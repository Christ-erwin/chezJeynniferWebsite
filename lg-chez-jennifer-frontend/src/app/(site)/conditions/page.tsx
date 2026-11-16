import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Missing } from "@/components/legal/LegalPage";
import { LEGAL } from "@/lib/legal";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Conditions générales de vente et d'utilisation",
  description: "Conditions d'utilisation du site et de vente des billets des Soirées chez Jeynnifer : commande, prix, paiement, billets, droit à l'image.",
  alternates: { canonical: "/conditions" },
};

export default function Conditions() {
  return (
    <LegalPage
      title="Conditions générales de vente et d'utilisation"
      current="/conditions"
      intro={
        <p>
          Ces conditions s&apos;appliquent à l&apos;utilisation du site chezjeynnifer.online et à tout achat de billet pour les soirées
          « {SITE.name} ». Tu les acceptes en cochant la case prévue avant le paiement. Tu peux les enregistrer ou les imprimer depuis ton
          navigateur (menu « Partager » ou « Imprimer »).
        </p>
      }
    >
      <h2>1. Qui sommes-nous ?</h2>
      <p>
        Le vendeur est <Missing value={LEGAL.company} />, dont le siège est situé <Missing value={LEGAL.address} />, joignable au {LEGAL.phone}.
        Toutes ses informations sont dans les <Link href="/mentions-legales">mentions légales</Link>.
      </p>

      <h2>2. Ce que nous vendons</h2>
      <p>
        Des billets d&apos;entrée (« passes ») pour des soirées à date fixe : Game Night, Soirée Loup-Garou, CinéLune, Beach Party… Chaque page
        d&apos;événement indique la date, l&apos;heure, la ville, ce qui est compris dans le pass et son prix. Pour certaines soirées,
        l&apos;adresse exacte n&apos;est communiquée qu&apos;après le paiement.
      </p>

      <h2>3. Prix</h2>
      <ul>
        <li>Les prix sont indiqués en francs CFA (FCFA), toutes taxes comprises. Aucun autre montant n&apos;est ajouté sans t&apos;être montré.</li>
        <li>
          Lors d&apos;un paiement en ligne, des <strong>frais de paiement Mobile Money</strong> s&apos;ajoutent au prix des passes. Leur montant
          est affiché sur une ligne séparée du récapitulatif, avant que tu valides, et inclus dans le total à payer.
        </li>
        <li>Le prix applicable est celui affiché au moment de ta commande.</li>
      </ul>

      <h2>4. Comment se passe une commande (étapes)</h2>
      <ol>
        <li>Tu choisis la soirée puis le nombre de passes.</li>
        <li>
          Si la soirée le demande : pour chaque place, tu indiques fille ou garçon (places réparties par sexe), le nom des personnes
          qui t&apos;accompagnent si tu le souhaites, le modèle et la taille du pack offert.
        </li>
        <li>Tu renseignes ton nom, ton numéro de téléphone et ton e-mail (pour recevoir tes billets).</li>
        <li>Tu choisis ton moyen de paiement : Wave ou Orange Money.</li>
        <li>
          Tu vérifies le récapitulatif (passes, frais, total). Tant que tu n&apos;as pas payé, tu peux <strong>corriger toute erreur</strong>{" "}
          en modifiant directement les champs du formulaire.
        </li>
        <li>Tu acceptes ces conditions, la politique de confidentialité et le droit à l&apos;image, puis tu cliques sur « Payer ».</li>
        <li>Tu valides le paiement dans ton application Wave ou Orange Money (via notre prestataire de paiement GeniusPay).</li>
        <li>
          Dès que le paiement est confirmé, tes billets s&apos;affichent et un <strong>e-mail de confirmation</strong> avec tes billets (QR codes)
          t&apos;est envoyé : il vaut accusé de réception de ta commande.
        </li>
      </ol>
      <p>
        La commande est ferme une fois le paiement confirmé. Les places sont gardées 20 minutes pendant le paiement ; au-delà, une commande
        non payée est annulée automatiquement. La vente se fait en français.
      </p>

      <h2>5. Paiement</h2>
      <p>
        Le paiement se fait par Wave ou Orange Money, par l&apos;intermédiaire de GeniusPay, prestataire de paiement établi en Côte
        d&apos;Ivoire. Nous ne voyons ni ne conservons jamais tes codes ou identifiants de paiement. Une vente peut aussi être enregistrée sur
        place par notre équipe (espèces ou Mobile Money).
      </p>

      <h2>6. Billets</h2>
      <ul>
        <li>Chaque billet porte un QR code unique, valable pour une personne et une seule entrée : il est vérifié à l&apos;entrée.</li>
        <li>Tes billets restent accessibles sur la page de confirmation (lien reçu par e-mail) ; tu peux les enregistrer en PDF ou en image.</li>
        <li>
          Garde ton QR code pour toi : la première personne qui le présente entre. Pour changer le nom d&apos;un billet, écris-nous sur WhatsApp
          avant la soirée.
        </li>
        <li>Pour les soirées en équipes, l&apos;équipe est tirée au sort au moment du paiement.</li>
      </ul>

      <h2>7. Annulation, report et remboursement</h2>
      <p>
        Tout est détaillé dans la page <Link href="/remboursement">annulation et remboursement</Link> : délai de rétractation, annulation ou
        report d&apos;une soirée par nos soins, modalités de remboursement.
      </p>

      <h2>8. Droit à l&apos;image</h2>
      <p>
        Les soirées sont <strong>filmées et photographiées</strong> pour les souvenirs et la communication des Soirées chez Jeynnifer (réseaux
        sociaux, site, vidéos). Avant le paiement, tu acceptes, pour toi et pour les personnes de ta réservation (que tu dois en avoir
        informées), d&apos;apparaître sur ces images. Tu peux à tout moment nous demander de retirer ou de flouter une photo ou une vidéo
        publiée où tu apparais : nous le faisons dans les meilleurs délais pour nos propres publications (voir la{" "}
        <Link href="/confidentialite">politique de confidentialité</Link>).
      </p>

      <h2>9. Pendant la soirée</h2>
      <p>
        Chacun s&apos;engage à respecter les autres participants, le lieu et les consignes de l&apos;équipe. L&apos;organisateur peut refuser
        l&apos;accès ou faire sortir une personne dont le comportement met en danger ou gêne gravement les autres.
      </p>

      <h2>10. Utilisation du site</h2>
      <ul>
        <li>Le site est accessible gratuitement. Tu t&apos;engages à fournir des informations exactes lors de ta commande.</li>
        <li>
          Il est interdit de perturber le fonctionnement du site, d&apos;essayer d&apos;accéder à l&apos;espace d&apos;administration ou de
          réutiliser ses contenus sans autorisation.
        </li>
        <li>Nous faisons notre possible pour que le site soit disponible et exact, mais une interruption ponctuelle peut arriver.</li>
      </ul>

      <h2>11. Responsabilité</h2>
      <p>
        Conformément à l&apos;article 7 de la loi n°2013-546, le vendeur est responsable de la bonne exécution de la prestation achetée,
        sauf si un manquement est dû à l&apos;acheteur ou à un cas de force majeure.
      </p>

      <h2>12. Conservation de la commande</h2>
      <p>
        Ta commande est enregistrée sur notre serveur et reste consultable via le lien de tes billets. Les durées de conservation sont
        indiquées dans la <Link href="/confidentialite">politique de confidentialité</Link>.
      </p>

      <h2>13. Réclamations et litiges</h2>
      <p>
        Pour toute réclamation, contacte-nous d&apos;abord sur WhatsApp au {LEGAL.phone}
        {LEGAL.email ? ` ou à ${LEGAL.email}` : ""} : nous cherchons toujours une solution à l&apos;amiable. Ces conditions sont soumises au
        droit ivoirien ; à défaut d&apos;accord, les juridictions compétentes d&apos;Abidjan seront saisies, sans préjudice des droits que la
        loi accorde au consommateur.
      </p>
    </LegalPage>
  );
}
