# LG chez Jennifer — site vitrine + billetterie

Deux projets **indépendants**, deux déploiements :

| Dossier | Rôle | Stack |
|---|---|---|
| [`lg-chez-jennifer-frontend/`](lg-chez-jennifer-frontend/) | Site vitrine public : présentation de l'événement, galerie photos, tunnel d'achat de tickets | Next.js 16 (App Router) + Tailwind v4 |
| [`lg-chez-jennifer-backend/`](lg-chez-jennifer-backend/) | API billetterie : réservation, stock, acheteurs, intégration paiement Mobile Money (CinetPay / PayDunya), webhooks | NestJS 12 (ESM) |

## Comment ils sont reliés

- Le backend expose son API sous le préfixe **`/api`** et tourne sur le port **4000**.
- CORS est ouvert pour l'origine du frontend via `FRONTEND_ORIGIN` (défaut `http://localhost:3000`).
- Le frontend lit **`NEXT_PUBLIC_API_BASE_URL`** (défaut `http://localhost:4000/api`) et centralise tous les appels dans [`src/lib/api.ts`](lg-chez-jennifer-frontend/src/lib/api.ts).
- Test de la liaison : le backend expose `GET /api/health`, la page d'accueil du frontend l'appelle et affiche l'état (« API connectée » / « API injoignable »).

```
frontend (Next.js :3000)  ──fetch NEXT_PUBLIC_API_BASE_URL──▶  backend (NestJS :4000/api)
        ▲                                                              │
        └──────────────── CORS: FRONTEND_ORIGIN ◀──────────────────────┘
```

## Démarrer en local

```bash
# 1. installer les deux projets
npm run install:all

# 2. créer les fichiers d'env à partir des exemples
cp lg-chez-jennifer-backend/.env.example lg-chez-jennifer-backend/.env
cp lg-chez-jennifer-frontend/.env.example lg-chez-jennifer-frontend/.env.local

# 3. lancer les deux ensemble
npm run dev
```

- Front : http://localhost:3000
- API : http://localhost:4000/api/health

> Node 20+ requis (testé avec v20.19). Le `node` de Homebrew de cette machine est cassé (mismatch icu4c) — utiliser celui de nvm : `nvm use 20`.

## Scripts racine

| Script | Effet |
|---|---|
| `npm run dev` | lance backend + frontend en parallèle |
| `npm run dev:back` / `npm run dev:front` | lance un seul des deux |
| `npm run build` | build des deux projets |
| `npm run install:all` | `npm install` dans les deux projets |
# chezJeynniferWebsite
