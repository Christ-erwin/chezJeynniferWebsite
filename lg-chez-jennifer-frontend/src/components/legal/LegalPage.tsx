import Link from "next/link";
import type { ReactNode } from "react";
import { LEGAL } from "@/lib/legal";

export const LEGAL_PAGES = [
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/conditions", label: "Conditions de vente et d'utilisation" },
  { href: "/remboursement", label: "Annulation et remboursement" },
  { href: "/confidentialite", label: "Politique de confidentialité" },
  { href: "/cookies", label: "Cookies et mesure d'audience" },
] as const;

/** Gabarit commun des pages légales : titre, date de mise à jour, sommaire, texte lisible. */
export function LegalPage({ title, intro, current, children }: { title: string; intro: ReactNode; current: string; children: ReactNode }) {
  return (
    <main id="contenu" className="mx-auto max-w-3xl px-5 pb-24 pt-32 sm:px-8">
      <p className="t-label text-peach">Informations légales</p>
      <h1 className="t-display mt-3 text-4xl text-paper sm:text-5xl">{title}</h1>
      <p className="mt-3 text-sm text-paper-muted">Dernière mise à jour : {LEGAL.updatedAt}</p>
      <div className="mt-6 text-base leading-relaxed text-paper-muted">{intro}</div>

      <nav aria-label="Autres pages légales" className="mt-8 rounded-2xl border border-line p-4">
        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {LEGAL_PAGES.map((p) => (
            <li key={p.href}>
              <Link href={p.href} aria-current={p.href === current ? "page" : undefined} className={p.href === current ? "font-semibold text-paper" : "text-paper-muted underline underline-offset-4 hover:text-peach"}>
                {p.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="legal-prose mt-10">{children}</div>
    </main>
  );
}

/** Information manquante : bien visible, jamais inventée. */
export function Missing({ value }: { value: string | null }) {
  return value ? <>{value}</> : <mark className="rounded bg-ember/20 px-1 text-paper">à compléter</mark>;
}
