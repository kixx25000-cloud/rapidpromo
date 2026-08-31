// Couche d'accès aux données : toutes les requêtes SQL de l'application
// passent par ici, pour garder le reste du code lisible.
//
// Base Postgres (via le pool de connexions défini dans db.ts) : toutes les
// fonctions sont asynchrones (await pool.query(...)), et les alias de
// colonnes en camelCase (ex. "bestPrice") sont entre guillemets doubles —
// sans ça, Postgres les renverrait tout en minuscules et casserait le code
// qui lit ces propriétés.

import { pool } from "./db.js";
import { nowIso, placeholderImage } from "./util.js";
import type { Category, Merchant, Offer, Product, RawOffer } from "./types.js";

// ---------- Catégories ----------

export async function getCategories(): Promise<Category[]> {
  const { rows } = await pool.query(`SELECT * FROM categories ORDER BY name`);
  return rows as Category[];
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  const { rows } = await pool.query(`SELECT * FROM categories WHERE slug = $1`, [slug]);
  return rows[0] as Category | undefined;
}

export async function getCategoryById(id: number): Promise<Category | undefined> {
  const { rows } = await pool.query(`SELECT * FROM categories WHERE id = $1`, [id]);
  return rows[0] as Category | undefined;
}

// ---------- Marchands ----------

export async function getMerchants(): Promise<Merchant[]> {
  const { rows } = await pool.query(`SELECT * FROM merchants ORDER BY name`);
  return rows as Merchant[];
}

async function upsertMerchant(name: string, network: string): Promise<number> {
  const { rows } = await pool.query(
    `INSERT INTO merchants (name, network) VALUES ($1, $2)
     ON CONFLICT (name) DO UPDATE SET network = excluded.network
     RETURNING id`,
    [name, network]
  );
  return rows[0].id as number;
}

// ---------- Produits & offres (import) ----------

async function upsertProduct(raw: RawOffer): Promise<number> {
  const category = await getCategoryBySlug(raw.categorySlug);
  if (!category) throw new Error(`Catégorie inconnue : ${raw.categorySlug}`);

  const { rows } = await pool.query(
    `INSERT INTO products (external_id, title, description, image, category_id)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (external_id) DO UPDATE SET
       title = excluded.title,
       description = excluded.description,
       image = excluded.image,
       category_id = excluded.category_id
     RETURNING id`,
    [raw.productExternalId, raw.productTitle, raw.productDescription, raw.productImage, category.id]
  );
  return rows[0].id as number;
}

/**
 * Insère ou met à jour une offre issue d'un connecteur de flux.
 * Retourne l'id de l'offre affectée.
 */
export async function upsertOfferFromFeed(raw: RawOffer, networkName: string): Promise<number> {
  const productId = await upsertProduct(raw);
  const merchantId = await upsertMerchant(raw.merchantName, networkName);
  const now = nowIso();
  const discountPct = raw.oldPrice && raw.oldPrice > raw.price
    ? Math.round((1 - raw.price / raw.oldPrice) * 100)
    : null;

  const { rows } = await pool.query(
    `INSERT INTO offers
       (product_id, merchant_id, price, old_price, discount_pct, affiliate_url, starts_at, ends_at, active, last_seen_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1, $9)
     ON CONFLICT (product_id, merchant_id) DO UPDATE SET
       price = excluded.price,
       old_price = excluded.old_price,
       discount_pct = excluded.discount_pct,
       affiliate_url = excluded.affiliate_url,
       ends_at = excluded.ends_at,
       active = 1,
       last_seen_at = excluded.last_seen_at
     RETURNING id`,
    [productId, merchantId, raw.price, raw.oldPrice ?? null, discountPct, raw.affiliateUrl, now, raw.endsAt, now]
  );
  return rows[0].id as number;
}

/**
 * Désactive les offres d'un réseau donné qui n'ont pas été revues lors du
 * dernier import (elles ont disparu du flux : fin de stock, fin de promo...)
 * ainsi que celles dont la date de fin est dépassée, tous réseaux confondus.
 * Retourne le nombre d'offres désactivées.
 */
export async function expireStaleOffers(networkName: string, seenBeforeIso: string): Promise<number> {
  const staleFromFeed = await pool.query(
    `UPDATE offers SET active = 0
     WHERE active = 1
       AND last_seen_at < $1
       AND merchant_id IN (SELECT id FROM merchants WHERE network = $2)`,
    [seenBeforeIso, networkName]
  );

  const pastDeadline = await pool.query(
    `UPDATE offers SET active = 0 WHERE active = 1 AND ends_at < $1`,
    [nowIso()]
  );

  return (staleFromFeed.rowCount ?? 0) + (pastDeadline.rowCount ?? 0);
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
    p.id, p.external_id AS "externalId", p.title, p.description, p.image,
    p.category_id AS "categoryId", c.slug AS "categorySlug", c.name AS "categoryName",
    MIN(o.price) AS "bestPrice",
    MAX(o.old_price) AS "bestOldPrice",
    MAX(o.discount_pct) AS "bestDiscountPct",
    COUNT(o.id)::int AS "offerCount",
    MAX(o.ends_at) AS "endsAt"
  FROM products p
  JOIN offers o ON o.product_id = p.id AND o.active = 1
  JOIN categories c ON c.id = p.category_id
`;

// Liste tous les produits actuellement en promo active, pour générer le
// plan du site (sitemap.xml) consulté par les moteurs de recherche.
export async function getAllActiveProductIds(): Promise<number[]> {
  const { rows } = await pool.query(
    `SELECT DISTINCT p.id AS id FROM products p
     JOIN offers o ON o.product_id = p.id AND o.active = 1`
  );
  return (rows as { id: number }[]).map((r) => r.id);
}

export async function getHomeDeals(limit = 12): Promise<ProductWithBestPrice[]> {
  const { rows } = await pool.query(
    `${PRODUCT_BEST_PRICE_SELECT}
     GROUP BY p.id, c.slug, c.name
     ORDER BY "bestDiscountPct" DESC NULLS LAST, "bestPrice" ASC
     LIMIT $1`,
    [limit]
  );
  return rows as ProductWithBestPrice[];
}

export async function getDealsByCategory(
  categoryId: number,
  sort: "discount" | "price" = "discount",
  limit = 60
): Promise<ProductWithBestPrice[]> {
  const orderBy =
    sort === "price" ? `"bestPrice" ASC` : `"bestDiscountPct" DESC NULLS LAST, "bestPrice" ASC`;
  const { rows } = await pool.query(
    `${PRODUCT_BEST_PRICE_SELECT}
     WHERE p.category_id = $1
     GROUP BY p.id, c.slug, c.name
     ORDER BY ${orderBy}
     LIMIT $2`,
    [categoryId, limit]
  );
  return rows as ProductWithBestPrice[];
}

export async function searchDeals(query: string, limit = 60): Promise<ProductWithBestPrice[]> {
  const like = `%${query}%`;
  const { rows } = await pool.query(
    `${PRODUCT_BEST_PRICE_SELECT}
     WHERE p.title ILIKE $1 OR p.description ILIKE $2
     GROUP BY p.id, c.slug, c.name
     ORDER BY "bestDiscountPct" DESC NULLS LAST, "bestPrice" ASC
     LIMIT $3`,
    [like, like, limit]
  );
  return rows as ProductWithBestPrice[];
}

export async function getProductById(id: number): Promise<Product | undefined> {
  const { rows } = await pool.query(`SELECT * FROM products WHERE id = $1`, [id]);
  const row = rows[0] as (Product & { external_id: string; category_id: number }) | undefined;
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

export async function getActiveOffersForProduct(productId: number): Promise<OfferRow[]> {
  const { rows } = await pool.query(
    `SELECT o.id, o.product_id AS "productId", o.merchant_id AS "merchantId", o.price,
            o.old_price AS "oldPrice", o.discount_pct AS "discountPct",
            o.affiliate_url AS "affiliateUrl", o.starts_at AS "startsAt", o.ends_at AS "endsAt",
            o.active, o.last_seen_at AS "lastSeenAt",
            m.name AS "merchantName", m.network AS "merchantNetwork"
     FROM offers o
     JOIN merchants m ON m.id = o.merchant_id
     WHERE o.product_id = $1 AND o.active = 1
     ORDER BY o.price ASC`,
    [productId]
  );
  return rows as OfferRow[];
}

export async function getOfferWithContext(offerId: number) {
  const { rows } = await pool.query(
    `SELECT o.id, o.affiliate_url AS "affiliateUrl", o.active,
            p.title AS "productTitle", m.name AS "merchantName"
     FROM offers o
     JOIN products p ON p.id = o.product_id
     JOIN merchants m ON m.id = o.merchant_id
     WHERE o.id = $1`,
    [offerId]
  );
  return rows[0] as
    | { id: number; affiliateUrl: string; active: number; productTitle: string; merchantName: string }
    | undefined;
}

export async function logClick(offerId: number, ipHash: string): Promise<void> {
  await pool.query(
    `INSERT INTO click_logs (offer_id, clicked_at, ip_hash) VALUES ($1, $2, $3)`,
    [offerId, nowIso(), ipHash]
  );
}

// ---------- Admin ----------

export async function insertManualOffer(input: {
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
}): Promise<number> {
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

export async function startImportRun(network: string): Promise<number> {
  const { rows } = await pool.query(
    `INSERT INTO import_runs (network, started_at, status) VALUES ($1, $2, 'ok') RETURNING id`,
    [network, nowIso()]
  );
  return rows[0].id as number;
}

export async function finishImportRun(
  id: number,
  importedCount: number,
  expiredCount: number,
  status: "ok" | "erreur",
  message: string | null
): Promise<void> {
  await pool.query(
    `UPDATE import_runs SET finished_at = $1, imported_count = $2, expired_count = $3, status = $4, message = $5
     WHERE id = $6`,
    [nowIso(), importedCount, expiredCount, status, message, id]
  );
}

export async function getRecentImportRuns(limit = 20) {
  const { rows } = await pool.query(
    `SELECT id, network, started_at AS "startedAt", finished_at AS "finishedAt",
            imported_count AS "importedCount", expired_count AS "expiredCount", status, message
     FROM import_runs ORDER BY id DESC LIMIT $1`,
    [limit]
  );
  return rows;
}

// Liste toutes les offres (actives et inactives) pour la page d'administration
// "Gérer les offres", qui permet de supprimer une offre (ex. une offre de
// test) directement depuis le site en ligne.
export async function getAllOffersForAdmin() {
  const { rows } = await pool.query(
    `SELECT o.id, o.price, o.old_price AS "oldPrice", o.discount_pct AS "discountPct",
            o.active, o.ends_at AS "endsAt",
            p.id AS "productId", p.title AS "productTitle",
            m.name AS "merchantName", m.network AS "merchantNetwork"
     FROM offers o
     JOIN products p ON p.id = o.product_id
     JOIN merchants m ON m.id = o.merchant_id
     ORDER BY o.active DESC, p.title ASC, o.price ASC`
  );
  return rows as Array<{
    id: number;
    price: number;
    oldPrice: number | null;
    discountPct: number | null;
    active: number;
    endsAt: string;
    productId: number;
    productTitle: string;
    merchantName: string;
    merchantNetwork: string;
  }>;
}

// Une seule offre, avec son contexte produit/marchand — utilisé pour afficher
// la page de confirmation avant suppression.
export async function getOfferForAdmin(offerId: number) {
  const { rows } = await pool.query(
    `SELECT o.id, o.price, o.active, p.title AS "productTitle", m.name AS "merchantName"
     FROM offers o
     JOIN products p ON p.id = o.product_id
     JOIN merchants m ON m.id = o.merchant_id
     WHERE o.id = $1`,
    [offerId]
  );
  return rows[0] as
    | { id: number; price: number; active: number; productTitle: string; merchantName: string }
    | undefined;
}

/**
 * Supprime définitivement une offre (ex. une offre de test ou obsolète) :
 * ses clics enregistrés, puis l'offre elle-même, puis — si c'était la
 * dernière offre du produit — la fiche produit devenue orpheline.
 * Retourne false si l'offre n'existait déjà plus.
 */
export async function deleteOffer(offerId: number): Promise<boolean> {
  const existing = await pool.query(`SELECT product_id AS "productId" FROM offers WHERE id = $1`, [offerId]);
  if (existing.rowCount === 0) return false;
  const productId = existing.rows[0].productId as number;

  await pool.query(`DELETE FROM click_logs WHERE offer_id = $1`, [offerId]);
  await pool.query(`DELETE FROM offers WHERE id = $1`, [offerId]);

  const remaining = await pool.query(`SELECT COUNT(*)::int AS n FROM offers WHERE product_id = $1`, [productId]);
  if ((remaining.rows[0] as { n: number }).n === 0) {
    await pool.query(`DELETE FROM products WHERE id = $1`, [productId]);
  }

  return true;
}

export async function getStats() {
  const activeOffers = await pool.query(`SELECT COUNT(*)::int AS n FROM offers WHERE active = 1`);
  const totalProducts = await pool.query(`SELECT COUNT(*)::int AS n FROM products`);
  const totalMerchants = await pool.query(`SELECT COUNT(*)::int AS n FROM merchants`);
  const totalClicks = await pool.query(`SELECT COUNT(*)::int AS n FROM click_logs`);
  return {
    activeOffers: activeOffers.rows[0].n as number,
    totalProducts: totalProducts.rows[0].n as number,
    totalMerchants: totalMerchants.rows[0].n as number,
    totalClicks: totalClicks.rows[0].n as number,
  };
}
