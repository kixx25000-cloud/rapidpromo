import pg from "pg";
import { env } from "./env.js";

const { Pool } = pg;

// Connexion à la base Postgres permanente (ex. Neon). Remplace l'ancien
// fichier SQLite local, qui était effacé à chaque redéploiement du site sur
// Render (plan gratuit sans disque persistant) — toutes les offres ajoutées
// manuellement disparaissaient donc à chaque mise à jour du code.
// Neon exige une connexion chiffrée (SSL).
export const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: { rejectUnauthorized: false },
});

const DEFAULT_CATEGORIES: Array<{ slug: string; name: string }> = [
  { slug: "high-tech", name: "High-tech" },
  { slug: "maison", name: "Maison & Électroménager" },
  { slug: "mode", name: "Mode & Beauté" },
];

// Crée les tables si elles n'existent pas encore, et s'assure que les 3
// catégories de lancement sont présentes. Appelé une fois au démarrage du
// serveur, avant d'accepter des requêtes.
export async function initSchema(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS merchants (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      network TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      external_id TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      image TEXT NOT NULL,
      category_id INTEGER NOT NULL REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS offers (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id),
      merchant_id INTEGER NOT NULL REFERENCES merchants(id),
      price REAL NOT NULL,
      old_price REAL,
      discount_pct REAL,
      affiliate_url TEXT NOT NULL,
      starts_at TEXT NOT NULL,
      ends_at TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      last_seen_at TEXT NOT NULL,
      UNIQUE(product_id, merchant_id)
    );

    CREATE TABLE IF NOT EXISTS import_runs (
      id SERIAL PRIMARY KEY,
      network TEXT NOT NULL,
      started_at TEXT NOT NULL,
      finished_at TEXT,
      imported_count INTEGER NOT NULL DEFAULT 0,
      expired_count INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'ok',
      message TEXT
    );

    CREATE TABLE IF NOT EXISTS click_logs (
      id SERIAL PRIMARY KEY,
      offer_id INTEGER NOT NULL REFERENCES offers(id),
      clicked_at TEXT NOT NULL,
      ip_hash TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_offers_product ON offers(product_id);
    CREATE INDEX IF NOT EXISTS idx_offers_active ON offers(active);
  `);

  for (const c of DEFAULT_CATEGORIES) {
    await pool.query(
      `INSERT INTO categories (slug, name) VALUES ($1, $2) ON CONFLICT (slug) DO NOTHING`,
      [c.slug, c.name]
    );
  }
}
