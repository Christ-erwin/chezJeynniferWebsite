# lg-chez-jennifer-backend — API billetterie « Chez Jeynnifer »

API **NestJS 12 (ESM)** — logique métier et paiement, séparée du site vitrine.

Sert une **plateforme multi-produits** (Loup-Garou, Game Night, Ciné Lune,
et tout produit futur) avec une billetterie commune : un produit est
une ligne en base, pas un module à part. Voir [`sql/schema.sql`](sql/schema.sql)
pour le schéma complet et son commentaire d'en-tête (hiérarchie
product → event_instance → ticket_tier → order → payment / ticket).

## Responsabilités
- Catalogue produits + instances d'événement (dates, lieu, capacité)
- Réservation de tickets + gestion du stock restant par tarif (transactions atomiques)
- Persistance : acheteurs, commandes, tickets vendus
- Intégration paiement Mobile Money via agrégateur (**CinetPay** ou **PayDunya**)
  - Init de paiement, endpoint **webhook** de confirmation, vérification de statut
  - Rappel : pas d'intégration opérateur par opérateur (Wave Business direct exige RCCM + DFE)
- Émission des tickets (QR / référence) après paiement confirmé

## Ne gère PAS
Le rendu des pages / la galerie → voir `../lg-chez-jennifer-frontend`.

## Conventions
- Toutes les routes sont préfixées par `/api` (`setGlobalPrefix` dans `src/main.ts`).
- Port : `PORT` (défaut 4000).
- CORS : `FRONTEND_ORIGIN` (défaut `http://localhost:3000`, plusieurs origines séparées par des virgules).
- Env chargé via `@nestjs/config` (fichier `.env`, voir `.env.example`).
- Route de vérification : `GET /api/health`.

## Billetterie (en place)
- `GET /api/events`, `GET /api/events/:id` — éditions publiées et à venir (sans l'adresse exacte), avec `remaining`.
- `POST /api/orders` — crée une commande : prix relus côté serveur (édition en base), capacité vérifiée (pas de survente, places bloquées 20 min), numéro ivoirien normalisé. Renvoie l'URL de paiement.
- `GET /api/orders/:id` — statut (+ billets et adresse une fois payé). Revérifie le statut auprès de CinetPay.
- `POST /api/payments/cinetpay/notify` — webhook CinetPay ; le statut est TOUJOURS relu via l'API CinetPay avant validation (montant contrôlé).
- `POST /api/payments/mock/:id/confirm` — simulateur local.

### Paiement Wave + Orange Money
- Sans clés → **simulateur** (aucun argent réel), refusé en production.
- Avec `CINETPAY_API_KEY` + `CINETPAY_SITE_ID` (dashboard CinetPay) → vrai guichet Mobile Money. Renseigner aussi `PUBLIC_API_URL` (joignable depuis Internet, pour le webhook) et `FRONTEND_URL`.

## Espace admin (`/api/admin/*`)
Authentification : `POST /api/admin/auth/login` `{ password }` → jeton signé (12 h) à passer en `Authorization: Bearer …`. 5 essais / 10 min par IP.

| Rôle | Mot de passe | Accès |
|---|---|---|
| admin | `ADMIN_PASSWORD` | tout |
| staff (accueil) | `STAFF_PASSWORD` | liste des éditions + `POST /checkin` |

- `GET stats` — CA, billets, conversion, par moyen, par édition, 14 jours
- `GET|POST events`, `GET|PUT|DELETE events/:id` — garde-fous : pas de capacité sous les places réservées, pas de suppression/modification des places d'un pass déjà vendu, pas de suppression d'une édition avec commandes (passer en « Annulée »)
- `GET orders?eventId&status&q`, `GET orders/export.csv`, `GET orders/:id`
- `POST orders` — vente manuelle (espèces / Wave / OM), payée immédiatement, billets émis
- `POST orders/:id/mark-paid`, `POST orders/:id/cancel`
- `POST checkin` `{ code, eventId? }` — un billet n'est validé qu'une fois

Variables : `ADMIN_PASSWORD`, `STAFF_PASSWORD`, `ADMIN_SECRET` (≥ 32 caractères, obligatoire en production), `EVENTS_FILE`, `ORDERS_FILE`.

## Soirée Loup-Garou (`/api/admin/games`)
- `GET /`, `POST /` (admin : `{ title, count, eventId? }`), `GET /:id`, `PUT /:id` (admin : composition — titre, joueurs, photos, rôles ; les éliminations sont conservées), `DELETE /:id` (admin)
- `GET /:id/state` — état léger (éliminations, statut) interrogé toutes les 2 s par la régie
- `GET /api/games/:id/screen` — **public** (écran géant) : joueurs, photos, éliminations ; le rôle n'est renvoyé que pour les joueurs éliminés (ou en fin de partie)
- `POST /:id/eliminate` `{ playerId }`, `POST /:id/revive` `{ playerId, resurrect? }` (`resurrect: true` = résurrection annoncée sur l'écran, sinon correction silencieuse), `POST /:id/chief` `{ playerId | null }` (chef du village), `POST /:id/start` (lance la partie : les écrans jouent la cinématique d'introduction ; aussi pour la rejouer), `POST /:id/finish` `{ winner }`, `POST /:id/reset` — admin **et accueil**
- `POST /api/admin/media` `{ data: "data:image/jpeg;base64,…" }` (photo recadrée par le navigateur, 1,5 Mo max) → `{ path: "media/<id>.jpg" }` ; lecture publique `GET /api/media/<id>.jpg` (nom aléatoire)
- Variables : `GAMES_FILE`, `MEDIA_DIR`.

## À faire avant la mise en ligne
- Changer `ADMIN_PASSWORD` / `STAFF_PASSWORD` / `ADMIN_SECRET`.
- Photos des joueurs : passer `data/media` sur un stockage objet (Supabase Storage).
- Remplacer le stockage fichier (`src/common/json-collection.ts` : éditions, commandes, parties) par PostgreSQL (schéma dans `sql/schema.sql`) — un disque local n'est pas persistant sur Vercel.
- Envoi du billet par WhatsApp / e-mail après paiement.
- Limitation de débit sur `POST /api/orders`.

## Commandes
```bash
npm install
cp .env.example .env
npm run start:dev   # http://localhost:4000/api
npm run build
npm run lint
npm test
```
