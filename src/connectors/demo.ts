// Connecteur de démonstration.
//
// Il respecte exactement l'interface `Connector` (voir src/types.ts) que
// devra respecter tout connecteur branché sur un vrai programme d'affiliation
// (Amazon, Awin, Effiliation...). Pour brancher un flux réel plus tard, il
// suffit d'écrire un nouveau fichier dans ce dossier qui exporte un objet du
// même type, puis de l'ajouter à la liste dans src/importer.ts.
//
// Ici, il simule un flux qui bouge à chaque exécution : prix et remises
// varient légèrement, dates de fin de promo tournantes, pour que le site ait
// quelque chose de crédible à montrer avant même d'avoir de vrais accès
// affiliés.
//
// Important : les images de ce connecteur sont volontairement de simples
// pictogrammes abstraits (voir placeholderImage), pas des photos. Ce sont des
// produits fictifs, sans marchand réel derrière — leur donner une photo
// réaliste donnerait l'illusion que ce sont de vraies offres. Dès qu'un
// connecteur réel est branché (Amazon, Awin, Effinity...), chaque produit
// importé aura automatiquement sa vraie photo, fournie par le flux officiel
// du marchand — aucune récupération d'image ailleurs.

import { placeholderImage } from "../util.js";
import type { Connector, RawOffer } from "../types.js";

interface MasterProduct {
  id: string;
  title: string;
  description: string;
  categorySlug: "high-tech" | "maison" | "mode";
  basePrice: number;
  merchants: string[];
}

const MASTER_PRODUCTS: MasterProduct[] = [
  {
    id: "ht-smartphone-x12",
    title: "Smartphone X12 128 Go",
    description: "Écran 6,5\", double SIM, batterie longue durée.",
    categorySlug: "high-tech",
    basePrice: 349,
    merchants: ["TechStore", "ClicDeal", "NumériShop"],
  },
  {
    id: "ht-ecouteurs-bt",
    title: "Écouteurs sans fil réduction de bruit",
    description: "Bluetooth 5.3, 30h d'autonomie avec boîtier de charge.",
    categorySlug: "high-tech",
    basePrice: 59,
    merchants: ["TechStore", "GrandMag", "NumériShop"],
  },
  {
    id: "ht-tv-55-4k",
    title: "TV 55\" 4K UHD Smart TV",
    description: "Dalle 4K, HDR10, applications de streaming intégrées.",
    categorySlug: "high-tech",
    basePrice: 429,
    merchants: ["TechStore", "GrandMag", "ClicDeal"],
  },
  {
    id: "ht-montre-connectee",
    title: "Montre connectée sport & santé",
    description: "Suivi cardio, sommeil, GPS, étanche 5 ATM.",
    categorySlug: "high-tech",
    basePrice: 79,
    merchants: ["NumériShop", "ClicDeal"],
  },
  {
    id: "ht-aspirateur-robot",
    title: "Aspirateur robot connecté",
    description: "Cartographie laser, vidange automatique, appli mobile.",
    categorySlug: "high-tech",
    basePrice: 249,
    merchants: ["TechStore", "GrandMag"],
  },
  {
    id: "ma-cafetiere-auto",
    title: "Machine à café automatique",
    description: "Broyeur intégré, mousseur à lait, 15 bars de pression.",
    categorySlug: "maison",
    basePrice: 199,
    merchants: ["MaisonPlus", "GrandMag", "ClicDeal"],
  },
  {
    id: "ma-friteuse-air",
    title: "Friteuse à air chaud sans huile 5.5L",
    description: "Cuisson saine, 8 programmes automatiques, panier antiadhésif.",
    categorySlug: "maison",
    basePrice: 69,
    merchants: ["MaisonPlus", "GrandMag", "NumériShop"],
  },
  {
    id: "ma-set-linge-lit",
    title: "Parure de lit percale 220x240",
    description: "100% coton, housse de couette + 2 taies d'oreiller.",
    categorySlug: "maison",
    basePrice: 39,
    merchants: ["MaisonPlus", "StyleCase"],
  },
  {
    id: "ma-lampe-led-bureau",
    title: "Lampe de bureau LED à pince",
    description: "3 températures de couleur, variateur tactile, USB-C.",
    categorySlug: "maison",
    basePrice: 24,
    merchants: ["MaisonPlus", "ClicDeal"],
  },
  {
    id: "ma-multicuiseur",
    title: "Multicuiseur intelligent 6L",
    description: "12 modes de cuisson, cuve amovible, minuterie programmable.",
    categorySlug: "maison",
    basePrice: 89,
    merchants: ["GrandMag", "MaisonPlus"],
  },
  {
    id: "mo-doudoune-hiver",
    title: "Doudoune matelassée capuche",
    description: "Déperlante, doublure chaude, coupe unisexe.",
    categorySlug: "mode",
    basePrice: 79,
    merchants: ["StyleCase", "GrandMag", "ClicDeal"],
  },
  {
    id: "mo-basket-running",
    title: "Baskets running amorti léger",
    description: "Semelle réactive, mesh respirant, plusieurs coloris.",
    categorySlug: "mode",
    basePrice: 65,
    merchants: ["StyleCase", "NumériShop"],
  },
  {
    id: "mo-sac-cabas",
    title: "Sac cabas cuir végétal",
    description: "Grand format, fermeture zippée, poches intérieures.",
    categorySlug: "mode",
    basePrice: 45,
    merchants: ["StyleCase", "GrandMag"],
  },
  {
    id: "mo-coffret-soin",
    title: "Coffret soin visage bio",
    description: "Nettoyant, sérum et crème hydratante, ingrédients naturels.",
    categorySlug: "mode",
    basePrice: 34,
    merchants: ["StyleCase", "MaisonPlus"],
  },
  {
    id: "mo-montre-classique",
    title: "Montre classique bracelet cuir",
    description: "Boîtier acier inoxydable, étanche, garantie 2 ans.",
    categorySlug: "mode",
    basePrice: 55,
    merchants: ["StyleCase", "ClicDeal", "NumériShop"],
  },
];

// Petit générateur pseudo-aléatoire déterministe par exécution (basé sur
// l'heure), pour que les prix "bougent" un peu à chaque import sans être
// totalement chaotiques.
function jitter(base: number, seedExtra: string): number {
  let seed = Math.floor(Date.now() / (1000 * 60 * 60)); // change chaque heure
  for (const ch of seedExtra) seed = (seed * 33 + ch.charCodeAt(0)) >>> 0;
  const pseudoRandom = (seed % 1000) / 1000; // 0..1
  return pseudoRandom;
}

export const demoConnector: Connector = {
  networkName: "Démo",

  async fetchOffers(): Promise<RawOffer[]> {
    const offers: RawOffer[] = [];

    for (const product of MASTER_PRODUCTS) {
      for (const merchant of product.merchants) {
        const r = jitter(product.basePrice, product.id + merchant);
        // Remise entre 10% et 45% selon le "hasard" déterministe ci-dessus
        const discount = 0.1 + r * 0.35;
        const price = Math.round(product.basePrice * (1 - discount) * 100) / 100;
        const oldPrice = product.basePrice;
        // Durée de la promo : entre 2 et 12 jours à partir de maintenant
        const durationDays = 2 + Math.round(r * 10);
        const endsAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

        offers.push({
          productExternalId: product.id,
          productTitle: product.title,
          productDescription: product.description,
          productImage: placeholderImage(product.title),
          categorySlug: product.categorySlug,
          merchantName: merchant,
          price,
          oldPrice,
          affiliateUrl: `https://exemple-marchand.invalid/${merchant.toLowerCase()}/${product.id}?aff=rapidpromo`,
          endsAt,
        });
      }
    }

    return offers;
  },
};
