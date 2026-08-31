// Couche d'accès aux données : toutes les requêtes SQL de l'application
// passent par ici, pour garder le reste du code lisible.

import { db } from "./db.js";
import { nowIso, placeholderImage } from "./util.js";
import type { Category, Merchant, Offer, Product, RawOffer } from "./types.js";

// ---------- Catégories ----------

export function getCategories(): Category[] {
  return db.prepare(`SELECT * FROM categories ORDER BY name`).all() as unknown as Category[];
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return db.prepare(`SELECT * FROM categories WHERE slug = ?`).get(slug) as
    | Category
    | undefined;
}

export function getCategoryById(id: number): Category | undefined {
  return db.prepare(`SELECT * FROM categories WHERE id = ?`).get(id) as Category | undefined;
}

// ---------- Marchands ----------

export function getMerchants(): Merchant[] {
  return db.prepare(`SELECT * FROM merchants ORDER BY name`).all() as unknown as Merchant[];
}

function upsertMerchant(name: string, network: string): number {
  db.prepare(
    `INSERT INTO merchants (name, network) VALUES (?, ?)
     ON CONFLICT(name) DO UPDATE SET network = excluded.network`
  ).run(name, network);
  const row = db.prepare(`SELECT id FROM merchants WHERE name = ?`).get(name) as { id: number };
  return row.id;
}

// ---------- Produits & offres (import) ----------

function upsertProduct(raw: RawOffer): number {
  const category = getCategoryBySlug(raw.categorySlug);
  if (!category) throw new Error(`Catégorie inconnue : ${raw.categorySlug}`);

  db.prepare(
    `INSERT INTO products (external_id, title, description, image, category_id)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(external_id) DO UPDATE SET
       title = excluded.title,
       description = excluded.description,
       image = excluded.image,
       category_id = excluded.category_id`
  ).run(raw.productExternalId, raw.productTitle, raw.productDescription, raw.productImage, category.id);

  const row = db
    .prepare(`SELECT id FROM products WHERE external_id = ?`)
    .get(raw.productExternalId) as { id: number };
  return row.id;
}

/**
 * Insère ou met à jour une offre issue d'un connecteur de flux.
 * Retourne l'id de l'offre affectée.
 */
export function upsertOfferFromFeed(raw: RawOffer, networkName: string): number {
  const productId = upsertProduct(raw);
  const merchantId = upsertMerchant(raw.merchantName, networkName);
  const now = nowIso();
  const discountPct = raw.oldPrice && raw.oldPrice > raw.price
    ? Math.round((1 - raw.price / raw.oldPrice) * 100)
    : null;

  db.prepare(
    `INSERT INTO offers
       (product_id, merchant_id, price, old_price, discount_pct, affiliate_url, starts_at, ends_at, active, last_seen_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
     ON CONFLICT(product_id, merchant_id) DO UPDATE SET
       price = excluded.price,
       old_price = excluded.old_price,
       discount_pct = excluded.discount_pct,
       affiliate_url = excluded.affiliate_url,
       ends_at = excluded.ends_at,
       active = 1,
       last_seen_at = excluded.last_seen_at`
  ).run(
    productId,
    merchantId,
    raw.price,
    raw.oldPrice ?? null,
    discountPct,
    raw.affiliateUrl,
    now,
    raw.endsAt,
    now
  );

  const row = db
    .prepare(`SELECT id FROM offers WHERE product_id = ? AND merchant_id = ?`)
    .get(productId, merchantId) as { id: number };
  return row.id;
}

/**
 * Désactive les offres d'un réseau donné qui n'ont pas été revues lors du
 * dernier import (elles ont disparu du flux : fin de stock, fin de promo...)
 * ainsi que celles dont la date de fin est dépassée, tous réseaux confondus.
 * Retourne le nombre d'offres désactivées.
 */
export function expireStaleOffers(networkName: string, seenBeforeIso: string): number {
  const staleFromFeed = db
    .prepare(
      `UPDATE offers SET active = 0
       WHERE active = 1
         AND last_seen_at < ?
         AND merchant_id IN (SELECT id FROM merchants WHERE network = ?)`
    )
    .run(seenBeforeIso, networkName);

  const pastDeadline = db
    .prepare(`UPDATE offers SET active = 0 WHERE active = 1 AND ends_at < ?`)
    .run(nowIso());

  return Number(staleFromFeed.changes) + Number(pastDeadline.changes);
}

// ---------- Lecture publique ----------

interface OfferRow extends Offer {
  merchantName: string;
  merchantNetwork: string;
}

interface ProductWithBestPrice extends Product {
  categorySlug: string;
  categoryName: string;
  bestPrice: number;
  bestOldPrice: number | null;
  bestDiscountPct: number | null;
  offerCount: number;
  endsAt: string;
}

const PRODUCT_BEST_PRICE_SELECT = `
  SELECT
    p.id, p.external_id AS externalId, p.title, p.description, p.image,
    p.category_id AS categoryId, c.slug AS categorySlug, c.name AS categoryName,
    MIN(o.price) AS bestPrice,
    MAX(o.old_price) AS bestOldPrice,
    MAX(o.discount_pct) AS bestDiscountPct,
    COUNT(o.id) AS offerCount,
    MAX(o.ends_at) AS endsAt
  FROM products p
  JOIN offers o ON o.product_id = p.id AND o.active = 1
  JOIN categories c ON c.id = p.category_id
`;

export function getHomeDeals(limit = 12): ProductWithBestPrice[] {
  return db
    .prepare(
      `${PRODUCT_BEST_PRICE_SELECT}
       GROUP BY p.id
       ORDER BY bestDiscountPct DESC NULLS LAST, bestPrice ASC
       LIMIT ?`
    )
    .all(limit) as unknown as ProductWithBestPrice[];
}

export function getDealsByCategory(
  categoryId: number,
  sort: "discount" | "price" = "discount",
  limit = 60
): ProductWithBestPrice[] {
  const orderBy =
    sort === "price" ? "bestPrice ASC" : "bestDiscountPct DESC NULLS LAST, bestPrice ASC";
  return db
    .prepare(
      `${PRODUCT_BEST_PRICE_SELECT}
       WHERE p.category_id = ?
       GROUP BY p.id
       ORDER BY ${orderBy}
       LIMIT ?`
    )
    .all(categoryId, limit) as unknown as ProductWithBestPrice[];
}

export function searchDeals(query: string, limit = 60): ProductWithBestPrice[] {
  const like = `%${query}%`;
  return db
    .prepare(
      `${PRODUCT_BEST_PRICE_SELECT}
       WHERE p.title LIKE ? OR p.description LIKE ?
       GROUP BY p.id
       ORDER BY bestDiscountPct DESC NULLS LAST, bestPrice ASC
       LIMIT ?`
    )
    .all(like, like, limit) as unknown as ProductWithBestPrice[];
}

export function getProductById(id: number): Product | undefined {
  const row = db.prepare(`SELECT * FROM products WHERE id = ?`).get(id) as
    | (Product & { external_id: string; category_id: number })
    | undefined;
  if (!row) return undefined;
  return {
    id: row.id,
    externalId: row.external_id,
    title: row.title,
    description: row.description,
    image: row.image,
    categoryId: row.category_id,
  };
}

export function getActiveOffersForProduct(productId: number): OfferRow[] {
  return db
    .prepare(
      `SELECT o.id, o.product_id AS productId, o.merchant_id AS merchantId, o.price,
              o.old_price AS oldPrice, o.discount_pct AS discountPct,
              o.affiliate_url AS affiliateUrl, o.starts_at AS startsAt, o.ends_at AS endsAt,
              o.active, o.last_seen_at AS lastSeenAt,
              m.name AS merchantName, m.network AS merchantNetwork
       FROM offers o
       JOIN merchants m ON m.id = o.merchant_id
       WHERE o.product_id = ? AND o.active = 1
       ORDER BY o.price ASC`
    )
    .all(productId) as unknown as OfferRow[];
}

export function getOfferWithContext(offerId: number) {
  return db
    .prepare(
      `SELECT o.id, o.affiliate_url AS affiliateUrl, o.active,
              p.title AS productTitle, m.name AS merchantName
       FROM offers o
       JOIN products p ON p.id = o.product_id
       JOIN merchants m ON m.id = o.merchant_id
       WHERE o.id = ?`
    )
    .get(offerId) as
    | { id: number; affiliateUrl: string; active: number; productTitle: string; merchantName: string }
    | undefined;
}

export function logClick(offerId: number, ipHash: string): void {
  db.prepare(`INSERT INTO click_logs (offer_id, clicked_at, ip_hash) VALUES (?, ?, ?)`).run(
    offerId,
    nowIso(),
    ipHash
  );
}

// ---------- Admin ----------

export function insertManualOffer(input: {
  categorySlug: string;
  productTitle: string;
  productDescription: string;
  merchantName: string;
  price: number;
  oldPrice?: number;
  affiliateUrl: string;
  endsAt: string;
  // URL d'une vraie photo du produit (ex. copiée depuis la fiche produit du
  // marchand, dans le cadre d'un vrai partenariat d'affiliation). Si absente,
  // on retombe sur le pictogramme placeholder — jamais une fausse photo.
  productImage?: string;
}): number {
  return upsertOfferFromFeed(
    {
      productExternalId: `manuel-${Date.now()}`,
      productTitle: input.productTitle,
      productDescription: input.productDescription,
      productImage: input.productImage?.trim() || placeholderImage(input.productTitle),
      categorySlug: input.categorySlug,
      merchantName: input.merchantName,
      price: input.price,
      oldPrice: input.oldPrice,
      affiliateUrl: input.affiliateUrl,
      endsAt: input.endsAt,
    },
    "Ajout manuel"
  );
}

export function startImportRun(network: string): number {
  const res = db
    .prepare(`INSERT INTO import_runs (network, started_at, status) VALUES (?, ?, 'ok')`)
    .run(network, nowIso());
  return Number(res.lastInsertRowid);
}

export function finishImportRun(
  id: number,
  importedCount: number,
  expiredCount: number,
  status: "ok" | "erreur",
  message: string | null
): void {
  db.prepare(
    `UPDATE import_runs SET finished_at = ?, imported_count = ?, expired_count = ?, status = ?, message = ?
     WHERE id = ?`
  ).run(nowIso(), importedCount, expiredCount, status, message, id);
}

export function getRecentImportRuns(limit = 20) {
  return db
    .prepare(
      `SELECT id, network, started_at AS startedAt, finished_at AS finishedAt,
              imported_count AS importedCount, expired_count AS expiredCount, status, message
       FROM import_runs ORDER BY id DESC LIMIT ?`
    )
    .all(limit);
}

export function getStats() {
  const activeOffers = db.prepare(`SELECT COUNT(*) AS n FROM offers WHERE active = 1`).get() as {
    n: number;
  };
  const totalProducts = db.prepare(`SELECT COUNT(*) AS n FROM products`).get() as { n: number };
  const totalMerchants = db.prepare(`SELECT COUNT(*) AS n FROM merchants`).get() as { n: number };
  const totalClicks = db.prepare(`SELECT COUNT(*) AS n FROM click_logs`).get() as { n: number };
  return {
    activeOffers: activeOffers.n,
    totalProducts: totalProducts.n,
    totalMerchants: totalMerchants.n,
    totalClicks: totalClicks.n,
  };
}
