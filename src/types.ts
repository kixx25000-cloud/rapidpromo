// Types partagés dans toute l'application.

export interface Category {
  id: number;
  slug: string;
  name: string;
}

export interface Merchant {
  id: number;
  name: string;
  network: string; // ex: "Amazon Associates", "Awin", "Effiliation", "Démo"
}

export interface Product {
  id: number;
  externalId: string;
  title: string;
  description: string;
  image: string; // data URI SVG placeholder ou URL
  categoryId: number;
}

export interface Offer {
  id: number;
  productId: number;
  merchantId: number;
  price: number;
  oldPrice: number | null;
  discountPct: number | null;
  affiliateUrl: string;
  startsAt: string; // ISO
  endsAt: string; // ISO
  active: number; // 0 ou 1 (SQLite n'a pas de booléen natif)
  lastSeenAt: string; // ISO
}

export interface ImportRun {
  id: number;
  network: string;
  startedAt: string;
  finishedAt: string | null;
  importedCount: number;
  expiredCount: number;
  status: "ok" | "erreur";
  message: string | null;
}

// Ce qu'un connecteur de flux d'affiliation doit renvoyer pour une offre.
// C'est l'interface commune que tout nouveau connecteur (Amazon, Awin...)
// devra respecter pour s'intégrer au pipeline d'import.
export interface RawOffer {
  productExternalId: string;
  productTitle: string;
  productDescription: string;
  productImage: string;
  categorySlug: string;
  merchantName: string;
  price: number;
  oldPrice?: number;
  affiliateUrl: string;
  endsAt: string; // ISO — fin de la promotion
}

export interface Connector {
  networkName: string;
  fetchOffers(): Promise<RawOffer[]>;
}
