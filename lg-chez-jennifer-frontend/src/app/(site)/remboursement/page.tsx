import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal/LegalPage";
import { LEGAL } from "@/lib/legal";
import { whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Annulation et remboursement",
  description: "Délai de rétractation, annulation ou report d'une soirée et remboursement des billets des Soirées chez Jeynnifer.",
  alternates: { canonical: "/remboursement" },
};

export default function Remboursement() {
  return (
    <LegalPage
      title="Annulation et remboursement"
      current="/remboursement"
      intro={<p>Ce qui se passe si tu changes d&apos;avis, ou si une soirée est annulée ou reportée.</p>}
    >
      <h2>1. Tu changes d&apos;avis : 10 jours ouvrables pour annuler</h2>
      <p>
        Pour un achat fait sur le site, tu disposes de <strong>10 jours ouvrables</strong> à compter de ton achat pour annuler ta commande et
        être <strong>remboursé intégralement</strong>, frais de paiement compris, sans avoir à te justifier ni payer de pénalité (article 11
        de la loi n°2016-412 du 15 juin 2016 relative à la consommation).
      </p>
      <p>
        Condition : les billets concernés ne doivent pas avoir déjà été utilisés (QR code scanné à l&apos;entrée). Tu peux annuler toute la
        commande ou seulement certaines places.
      </p>

      <h2>2. La soirée est annulée ou reportée par nous</h2>
      <ul>
        <li>
          <strong>Annulation</strong> : tu es remboursé intégralement (prix des passes et frais de paiement), sans démarche compliquée — nous te
          contactons.
        </li>
        <li>
          <strong>Report à une autre date</strong> : ton billet reste valable pour la nouvelle date. Si elle ne te convient pas, tu peux
          demander le remboursement intégral.
        </li>
        <li>
          <strong>Changement important</strong> (lieu dans une autre ville, contenu essentiel du pass modifié) : tu peux choisir de garder ton
          billet ou d&apos;être remboursé.
        </li>
      </ul>

      <h2>3. Après le délai de 10 jours</h2>
      <p>
        Passé ce délai, et sauf annulation, report ou changement important de notre fait, les billets ne sont plus remboursables. Tu peux en
        revanche <strong>céder ton billet</strong> à une autre personne : écris-nous pour changer le nom inscrit dessus avant la soirée.
      </p>

      <h2>4. Achats faits sur place</h2>
      <p>
        Les billets achetés directement auprès de notre équipe (en ta présence) ne bénéficient pas du délai de rétractation de la vente à
        distance ; ils sont remboursés en cas d&apos;annulation, de report ou de changement important de notre fait.
      </p>

      <h2>5. Comment demander un remboursement</h2>
      <ol>
        <li>
          Écris-nous sur{" "}
          <a href={whatsappLink("Bonjour ! Je souhaite annuler ma commande (référence JEY-…).")} target="_blank" rel="noopener noreferrer">
            WhatsApp au {LEGAL.phone}
          </a>
          {LEGAL.email ? <> ou par e-mail à <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a></> : null}, en indiquant ta référence de
          commande (JEY-…, visible sur tes billets et dans l&apos;e-mail de confirmation).
        </li>
        <li>Nous confirmons la réception de ta demande.</li>
        <li>
          Le remboursement est fait <strong>par le même moyen</strong> (Wave ou Orange Money, au numéro utilisé pour payer, ou un autre numéro
          à ton nom que tu nous indiques) dans un délai maximum de <strong>14 jours</strong> après ta demande. Les billets remboursés sont
          annulés.
        </li>
      </ol>

      <h2>6. Questions</h2>
      <p>
        Pour toute question, consulte aussi nos <Link href="/conditions">conditions de vente</Link> ou écris-nous : nous répondons rapidement.
      </p>
    </LegalPage>
  );
}
