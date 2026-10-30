import type { ReactNode } from "react";
import { CAMPS, ROLE_BY_ID, roleName, type Camp, type RoleId } from "@/lib/werewolf";

/* ---------------------------------- emblèmes ---------------------------------- */
const WOLF = "M14 10 24 24q8-3 16 0l10-14-1 20q-1 10-8 17l-5 7q-4 4-8 0l-5-7q-7-7-8-17Z";
const WOLF_FACE = "M23 33l6 2M41 33l-6 2M30 46h4l-2 2.5Z";

const EMBLEMS: Record<RoleId, ReactNode> = {
  "loup-garou": (
    <>
      <path d={WOLF} />
      <path d={WOLF_FACE} />
    </>
  ),
  "loup-garou-infect": (
    <>
      <g transform="translate(-6 0)">
        <path d={WOLF} />
        <path d={WOLF_FACE} />
      </g>
      <path d="M53 36q6 8 0 12-6-4 0-12Z" />
      <path d="M53 52v4M50 58h6" />
    </>
  ),
  "grand-mechant-loup": (
    <>
      <path d={WOLF} />
      <path d="M21 30l8 4M43 30l-8 4M30 46h4l-2 2.5ZM27 50l2 4 2-4M33 50l2 4 2-4" />
      <path d="M4 22l6 14M8 19l6 14M56 22l-6 14M60 19l-6 14" />
    </>
  ),
  "loup-blanc": (
    <>
      <g transform="translate(-4 4)">
        <path d={WOLF} />
        <path d={WOLF_FACE} />
      </g>
      <path d="M53 4a8 8 0 1 0 6 13 6.5 6.5 0 0 1-6-13Z" />
    </>
  ),
  villageois: (
    <path d="M6 52V37l8-7 8 7v15M22 52V31l10-12 10 12v21M42 52V38l8-6 8 6v14M3 52h58M29 52v-8h6v8M32 19v-8M29 14h6M10 44h4M50 44h4" />
  ),
  voyante: (
    <>
      <circle cx="32" cy="27" r="16" />
      <path d="M22 27q10-8 20 0-10 8-20 0Z" />
      <circle cx="32" cy="27" r="3" />
      <path d="M20 52h24l-3-8H23ZM16 56h32" />
    </>
  ),
  sorciere: (
    <>
      <path d="M26 7h12M28.5 7v11L18 39a11 11 0 0 0 10 16h8a11 11 0 0 0 10-16L35.5 18V7M20 40h24" />
      <circle cx="28" cy="47" r="2" />
      <circle cx="36" cy="45" r="1.5" />
      <path d="M50 10l2 4 4 2-4 2-2 4-2-4-4-2 4-2Z" />
    </>
  ),
  chasseur: (
    <>
      <circle cx="32" cy="32" r="17" />
      <circle cx="32" cy="32" r="7" />
      <path d="M32 6v14M32 44v14M6 32h14M44 32h14" />
    </>
  ),
  cupidon: (
    <path d="M9 55 51 13M43 12h9v9M14 50l-5 1 1-5M32 46s-12-7-12-16a6 6 0 0 1 12-3 6 6 0 0 1 12 3c0 9-12 16-12 16Z" />
  ),
  "petite-fille": (
    <>
      <circle cx="32" cy="21" r="7" />
      <path d="M21 26q11-24 22 0M24 56l4-26h8l4 26ZM24 25l-3 9M40 25l3 9" />
    </>
  ),
  "deux-soeurs": (
    <>
      <circle cx="23" cy="20" r="6" />
      <circle cx="41" cy="20" r="6" />
      <path d="M14 56l4-26h10l4 26M32 56l4-26h10l4 26M28 40h8" />
    </>
  ),
  "enfant-sauvage": (
    <path d="M12 52C12 28 28 12 54 10c0 26-16 42-42 42ZM12 52l30-30M26 38h10M33 31V21M20 44h8" />
  ),
  "chien-loup": (
    <>
      <ellipse cx="32" cy="42" rx="11" ry="9" />
      <ellipse cx="18" cy="27" rx="4.5" ry="6" />
      <ellipse cx="27" cy="19" rx="4.5" ry="6.5" />
      <ellipse cx="37" cy="19" rx="4.5" ry="6.5" />
      <ellipse cx="46" cy="27" rx="4.5" ry="6" />
    </>
  ),
};

export function RoleEmblem({ role, className = "" }: { role: RoleId; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {EMBLEMS[role]}
    </svg>
  );
}

/* ----------------------------------- thèmes ----------------------------------- */
/* Mêmes cartes que « Tire ta carte » sur la page /loup-garou : parchemin pour le
   village, rouge sang pour la meute. Le Loup Blanc garde la nuit, en argent ;
   les rôles au camp incertain gardent le parchemin, teinté de violet. */
const THEME: Record<Camp, { card: string; ink: string; muted: string; frame: string; label: string }> = {
  village: {
    card: "border-[#e9cfa8]/60 bg-[radial-gradient(circle_at_50%_30%,#f7ece0,#e6d0b4_80%)]",
    ink: "text-cacao",
    muted: "text-cacao-muted",
    frame: "border-[#6e1f2a]/25",
    label: "text-[#6e1f2a]",
  },
  ambigu: {
    card: "border-[#d9c7ef]/60 bg-[radial-gradient(circle_at_50%_30%,#f3ecf7,#ddd0e6_80%)]",
    ink: "text-[#2a1c33]",
    muted: "text-[#5b4a66]",
    frame: "border-[#5b2a86]/25",
    label: "text-[#5b2a86]",
  },
  loups: {
    card: "border-[#c8262f] bg-[radial-gradient(circle_at_50%_30%,#4a0b10,#140506_75%)]",
    ink: "text-[#ffb3ab]",
    muted: "text-[#e9c1bc]",
    frame: "border-[#c8262f]/35",
    label: "text-[#ff8a7a]",
  },
  solitaire: {
    card: "border-[#cfd6e2]/70 bg-[radial-gradient(circle_at_50%_30%,#2b3240,#0b0d12_75%)]",
    ink: "text-[#eef2f8]",
    muted: "text-[#c3cad6]",
    frame: "border-[#cfd6e2]/30",
    label: "text-[#dfe6f2]",
  },
};

/**
 * Carte de rôle (recto). Taille pilotée par le conteneur : tout est en
 * unités relatives (cqw) pour rester net de la vignette à l'écran géant.
 */
export function RoleCardFront({ role, feminine, className = "" }: { role: RoleId; feminine?: boolean; className?: string }) {
  const r = ROLE_BY_ID[role];
  const t = THEME[r.camp];
  return (
    <div className={`@container relative aspect-[5/7] overflow-hidden rounded-[7%/5%] border shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] ${t.card} ${t.ink} ${className}`}>
      <div className={`absolute inset-[4.5%] rounded-[5%/3.6%] border ${t.frame}`} />
      <div className="absolute inset-[9%] flex flex-col items-center justify-between text-center">
        <span className={`t-label text-[4.6cqw]! ${t.label}`}>{CAMPS[r.camp].label}</span>
        <div className="flex flex-col items-center">
          <RoleEmblem role={role} className="w-[36%]" />
          <p className="t-caps mt-[6cqw] text-[10.5cqw] leading-[0.95]">{roleName(role, feminine)}</p>
        </div>
        <p className={`text-[4.8cqw] leading-relaxed ${t.muted}`}>{r.text}</p>
      </div>
    </div>
  );
}

/** Dos de carte : celui du paquet « Tire ta carte » (orbe rouge). */
export function RoleCardBack({ className = "" }: { className?: string }) {
  return (
    <div className={`@container relative aspect-[5/7] overflow-hidden rounded-[7%/5%] border border-[#5a1a1f] bg-[radial-gradient(circle_at_50%_40%,#3a0b10,#140506_70%)] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] ${className}`}>
      <div className="absolute inset-[4.5%] rounded-[5%/3.6%] border border-[#c8262f]/30" />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="aspect-square w-[30%] rounded-full bg-[radial-gradient(circle_at_40%_35%,#ff8a7a,#c8262f_55%,#4a0b10)] shadow-[0_0_14cqw_2cqw_rgba(200,38,47,0.45)]" />
        <span className="t-caps mt-[9cqw] text-[4.6cqw] tracking-[0.4em] text-[#e9a6a0]/70">Loup-Garou</span>
      </div>
    </div>
  );
}

/** Pastille de rôle (vignettes, listes). */
export function RoleChip({ role, feminine, className = "" }: { role: RoleId; feminine?: boolean; className?: string }) {
  const r = ROLE_BY_ID[role];
  const color = CAMPS[r.camp].color;
  return (
    <span className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${className}`} style={{ borderColor: `${color}66`, color, background: `${color}14` }}>
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} />
      <span className="truncate">{roleName(role, feminine)}</span>
    </span>
  );
}
