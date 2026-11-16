import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Missing } from "@/components/legal/LegalPage";
import { LEGAL, PROCESSORS } from "@/lib/legal";
import { whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: "Quelles données personnelles collectent Les Soirées chez Jeynnifer, pourquoi, combien de temps, avec qui, et comment exercer tes droits.",
  alternates: { canonical: "/confidentialite" },
};

export default function Confidentialite() {
  return (
    <LegalPage
      title="Politique de confidentialité"
      current="/confidentialite"
      intro={
        <p>
          Nous collectons uniquement les données nécessaires pour te vendre un billet et organiser la soirée. Nous ne les vendons pas, nous ne
          faisons pas de publicité ciblée et nous ne t&apos;envoyons pas de messages commerciaux sans ton accord. Cette politique applique la
          loi n°2013-450 du 19 juin 2013 relative à la protection des données à caractère personnel.
        </p>
      }
    >
      <h2>1. Qui est responsable de tes données ?</h2>
      <p>
        Le responsable du traitement est <Missing value={LEGAL.company} />, siège : <Missing value={LEGAL.address} />. Contact : WhatsApp{" "}
        {LEGAL.phone}
        {LEGAL.email ? <>, e-mail <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a></> : null}.
        {LEGAL.artciReference ? ` Traitement déclaré auprès de l'ARTCI (référence ${LEGAL.artciReference}).` : ""}
      </p>

      <h2>2. Quelles données, pourquoi, et combien de temps ?</h2>
      <table tabIndex={0}>
        <thead>
          <tr>
            <th scope="col">Données</th>
            <th scope="col">À quoi elles servent</th>
            <th scope="col">Durée de conservation</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Nom et prénom, numéro de téléphone, e-mail de la personne qui commande</td>
            <td>
              Créer la commande, faire le paiement Mobile Money, t&apos;envoyer tes billets par e-mail, te donner les infos pratiques (ex.
              adresse la veille sur WhatsApp), traiter un remboursement
            </td>
            <td>Téléphone et e-mail : jusqu&apos;à 12 mois après la soirée, puis effacés</td>
          </tr>
          <tr>
            <td>Pour chaque place : fille ou garçon (seulement si la soirée a des places réparties), nom de l&apos;invité (facultatif), modèle et taille du pack offert</td>
            <td>Respecter la répartition filles / garçons, former les équipes, préparer les packs, afficher le nom sur le billet</td>
            <td>Jusqu&apos;à 12 mois après la soirée, puis effacés</td>
          </tr>
          <tr>
            <td>Référence de commande, nom, montant, frais, moyen de paiement, date, référence de la transaction</td>
            <td>Preuve de la vente et obligations comptables</td>
            <td>10 ans (Acte uniforme OHADA relatif au droit comptable)</td>
          </tr>
          <tr>
            <td>Billets : code QR, heure de passage à l&apos;entrée</td>
            <td>Contrôler les entrées et éviter les fraudes</td>
            <td>Jusqu&apos;à 12 mois après la soirée</td>
          </tr>
          <tr>
            <td>Date et heure de ton accord (conditions, droit à l&apos;image)</td>
            <td>Prouver que tu as donné ton accord</td>
            <td>Aussi longtemps que la commande</td>
          </tr>
          <tr>
            <td>Commandes non payées (paiement abandonné ou échoué)</td>
            <td>Garder ta place pendant le paiement</td>
            <td>Coordonnées effacées 30 jours après</td>
          </tr>
          <tr>
            <td>Photos et vidéos prises pendant les soirées</td>
            <td>Souvenirs et communication des Soirées chez Jeynnifer (réseaux sociaux, site, vidéos)</td>
            <td>Tant qu&apos;elles sont publiées ; retirées sur simple demande</td>
          </tr>
          <tr>
            <td>Soirée Loup-Garou : prénom et photo des joueurs, saisis par notre équipe</td>
            <td>Afficher les joueurs à l&apos;écran pendant la partie</td>
            <td>Effacés 12 mois après la partie au plus tard, ou avant sur demande</td>
          </tr>
          <tr>
            <td>Statistiques de visite : page vue, site d&apos;où tu arrives, type d&apos;appareil</td>
            <td>Savoir quelles pages et quels réseaux fonctionnent (sans cookie, voir <Link href="/cookies">cookies</Link>)</td>
            <td>Compteurs anonymes conservés 13 mois</td>
          </tr>
        </tbody>
      </table>
      <p>
        Les champs obligatoires sont signalés dans le formulaire : sans eux, nous ne pouvons pas te vendre de billet. Tu peux refuser de
        figurer dans nos fichiers en n&apos;achetant pas en ligne, ou demander l&apos;effacement de tes données à tout moment (section 5),
        sous réserve des obligations comptables.
      </p>

      <h2>3. Sur quelle base ?</h2>
      <p>
        Tes données sont traitées avec ton <strong>consentement exprès</strong>, donné en cochant les cases avant le paiement, et parce
        qu&apos;elles sont nécessaires à l&apos;exécution de ta commande ; les données comptables sont conservées pour respecter une obligation
        légale (article 14 de la loi n°2013-450).
      </p>

      <h2>4. Qui reçoit tes données ?</h2>
      <p>
        Notre équipe d&apos;organisation (accès protégé par mot de passe ; l&apos;équipe d&apos;accueil ne voit que ce qui sert à valider les
        billets), et les prestataires techniques ci-dessous, uniquement pour ce qui les concerne :
      </p>
      <table tabIndex={0}>
        <thead>
          <tr>
            <th scope="col">Prestataire</th>
            <th scope="col">Pays</th>
            <th scope="col">Rôle</th>
            <th scope="col">Données reçues</th>
          </tr>
        </thead>
        <tbody>
          {PROCESSORS.map((p) => (
            <tr key={p.name}>
              <td>{p.name}</td>
              <td>{p.country}</td>
              <td>{p.purpose}</td>
              <td>{p.data}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        <strong>Transferts hors de Côte d&apos;Ivoire</strong> : nos hébergeurs (Railway, Vercel) et notre service d&apos;envoi d&apos;e-mails
        (Resend) sont situés aux États-Unis ; tes données y sont donc transférées. Ces prestataires s&apos;engagent contractuellement à assurer
        la sécurité et la confidentialité des données qu&apos;ils traitent pour nous.
        {LEGAL.artciReference ? ` Ces transferts sont autorisés par l'ARTCI (référence ${LEGAL.artciReference}).` : ""}
      </p>
      <p>
        Nous ne vendons ni ne louons tes données. Elles ne sont jamais utilisées pour de la publicité ciblée. Nous ne t&apos;enverrons pas de
        messages promotionnels (e-mail, SMS, WhatsApp) sans ton accord préalable.
      </p>

      <h2>5. Tes droits</h2>
      <p>Tu peux à tout moment, gratuitement :</p>
      <ul>
        <li>savoir si nous avons des données sur toi et en obtenir une copie (droit d&apos;accès) ;</li>
        <li>les faire corriger, compléter ou mettre à jour (droit de rectification) ;</li>
        <li>les faire effacer, sauf ce que la loi nous oblige à garder (droit à l&apos;effacement) ;</li>
        <li>t&apos;opposer à leur utilisation pour un motif légitime (droit d&apos;opposition) ;</li>
        <li>retirer ton accord sur le droit à l&apos;image : nous retirons ou floutons alors les photos et vidéos que nous avons publiées où tu apparais.</li>
      </ul>
      <p>
        Pour cela, écris-nous sur{" "}
        <a href={whatsappLink("Bonjour ! Je souhaite exercer mes droits sur mes données personnelles.")} target="_blank" rel="noopener noreferrer">
          WhatsApp ({LEGAL.phone})
        </a>
        {LEGAL.email ? <> ou à <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a></> : null}. Nous pouvons te demander de justifier ton
        identité. Nous répondons au plus tard sous 30 jours.
      </p>
      <p>
        Si tu estimes que tes droits ne sont pas respectés, tu peux saisir l&apos;ARTCI, autorité de protection des données à caractère
        personnel :{" "}
        <a href="https://www.autoritedeprotection.ci" target="_blank" rel="noopener noreferrer">
          www.autoritedeprotection.ci
        </a>
        .
      </p>

      <h2>6. Sécurité</h2>
      <p>
        Le site est entièrement en connexion chiffrée (HTTPS). L&apos;espace d&apos;administration est protégé par mot de passe et limité à
        notre équipe. Le paiement se fait chez GeniusPay, Wave et Orange Money : nous n&apos;avons jamais accès à tes codes de paiement.
      </p>

      <h2>7. Modifications</h2>
      <p>
        Cette politique peut évoluer (nouveau service, nouvelle loi). La date de mise à jour est indiquée en haut de la page. Voir aussi la{" "}
        <Link href="/cookies">politique cookies</Link>.
      </p>
    </LegalPage>
  );
}
