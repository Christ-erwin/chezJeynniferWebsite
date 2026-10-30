import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

/** Écrans projetés pendant les soirées : plein écran, sans menu, non indexés. */
export const metadata: Metadata = {
  title: "Écran de jeu",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#070404" };

export default function ScreenLayout({ children }: { children: ReactNode }) {
  return children;
}
