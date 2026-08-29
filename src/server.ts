import { env } from "./env.js";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { homePage, categoryPage, productPage, searchPage } from "./render/public.js";
import { mentionsLegalesPage, cguPage, confidentialitePage } from "./render/legal.js";
import { adminDashboardPage, adminNewOfferPage } from "./render/admin.js";
import { getOfferWithContext, insertManualOffer, logClick } from "./repo.js";
import { hashIp } from "./util.js";
import { runImport } from "./importer.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

function send(res: ServerResponse, status: number, body: string, contentType = "text/html; charset=utf-8"): void {
  res.writeHead(status, { "Content-Type": contentType });
  res.end(body);
}

function notFound(res: ServerResponse): void {
  send(res, 404, `<!doctype html><meta charset="utf-8"><title>404</title>
    <body style="font-family:system-ui;text-align:center;padding:80px;">
      <h1>Page introuvable</h1><p><a href="/">Retour à l'accueil</a></p>
    </body>`);
}

async function readBody(req: IncomingMessage): Promise<URLSearchParams> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const raw = Buffer.concat(chunks).toString("utf-8");
  return new URLSearchParams(raw);
}

function parseFlash(url: URL): { type: "success" | "error"; message: string } | undefined {
  const flash = url.searchParams.get("flash");
  if (!flash) return undefined;
  const sep = flash.indexOf(":");
  if (sep === -1) return undefined;
  const type = flash.slice(0, sep);
  const message = decodeURIComponent(flash.slice(sep + 1));
  if (type !== "success" && type !== "error") return undefined;
  return { type, message };
}

function requireBasicAuth(req: IncomingMessage, res: ServerResponse): boolean {
  const header = req.headers.authorization;
  if (header?.startsWith("Basic ")) {
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf-8");
    const sep = decoded.indexOf(":");
    const user = decoded.slice(0, sep);
    const pass = decoded.slice(sep + 1);
    if (user === env.adminUser && pass === env.adminPass) return true;
  }
  res.writeHead(401, { "WWW-Authenticate": 'Basic realm="RapidPromo Admin"' });
  res.end("Authentification requise.");
  return false;
}

function getClientIp(req: IncomingMessage): string {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length > 0) return fwd.split(",")[0]!.trim();
  return req.socket.remoteAddress ?? "inconnu";
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
    const path = url.pathname;
    const method = req.method ?? "GET";

    // Fichiers statiques
    if (method === "GET" && path === "/style.css") {
      const css = await readFile(join(publicDir, "style.css"), "utf-8");
      send(res, 200, css, "text/css; charset=utf-8");
      return;
    }

    // Cron externe (production) : GET /api/cron/import?token=...
    if (method === "GET" && path === "/api/cron/import") {
      if (url.searchParams.get("token") !== env.cronToken) {
        send(res, 403, "Jeton invalide", "text/plain; charset=utf-8");
        return;
      }
      const results = await runImport();
      send(res, 200, JSON.stringify(results, null, 2), "application/json; charset=utf-8");
      return;
    }

    // Pages publiques
    if (method === "GET" && path === "/") {
      send(res, 200, homePage());
      return;
    }

    if (method === "GET" && path.startsWith("/categorie/")) {
      const slug = path.slice("/categorie/".length);
      const sort = url.searchParams.get("tri") === "prix" ? "price" : "discount";
      const html = categoryPage(slug, sort);
      if (!html) return notFound(res);
      send(res, 200, html);
      return;
    }

    if (method === "GET" && path === "/recherche") {
      send(res, 200, searchPage(url.searchParams.get("q") ?? ""));
      return;
    }

    if (method === "GET" && path.startsWith("/produit/")) {
      const id = Number(path.slice("/produit/".length));
      const html = Number.isFinite(id) ? productPage(id) : null;
      if (!html) return notFound(res);
      send(res, 200, html);
      return;
    }

    if (method === "GET" && path.startsWith("/go/")) {
      const offerId = Number(path.slice("/go/".length));
      const offer = Number.isFinite(offerId) ? getOfferWithContext(offerId) : undefined;
      if (!offer || !offer.active) return notFound(res);
      logClick(offerId, hashIp(getClientIp(req)));
      res.writeHead(302, { Location: offer.affiliateUrl });
      res.end();
      return;
    }

    if (method === "GET" && path === "/mentions-legales") {
      send(res, 200, mentionsLegalesPage());
      return;
    }
    if (method === "GET" && path === "/cgu") {
      send(res, 200, cguPage());
      return;
    }
    if (method === "GET" && path === "/confidentialite") {
      send(res, 200, confidentialitePage());
      return;
    }

    // Espace admin (protégé par authentification basique)
    if (path === "/admin" || path.startsWith("/admin/")) {
      if (!requireBasicAuth(req, res)) return;

      if (method === "GET" && path === "/admin") {
        send(res, 200, adminDashboardPage(parseFlash(url)));
        return;
      }

      if (method === "POST" && path === "/admin/import") {
        await runImport();
        res.writeHead(302, { Location: "/admin?flash=success:" + encodeURIComponent("Import lancé avec succès.") });
        res.end();
        return;
      }

      if (method === "GET" && path === "/admin/offres/nouvelle") {
        send(res, 200, adminNewOfferPage(parseFlash(url)));
        return;
      }

      if (method === "POST" && path === "/admin/offres/nouvelle") {
        const body = await readBody(req);
        try {
          insertManualOffer({
            categorySlug: String(body.get("categorySlug")),
            productTitle: String(body.get("productTitle")),
            productDescription: String(body.get("productDescription") ?? ""),
            merchantName: String(body.get("merchantName")),
            price: Number(body.get("price")),
            oldPrice: body.get("oldPrice") ? Number(body.get("oldPrice")) : undefined,
            affiliateUrl: String(body.get("affiliateUrl")),
            endsAt: new Date(String(body.get("endsAt"))).toISOString(),
          });
          res.writeHead(302, {
            Location: "/admin?flash=success:" + encodeURIComponent("Offre publiée sur le site."),
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          res.writeHead(302, { Location: "/admin/offres/nouvelle?flash=error:" + encodeURIComponent(msg) });
        }
        res.end();
        return;
      }
    }

    notFound(res);
  } catch (err) {
    console.error(err);
    send(res, 500, "Erreur interne du serveur.", "text/plain; charset=utf-8");
  }
});

server.listen(env.port, () => {
  console.log(`✅ RapidPromo tourne sur http://localhost:${env.port}`);
  console.log(`   Espace admin : http://localhost:${env.port}/admin (identifiants dans .env)`);
});

// Planificateur intégré : relance un import à intervalle régulier tant que
// le serveur est en vie, pour que le site "tourne en continu" sans dépendre
// d'un cron externe. Un premier import est lancé immédiatement au démarrage.
runImport().then((results) => {
  console.log("Import initial effectué :", results);
});

setInterval(
  () => {
    runImport().then((results) => {
      console.log("Import automatique effectué :", results);
    });
  },
  env.importIntervalHours * 60 * 60 * 1000
);
