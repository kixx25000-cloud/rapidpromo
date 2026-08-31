// Petit chargeur de variables d'environnement, sans dépendance externe
// (équivalent minimal de la librairie "dotenv").

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const envPath = join(root, ".env");

if (existsSync(envPath)) {
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (process.env[key] === undefined) process.env[key] = value;
  }
} else {
  console.warn(
    "⚠️  Aucun fichier .env trouvé — copiez .env.example en .env pour définir vos identifiants admin. Des valeurs par défaut non sécurisées sont utilisées en attendant."
  );
}

export const env = {
  port: Number(process.env.PORT ?? 3000),
  adminUser: process.env.ADMIN_USER ?? "admin",
  adminPass: process.env.ADMIN_PASS ?? "changez-moi",
  cronToken: process.env.CRON_TOKEN ?? "changez-moi-aussi",
  importIntervalHours: Number(process.env.IMPORT_INTERVAL_HOURS ?? 6),
  // Chaîne de connexion vers la base Postgres (ex. fournie par Neon), qui
  // stocke les données de façon permanente — contrairement à un fichier
  // local, qui disparaissait à chaque redéploiement du site.
  databaseUrl: process.env.DATABASE_URL ?? "",
};
