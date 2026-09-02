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
  {
    slug: "reperer-fausse-promotion-prix-barre",
    title: "Prix barré, fausse promo : 5 signes qui doivent vous alerter",
    description:
      "Un prix barré n'est pas toujours une vraie réduction. Voici comment repérer une fausse promotion en quelques secondes avant d'acheter.",
    categorySlug: null,
    categoryLabel: "À propos",
    publishedAt: "2026-09-02",
    bodyHtml: `
      <p>Depuis 2015, les commerçants en ligne sont encadrés par la réglementation sur les annonces de réduction de prix : le prix "de référence" barré doit correspondre au prix le plus bas réellement pratiqué au cours des 30 derniers jours. Dans les faits, tous les marchands ne jouent pas le jeu de la même façon. Voici les signes qui doivent mettre la puce à l'oreille.</p>
      <h2>1. Le prix barré ne bouge jamais</h2>
      <p>Si un produit affiche "-40%" en continu depuis des mois sans que le prix barré change, ce prix de référence a de fortes chances d'être artificiel plutôt qu'un vrai prix pratiqué récemment.</p>
      <h2>2. La réduction est ronde et spectaculaire</h2>
      <p>Une remise de "-70%" ou "-80%" sur un produit courant doit interroger : soit c'est un vrai déstockage ponctuel, soit le prix de départ a été gonflé pour rendre la remise plus impressionnante qu'elle ne l'est réellement.</p>
      <h2>3. Le prix ne correspond à aucun historique cohérent</h2>
      <p>Comparer le prix affiché avec ce qui est pratiqué chez d'autres marchands pour le même produit reste le réflexe le plus fiable. C'est exactement ce que permet un comparateur comme RapidPromo : voir plusieurs offres actives côte à côte, plutôt que de se fier à un seul site.</p>
      <h2>4. La promotion est "limitée dans le temps" en permanence</h2>
      <p>Un compte à rebours qui se relance sans cesse, ou une mention "offre valable aujourd'hui seulement" qui revient chaque jour, est une technique classique pour créer un faux sentiment d'urgence.</p>
      <h2>5. Le vendeur n'est pas identifiable clairement</h2>
      <p>Sur les marketplaces, vérifiez toujours qui vend réellement le produit (le site lui-même ou un vendeur tiers) : les conditions de retour, de garantie et de service après-vente peuvent différer.</p>
      <p>Le meilleur réflexe reste simple : comparer avant d'acheter, plutôt que de se fier à un seul badge "promo". C'est la mission de RapidPromo sur les catégories <a href="/categorie/high-tech">high-tech</a>, <a href="/categorie/maison">maison &amp; électroménager</a> et <a href="/categorie/mode">mode &amp; beauté</a>.</p>
    `,
  },
  {
    slug: "calendrier-meilleures-periodes-soldes-promos",
    title: "Calendrier des promos 2026 : quand acheter le moins cher selon la catégorie",
    description:
      "Soldes, French Days, Black Friday... le calendrier des meilleures périodes pour acheter en promo high-tech, maison et mode & beauté.",
    categorySlug: null,
    categoryLabel: "À propos",
    publishedAt: "2026-09-02",
    bodyHtml: `
      <p>Toutes les périodes de promotion ne se valent pas selon ce que vous achetez. Voici un calendrier repère pour savoir quand les prix ont le plus de chances d'être vraiment bas, catégorie par catégorie.</p>
      <h2>Janvier et juillet : les soldes officielles</h2>
      <p>Les seules périodes de démarque réglementées par la loi en France. Elles restent particulièrement intéressantes pour la <a href="/categorie/mode">mode &amp; beauté</a>, où les enseignes doivent réellement écouler leurs stocks de saison.</p>
      <h2>Fin avril / début mai : les French Days</h2>
      <p>Un bon moment pour le <a href="/categorie/high-tech">high-tech</a> : les marques préparent souvent des baisses ciblées sur les références qui vont être renouvelées dans l'année.</p>
      <h2>Fin novembre : Black Friday et Cyber Monday</h2>
      <p>La période la plus intense de l'année tous secteurs confondus, mais aussi celle où les faux prix barrés sont les plus fréquents (voir notre <a href="/guides/reperer-fausse-promotion-prix-barre">guide pour repérer une fausse promotion</a>). Comparer plusieurs marchands y est particulièrement utile.</p>
      <h2>Septembre-octobre : la rentrée pour l'électroménager</h2>
      <p>Les nouvelles gammes <a href="/categorie/maison">maison &amp; électroménager</a> arrivent souvent à l'automne, ce qui pousse certains marchands à baisser les prix sur les modèles de l'année précédente.</p>
      <h2>Le reste de l'année : rester attentif plutôt qu'attendre</h2>
      <p>En dehors de ces temps forts, de bonnes affaires ponctuelles existent toute l'année (fin de série, déstockage, opération d'un marchand en particulier). Plutôt que d'attendre une date précise, le plus efficace reste de comparer régulièrement les offres actives sur RapidPromo pour ne pas rater une promo isolée.</p>
    `,
  },
  {
    slug: "lien-affilie-comment-ca-marche",
    title: "Lien affilié RapidPromo : comment ça marche, et est-ce que ça change le prix ?",
    description:
      "RapidPromo utilise des liens d'affiliation pour se financer. Explication simple de ce que c'est, et pourquoi ça ne change rien au prix que vous payez.",
    categorySlug: null,
    categoryLabel: "À propos",
    publishedAt: "2026-09-02",
    bodyHtml: `
      <p>C'est une question légitime, et la réponse est simple : non, cliquer sur un lien RapidPromo ne coûte rien de plus, et ne change jamais le prix affiché chez le marchand.</p>
      <h2>Qu'est-ce qu'un lien d'affiliation ?</h2>
      <p>Quand vous cliquez sur "Profiter de l'offre" sur RapidPromo, vous êtes redirigé vers la page du marchand via un lien spécial qui indique simplement d'où vient la visite. Si vous achetez ensuite, le marchand reverse une petite commission à RapidPromo — un peu comme un vendeur qui vous a orienté vers le bon rayon touche une prime, sans que cela change le prix payé en caisse.</p>
      <h2>Pourquoi le prix ne change pas</h2>
      <p>La commission d'affiliation est payée par le marchand sur sa propre marge, dans le cadre d'un programme officiel (Amazon Partenaires, Awin, Tradedoubler...). Elle n'est jamais ajoutée au prix affiché : vous payez exactement le même montant qu'en allant directement sur le site du marchand, voire moins si RapidPromo vous a permis de repérer l'offre la moins chère.</p>
      <h2>Pourquoi RapidPromo est gratuit pour vous</h2>
      <p>C'est justement ce modèle qui permet à RapidPromo de comparer les prix sans rien facturer aux visiteurs : le site se rémunère uniquement quand il vous aide réellement à trouver une bonne affaire, jamais autrement.</p>
      <h2>La transparence, une obligation légale</h2>
      <p>En France, toute communication commerciale autour d'un lien affilié doit être clairement signalée — c'est une règle que RapidPromo applique scrupuleusement, y compris dans ce guide.</p>
      <p>Pour en savoir plus sur l'ensemble de la démarche, consultez notre page <a href="/guides/quest-ce-que-rapidpromo">« RapidPromo, c'est quoi ? »</a>.</p>
    `,
  },
  {
    slug: "rapidpromo-est-il-fiable-transparence",
    title: "RapidPromo est-il fiable ? Notre engagement de transparence",
    description:
      "Comment RapidPromo sélectionne ses offres, d'où viennent les prix affichés, et pourquoi le site n'a aucun intérêt à afficher un faux bon plan.",
    categorySlug: null,
    categoryLabel: "À propos",
    publishedAt: "2026-09-02",
    bodyHtml: `
      <p>Un comparateur n'a de valeur que si l'on peut lui faire confiance. Voici, sans détour, comment RapidPromo fonctionne et ce qui garantit son sérieux.</p>
      <h2>D'où viennent les prix affichés ?</h2>
      <p>Exclusivement de programmes d'affiliation officiels (Amazon Partenaires, et d'autres réseaux partenaires en cours d'intégration). Aucune donnée n'est scrapée ou inventée : chaque offre correspond à un prix réellement pratiqué par le marchand au moment de la publication.</p>
      <h2>RapidPromo peut-il "pousser" une offre pour gagner plus ?</h2>
      <p>Non : le tri des offres sur une fiche produit se fait par prix croissant, de façon automatique. RapidPromo n'a pas intérêt à mettre en avant une offre plus chère, puisque son modèle repose sur la confiance des visiteurs qui reviennent comparer régulièrement.</p>
      <h2>Que se passe-t-il quand une promo se termine ?</h2>
      <p>L'offre est automatiquement retirée du site. Une promotion affichée sur RapidPromo est une promotion active au moment où vous la consultez.</p>
      <h2>Qui se cache derrière RapidPromo ?</h2>
      <p>Un site indépendant, sans lien capitalistique avec les marchands comparés. RapidPromo ne vend rien lui-même et n'intervient jamais dans la transaction, le paiement ou la livraison — cela reste entièrement entre vous et le marchand choisi.</p>
      <p>Pour le détail du modèle économique, voir notre guide <a href="/guides/lien-affilie-comment-ca-marche">sur le fonctionnement des liens affiliés</a>.</p>
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
