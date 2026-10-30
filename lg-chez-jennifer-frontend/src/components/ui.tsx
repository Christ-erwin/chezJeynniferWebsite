import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { ArrowRightIcon } from "./icons";

/* -------------------------------------------------------------------------- */
/*  Logo — script "Les Soirées" + capitales "chez Jeynnifer"                  */
/* -------------------------------------------------------------------------- */
export function Logo({ className = "", tone = "paper" }: { className?: string; tone?: "paper" | "cacao" }) {
  return (
    <span className={`inline-flex flex-col leading-none ${tone === "cacao" ? "text-cacao" : "text-paper"} ${className}`}>
      <span className={`t-script -mb-1 text-[1.65em] ${tone === "cacao" ? "text-wine" : "text-peach"}`}>Les Soirées</span>
      <span className="t-caps whitespace-nowrap pl-[0.9em] text-[0.82em] tracking-[0.14em]">chez Jeynnifer</span>
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Boutons                                                                   */
/* -------------------------------------------------------------------------- */
type LinkBtn = Omit<ComponentProps<typeof Link>, "className"> & {
  children: ReactNode;
  className?: string;
  arrow?: boolean;
};

const base =
  "group inline-flex items-center justify-center gap-3 rounded-full font-sans text-[0.95rem] font-semibold tracking-[0.01em] transition-[background-color,color,border-color,transform,box-shadow] duration-300 ease-(--ease-soft) active:scale-[0.98]";

/** Bouton principal pêche — l'action de réservation, toujours la même partout. */
export function PassButton({ children, className = "", arrow = true, ...rest }: LinkBtn) {
  return (
    <Link
      {...rest}
      className={`${base} bg-peach px-7 py-3.5 text-cacao shadow-[0_10px_40px_-12px_rgba(246,201,167,0.55)] hover:bg-[#ffd9bd] hover:shadow-[0_14px_50px_-10px_rgba(246,201,167,0.7)] ${className}`}
    >
      {children}
      {arrow && <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />}
    </Link>
  );
}

/** Bouton contour — action secondaire. `tone` cacao pour les fonds crème. */
export function GhostButton({
  children,
  className = "",
  arrow = true,
  tone = "paper",
  ...rest
}: LinkBtn & { tone?: "paper" | "cacao" }) {
  const t =
    tone === "cacao"
      ? "border-cacao/30 text-cacao hover:border-cacao hover:bg-cacao hover:text-cream"
      : "border-paper/30 text-paper hover:border-peach hover:text-peach";
  return (
    <Link {...rest} className={`${base} border px-7 py-3.5 ${t} ${className}`}>
      {children}
      {arrow && <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />}
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/*  En-têtes de section                                                       */
/* -------------------------------------------------------------------------- */
export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p data-reveal className={`t-label ${className}`}>
      {children}
    </p>
  );
}

export function Heart({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={`h-3 w-3 ${className}`} fill="currentColor">
      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
    </svg>
  );
}

/** Guirlande lumineuse (ampoules qui scintillent) — signature visuelle de la marque. */
export function StringLights({
  className = "",
  count = 18,
  sag = 0.5,
  color = "#ffcf8a",
}: {
  className?: string;
  count?: number;
  /** creux de la guirlande, en fraction de la hauteur du conteneur */
  sag?: number;
  color?: string;
}) {
  const bulbs = Array.from({ length: count }, (_, i) => {
    const t = (i + 0.5) / count;
    return { left: t * 100, top: 4 * sag * t * (1 - t) * 100, d: (i * 0.37) % 3.4 };
  });
  return (
    <div aria-hidden className={`pointer-events-none relative ${className}`}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
        <path
          d={`M0 0 Q 50 ${sag * 200} 100 0`}
          fill="none"
          stroke="rgba(20,13,9,0.85)"
          strokeWidth="1.2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {bulbs.map((b, i) => (
        <span
          key={i}
          className="anim-bulb absolute block h-2.5 w-2 -translate-x-1/2 rounded-full"
          style={{
            left: `${b.left}%`,
            top: `calc(${b.top}% + 2px)`,
            background: color,
            boxShadow: `0 0 10px 2px ${color}aa, 0 0 34px 8px ${color}40`,
            animationDelay: `-${b.d}s`,
          }}
        />
      ))}
    </div>
  );
}
