import { layout } from "./layout.js";
import { escapeHtml, formatDate } from "../util.js";

// Section "Guides" : contenu éditorial original (conseils d'achat, non lié à
// un flux de produits), pensé pour le référencement naturel (SEO) — mots-clés
// longue traîne par thématique, et pages supplémentaires qui renforcent la
// présence de RapidPromo dans les résultats Google, y compris pour la
// recherche de la marque elle-même. Les articles sont statiques (pas de
// scraping, pas de contenu copié) et pointent vers les catégories du site.

interface GuideArticle {
  slug: string;
  title: string;
  description: string;
  categorySlug: string | null;
  categoryLabel: string;
  publishedAt: string;
  bodyHtml: string;
}

const ARTICLES: GuideArticle[] = [
  {
    slug: "quest-ce-que-rapidpromo",
    title: "RapidPromo : c'est quoi, comment ça marche et pourquoi comparer les promos ?",
    description:
      "RapidPromo est un comparateur de promotions en ligne, gratuit et indépendant. Découvrez comment le site sélectionne les offres et comment en profiter.",
    categorySlug: null,
    categoryLabel: "À propos",
    publishedAt: "2026-08-31",
    bodyHtml: `
      <p>RapidPromo est né d'un constat simple : les promotions intéressantes sont partout sur internet, mais elles sont dispersées entre des dizaines de sites marchands, difficiles à comparer et souvent limitées dans le temps. RapidPromo centralise ces offres dans trois thématiques — <a href="/categorie/high-tech">high-tech</a>, <a href="/categorie/maison">maison &amp; électroménager</a> et <a href="/categorie/mode">mode &amp; beauté</a> — et les compare automatiquement pour afficher le prix le plus bas du moment sur chaque produit.</p>
      <h2>Comment fonctionne RapidPromo ?</h2>
      <p>Le site s'appuie sur des programmes d'affiliation officiels (Amazon, et d'autres réseaux partenaires) pour recevoir des informations à jour sur les prix et les promotions en cours. Aucune donnée n'est scrapée en dehors de ces canaux officiels. Quand une promotion se termine ou qu'un prix change, la fiche produit RapidPromo est automatiquement mise à jour.</p>
      <h2>RapidPromo est-il gratuit ?</h2>
      <p>Oui, entièrement. RapidPromo ne facture rien à ses visiteurs. Le site se rémunère uniquement via une commission d'affiliation versée par le marchand lorsqu'un achat est réalisé après un clic depuis RapidPromo — un modèle courant et transparent, qui ne modifie jamais le prix payé par l'acheteur.</p>
      <h2>Comment profiter d'une offre ?</h2>
      <p>Chaque fiche produit affiche un tableau comparatif des offres actives, triées par prix. Un clic sur "Profiter de l'offre" redirige directement vers la page du marchand pour finaliser l'achat — RapidPromo n'intervient jamais dans la transaction elle-même (paiement, livraison, service après-vente).</p>
      <p>Pour retrouver le site facilement, il suffit de taper <strong>RapidPromo</strong> dans votre moteur de recherche, ou de l'ajouter à vos favoris.</p>
    `,
  },
  {
    slug: "bien-choisir-promo-high-tech",
    title: "High-tech en promo : 6 réflexes pour ne pas se tromper",
    description:
      "Smartphone, PC, écouteurs... comment repérer une vraie bonne affaire high-tech et éviter les pièges des fausses promotions.",
    categorySlug: "high-tech",
    categoryLabel: "High-tech",
    publishedAt: "2026-08-31",
    bodyHtml: `
      <p>Les promotions high-tech sont parmi les plus nombreuses en ligne, mais aussi les plus trompeuses : un prix "barré" n'est pas toujours une vraie réduction. Voici quelques réflexes simples avant d'acheter.</p>
      <h2>1. Comparez plusieurs marchands, pas seulement le prix affiché</h2>
      <p>Un même produit (même référence exacte, même version) peut être vendu à des prix différents selon le marchand. C'est exactement ce que fait <a href="/categorie/high-tech">la catégorie high-tech de RapidPromo</a> : afficher plusieurs offres actives côte à côte pour un même produit.</p>
      <h2>2. Vérifiez la référence exacte du modèle</h2>
      <p>Sur les smartphones et ordinateurs portables, deux configurations qui se ressemblent (stockage, RAM, coloris) peuvent avoir des prix très différents. Prenez toujours le temps de vérifier que la fiche produit correspond exactement à ce que vous cherchez.</p>
      <h2>3. Regardez la date de fin de la promotion</h2>
      <p>Une promotion limitée dans le temps peut créer un sentiment d'urgence artificiel. Rien n'empêche d'attendre un jour ou deux pour comparer sereinement, sauf si le stock est explicitement annoncé comme limité.</p>
      <h2>4. Méfiez-vous des accessoires "obligatoires"</h2>
      <p>Certaines offres associent un produit high-tech à des accessoires ou un abonnement qui gonflent le prix final. Vérifiez toujours ce qui est réellement inclus.</p>
      <h2>5. Gardez un œil sur la garantie</h2>
      <p>Un produit reconditionné ou vendu par un marchand tiers peut avoir des conditions de garantie différentes d'un achat neuf classique. C'est une information à vérifier sur la fiche du marchand avant de valider l'achat.</p>
      <h2>6. Comparez avant, achetez après</h2>
      <p>Le meilleur réflexe reste de comparer avant d'acheter, pas après. C'est la mission de RapidPromo : afficher le prix le plus bas du moment sur chaque produit high-tech suivi.</p>
    `,
  },
  {
    slug: "electromenager-soldes-sans-se-tromper",
    title: "Électroménager : comment profiter des soldes sans se tromper",
    description:
      "Robot cuiseur, aspirateur, épilateur électrique... nos conseils pour acheter de l'électroménager en promotion sans mauvaise surprise.",
    categorySlug: "maison",
    categoryLabel: "Maison & Électroménager",
    publishedAt: "2026-08-31",
    bodyHtml: `
      <p>L'électroménager est une catégorie où les écarts de prix entre marchands peuvent être importants, surtout pendant les périodes de soldes. Quelques points de vigilance avant d'acheter.</p>
      <h2>Vérifiez la puissance et les dimensions réelles</h2>
      <p>Sur des produits comme les aspirateurs, robots de cuisine ou petits appareils de beauté, deux modèles très proches visuellement peuvent avoir des caractéristiques techniques différentes. Prenez le temps de lire la fiche technique complète avant de comparer les prix.</p>
      <h2>Comparez le prix au litre, au watt, ou à l'unité utile</h2>
      <p>Pour l'électroménager, comparer uniquement le prix affiché peut être trompeur si les capacités (volume, puissance, autonomie) diffèrent. La <a href="/categorie/maison">catégorie maison &amp; électroménager de RapidPromo</a> permet de comparer plusieurs offres actives sur un même produit, ce qui facilite ce type de comparaison.</p>
      <h2>Pensez à la disponibilité des pièces détachées et du SAV</h2>
      <p>Pour un achat électroménager, la disponibilité du service après-vente et des pièces détachées est un critère aussi important que le prix, surtout sur des appareils utilisés au quotidien.</p>
      <h2>Ne vous fiez pas uniquement au pourcentage de réduction affiché</h2>
      <p>Un pourcentage de réduction élevé peut parfois s'appliquer à un prix de référence gonflé artificiellement. Ce qui compte, c'est le prix final réellement payé — c'est pour cette raison que RapidPromo affiche toujours le prix en euros, pas seulement le pourcentage.</p>
      <h2>Attendez les bonnes périodes si vous n'êtes pas pressé</h2>
      <p>Certaines catégories d'électroménager voient revenir des promotions régulières à des périodes prévisibles de l'année. Si votre achat n'est pas urgent, comparer sur quelques jours via RapidPromo permet souvent de repérer une meilleure offre.</p>
    `,
  },
  {
    slug: "mode-beaute-economiser-sans-sacrifier-qualite",
    title: "Mode & beauté : nos astuces pour économiser sans sacrifier la qualité",
    description:
      "Cosmétiques, soins, accessoires de mode : comment profiter des promotions mode & beauté intelligemment.",
    categorySlug: "mode",
    categoryLabel: "Mode & Beauté",
    publishedAt: "2026-08-31",
    bodyHtml: `
      <p>Le secteur mode &amp; beauté propose des promotions très fréquentes, ce qui peut donner l'impression que "tout est toujours en promo". Voici comment y voir plus clair.</p>
      <h2>Repérez les vraies périodes de forte réduction</h2>
      <p>Certaines enseignes pratiquent des promotions légères en continu, et des réductions bien plus fortes à certaines périodes précises. Comparer régulièrement via la <a href="/categorie/mode">catégorie mode &amp; beauté de RapidPromo</a> permet de repérer ces écarts plus facilement qu'en surveillant un seul site marchand.</p>
      <h2>Vérifiez la contenance et la composition, pas seulement le prix</h2>
      <p>Pour les cosmétiques et produits de soin, deux formats visuellement proches peuvent avoir des contenances très différentes. Le prix au ml ou au gramme est souvent plus parlant que le prix affiché brut.</p>
      <h2>Un prix bas ne veut pas dire produit de moindre qualité</h2>
      <p>Une promotion s'explique souvent par un déstockage, un changement de packaging ou une opération commerciale ponctuelle du marchand — pas nécessairement par un défaut du produit. Cela dit, il reste utile de vérifier la date de péremption sur les produits cosmétiques.</p>
      <h2>Comparez les frais de livraison</h2>
      <p>Sur les petits articles mode et beauté, les frais de livraison peuvent parfois annuler l'intérêt d'une réduction. Vérifiez toujours le prix total, livraison comprise, avant de valider votre panier chez le marchand.</p>
      <h2>Gardez une liste de vos essentiels</h2>
      <p>Plutôt que d'acheter au coup par coup, garder une liste de vos produits mode et beauté récurrents permet de profiter des bonnes promotions au bon moment, sans achat impulsif inutile.</p>
    `,
  },
];

export async function guidesIndexPage(): Promise<string> {
  const cards = ARTICLES.map(
    (a) => `
      <a class="card" href="/guides/${a.slug}" style="display:block; padding:16px;">
        <span class="badge">${escapeHtml(a.categoryLabel)}</span>
        <h3 style="margin-top:8px;">${escapeHtml(a.title)}</h3>
        <p style="color:#6b7280; margin-top:6px;">${escapeHtml(a.description)}</p>
      </a>`
  ).join("\n");

  return layout({
    title: "Guides & conseils",
    description:
      "Les guides RapidPromo : conseils pratiques pour bien acheter en promotion, par thématique (high-tech, maison, mode & beauté).",
    path: "/guides",
    body: `
      <div class="hero">
        <h1>Guides &amp; conseils RapidPromo</h1>
        <p>Des conseils pratiques et indépendants pour profiter des promotions sans mauvaise surprise.</p>
      </div>
      <div class="grid">${cards}</div>
    `,
  });
}

export async function guideArticlePage(slug: string): Promise<string | null> {
  const article = ARTICLES.find((a) => a.slug === slug);
  if (!article) return null;

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.publishedAt,
    author: { "@type": "Organization", name: "RapidPromo" },
    publisher: { "@type": "Organization", name: "RapidPromo" },
  });

  const categoryLink = article.categorySlug
    ? `<p><a href="/categorie/${article.categorySlug}">Voir les offres ${escapeHtml(article.categoryLabel.toLowerCase())} en ce moment →</a></p>`
    : "";

  return layout({
    title: article.title,
    description: article.description,
    path: `/guides/${article.slug}`,
    body: `
      <script type="application/ld+json">${jsonLd}</script>
      <article class="legal-page">
        <p><a href="/guides">← Tous les guides</a></p>
        <h1>${escapeHtml(article.title)}</h1>
        <p style="color:#6b7280;">Publié le ${formatDate(article.publishedAt)} — ${escapeHtml(article.categoryLabel)}</p>
        ${article.bodyHtml}
        ${categoryLink}
      </article>
    `,
  });
}

export function getGuideSlugs(): string[] {
  return ARTICLES.map((a) => a.slug);
}

