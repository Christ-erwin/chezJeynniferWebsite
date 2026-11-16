import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Missing } from "@/components/legal/LegalPage";
import { HOSTS, LEGAL } from "@/lib/legal";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Identité de l'éditeur du site Les Soirées chez Jeynnifer, coordonnées et hébergeurs.",
  alternates: { canonical: "/mentions-legales" },
};

export default function MentionsLegales() {
  return (
    <LegalPage
      title="Mentions légales"
      current="/mentions-legales"
      intro={
        <p>
          Informations prévues par l&apos;article 5 de la loi n°2013-546 du 30 juillet 2013 relative aux transactions électroniques et par
          l&apos;article 12 de la loi n°2016-412 du 15 juin 2016 relative à la consommation.
        </p>
      }
    >
      <h2>Éditeur du site</h2>
      <p>
        Le site <strong>chezjeynnifer.online</strong> et la marque « {SITE.name} » sont édités et exploités par :
      </p>
      <ul>
        <li>Dénomination sociale : <Missing value={LEGAL.company} /></li>
        <li>Forme juridique : <Missing value={LEGAL.legalForm} /></li>
        <li>Capital social : <Missing value={LEGAL.capital} /></li>
        <li>Immatriculation au RCCM : <Missing value={LEGAL.rccm} /></li>
        <li>Numéro de compte contribuable (NCC) : <Missing value={LEGAL.taxId} /></li>
        <li>Siège social : <Missing value={LEGAL.address} /></li>
        <li>
          Téléphone et WhatsApp : <a href={`tel:${LEGAL.phone.replace(/\s/g, "")}`}>{LEGAL.phone}</a>
        </li>
        <li>
          E-mail : {LEGAL.email ? <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> : <Missing value={null} />}
        </li>
        <li>Responsable de la publication : <Missing value={LEGAL.publisher} /></li>
      </ul>

      <h2>Hébergement</h2>
      <ul>
        {HOSTS.map((h) => (
          <li key={h.name}>
            <strong>{h.role}</strong> : {h.name}, {h.address} ({h.web})
          </li>
        ))}
      </ul>

      <h2>Données personnelles</h2>
      <p>
        Le traitement des données personnelles est encadré par la loi n°2013-450 du 19 juin 2013 relative à la protection des données à
        caractère personnel, sous le contrôle de l&apos;ARTCI (Autorité de protection des données à caractère personnel).
        {LEGAL.artciReference ? ` Référence de déclaration / autorisation ARTCI : ${LEGAL.artciReference}.` : ""} Tout est expliqué dans la{" "}
        <Link href="/confidentialite">politique de confidentialité</Link>.
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        Les textes, logos, affiches, photos et vidéos du site sont protégés. Leur reproduction, même partielle, sans autorisation écrite de
        l&apos;éditeur est interdite.
      </p>

      <h2>Contact</h2>
      <p>
        Pour toute question, écris-nous sur WhatsApp au {LEGAL.phone}
        {LEGAL.email ? <> ou par e-mail à <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a></> : ""}.
      </p>
    </LegalPage>
  );
}
