import Image from "next/image";
import type { PaymentMethod } from "@/lib/api";

export const PAYMENT_METHODS: { id: PaymentMethod; name: string; hint: string; color: string; ink: string; logo: string }[] = [
  { id: "wave", name: "Wave", hint: "Validation dans l'app Wave", color: "#1dc3f5", ink: "#05263a", logo: "/payments/wave.jpg" },
  { id: "orange_money", name: "Orange Money", hint: "Validation par code ou dans Max it", color: "#ff7a00", ink: "#1a0d00", logo: "/payments/orange-money.png" },
];

/** Logo d'un moyen de paiement (icône carrée aux coins arrondis). */
export function PaymentLogo({ id, size = 24, className = "" }: { id: PaymentMethod; size?: number; className?: string }) {
  const m = PAYMENT_METHODS.find((p) => p.id === id)!;
  return (
    <Image
      src={m.logo}
      alt={m.name}
      width={size}
      height={size}
      className={`shrink-0 rounded-[22%] object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

/** Pastille d'un moyen de paiement : logo + nom. */
export function PaymentMark({ id, className = "" }: { id: PaymentMethod; className?: string }) {
  const m = PAYMENT_METHODS.find((p) => p.id === id)!;
  return (
    <span className={`inline-flex items-center gap-2 rounded-xl border border-line-strong bg-paper/5 py-1.5 pl-1.5 pr-3.5 text-sm font-semibold text-paper ${className}`}>
      <PaymentLogo id={id} size={26} />
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
