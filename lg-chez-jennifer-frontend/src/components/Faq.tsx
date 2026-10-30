import { PlusIcon } from "@/components/icons";

export type FaqItem = { q: string; a: string };

export const GENERAL_FAQ: FaqItem[] = [
  {
    q: "Je peux venir seul·e ?",
    a: "Oui, et c'est même une excellente idée. Les jeux cassent la glace dès les premières minutes : personne ne reste dans son coin chez Jeynnifer.",
  },
  {
    q: "Comment se passe le paiement ?",
    a: "Tu choisis ton pass, tu indiques ton nom et ton numéro, puis tu paies par Wave ou Orange Money directement depuis ton téléphone. Dès que le paiement est validé, ton billet (avec QR code) s'affiche et t'est envoyé.",
  },
  {
    q: "Où ont lieu les soirées ?",
    a: "Dans des lieux sélectionnés à Abidjan, aménagés pour une ambiance cozy. Pour certaines éditions, l'adresse exacte est communiquée après la réservation.",
  },
  {
    q: "Je peux annuler ou transférer ma place ?",
    a: "Une place peut être transférée à un proche en nous écrivant sur WhatsApp au moins 48 h avant la soirée. Les passes ne sont pas remboursables sauf annulation de notre part.",
  },
  {
    q: "Il y a de quoi manger et boire ?",
    a: "Oui : boissons, cocktails et de quoi grignoter sont prévus sur place. Certains passes incluent une boisson ou du popcorn.",
  },
  {
    q: "Faut-il savoir jouer ?",
    a: "Pas du tout. Les règles sont expliquées sur place, on joue pour s'amuser — pas pour gagner.",
  },
];

/** Accordéon accessible (details/summary), réutilisé sur chaque univers. */
export function Faq({
  items,
  accent = "#f6c9a7",
  tone = "dark",
}: {
  items: FaqItem[];
  accent?: string;
  tone?: "dark" | "cream";
}) {
  const line = tone === "cream" ? "border-cacao-line divide-cacao-line" : "border-line divide-line";
  const q = tone === "cream" ? "text-cacao" : "text-paper";
  const a = tone === "cream" ? "text-cacao-muted" : "text-paper-muted";
  return (
    <div className={`divide-y border-y ${line}`} data-stagger>
      {items.map((item) => (
        <details key={item.q} className="group py-6">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 [&::-webkit-details-marker]:hidden">
            <span className={`t-display text-2xl sm:text-[1.75rem] ${q}`}>{item.q}</span>
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-transform duration-500 group-open:rotate-45"
              style={{ borderColor: `${accent}55`, color: accent }}
            >
              <PlusIcon className="h-4 w-4" />
            </span>
          </summary>
          <p className={`mt-4 max-w-3xl leading-relaxed ${a}`}>{item.a}</p>
        </details>
      ))}
    </div>
  );
}
