import type { ReactNode } from "react";
import { PageMotion } from "@/components/motion/PageMotion";
import { Footer } from "@/components/site/Footer";

/**
 * Remonté à chaque navigation : rejoue le rideau d'entrée et réarme les
 * animations de scroll de la nouvelle page (pied de page compris).
 */
export default function Template({ children }: { children: ReactNode }) {
  return (
    <PageMotion>
      {children}
      <Footer />
    </PageMotion>
  );
}
