"use client";

import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, SVGProps, TextareaHTMLAttributes } from "react";
import { useEffect, useId } from "react";
import type { Tone } from "@/lib/admin-api";

/* ---------------------------------- icônes --------------------------------- */
function I(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props} />
  );
}
export const DashboardIcon = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></I>
);
export const CalendarIcon = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}><rect x="3" y="4.5" width="18" height="17" rx="2" /><path d="M3 9h18M8 2.5v4M16 2.5v4" /></I>
);
export const ReceiptIcon = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}><path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z" /><path d="M9 8h6M9 12h6M9 16h3" /></I>
);
export const ScanIcon = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M7 12h10" /></I>
);
export const LogoutIcon = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H4" /></I>
);
export const PlusIcon = (p: SVGProps<SVGSVGElement>) => <I {...p}><path d="M12 5v14M5 12h14" /></I>;
export const DownloadIcon = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></I>
);
export const SearchIcon = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></I>
);
export const TrashIcon = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></I>
);
export const XIcon = (p: SVGProps<SVGSVGElement>) => <I {...p}><path d="M6 6l12 12M18 6 6 18" /></I>;
export const CheckIcon = (p: SVGProps<SVGSVGElement>) => <I {...p}><path d="m5 12 5 5 9-10" /></I>;
export const ExternalIcon = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></I>
);
export const MoonIcon = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" /></I>
);
export const ShuffleIcon = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}><path d="M4 7h3c5 0 5 10 10 10h3M17 14l3 3-3 3M4 17h3c1.6 0 2.7-1 3.5-2.4M13.5 9.4C14.3 8 15.4 7 17 7h3M17 4l3 3-3 3" /></I>
);
export const PlayIcon = (p: SVGProps<SVGSVGElement>) => <I {...p}><path d="M7 4.5v15l12-7.5z" /></I>;
export const ImageIcon = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}><rect x="3.5" y="4.5" width="17" height="15" rx="2" /><circle cx="9" cy="10" r="1.8" /><path d="m4 18 5-5 4 4 3-3 4 4" /></I>
);
export const UndoIcon = (p: SVGProps<SVGSVGElement>) => <I {...p}><path d="M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3" /></I>;
export const ExpandIcon = (p: SVGProps<SVGSVGElement>) => <I {...p}><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></I>;
export const SoundIcon = (p: SVGProps<SVGSVGElement>) => <I {...p}><path d="M4 9.5h4L13 5v14l-5-4.5H4zM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /></I>;
export const MuteIcon = (p: SVGProps<SVGSVGElement>) => <I {...p}><path d="M4 9.5h4L13 5v14l-5-4.5H4zM17 9.5l5 5M22 9.5l-5 5" /></I>;
export const FlagIcon = (p: SVGProps<SVGSVGElement>) => <I {...p}><path d="M5 21V4M5 4h11l-2 4 2 4H5" /></I>;
export const ArrowLeftIcon = (p: SVGProps<SVGSVGElement>) => <I {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></I>;

export const MenuIcon = (p: SVGProps<SVGSVGElement>) => <I {...p}><path d="M4 7h16M4 12h16M4 17h16" /></I>;
export const CameraIcon = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></I>
);
export const RefreshIcon = (p: SVGProps<SVGSVGElement>) => (
  <I {...p}><path d="M20 11a8 8 0 0 0-14.6-4.5M4 4v4h4M4 13a8 8 0 0 0 14.6 4.5M20 20v-4h-4" /></I>
);

/* -------------------------------- primitives ------------------------------- */
const TONES: Record<Tone, string> = {
  ok: "bg-emerald-400/12 text-emerald-300 ring-emerald-400/25",
  warn: "bg-amber-400/12 text-amber-200 ring-amber-400/25",
  bad: "bg-rose-400/12 text-rose-300 ring-rose-400/25",
  mute: "bg-paper/6 text-paper-muted ring-line",
  info: "bg-moon/12 text-moon ring-moon/25",
};

export function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${TONES[tone]}`}>{children}</span>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-line bg-night-2 ${className}`}>{children}</section>;
}

export function PageHead({ title, sub, actions }: { title: string; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="t-display text-4xl text-paper sm:text-5xl">{title}</h1>
        {sub && <p className="mt-1 text-sm text-paper-muted">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger"; size?: "sm" | "md" };
export function Button({ variant = "ghost", size = "md", className = "", ...rest }: BtnProps) {
  const v = {
    primary: "bg-peach text-cacao hover:bg-[#ffd9bd]",
    ghost: "border border-line-strong text-paper hover:border-peach hover:text-peach",
    danger: "border border-rose-400/40 text-rose-300 hover:bg-rose-400/10",
  }[variant];
  const s = size === "sm" ? "h-9 px-3.5 text-sm" : "h-11 px-5 text-sm";
  return (
    <button
      type="button"
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-full font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${v} ${s} ${className}`}
      {...rest}
    />
  );
}

const fieldCls =
  "w-full rounded-xl border border-line-strong bg-night px-3.5 py-2.5 text-[0.95rem] text-paper placeholder:text-paper-dim outline-none transition-colors focus:border-peach focus:ring-2 focus:ring-peach/25";

export function Field({ label, hint, children, className = "" }: { label: string; hint?: ReactNode; children: (id: string) => ReactNode; className?: string }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-paper">{label}</label>
      {children(id)}
      {hint && <p className="mt-1 text-xs text-paper-dim">{hint}</p>}
    </div>
  );
}

export const Input = ({ className = "", ...p }: InputHTMLAttributes<HTMLInputElement>) => <input className={`${fieldCls} ${className}`} {...p} />;
export const Textarea = ({ className = "", ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea className={`${fieldCls} ${className}`} {...p} />;
export const Select = ({ className = "", ...p }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select className={`${fieldCls} cursor-pointer ${className}`} {...p} />
);

export function ErrorNote({ children }: { children: ReactNode }) {
  return <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{children}</p>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="px-6 py-14 text-center text-paper-muted">{children}</p>;
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-paper/6 ${className}`} />;
}

/** Barre de remplissage (vendu + en attente) d'une édition. */
export function FillBar({ sold, pending = 0, capacity }: { sold: number; pending?: number; capacity: number }) {
  const pct = (n: number) => `${Math.min(100, (n / Math.max(1, capacity)) * 100)}%`;
  return (
    <div className="flex h-2 overflow-hidden rounded-full bg-paper/8" role="img" aria-label={`${sold} places vendues sur ${capacity}${pending ? `, ${pending} en attente` : ""}`}>
      <div className="h-full bg-peach" style={{ width: pct(sold) }} />
      <div className="h-full bg-peach/35" style={{ width: pct(pending) }} />
    </div>
  );
}

export const fcfa = (n: number) => `${new Intl.NumberFormat("fr-FR").format(n)} FCFA`;

export const dateTime = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", { timeZone: "Africa/Abidjan", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

export const dateLong = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", { timeZone: "Africa/Abidjan", weekday: "short", day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));

/** Panneau latéral (détail) ou fenêtre centrée ; Échap ou clic dehors pour fermer. */
export function Overlay({ title, onClose, children, side = false }: { title: string; onClose: () => void; children: ReactNode; side?: boolean }) {
  const id = useId();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  return (
    <div className={`fixed inset-0 z-50 flex bg-black/60 backdrop-blur-sm ${side ? "justify-end" : "items-end justify-center sm:items-center sm:p-6"}`} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        className={`flex max-h-dvh w-full flex-col overflow-hidden border-line bg-night-2 shadow-2xl ${side ? "h-dvh max-w-lg border-l" : "max-h-[92dvh] max-w-2xl rounded-t-3xl border sm:rounded-3xl"}`}
      >
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <h2 id={id} className="text-lg font-semibold text-paper">{title}</h2>
          <button type="button" onClick={onClose} autoFocus aria-label="Fermer" className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-paper-muted hover:bg-paper/6 hover:text-paper">
            <XIcon />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6" data-lenis-prevent>{children}</div>
      </div>
    </div>
  );
}
