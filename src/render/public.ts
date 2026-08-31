import { layout } from "./layout.js";
import { dealGrid } from "./cards.js";
import {
  getActiveOffersForProduct,
  getCategories,
  getCategoryBySlug,
  getDealsByCategory,
  getHomeDeals,
  getProductById,
  searchDeals,
} from "../repo.js";
import { daysRemaining, escapeHtml, formatDate, formatPrice } from "../util.js";

export function homePage(): string {
  const deals = getHomeDeals(12);
  const categories = getCategories();

  const tabs = categories
    .map((c) => `<a href="/categorie/${c.slug}">${escapeHtml(c.name)}</a>`)
    .join("");

  return layout({
    title: "Les meilleures promotions du moment",
    path: "/",
    body: `
      <div class="hero">
        <h1>Les meilleures promos, comparées pour vous</h1>
        <p>RapidPromo repère les prix les plus bas chez nos marchands partenaires et vous redirige directement vers la meilleure offre.</p>
      </div>
      <div class="category-tabs">${tabs}</div>
      <h2 class="section-title">🔥 Meilleures réductions du moment</h2>
      ${dealGrid(deals)}
    `,
  });
}

export function categoryPage(slug: string, sort: "discount" | "price"): string | null {
  const category = getCategoryBySlug(slug);
  if (!category) return null;

  const categories = getCategories();
  const deals = getDealsByCategory(category.id, sort);

  const tabs = categories
    .map(
      (c) =>
        `<a href="/categorie/${c.slug}" class="${c.slug === slug ? "active" : ""}">${escapeHtml(c.name)}</a>`
    )
    .join("");

  return layout({
    title: category.name,
    activeCategorySlug: slug,
    path: `/categorie/${slug}`,
    body: `
      <div class="hero">
        <h1>${escapeHtml(category.name)}</h1>
        <p>${deals.length} produit${deals.length > 1 ? "s" : ""} en promotion en ce moment.</p>
      </div>
      <div class="category-tabs">${tabs}</div>
      <div style="display:flex; gap:10px; margin-bottom:16px;">
        <a class="btn small ${sort === "discount" ? "" : "secondary"}" href="/categorie/${slug}?tri=reduction">Tri : plus grosse réduction</a>
        <a class="btn small ${sort === "price" ? "" : "secondary"}" href="/categorie/${slug}?tri=prix">Tri : prix le plus bas</a>
      </div>
      ${dealGrid(deals)}
    `,
  });
}

export function searchPage(query: string): string {
  const deals = query.trim() ? searchDeals(query.trim()) : [];
  return layout({
    title: query ? `Résultats pour "${query}"` : "Recherche",
    body: `
      <div class="hero">
        <h1>${query ? `Résultats pour « ${escapeHtml(query)} »` : "Recherche"}</h1>
        <p>${deals.length} résultat${deals.length > 1 ? "s" : ""}.</p>
      </div>
      ${dealGrid(deals)}
    `,
  });
}

export function productPage(id: number): string | null {
  const product = getProductById(id);
  if (!product) return null;
  const offers = getActiveOffersForProduct(id);
  if (offers.length === 0) return null;

  const best = offers[0];
  const remaining = daysRemaining(best.endsAt);

  const rows = offers
    .map(
      (o, i) => `<tr>
        <td>${escapeHtml(o.merchantName)}</td>
        <td>${formatPrice(o.price)}${o.oldPrice ? ` <span class="price-old">${formatPrice(o.oldPrice)}</span>` : ""}</td>
        <td>${o.discountPct ? `-${o.discountPct}%` : "—"}</td>
        <td>${formatDate(o.endsAt)}</td>
        <td><a class="btn small" href="/go/${o.id}" rel="sponsored nofollow">${i === 0 ? "Profiter de l'offre" : "Voir l'offre"}</a></td>
      </tr>`
    )
    .join("\n");

  // Données structurées (schema.org) : aident Google à comprendre qu'il
  // s'agit d'un produit avec un prix, pour un meilleur référencement et de
  // possibles "rich snippets" (étoiles, prix) dans les résultats de recherche.
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: product.image,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "EUR",
      lowPrice: best.price,
      offerCount: offers.length,
      availability: "https://schema.org/InStock",
    },
  });

  return layout({
    title: product.title,
    description: product.description,
    path: `/produit/${id}`,
    image: product.image,
    body: `
      <script type="application/ld+json">${jsonLd}</script>
      <div class="product-detail">
        <div>
          <img src="${product.image}" alt="${escapeHtml(product.title)}" />
        </div>
        <div>
          <h1>${escapeHtml(product.title)}</h1>
          <p class="desc">${escapeHtml(product.description)}</p>
          <div class="price-row" style="margin-bottom:6px;">
            <span class="price-now">À partir de ${formatPrice(best.price)}</span>
            ${best.oldPrice ? `<span class="price-old">${formatPrice(best.oldPrice)}</span>` : ""}
          </div>
          ${remaining <= 2 ? `<span class="badge ends-soon">Offre la moins chère bientôt terminée</span>` : ""}
          <h2 class="section-title" style="margin-top:24px;">Comparatif des ${offers.length} offre${offers.length > 1 ? "s" : ""} actives</h2>
          <table class="offers-table">
            <thead><tr><th>Marchand</th><th>Prix</th><th>Réduction</th><th>Fin de la promo</th><th></th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    `,
  });
}
