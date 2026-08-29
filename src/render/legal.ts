import { layout } from "./layout.js";

const PLACEHOLDER = (label: string) => `<span class="placeholder">${label}</span>`;

export function mentionsLegalesPage(): string {
  return layout({
    title: "Mentions légales",
    body: `
      <div class="legal-page">
        <h1>Mentions légales</h1>
        <p><em>Page modèle à compléter avec vos informations réelles avant la mise en ligne (obligatoire en France).</em></p>
        <p>
          Éditeur du site : ${PLACEHOLDER("Nom / raison sociale")}<br/>
          Statut : ${PLACEHOLDER("ex. Auto-entrepreneur")} — SIRET ${PLACEHOLDER("numéro SIRET")}<br/>
          Adresse : ${PLACEHOLDER("adresse postale")}<br/>
          Email de contact : ${PLACEHOLDER("contact@rapidpromo.fr")}<br/>
          Directeur de la publication : ${PLACEHOLDER("Nom")}
        </p>
        <p>
          Hébergeur : ${PLACEHOLDER("Nom de l'hébergeur, adresse, téléphone")}
        </p>
        <p>
          RapidPromo est un site comparateur qui redirige ses visiteurs vers des sites marchands tiers
          via des liens d'affiliation. RapidPromo perçoit une commission sur les ventes réalisées via ces liens,
          sans surcoût pour l'acheteur. RapidPromo n'est ni vendeur ni intermédiaire dans la transaction, qui se
          conclut directement entre l'internaute et le site marchand.
        </p>
      </div>
    `,
  });
}

export function cguPage(): string {
  return layout({
    title: "Conditions générales d'utilisation",
    body: `
      <div class="legal-page">
        <h1>Conditions générales d'utilisation</h1>
        <p><em>Modèle à faire valider par un professionnel du droit avant mise en ligne.</em></p>
        <h2>Objet</h2>
        <p>RapidPromo est un service de comparaison de promotions. Il référence des offres proposées par des
        marchands partenaires et redirige l'utilisateur vers leur site pour finaliser tout achat.</p>
        <h2>Nature du service</h2>
        <p>RapidPromo n'est pas vendeur des produits présentés. La vente, la livraison, la facturation, le
        service après-vente et le droit de rétractation relèvent exclusivement du marchand chez qui l'achat est
        effectué. Les prix et disponibilités affichés sont fournis par les marchands partenaires et peuvent
        évoluer entre le moment de la consultation et celui de l'achat.</p>
        <h2>Rémunération</h2>
        <p>RapidPromo perçoit une commission d'affiliation de la part des marchands partenaires lorsqu'un
        achat est réalisé suite à une redirection depuis le site, sans impact sur le prix payé par l'acheteur.</p>
        <h2>Responsabilité</h2>
        <p>RapidPromo met tout en œuvre pour l'exactitude des informations affichées mais ne peut être tenu
        responsable des erreurs de prix, de disponibilité ou de description provenant des flux marchands.</p>
      </div>
    `,
  });
}

export function confidentialitePage(): string {
  return layout({
    title: "Confidentialité & cookies",
    body: `
      <div class="legal-page">
        <h1>Confidentialité &amp; cookies</h1>
        <p><em>Modèle à adapter selon vos outils réels (statistiques, réseaux d'affiliation) avant mise en ligne — obligation RGPD.</em></p>
        <h2>Cookies utilisés</h2>
        <p>
          — Cookie de préférence (consentement cookies) : mémorise votre choix, durée 6 mois.<br/>
          — Cookies de suivi d'affiliation : déposés par les réseaux partenaires (${PLACEHOLDER("ex. Amazon Associates, Awin")})
          lors d'un clic vers une offre, pour permettre le versement de la commission au site. Voir les politiques
          de confidentialité de chaque réseau partenaire.<br/>
          — Cookies de mesure d'audience : ${PLACEHOLDER("outil à préciser, ex. Plausible/Matomo")}.
        </p>
        <h2>Données collectées</h2>
        <p>RapidPromo enregistre un identifiant technique anonymisé (haché) des clics vers les offres, à des fins
        statistiques et de rémunération d'affiliation. Aucune donnée bancaire ou de compte n'est collectée par
        RapidPromo : tout achat se fait directement sur le site du marchand.</p>
        <h2>Vos droits</h2>
        <p>Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos
        données. Contact : ${PLACEHOLDER("email de contact")}.</p>
      </div>
    `,
  });
}
