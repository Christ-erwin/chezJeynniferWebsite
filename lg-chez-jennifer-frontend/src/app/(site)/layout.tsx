import type { ReactNode } from "react";
import { Header } from "@/components/site/Header";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { CandleCursor } from "@/components/motion/CandleCursor";

/** Coquille du site public : scroll fluide, curseur bougie, grain, en-tête. */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="u-grain">
      <SmoothScroll />
      <CandleCursor />
      <Header />
      {children}
    </div>
  );
}
