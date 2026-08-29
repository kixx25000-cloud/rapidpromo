// Déclenche un import manuellement, sans lancer le serveur web.
// Utile pour tester le pipeline d'import, ou pour un cron système classique
// (ex: une tâche planifiée qui exécute `npm run import:now` toutes les X heures).

import "../src/env.js";
import { runImport } from "../src/importer.js";

const results = await runImport();
console.log(JSON.stringify(results, null, 2));
