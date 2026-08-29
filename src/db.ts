import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "data");
mkdirSync(dataDir, { recursive: true });

export const db = new DatabaseSync(join(dataDir, "rapidpromo.db"));

db.exec(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS merchants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    network TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    external_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    image TEXT NOT NULL,
    category_id INTEGER NOT NULL REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS offers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    network TEXT NOT NULL,
    started_at TEXT NOT NULL,
    finished_at TEXT,
    imported_count INTEGER NOT NULL DEFAULT 0,
    expired_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'ok',
    message TEXT
  );

  CREATE TABLE IF NOT EXISTS click_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    offer_id INTEGER NOT NULL REFERENCES offers(id),
    clicked_at TEXT NOT NULL,
    ip_hash TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
  CREATE INDEX IF NOT EXISTS idx_offers_product ON offers(product_id);
  CREATE INDEX IF NOT EXISTS idx_offers_active ON offers(active);
`);

const DEFAULT_CATEGORIES: Array<{ slug: string; name: string }> = [
  { slug: "high-tech", name: "High-tech" },
  { slug: "maison", name: "Maison & Électroménager" },
  { slug: "mode", name: "Mode & Beauté" },
];

const insertCategory = db.prepare(
  `INSERT OR IGNORE INTO categories (slug, name) VALUES (?, ?)`
);
for (const c of DEFAULT_CATEGORIES) insertCategory.run(c.slug, c.name);
