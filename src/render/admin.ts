import { layout, flashHtml } from "./layout.js";
import { getCategories, getRecentImportRuns, getStats } from "../repo.js";
import { escapeHtml, formatDate } from "../util.js";

export function adminDashboardPage(flash?: { type: "success" | "error"; message: string }): string {
  const stats = getStats();
  const runs = getRecentImportRuns(15) as Array<{
    id: number;
    network: string;
    startedAt: string;
    finishedAt: string | null;
    importedCount: number;
    expiredCount: number;
    status: string;
    message: string | null;
  }>;

  const runRows = runs
    .map(
      (r) => `<tr>
        <td>#${r.id}</td>
        <td>${escapeHtml(r.network)}</td>
        <td>${formatDate(r.startedAt)}</td>
        <td>${r.importedCount}</td>
        <td>${r.expiredCount}</td>
        <td class="status-${r.status === "ok" ? "ok" : "erreur"}">${escapeHtml(r.status)}</td>
      </tr>`
    )
    .join("\n");

  return layout({
    title: "Espace pro — Administration",
    body: `
      <h1>Administration RapidPromo</h1>
      ${flashHtml(flash)}
      <div class="admin">
        <div class="stats">
          <div class="stat-card"><div class="n">${stats.activeOffers}</div><div class="label">Offres actives</div></div>
          <div class="stat-card"><div class="n">${stats.totalProducts}</div><div class="label">Produits référencés</div></div>
          <div class="stat-card"><div class="n">${stats.totalMerchants}</div><div class="label">Marchands</div></div>
          <div class="stat-card"><div class="n">${stats.totalClicks}</div><div class="label">Clics vers les marchands</div></div>
        </div>

        <div style="display:flex; gap:12px; margin-bottom:24px;">
          <form method="post" action="/admin/import">
            <button class="btn" type="submit">Lancer un import maintenant</button>
          </form>
          <a class="btn secondary" href="/admin/offres/nouvelle">+ Ajouter une offre manuellement</a>
        </div>

        <h2 class="section-title">Derniers imports</h2>
        <table>
          <thead><tr><th>ID</th><th>Réseau</th><th>Date</th><th>Importées</th><th>Expirées</th><th>Statut</th></tr></thead>
          <tbody>${runRows || '<tr><td colspan="6">Aucun import pour le moment.</td></tr>'}</tbody>
        </table>
      </div>
    `,
  });
}

export function adminNewOfferPage(flash?: { type: "success" | "error"; message: string }): string {
  const categories = getCategories();
  const options = categories
    .map((c) => `<option value="${c.slug}">${escapeHtml(c.name)}</option>`)
    .join("");

  return layout({
    title: "Ajouter une offre",
    body: `
      <h1>Ajouter une offre manuellement</h1>
      <p style="color:#6b7280; max-width:560px;">Utile en attendant que vos flux d'affiliation soient branchés : cette offre apparaîtra sur le site comme les autres et sera comparée aux offres existantes du même produit.</p>
      ${flashHtml(flash)}
      <form class="admin-form" method="post" action="/admin/offres/nouvelle">
        <label>Catégorie
          <select name="categorySlug" required>${options}</select>
        </label>
        <label>Nom du produit
          <input type="text" name="productTitle" required />
        </label>
        <label>Description courte
          <textarea name="productDescription" rows="2"></textarea>
        </label>
        <label>Nom du marchand
          <input type="text" name="merchantName" required placeholder="ex. TechStore" />
        </label>
        <label>URL de la photo du produit (optionnel)
          <input type="url" name="productImage" placeholder="https://... (copiée depuis la fiche du marchand)" />
        </label>
        <p style="color:#6b7280; font-size:0.85em; margin-top:-14px;">Laissez vide pour garder un pictogramme neutre. Ne mettez que l'URL d'une vraie photo du produit, fournie par le marchand — jamais une image générique.</p>
        <label>Prix promo (€)
          <input type="number" name="price" step="0.01" min="0" required />
        </label>
        <label>Prix barré (optionnel, €)
          <input type="number" name="oldPrice" step="0.01" min="0" />
        </label>
        <label>Lien d'affiliation
          <input type="url" name="affiliateUrl" required placeholder="https://..." />
        </label>
        <label>Fin de la promotion
          <input type="date" name="endsAt" required />
        </label>
        <button class="btn" type="submit">Publier l'offre</button>
      </form>
    `,
  });
}
