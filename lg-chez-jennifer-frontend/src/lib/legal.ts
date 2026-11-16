/**
 * Informations légales de l'éditeur du site — UN SEUL ENDROIT À REMPLIR.
 *
 * Exigées par la loi n°2013-546 du 30 juillet 2013 (transactions
 * électroniques, art. 5 ; sanction art. 13 : 1 à 10 millions FCFA) et par la
 * loi n°2016-412 du 15 juin 2016 (consommation, art. 12 : nom, téléphone,
 * adresse du siège — sinon le délai de rétractation passe à 3 mois).
 *
 * Une valeur `null` s'affiche « à compléter » sur les pages légales :
 * ne jamais inventer une information (numéro RCCM, capital…).
 */
export const LEGAL = {
  /** dénomination sociale exacte, telle qu'au RCCM (ex. « AGENCE 22 SARL ») */
  company: null as string | null,
  /** forme juridique (SARL, SARLU, SAS, entreprise individuelle…) */
  legalForm: null as string | null,
  /** capital social en FCFA (ex. « 1 000 000 FCFA ») */
  capital: null as string | null,
  /** numéro RCCM (ex. « CI-ABJ-03-2024-B12-01234 ») */
  rccm: null as string | null,
  /** numéro de compte contribuable (NCC) / identification fiscale */
  taxId: null as string | null,
  /** adresse complète du siège */
  address: null as string | null,
  /** téléphone de contact */
  phone: "+225 07 87 87 97 80",
  /** e-mail de contact */
  email: null as string | null,
  /** responsable de la publication (nom et fonction) */
  publisher: null as string | null,
  /** récépissé de déclaration / autorisation ARTCI (loi 2013-450, art. 5 et 7), une fois obtenu */
  artciReference: null as string | null,
  /** date de dernière mise à jour des pages légales */
  updatedAt: "16 novembre 2026",
} as const;

export const HOSTS = [
  { role: "Site web (pages affichées)", name: "Vercel Inc.", address: "440 N Barranca Ave #4133, Covina, CA 91723, États-Unis", web: "vercel.com" },
  { role: "Serveur et données (commandes, billets)", name: "Railway Corporation", address: "548 Market St Suite 68956, San Francisco, CA 94104, États-Unis", web: "railway.com" },
] as const;

/** Prestataires qui reçoivent des données (sous-traitants), pour la politique de confidentialité. */
export const PROCESSORS = [
  { name: "GeniusPay", country: "Côte d'Ivoire", purpose: "Encaissement des paiements Wave et Orange Money", data: "nom, numéro de téléphone, montant, référence de commande" },
  { name: "Wave et Orange Money", country: "Côte d'Ivoire", purpose: "Exécution du paiement depuis ton compte mobile", data: "les données de ton compte, gérées directement par l'opérateur" },
  { name: "Railway Corporation", country: "États-Unis", purpose: "Hébergement du serveur et de la base des commandes", data: "toutes les données de commande" },
  { name: "Vercel Inc.", country: "États-Unis", purpose: "Hébergement du site et mesure d'audience sans cookie", data: "adresse IP (journaux techniques), pages vues anonymes" },
  { name: "Resend (Plus Five Five, Inc.)", country: "États-Unis", purpose: "Envoi de l'e-mail contenant tes billets", data: "adresse e-mail, nom, détail des billets" },
] as const;

/** Valeur affichée, ou mention « à compléter » si l'information manque encore. */
export function legalValue(v: string | null): string {
  return v ?? "à compléter";
}
