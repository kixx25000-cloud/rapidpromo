import { getCategories } from "../repo.js";
import { escapeHtml } from "../util.js";

const SITE_URL = "https://rapidpromo.onrender.com";
const DEFAULT_DESCRIPTION =
  "RapidPromo compare les meilleures promotions du moment et vous redirige vers le prix le plus bas.";

export function layout(opts: {
  title: string;
  description?: string;
  activeCategorySlug?: string;
  path?: string;
  image?: string;
  body: string;
}): string {
  const categories = getCategories();
  const description = opts.description ?? DEFAULT_DESCRIPTION;
  const canonical = SITE_URL + (opts.path ?? "/");
  const image = opts.image ?? `${SITE_URL}/icons/icon-192.png`;
  const navLinks = categories
    .map(
      (c) =>
        `<a href="/categorie/${c.slug}"${c.slug === opts.activeCategorySlug ? ' style="border-bottom-color:#ea580c"' : ""}>${escapeHtml(c.name)}</a>`
    )
    .join("\n");

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(opts.title)} — RapidPromo</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${canonical}" />
  <link rel="stylesheet" href="/style.css" />

  <!-- Réseaux sociaux : aperçu correct quand un lien RapidPromo est partagé
       (Facebook, X, WhatsApp, Discord, etc.) -->
  <meta property="og:site_name" content="RapidPromo" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeHtml(opts.title)} — RapidPromo" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:image" content="${image}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(opts.title)} — RapidPromo" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${image}" />

  <!-- Application web installable (PWA) : permet d'ajouter RapidPromo sur
       l'écran d'accueil du téléphone (iPhone et Android), comme une appli. -->
  <link rel="manifest" href="/manifest.webmanifest" />
  <meta name="theme-color" content="#ea580c" />
  <link rel="icon" href="/icons/icon-32.png" sizes="32x32" type="image/png" />
  <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="RapidPromo" />
  <script>
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", function () {
        navigator.serviceWorker.register("/sw.js").catch(function () {});
      });
    }
  </script>
</head>
<body>
  <header class="site-header">
    <div class="container bar">
      <a href="/" class="logo">Rapid<span>Promo</span></a>
      <nav class="main-nav">
        <a href="/">Accueil</a>
        ${navLinks}
      </nav>
      <form class="search-form" action="/recherche" method="get">
        <input type="search" name="q" placeholder="Rechercher un produit..." required />
        <button type="submit">Chercher</button>
      </form>
    </div>
  </header>

  <main class="container">
    ${opts.body}
  </main>

  <footer class="site-footer">
    <div class="container">
      <div>RapidPromo compare des offres et perçoit une commission sur les achats réalisés via ses liens partenaires. Les prix et disponibilités sont susceptibles de changer sur le site du marchand.</div>
      <div class="links">
        <a href="/mentions-legales">Mentions légales</a>
        <a href="/cgu">CGU</a>
        <a href="/confidentialite">Confidentialité &amp; cookies</a>
        <a href="/admin">Espace pro</a>
      </div>
    </div>
  </footer>

  <div id="cookie-banner" hidden>
    <p>RapidPromo utilise des cookies pour mesurer l'audience et suivre les redirections vers ses partenaires (nécessaires au modèle d'affiliation). Voir notre <a href="/confidentialite" style="color:white;">politique de confidentialité</a>.</p>
    <div class="actions">
      <button class="refuse" onclick="setCookieChoice('refuse')">Refuser</button>
      <button class="accept" onclick="setCookieChoice('accept')">Accepter</button>
    </div>
  </div>

  <script>
    (function () {
      var KEY = "rapidpromo_cookie_choice";
      function getChoice() {
        var m = document.cookie.match(new RegExp('(?:^|; )' + KEY + '=([^;]*)'));
        return m ? decodeURIComponent(m[1]) : null;
      }
      window.setCookieChoice = function (choice) {
        document.cookie = KEY + "=" + choice + "; max-age=" + 60 * 60 * 24 * 180 + "; path=/";
        document.getElementById("cookie-banner").hidden = true;
      };
      if (!getChoice()) {
        document.getElementById("cookie-banner").hidden = false;
      }
    })();
  </script>
</body>
</html>`;
}

export function flashHtml(flash?: { type: "success" | "error"; message: string }): string {
  if (!flash) return "";
  return `<div class="flash ${flash.type}">${escapeHtml(flash.message)}</div>`;
}
