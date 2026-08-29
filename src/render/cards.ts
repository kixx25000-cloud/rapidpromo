import { daysRemaining, escapeHtml, formatPrice } from "../util.js";

interface DealCardData {
  id: number;
  title: string;
  image: string;
  bestPrice: number;
  bestOldPrice: number | null;
  bestDiscountPct: number | null;
  offerCount: number;
  endsAt: string;
}

export function dealCard(d: DealCardData): string {
  const remaining = daysRemaining(d.endsAt);
  const endsBadge =
    remaining <= 2
      ? `<span class="badge ends-soon">Se termine dans ${remaining <= 0 ? "quelques heures" : remaining + " j"}</span>`
      : "";

  return `<a class="card" href="/produit/${d.id}">
    <img src="${d.image}" alt="${escapeHtml(d.title)}" loading="lazy" />
    <div class="card-body">
      ${d.bestDiscountPct ? `<span class="badge">-${d.bestDiscountPct}%</span>` : ""}
      <h3>${escapeHtml(d.title)}</h3>
      <div class="price-row">
        <span class="price-now">${formatPrice(d.bestPrice)}</span>
        ${d.bestOldPrice ? `<span class="price-old">${formatPrice(d.bestOldPrice)}</span>` : ""}
      </div>
      <div style="display:flex; gap:6px; flex-wrap:wrap;">
        ${d.offerCount > 1 ? `<span class="badge merchant-count">${d.offerCount} marchands comparés</span>` : ""}
        ${endsBadge}
      </div>
    </div>
  </a>`;
}

export function dealGrid(deals: DealCardData[]): string {
  if (deals.length === 0) {
    return `<div class="empty-state">Aucune promotion active pour le moment — revenez bientôt, le site se met à jour automatiquement.</div>`;
  }
  return `<div class="grid">${deals.map(dealCard).join("\n")}</div>`;
}
