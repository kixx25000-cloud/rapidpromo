import { layout } from "./layout.js";
import { dealGrid } from "./cards.js";
import {
  countDealsByCategory,
  getActiveOffersForProduct,
  getCategories,
  getCategoryBySlug,
  getDealsByCategory,
  getHomeDeals,
  getProductById,
  searchDeals,
} from "../repo.js";
import { daysRemaining, escapeHtml, formatDate, formatPrice } from "../util.js";

const SITE_URL = "https://rapidpromo.onrender.com";

// Fil d'Ariane (breadcrumb) en données structurées schema.org : aide Google
// à afficher le chemin de navigation (Accueil > Catégorie > Produit) dans
// les résultats de recherche au lieu de la simple URL, et renforce le maillage
// interne perçu par les moteurs de recherche.
function breadcrumbJsonLd(items: { name: string; path?: string }[]): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      ...(item.path ? { item: `${SITE_URL}${item.path}` } : {}),
    })),
  });
}

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

// Un texte d'introduction unique par catégorie (150-250 mots) : avant cet
// ajout, les pages catégorie n'avaient presque aucun texte propre (juste le
// H1 et le nombre de produits), ce qui les rendait quasi interchangeables
// aux yeux de Google et privait ces pages, parmi les plus visitées du site,
// de mots-clés naturels pour se positionner.
const CATEGORY_INTRO: Record<string, string> = {
  "high-tech": `Smartphones, ordinateurs portables, TV, écouteurs, composants PC, objets connectés... la catégorie high-tech de RapidPromo réunit les meilleures promotions du moment chez plusieurs marchands partenaires. Plutôt que de comparer les prix produit par produit sur chaque site marchand, RapidPromo le fait pour vous et remet en avant, sur chaque fiche, le prix le plus bas actuellement disponible ainsi que la réduction appliquée par rapport au prix de référence. Les offres sont mises à jour en continu à partir des catalogues de nos partenaires, avec une date de fin de promotion clairement indiquée sur chaque fiche produit. Avant d'acheter un article high-tech en promotion, mieux vaut vérifier que la réduction affichée est réelle : consultez notre guide « 6 réflexes pour bien choisir une promo high-tech » pour éviter les fausses bonnes affaires. Utilisez les boutons de tri ci-dessous pour classer les offres par plus grosse réduction ou par prix le plus bas, et parcourez les pages suivantes pour voir l'ensemble du catalogue high-tech en promotion.`,
  maison: `Électroménager, petit électroménager, cuisine, rangement, décoration... la catégorie maison & électroménager de RapidPromo compare les promotions du moment sur tout ce qui équipe la maison, chez plusieurs marchands partenaires. Chaque fiche produit affiche le prix le plus bas repéré, la réduction par rapport au prix de référence, et une date de fin d'offre pour ne pas manquer une bonne affaire. Les gros achats d'électroménager méritent une vigilance particulière lors des soldes : notre guide « profiter des soldes électroménager sans se tromper » détaille les points à vérifier avant de valider une commande (garantie, avis, prix historique). Triez les offres ci-dessous par réduction ou par prix, et naviguez entre les pages pour découvrir l'ensemble des promotions maison actuellement actives sur RapidPromo.`,
  mode: `Vêtements, chaussures, accessoires, cosmétiques, parfums... la catégorie mode & beauté de RapidPromo rassemble les meilleures promotions repérées chez nos marchands partenaires. Comme pour les autres catégories, chaque fiche produit indique le prix le plus bas du moment, la réduction appliquée et la date de fin de la promotion, pour vous permettre de comparer rapidement sans multiplier les onglets. Le secteur mode & beauté est particulièrement concerné par les fausses promotions (prix barré gonflé artificiellement avant le déstockage) : nos guides « nos astuces mode & beauté pour économiser sans sacrifier la qualité » et « prix barré, fausse promo : 5 signes qui doivent vous alerter » vous aident à faire la différence. Utilisez les boutons de tri pour classer les offres par réduction ou par prix, et parcourez les pages suivantes pour voir tout le catalogue mode & beauté en promotion.`,
};

const CATEGORY_PAGE_SIZE = 60;

export async function categoryPage(
  slug: string,
  sort: "discount" | "price",
  page = 1
): Promise<string | null> {
  const category = await getCategoryBySlug(slug);
  if (!category) return null;

  const categories = await getCategories();
  const total = await countDealsByCategory(category.id);
  const totalPages = Math.max(1, Math.ceil(total / CATEGORY_PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const deals = await getDealsByCategory(
    category.id,
    sort,
    CATEGORY_PAGE_SIZE,
    (safePage - 1) * CATEGORY_PAGE_SIZE
  );
  // Page demandée hors limites (ex. ?page=999 sur une catégorie qui n'a que
  // 5 pages) : traité comme une page introuvable plutôt que de renvoyer une
  // page vide indexable, qui serait perçue comme du contenu de faible qualité.
  if (page > totalPages || page < 1) return null;

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

  const sortQuery = sort === "price" ? "&tri=prix" : "";
  const pageHref = (p: number) => `/categorie/${slug}?page=${p}${sortQuery}`;
  // Pagination : liens réels (pas de JavaScript) vers les pages précédente/
  // suivante et vers 5 numéros de page autour de la page courante, pour que
  // les ~3 300 produits du catalogue restent tous atteignables en cliquant
  // depuis le site, et pas seulement listés dans le sitemap.xml.
  let paginationLinks = "";
  if (totalPages > 1) {
    const windowStart = Math.max(1, safePage - 2);
    const windowEnd = Math.min(totalPages, windowStart + 4);
    const pageNumbers = [];
    for (let p = windowStart; p <= windowEnd; p++) {
      pageNumbers.push(
        `<a class="btn small ${p === safePage ? "" : "secondary"}" href="${pageHref(p)}"${p === safePage ? ' aria-current="page"' : ""}>${p}</a>`
      );
    }
    paginationLinks = `
      <nav class="pagination" style="display:flex; gap:6px; flex-wrap:wrap; margin:24px 0;" aria-label="Pagination">
        ${safePage > 1 ? `<a class="btn small secondary" href="${pageHref(safePage - 1)}" rel="prev">&larr; Page précédente</a>` : ""}
        ${pageNumbers.join("\n")}
        ${safePage < totalPages ? `<a class="btn small secondary" href="${pageHref(safePage + 1)}" rel="next">Page suivante &rarr;</a>` : ""}
      </nav>`;
  }

  const breadcrumb = breadcrumbJsonLd([
    { name: "Accueil", path: "/" },
    { name: category.name, ...(safePage > 1 ? { path: `/categorie/${slug}` } : {}) },
  ]);

  const pageSuffix = safePage > 1 ? ` — page ${safePage}` : "";

  return layout({
    title: `${category.name}${pageSuffix}`,
    // Description raccourcie pour rester sous ~155-160 caractères même avec
    // le nom de catégorie le plus long ("maison & électroménager") — au-delà,
    // Google tronque souvent la description dans les résultats de recherche.
    description: `RapidPromo compare les offres ${category.name.toLowerCase()} du moment${pageSuffix ? ` (page ${safePage}/${totalPages})` : ""} : prix les plus bas chez plusieurs marchands partenaires, triées par réduction ou par prix.`,
    activeCategorySlug: slug,
    path: `/categorie/${slug}${safePage > 1 ? `?page=${safePage}` : ""}`,
    body: `
      <script type="application/ld+json">${breadcrumb}</script>
      <div class="hero">
        <h1>${escapeHtml(category.name)}${safePage > 1 ? ` <span style="font-weight:400;color:#6b7280;">— page ${safePage}/${totalPages}</span>` : ""}</h1>
        <p>${total} produit${total > 1 ? "s" : ""} en promotion en ce moment.</p>
      </div>
      ${safePage === 1 && CATEGORY_INTRO[slug] ? `<p style="color:#4b5563; margin-bottom:20px; max-width:70ch;">${escapeHtml(CATEGORY_INTRO[slug])}</p>` : ""}
      <div class="category-tabs">${tabs}</div>
      <div style="display:flex; gap:10px; margin-bottom:16px;">
        <a class="btn small ${sort === "discount" ? "" : "secondary"}" href="/categorie/${slug}?tri=reduction">Tri : plus grosse réduction</a>
        <a class="btn small ${sort === "price" ? "" : "secondary"}" href="/categorie/${slug}?tri=prix">Tri : prix le plus bas</a>
      </div>
      ${dealGrid(deals)}
      ${paginationLinks}
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
    // Les pages de résultats de recherche interne (une par mot-clé tapé) ne
    // sont pas destinées à être indexées individuellement par Google — elles
    // dupliquent le contenu déjà présent sur les pages catégorie/produit et
    // pourraient gaspiller le budget d'exploration. "noindex" seul laisse
    // Google continuer à suivre les liens vers les fiches produit depuis
    // cette page.
    noindex: true,
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
  const categories = await getCategories();
  const category = categories.find((c) => c.id === product.categoryId);

  // La quasi-totalité du catalogue a été importée sans description (champ
  // laissé vide lors de l'ajout en masse depuis les meilleures ventes
  // Amazon) : sans repli, la balise meta description et les données
  // structurées Product se retrouvaient vides sur ~3 300 fiches, ce qui
  // prive Google d'un texte à afficher sous le lien dans les résultats de
  // recherche. On génère une description courte et unique à partir du
  // titre, du prix et de la catégorie plutôt que de laisser vide.
  const effectiveDescription =
    product.description && product.description.trim().length > 0
      ? product.description
      : `Comparez le prix de ${product.title}${category ? ` (${category.name})` : ""} : à partir de ${formatPrice(best.price)} chez ${offers.length > 1 ? `${offers.length} marchands partenaires` : best.merchantName}, sur RapidPromo.`;

  const rows = offers
    .map(
      (o, i) => `<tr>
        <td>${escapeHtml(o.merchantName)}</td>
        <td>${formatPrice(o.price)}${o.oldPrice ? ` <span class="price-old">${formatPrice(o.oldPrice)}</span>` : ""}</td>
        <td>${o.discountPct ? `-${o.discountPct}%` : "—"}</td>
        <td>${formatDate(o.endsAt)}</td>
        <td><a class="btn small" href="/go/${o.id}" rel="sponsored nofollow noopener" target="_blank">${i === 0 ? "Profiter de l'offre" : "Voir l'offre"}</a></td>
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
    description: effectiveDescription,
    image: product.image,
    url: `${SITE_URL}/produit/${id}`,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "EUR",
      lowPrice: best.price,
      offerCount: offers.length,
      availability: "https://schema.org/InStock",
      priceValidUntil: best.endsAt.slice(0, 10),
      // Tous les produits comparés viennent de programmes d'affiliation
      // officiels (Amazon...) : ce sont des articles neufs vendus par le
      // marchand, jamais d'occasion ou reconditionnés — champ recommandé par
      // Google pour les données structurées Offer.
      itemCondition: "https://schema.org/NewCondition",
    },
  });

  const breadcrumb = breadcrumbJsonLd([
    { name: "Accueil", path: "/" },
    ...(category ? [{ name: category.name, path: `/categorie/${category.slug}` }] : []),
    { name: product.title },
  ]);

  return layout({
    title: product.title,
    description: effectiveDescription,
    path: `/produit/${id}`,
    image: product.image,
    body: `
      <script type="application/ld+json">${jsonLd}</script>
      <script type="application/ld+json">${breadcrumb}</script>
      <div class="product-detail">
        <div>
          <img src="${product.image}" alt="${escapeHtml(product.title)}" />
        </div>
        <div>
          <h1>${escapeHtml(product.title)}</h1>
          <p class="desc">${escapeHtml(effectiveDescription)}</p>
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
