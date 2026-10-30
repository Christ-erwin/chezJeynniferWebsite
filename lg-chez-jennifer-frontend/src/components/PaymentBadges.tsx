import type { PaymentMethod } from "@/lib/api";

export const PAYMENT_METHODS: { id: PaymentMethod; name: string; hint: string; color: string; ink: string }[] = [
  { id: "wave", name: "Wave", hint: "Validation dans l'app Wave", color: "#1dc3f5", ink: "#05263a" },
  { id: "orange_money", name: "Orange Money", hint: "Validation par code ou dans Max it", color: "#ff7a00", ink: "#1a0d00" },
];

/** Pastille typographique d'un moyen de paiement (pas de logo officiel reproduit). */
export function PaymentMark({ id, className = "" }: { id: PaymentMethod; className?: string }) {
  const m = PAYMENT_METHODS.find((p) => p.id === id)!;
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-bold tracking-tight ${className}`}
      style={{ background: m.color, color: m.ink }}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: m.ink, opacity: 0.85 }} />
      {m.name}
    </span>
  );
}

export function PaymentBadges({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-2.5 ${className}`}>
      {PAYMENT_METHODS.map((m) => (
        <PaymentMark key={m.id} id={m.id} />
      ))}
    </div>
  );
}
