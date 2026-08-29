// Pipeline d'import : appelle chaque connecteur actif, enregistre/actualise
// les offres, puis désactive celles qui ont disparu du flux ou dont la date
// de fin est dépassée. C'est ce qui fait "tourner" le site en continu.

import { demoConnector } from "./connectors/demo.js";
import {
  expireStaleOffers,
  finishImportRun,
  startImportRun,
  upsertOfferFromFeed,
} from "./repo.js";
import { nowIso } from "./util.js";
import type { Connector } from "./types.js";

// Pour brancher un vrai réseau d'affiliation : écrire un connecteur dans
// src/connectors/ (même interface que demoConnector) et l'ajouter ici.
const ACTIVE_CONNECTORS: Connector[] = [demoConnector];

export async function runImport(): Promise<
  Array<{ network: string; imported: number; expired: number; status: string }>
> {
  const results: Array<{ network: string; imported: number; expired: number; status: string }> = [];

  for (const connector of ACTIVE_CONNECTORS) {
    const runId = startImportRun(connector.networkName);
    const startedAt = nowIso();
    try {
      const offers = await connector.fetchOffers();
      let imported = 0;
      for (const raw of offers) {
        upsertOfferFromFeed(raw, connector.networkName);
        imported++;
      }
      const expired = expireStaleOffers(connector.networkName, startedAt);
      finishImportRun(runId, imported, expired, "ok", null);
      results.push({ network: connector.networkName, imported, expired, status: "ok" });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      finishImportRun(runId, 0, 0, "erreur", message);
      results.push({ network: connector.networkName, imported: 0, expired: 0, status: "erreur: " + message });
    }
  }

  return results;
}
