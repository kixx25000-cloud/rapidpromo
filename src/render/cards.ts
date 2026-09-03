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

export function dealCard(d: DealCardData, isFirst = false): string {
  const remaining = daysRemaining(d.endsAt);
  const endsBadge =
    remaining <= 2
      ? `<span class="badge ends-soon">Se termine dans ${remaining <= 0 ? "quelques heures" : remaining + " j"}</span>`
      : "";

  // La toute première image de la grille est presque toujours visible dès le
  // chargement de la page (au-dessus de la ligne de flottaison) : la charger
  // en priorité (fetchpriority="high", sans loading="lazy") plutôt que
  // d'attendre l'observation par le navigateur accélère l'affichage du plus
  // grand élément visible (LCP, signal Core Web Vitals). Les images
  // suivantes restent en chargement différé ("lazy"), inutile pour elles.
  const imgAttrs = isFirst ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"';

  return `<a class="card" href="/produit/${d.id}">
    <img src="${d.image}" alt="${escapeHtml(d.title)}" ${imgAttrs} />
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
  return `<div class="grid">${deals.map((d, i) => dealCard(d, i === 0)).join("\n")}</div>`;
}
