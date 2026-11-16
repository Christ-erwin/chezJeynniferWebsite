import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Cookies et mesure d'audience",
  description: "Le site des Soirées chez Jeynnifer n'utilise aucun cookie publicitaire ni de suivi. Détail des quelques éléments techniques enregistrés.",
  alternates: { canonical: "/cookies" },
};

export default function Cookies() {
  return (
    <LegalPage
      title="Cookies et mesure d'audience"
      current="/cookies"
      intro={
        <p>
          <strong>En bref : notre site ne dépose aucun cookie publicitaire, de réseau social ou de suivi.</strong> C&apos;est pour cela
          qu&apos;il n&apos;y a pas de bandeau te demandant d&apos;accepter des cookies : rien de ce que nous utilisons n&apos;en a besoin.
        </p>
      }
    >
      <h2>1. Ce qui est enregistré dans ton navigateur</h2>
      <table tabIndex={0}>
        <thead>
          <tr>
            <th scope="col">Nom</th>
            <th scope="col">Type</th>
            <th scope="col">À quoi ça sert</th>
            <th scope="col">Durée</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>jey:last-order</td>
            <td>Stockage de session (pas un cookie)</td>
            <td>Retrouver ta commande quand tu reviens de l&apos;application de paiement. Contient seulement le numéro technique de la commande.</td>
            <td>Effacé à la fermeture de l&apos;onglet</td>
          </tr>
        </tbody>
      </table>
      <p>
        Il est <strong>strictement nécessaire</strong> au service que tu demandes (acheter un billet) et ne sert à rien d&apos;autre. L&apos;espace
        d&apos;administration, réservé à notre équipe, garde aussi sa session de connexion dans le navigateur des membres de l&apos;équipe.
      </p>

      <h2>2. Mesure d&apos;audience, sans cookie</h2>
      <p>Pour savoir combien de personnes visitent le site et d&apos;où elles viennent, nous utilisons deux outils qui ne déposent rien sur ton appareil :</p>
      <ul>
        <li>
          <strong>Nos propres statistiques</strong> : à chaque page, ton navigateur nous indique la page vue et, à ton arrivée, le site
          d&apos;où tu viens (ex. Instagram). Pour compter les visiteurs uniques d&apos;une journée, une empreinte technique est calculée à partir
          de ton adresse IP et de ton navigateur, rendue illisible (hachage) et <strong>effacée le lendemain</strong>. Nous ne gardons que des
          compteurs anonymes (13 mois).
        </li>
        <li>
          <strong>Vercel Web Analytics</strong> (notre hébergeur) : mesure d&apos;audience anonyme et sans cookie.
        </li>
      </ul>
      <p>Aucun de ces outils ne permet de te suivre d&apos;un site à l&apos;autre ni de te reconnaître d&apos;un jour sur l&apos;autre.</p>

      <h2>3. Sites externes</h2>
      <p>
        Quand tu paies, tu es redirigé vers GeniusPay, Wave ou Orange Money ; quand tu cliques sur un lien WhatsApp ou Instagram, tu quittes
        notre site. Ces services appliquent leurs propres règles en matière de cookies.
      </p>

      <h2>4. Et si nous changeons ?</h2>
      <p>
        Si un jour nous ajoutons un outil qui utilise des cookies non nécessaires (publicité, réseaux sociaux…), nous te demanderons ton
        accord avant, et tu pourras le refuser sans conséquence. Pour le reste, voir la{" "}
        <Link href="/confidentialite">politique de confidentialité</Link>.
      </p>
    </LegalPage>
  );
}
