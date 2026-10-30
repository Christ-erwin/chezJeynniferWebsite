/** Carte de jeu générique aux couleurs vives (aucun logo de marque reproduit). */
export const CARD_COLORS = {
  red: "#e3423a",
  yellow: "#f4b93a",
  green: "#2e9d5b",
  blue: "#2f6fd6",
  black: "#1b1512",
} as const;

export type CardColor = keyof typeof CARD_COLORS;

export function PlayingCard({ color, value, className = "" }: { color: CardColor; value: string; className?: string }) {
  const c = CARD_COLORS[color];
  const wild = color === "black";
  return (
    <div
      className={`relative aspect-[5/7.2] overflow-hidden rounded-[12%/8.5%] border-[3px] border-white bg-white shadow-[0_18px_40px_-12px_rgba(0,0,0,0.7)] ${className}`}
    >
      <div className="absolute inset-[5%] overflow-hidden rounded-[10%/7%]" style={{ background: c }}>
        <div
          className="absolute left-1/2 top-1/2 flex h-[78%] w-[62%] -translate-x-1/2 -translate-y-1/2 -rotate-[28deg] items-center justify-center rounded-[50%] bg-white"
          style={wild ? { background: `conic-gradient(${CARD_COLORS.red} 0 25%, ${CARD_COLORS.blue} 0 50%, ${CARD_COLORS.yellow} 0 75%, ${CARD_COLORS.green} 0)` } : undefined}
        >
          <span
            className="rotate-[28deg] font-sans text-[2.4em] font-black italic leading-none"
            style={{ color: wild ? "#fff" : c, WebkitTextStroke: wild ? "1px #1b1512" : undefined }}
          >
            {value}
          </span>
        </div>
        <span className="absolute left-[8%] top-[5%] font-sans text-[0.75em] font-black italic text-white">{value}</span>
        <span className="absolute bottom-[5%] right-[8%] rotate-180 font-sans text-[0.75em] font-black italic text-white">{value}</span>
      </div>
    </div>
  );
}
