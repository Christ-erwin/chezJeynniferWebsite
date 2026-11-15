/**
 * Frais de paiement répercutés sur le client, pour que l'organisateur
 * touche net le prix des billets.
 *
 * GeniusPay (tarifs publics) : 1 % + 100 XOF fixe, + frais opérateur ≈ 1,5 %.
 * Les frais sont pris sur le MONTANT PAYÉ (frais compris), d'où le calcul
 * « à l'envers » : payé = (prix + fixe) / (1 − taux), arrondi à la centaine
 * supérieure. Ex. 60 000 → 61 700 (≈ 1 643 de frais, il reste ≥ 60 000).
 *
 * Réglages (Railway) : PAYMENT_FEE_PERCENT (défaut 2.5), PAYMENT_FEE_FIXED
 * (défaut 100). Mettre les deux à 0 pour ne plus répercuter les frais.
 */
export type FeeRule = { percent: number; fixed: number };

function num(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return raw !== undefined && raw.trim() !== '' && Number.isFinite(n) && n >= 0 ? n : fallback;
}

export function feeRule(): FeeRule | undefined {
  const percent = Math.min(num(process.env.PAYMENT_FEE_PERCENT, 2.5), 50);
  const fixed = num(process.env.PAYMENT_FEE_FIXED, 100);
  return percent > 0 || fixed > 0 ? { percent, fixed } : undefined;
}

/** Frais à ajouter au prix des billets (0 si pas de règle ou prix nul). */
export function paymentFee(subtotal: number, rule: FeeRule | undefined): number {
  if (!rule || subtotal <= 0) return 0;
  const gross = Math.ceil((subtotal + rule.fixed) / (1 - rule.percent / 100) / 100) * 100;
  return gross - subtotal;
}
