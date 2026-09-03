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

export async function homePage(): Promise<string> {
  const deals = await getHomeDeals(12);
  const categories = await getCategories();

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

      <section style="margin-top:48px; padding-top:24px; border-top:1px solid #e5e7eb; color:#4b5563;">
        <h2 class="section-title">RapidPromo, le comparateur de promotions en ligne</h2>
        <p>RapidPromo est un site 100% gratuit qui compare en continu les promotions <strong>high-tech</strong>, <strong>maison &amp; électroménager</strong> et <strong>mode &amp; beauté</strong> chez plusieurs marchands partenaires, pour vous faire gagner du temps et de l'argent. Plutôt que de comparer les prix vous-même produit par produit, RapidPromo le fait pour vous et met en avant le prix le plus bas du moment.</p>
        <p>Chaque fiche produit RapidPromo affiche un comparatif clair des offres actives : prix, réduction, marchand et date de fin de la promotion. Un clic vous redirige directement vers le site du marchand pour finaliser votre achat, en toute sécurité — RapidPromo ne vend rien lui-même et ne gère ni paiement ni livraison.</p>
        <p>Vous cherchez des conseils pour mieux acheter en promotion ? Consultez nos <a href="/guides">guides RapidPromo</a>, ou utilisez la recherche en haut de page pour retrouver rapidement un produit.</p>
      </section>
    `,
  });
}

export async function categoryPage(slug: string, sort: "discount" | "price"): Promise<string | null> {
  const category = await getCategoryBySlug(slug);
  if (!category) return null;

  const categories = await getCategories();
  const deals = await getDealsByCategory(category.id, sort);

  const tabs = categories
    .map(
      (c) =>
        `<a href="/categorie/${c.slug}" class="${c.slug === slug ? "active" : ""}">${escapeHtml(c.name)}</a>`
    )
    .join("");

  // Maillage interne vers le guide correspondant : les guides pointent déjà
  // vers les catégories, ce lien complète la boucle dans l'autre sens pour
  // que les moteurs de recherche découvrent plus facilement le contenu
  // éditorial depuis les pages catégorie, les plus visitées du site.
  const guideBySlug: Record<string, { slug: string; label: string }> = {
    "high-tech": { slug: "bien-choisir-promo-high-tech", label: "nos 6 réflexes pour bien choisir une promo high-tech" },
    maison: { slug: "electromenager-soldes-sans-se-tromper", label: "nos conseils pour profiter des soldes électroménager sans se tromper" },
    mode: { slug: "mode-beaute-economiser-sans-sacrifier-qualite", label: "nos astuces mode & beauté pour économiser sans sacrifier la qualité" },
  };
  const relatedGuide = guideBySlug[slug];
  const guideLink = relatedGuide
    ? `<p style="margin-top:24px; color:#6b7280;">📖 <a href="/guides/${relatedGuide.slug}">Lire ${relatedGuide.label}</a></p>`
    : "";

  return layout({
    title: category.name,
    description: `Comparez les meilleures offres ${category.name.toLowerCase()} du moment sur RapidPromo : prix les plus bas chez plusieurs marchands partenaires, triés par réduction ou par prix.`,
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
      ${guideLink}
    `,
  });
}

export async function searchPage(query: string): Promise<string> {
  const deals = query.trim() ? await searchDeals(query.trim()) : [];
  return layout({
    title: query ? `Résultats pour "${query}"` : "Recherche",
    description: query
      ? `${deals.length} offre${deals.length > 1 ? "s" : ""} trouvée${deals.length > 1 ? "s" : ""} pour "${query}" sur RapidPromo, comparateur de promotions.`
      : "Recherchez un produit en promotion sur RapidPromo pour comparer les offres actives chez plusieurs marchands.",
    path: "/recherche",
    body: `
      <div class="hero">
        <h1>${query ? `Résultats pour « ${escapeHtml(query)} »` : "Recherche"}</h1>
        <p>${deals.length} résultat${deals.length > 1 ? "s" : ""}.</p>
      </div>
      ${dealGrid(deals)}
    `,
  });
}

export async function productPage(id: number): Promise<string | null> {
  const product = await getProductById(id);
  if (!product) return null;
  const offers = await getActiveOffersForProduct(id);
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
