# RapidPromo

Comparateur de promotions (high-tech, maison & électroménager, mode & beauté) en modèle **affiliation** : RapidPromo compare les prix chez plusieurs marchands partenaires et redirige le visiteur vers la meilleure offre. RapidPromo ne vend rien lui-même — il touche une commission sur les ventes réalisées via ses liens.

Construit en **Node.js + TypeScript**, sans dépendance externe à installer (base de données SQLite intégrée à Node).

## Démarrer en local

Prérequis : **Node.js 22 ou plus récent**.

```bash
cd rapidpromo
npm install
cp .env.example .env
npm run dev
```

Le site est alors sur **http://localhost:3000**, et l'espace admin sur **http://localhost:3000/admin**.

## Déploiement

Ce dépôt est prêt à être déployé sur un hébergeur Node.js (Render, Railway...) : commande d'installation `npm install`, commande de démarrage `npm start`.

## Organisation du code

- `src/server.ts` — serveur web et routes (pages publiques, admin, redirection d'affiliation, cron)
- `src/db.ts` / `src/repo.ts` — base de données SQLite et requêtes
- `src/connectors/demo.ts` — connecteur de démonstration
- `src/importer.ts` — pipeline d'import/expiration
- `src/render/` — pages HTML
- `public/style.css` — mise en page

## Prochaines étapes

1. S'inscrire aux programmes d'affiliation (Amazon Associates, Awin, Effiliation...)
2. Brancher les flux réels à la place du connecteur démo
3. Nom de domaine personnalisé
4. Compléter les pages légales avec les vraies informations (SIRET, adresse...)
