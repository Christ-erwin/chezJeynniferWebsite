# Mise en ligne

| Partie | Hébergeur | Pourquoi |
|---|---|---|
| Site (`lg-chez-jennifer-frontend`) | **Vercel** | déjà en place |
| API (`lg-chez-jennifer-backend`) | **Railway** + un volume | l'API stocke commandes, éditions et photos dans des fichiers : il lui faut un disque qui survit aux redéploiements |

Coût Railway : offre Hobby, environ 5 $/mois (un essai gratuit est offert à l'inscription).

## 1. Backend sur Railway

1. Sur [railway.com](https://railway.com), se connecter avec GitHub.
2. **New Project → Deploy from GitHub repo** → choisir `chezJeynniferWebsite`.
3. Dans le service créé → **Settings** :
   - **Root Directory** : `lg-chez-jennifer-backend`
   - **Branch** : `main`
   - le reste (build, démarrage, healthcheck) est lu dans `lg-chez-jennifer-backend/railway.json`.
4. **Volume** : clic droit sur le service → **Attach Volume** → point de montage `/data`.
5. **Variables** (onglet Variables) :

   ```
   NODE_ENV=production
   DATA_DIR=/data
   ADMIN_PASSWORD=<mot de passe fort, nouveau>
   STAFF_PASSWORD=<mot de passe de l'équipe d'accueil>
   ADMIN_SECRET=<résultat de : openssl rand -hex 32>
   FRONTEND_ORIGIN=https://www.chezjeynnifer.online,https://chezjeynnifer.online,https://chez-jeynnifer-website-x954.vercel.app
   FRONTEND_URL=https://www.chezjeynnifer.online
   GENIUSPAY_PUBLIC_KEY=pk_sandbox_...   (puis pk_live_...)
   GENIUSPAY_SECRET_KEY=sk_sandbox_...   (puis sk_live_...)
   GENIUSPAY_WEBHOOK_SECRET=whsec_...
   ```

   Ne pas définir `PORT` : Railway le fournit.
6. **Settings → Networking → Generate Domain** : Railway donne une adresse du type
   `https://xxx.up.railway.app`. Vérifier `https://xxx.up.railway.app/api/health` → `{"status":"ok"}`.

Sans clés GeniusPay, l'API refuse de démarrer en production (pas de vente avec le simulateur par erreur).
Pour la tester avant d'avoir les clés : ajouter temporairement `ALLOW_MOCK_PAYMENTS=true`, **et le retirer avant d'ouvrir la vente**.

## 2. Brancher le site sur l'API (Vercel)

1. Projet Vercel → **Settings → Environment Variables** :
   `NEXT_PUBLIC_API_BASE_URL=https://xxx.up.railway.app/api` (environnement Production).
2. **Deployments → … → Redeploy** : la variable est intégrée au moment du build, il faut redéployer.

## 3. GeniusPay

- Dashboard GeniusPay → Webhooks → URL : `https://xxx.up.railway.app/api/payments/geniuspay/webhook`
  (événements `payment.*`). Copier le secret `whsec_…` dans `GENIUSPAY_WEBHOOK_SECRET`.
- Faire un achat test en **sandbox** (Wave puis Orange Money), puis passer aux clés **live**.

## 4. Billets par e-mail (Resend)

1. Créer un compte sur [resend.com](https://resend.com) (gratuit jusqu'à 3 000 e-mails/mois).
2. **Domains → Add Domain** → `chezjeynnifer.online`. Resend affiche 3–4 enregistrements DNS
   (TXT / MX) : les ajouter chez le registrar du domaine, puis **Verify**.
3. **API Keys → Create API Key** (permission « Sending access »).
4. Railway → Variables :
   ```
   RESEND_API_KEY=re_...
   MAIL_FROM=Les Soirées chez Jeynnifer <billets@chezjeynnifer.online>
   MAIL_REPLY_TO=<ton adresse e-mail de contact>
   ```
Les billets partent automatiquement dès qu'un paiement est confirmé (en ligne ou vente
enregistrée dans l'admin). L'admin peut les renvoyer depuis le détail d'une commande.

## 5. Avant d'ouvrir la vente

- [ ] `/api/health` répond
- [ ] le site affiche les éditions venant de l'API (admin → Éditions)
- [ ] connexion admin OK avec le nouveau mot de passe
- [ ] éditions de démonstration dépubliées si elles ne sont pas réelles
- [ ] achat test sandbox : paiement → billet → page statut → scan au contrôle
- [ ] clés **live** en place, `ALLOW_MOCK_PAYMENTS` absent
- [ ] e-mail des billets reçu (vérifier aussi les spams)
- [ ] un vrai petit achat en live

## Sauvegardes

Toutes les données sont dans le volume `/data`. Railway propose des sauvegardes du volume
(onglet du volume → **Backups**) : activer une sauvegarde quotidienne.
L'admin permet aussi d'exporter les commandes en CSV.

## Si on change de domaine

Mettre à jour `FRONTEND_ORIGIN` / `FRONTEND_URL` (Railway), puis `metadataBase` dans
`lg-chez-jennifer-frontend/src/app/layout.tsx`.
