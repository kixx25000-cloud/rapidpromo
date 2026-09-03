import { env } from "./env.js";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";

import { homePage, categoryPage, productPage, searchPage } from "./render/public.js";
import { mentionsLegalesPage, cguPage, confidentialitePage } from "./render/legal.js";
import { guidesIndexPage, guideArticlePage, getGuideSlugs } from "./render/blog.js";
import { adminDashboardPage, adminNewOfferPage, adminLoginPage, adminOffersPage, adminDeleteOfferPage } from "./render/admin.js";
import { deleteOffer, getAllActiveProductIds, getCategories, getOfferWithContext, insertManualOffer, logClick } from "./repo.js";
import { hashIp } from "./util.js";
import { runImport } from "./importer.js";
import { initSchema } from "./db.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");
const SITE_URL = "https://rapidpromo.onrender.com";

function send(res: ServerResponse, status: number, body: string, contentType = "text/html; charset=utf-8"): void {
  res.writeHead(status, { "Content-Type": contentType });
  res.end(body);
}

// Page 404 habillée aux couleurs de RapidPromo plutôt qu'une page nue :
// meilleure expérience pour un visiteur qui suit un vieux lien, et des liens
// internes vers les pages clés pour ne pas perdre le visiteur (et aider les
// moteurs de recherche à continuer d'explorer le site depuis n'importe quelle
// URL cassée).
function notFound(res: ServerResponse): void {
  send(
    res,
    404,
    `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Page introuvable — RapidPromo</title>
  <meta name="robots" content="noindex" />
  <link rel="stylesheet" href="/style.css" />
</head>
<body>
  <header class="site-header">
    <div class="container bar">
      <a href="/" class="logo">Rapid<span>Promo</span></a>
    </div>
  </header>
  <main class="container" style="text-align:center; padding:60px 16px;">
    <h1>404 — Page introuvable</h1>
    <p style="color:#4b5563; margin-bottom:24px;">Cette page n'existe pas ou plus (l'offre est peut-être terminée).</p>
    <p>
      <a class="btn" href="/">Retour à l'accueil</a>
    </p>
    <p style="margin-top:24px;">
      <a href="/categorie/high-tech">High-tech</a> ·
      <a href="/categorie/maison">Maison &amp; électroménager</a> ·
      <a href="/categorie/mode">Mode &amp; beauté</a> ·
      <a href="/guides">Guides</a>
    </p>
  </main>
</body>
</html>`
  );
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

// Sessions admin : jetons aléatoires gardés en mémoire (le serveur tourne en
// une seule instance). Remplace l'authentification HTTP Basic — dont la boîte
// de dialogue native du navigateur ne peut pas être remplie par un outil
// d'automatisation — par une vraie page de connexion HTML classique.
const adminSessions = new Set<string>();
const SESSION_COOKIE = "rapidpromo_admin_session";

function parseCookies(req: IncomingMessage): Record<string, string> {
  const header = req.headers.cookie;
  const result: Record<string, string> = {};
  if (!header) return result;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (key) result[key] = decodeURIComponent(value);
  }
  return result;
}

function isAdminAuthenticated(req: IncomingMessage): boolean {
  const cookies = parseCookies(req);
  const token = cookies[SESSION_COOKIE];
  return Boolean(token && adminSessions.has(token));
}

function createAdminSession(res: ServerResponse): void {
  const token = randomBytes(24).toString("hex");
  adminSessions.add(token);
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 12}`
  );
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
    // Cache-Control : le fichier CSS ne change presque jamais, autant éviter
    // que chaque page (toutes les pages le chargent) le re-télécharge à
    // chaque visite — améliore la vitesse de chargement perçue, un signal
    // utilisé par Google (Core Web Vitals) pour le classement.
    if (method === "GET" && path === "/style.css") {
      const css = await readFile(join(publicDir, "style.css"), "utf-8");
      res.writeHead(200, {
        "Content-Type": "text/css; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      });
      res.end(css);
      return;
    }

    // Fichiers de l'application web installable (PWA) : manifest, service
    // worker, icônes. Servis tels quels depuis /public.
    if (method === "GET" && path === "/manifest.webmanifest") {
      const manifest = await readFile(join(publicDir, "manifest.webmanifest"), "utf-8");
      send(res, 200, manifest, "application/manifest+json; charset=utf-8");
      return;
    }
    if (method === "GET" && path === "/sw.js") {
      const sw = await readFile(join(publicDir, "sw.js"), "utf-8");
      send(res, 200, sw, "application/javascript; charset=utf-8");
      return;
    }
    if (method === "GET" && path.startsWith("/icons/")) {
      const name = path.slice("/icons/".length);
      // Nom de fichier strictement validé (évite toute tentative de
      // traversée de répertoire) : icônes servies directement depuis
      // /public/icons comme de vrais fichiers PNG, plus simple et plus
      // fiable qu'un encodage base64 intégré dans le code source.
      if (!/^[a-z0-9-]+\.png$/.test(name)) return notFound(res);
      try {
        const buf = await readFile(join(publicDir, "icons", name));
        res.writeHead(200, { "Content-Type": "image/png", "Cache-Control": "public, max-age=604800" });
        res.end(buf);
      } catch {
        notFound(res);
      }
      return;
    }

    // Certains navigateurs et robots demandent systématiquement /favicon.ico
    // à la racine, même quand la balise <link rel="icon"> pointe ailleurs.
    // On réutilise la petite icône 32x32 existante plutôt que de dupliquer
    // un fichier .ico séparé.
    if (method === "GET" && path === "/favicon.ico") {
      try {
        const buf = await readFile(join(publicDir, "icons", "icon-32.png"));
        res.writeHead(200, { "Content-Type": "image/png", "Cache-Control": "public, max-age=604800" });
        res.end(buf);
      } catch {
        notFound(res);
      }
      return;
    }

    // Référencement (SEO) : robots.txt et sitemap.xml, générés dynamiquement
    // à partir des catégories et offres actives, pour que Google découvre
    // et indexe toutes les pages du site.
    if (method === "GET" && path === "/robots.txt") {
      const body = ["User-agent: *", "Allow: /", "Disallow: /admin", `Sitemap: ${SITE_URL}/sitemap.xml`].join(
        "\n"
      );
      send(res, 200, body, "text/plain; charset=utf-8");
      return;
    }

    if (method === "GET" && path === "/sitemap.xml") {
      const categories = await getCategories();
      const productIds = await getAllActiveProductIds();
      const urls = [
        `${SITE_URL}/`,
        `${SITE_URL}/guides`,
        ...categories.map((c) => `${SITE_URL}/categorie/${c.slug}`),
        ...productIds.map((id) => `${SITE_URL}/produit/${id}`),
        ...getGuideSlugs().map((slug) => `${SITE_URL}/guides/${slug}`),
      ];
      const body =
        `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
        urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n") +
        `\n</urlset>\n`;
      send(res, 200, body, "application/xml; charset=utf-8");
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
      send(res, 200, await homePage());
      return;
    }

    if (method === "GET" && path.startsWith("/categorie/")) {
      const slug = path.slice("/categorie/".length);
      const sort = url.searchParams.get("tri") === "prix" ? "price" : "discount";
      const html = await categoryPage(slug, sort);
      if (!html) return notFound(res);
      send(res, 200, html);
      return;
    }

    if (method === "GET" && path === "/recherche") {
      send(res, 200, await searchPage(url.searchParams.get("q") ?? ""));
      return;
    }

    if (method === "GET" && path.startsWith("/produit/")) {
      const id = Number(path.slice("/produit/".length));
      const html = Number.isFinite(id) ? await productPage(id) : null;
      if (!html) return notFound(res);
      send(res, 200, html);
      return;
    }

    if (method === "GET" && path.startsWith("/go/")) {
      const offerId = Number(path.slice("/go/".length));
      const offer = Number.isFinite(offerId) ? await getOfferWithContext(offerId) : undefined;
      if (!offer || !offer.active) return notFound(res);
      await logClick(offerId, hashIp(getClientIp(req)));
      res.writeHead(302, { Location: offer.affiliateUrl });
      res.end();
      return;
    }

    if (method === "GET" && path === "/guides") {
      send(res, 200, await guidesIndexPage());
      return;
    }

    if (method === "GET" && path.startsWith("/guides/")) {
      const slug = path.slice("/guides/".length);
      const html = await guideArticlePage(slug);
      if (!html) return notFound(res);
      send(res, 200, html);
      return;
    }

    if (method === "GET" && path === "/mentions-legales") {
      send(res, 200, await mentionsLegalesPage());
      return;
    }
    if (method === "GET" && path === "/cgu") {
      send(res, 200, await cguPage());
      return;
    }
    if (method === "GET" && path === "/confidentialite") {
      send(res, 200, await confidentialitePage());
      return;
    }

    // Connexion à l'espace admin (page HTML classique, avec cookie de session)
    if (method === "GET" && path === "/admin/login") {
      send(res, 200, await adminLoginPage(parseFlash(url), url.searchParams.get("next") ?? undefined));
      return;
    }

    if (method === "POST" && path === "/admin/login") {
      const body = await readBody(req);
      const username = String(body.get("username") ?? "");
      const password = String(body.get("password") ?? "");
      const next = String(body.get("next") ?? "/admin");
      if (username === env.adminUser && password === env.adminPass) {
        createAdminSession(res);
        res.writeHead(302, { Location: next.startsWith("/admin") ? next : "/admin" });
        res.end();
        return;
      }
      res.writeHead(302, {
        Location:
          "/admin/login?flash=error:" + encodeURIComponent("Identifiant ou mot de passe incorrect."),
      });
      res.end();
      return;
    }

    // Espace admin (protégé par cookie de session, voir /admin/login ci-dessus)
    if (path === "/admin" || path.startsWith("/admin/")) {
      if (!isAdminAuthenticated(req)) {
        res.writeHead(302, { Location: "/admin/login?next=" + encodeURIComponent(path) });
        res.end();
        return;
      }

      if (method === "GET" && path === "/admin") {
        send(res, 200, await adminDashboardPage(parseFlash(url)));
        return;
      }

      if (method === "POST" && path === "/admin/import") {
        await runImport();
        res.writeHead(302, { Location: "/admin?flash=success:" + encodeURIComponent("Import lancé avec succès.") });
        res.end();
        return;
      }

      if (method === "GET" && path === "/admin/offres/nouvelle") {
        send(res, 200, await adminNewOfferPage(parseFlash(url)));
        return;
      }

      if (method === "POST" && path === "/admin/offres/nouvelle") {
        const body = await readBody(req);
        try {
          await insertManualOffer({
            categorySlug: String(body.get("categorySlug")),
            productTitle: String(body.get("productTitle")),
            productDescription: String(body.get("productDescription") ?? ""),
            merchantName: String(body.get("merchantName")),
            price: Number(body.get("price")),
            oldPrice: body.get("oldPrice") ? Number(body.get("oldPrice")) : undefined,
            affiliateUrl: String(body.get("affiliateUrl")),
            endsAt: new Date(String(body.get("endsAt"))).toISOString(),
            productImage: body.get("productImage") ? String(body.get("productImage")) : undefined,
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

      if (method === "GET" && path === "/admin/offres") {
        send(res, 200, await adminOffersPage(parseFlash(url)));
        return;
      }

      const deleteMatch = path.match(/^\/admin\/offres\/(\d+)\/supprimer$/);
      if (deleteMatch) {
        const offerId = Number(deleteMatch[1]);

        if (method === "GET") {
          const html = await adminDeleteOfferPage(offerId);
          if (!html) return notFound(res);
          send(res, 200, html);
          return;
        }

        if (method === "POST") {
          const ok = await deleteOffer(offerId);
          res.writeHead(302, {
            Location:
              "/admin/offres?flash=" +
              (ok ? "success:" + encodeURIComponent("Offre supprimée.") : "error:" + encodeURIComponent("Offre introuvable.")),
          });
          res.end();
          return;
        }
      }
    }

    notFound(res);
  } catch (err) {
    console.error(err);
    send(res, 500, "Erreur interne du serveur.", "text/plain; charset=utf-8");
  }
});

// Crée les tables (si besoin) avant d'accepter la moindre requête — la base
// Postgres est distante, donc cette étape est maintenant asynchrone.
await initSchema();

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
