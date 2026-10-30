# lg-chez-jennifer-frontend — Les Soirées chez Jeynnifer

Site Next.js 16 (App Router) + Tailwind v4 + GSAP (ScrollTrigger, SplitText) + Lenis.

## Pages

| Route | Rôle |
|---|---|
| `/` | La marque : hero guinguette, manifeste épinglé, 3 univers, mondes en défilement horizontal, prochaines soirées, comment réserver, FAQ |
| `/game-night` | Monde Game Night : cartes flottantes, éventail des jeux, dé 3D « brise-glace » |
| `/loup-garou` | Monde Loup-Garou : nuit au village épinglée (desktop), « Tire ta carte », cycle jour/nuit |
| `/cine-lune` | Monde CinéLune : cinéma en plein air, l'écran s'allume puis remplit la vue, pellicule au scroll |
| `/evenements` | Calendrier, filtre par univers (`?soiree=game-night`) |
| `/reserver/[id]` | Réservation : passes → infos → Wave / Orange Money |
| `/reserver/confirmation/[orderId]` | Statut de paiement + billets QR code |
| `/paiement/simulation/[orderId]` | Simulateur de paiement (dev uniquement) |

Les pages publiques vivent dans le groupe `src/app/(site)/` (en-tête, scroll fluide, curseur, rideau, pied de page).

## Espace admin (`/admin`, non indexé)

| Route | Rôle |
|---|---|
| `/admin/login` | Connexion par mot de passe (rôle **admin** ou **accueil**) |
| `/admin` | Tableau de bord : CA, billets, remplissage par soirée, ventes 14 jours, moyens de paiement |
| `/admin/evenements` | Éditions : créer, modifier (date, lieu, adresse secrète, visuel, capacité, passes), publier, annuler |
| `/admin/commandes` | Recherche / filtres, détail, « paiement reçu », annulation, **vente sur place**, envoi des billets par WhatsApp, **export CSV** (Excel) |
| `/admin/controle` | Contrôle à l'entrée : scan QR à la caméra (Chrome Android) ou saisie du code, un billet n'entre qu'une fois |
| `/admin/loup-garou` | Parties de Loup-Garou : joueurs (photo, nom, rôle), composition, distribution au hasard |
| `/admin/loup-garou/[id]/regie` | Régie (téléphone / ordinateur) : **Lancer la partie** joue sur l'écran la cinématique « Bienvenue à Pkapkatokro » puis distribue les cartes (l'écran affiche une salle d'attente avant) ; on touche un joueur pour l'éliminer, l'**élire chef du village** (couronne), le **ressusciter** (annoncé sur l'écran) ou annuler une élimination faite par erreur (sans annonce) ; on désigne le camp gagnant. Lien + QR code de l'écran public |
| `/ecran/loup-garou/[id]` | **Écran public** (télé / projecteur, sans connexion), aux couleurs de la page `/loup-garou` : suit la régie en direct — compte à rebours, la carte se retourne et révèle le rôle, joueur barré, puis victoire et révélation de tous les rôles. Seuls les rôles des joueurs éliminés y sont transmis. Si ce navigateur est connecté à l'admin, on peut aussi cliquer directement sur les joueurs. Touches : F plein écran, M son |

Le rôle **accueil** (mot de passe `STAFF_PASSWORD`) voit le contrôle à l'entrée et la régie Loup-Garou (sans pouvoir modifier la composition).

## Où modifier

- **Éditions, dates, tarifs, capacités** : depuis l'espace admin. Le site les lit sur l'API (`src/lib/events.ts`, cache 30 s).
- **Les 3 univers (textes, couleurs, photos)** : `src/lib/catalog.ts`
- **Coordonnées / navigation** : `src/lib/site.ts`
- **Photos** : dépose-les dans `public/images/` (garder le même nom pour remplacer une photo), puis lance **`npm run images`** :
  réduction à 2560 px max (≈ 200–600 Ko), original rangé dans `images-originales/` (non versionné), vignettes de partage 1200×630 dans `public/images/og/`, cache d'images Next.js vidé.
- **Couleurs, typo** : `src/app/globals.css` (`@theme`)
- **Animations** : attributs `data-split`, `data-reveal`, `data-reveal-img`, `data-parallax`, `data-stagger` (moteur dans `src/components/motion/PageMotion.tsx`). `prefers-reduced-motion` est respecté partout.

## Commandes

```bash
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
npm run dev                  # http://localhost:3000
npm run build && npm run lint
```
