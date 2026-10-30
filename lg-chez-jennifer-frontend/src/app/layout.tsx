import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

/*
 * Polices hébergées dans le projet (src/app/fonts, sous-ensemble latin de
 * Google Fonts) : le site ne dépend pas d'une connexion à Google, ni au
 * démarrage du serveur de dev, ni au build.
 */

// Titres : serif éditorial fin, très contrasté (esprit des visuels)
const cormorant = localFont({
  src: [
    { path: "./fonts/cormorant-garamond.woff2", weight: "300 700", style: "normal" },
    { path: "./fonts/cormorant-garamond-italic.woff2", weight: "300 700", style: "italic" },
  ],
  variable: "--font-cormorant",
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "serif"],
});

// Texte courant et interface
const manrope = localFont({
  src: "./fonts/manrope.woff2",
  weight: "200 800",
  variable: "--font-manrope",
  display: "swap",
  fallback: ["system-ui", "Arial", "sans-serif"],
});

// Notes manuscrites ("Les Soirées", "Choisis ton univers !")
const script = localFont({
  src: "./fonts/alex-brush.woff2",
  weight: "400",
  variable: "--font-script-face",
  display: "swap",
  fallback: ["cursive"],
});

const description =
  "Les Soirées chez Jeynnifer : Game Night, Soirée Loup-Garou et CinéLune à Abidjan. Des soirées à taille humaine pour jouer, rire, regarder un film et vraiment se rencontrer. Réserve ton pass en ligne, paiement Wave ou Orange Money.";

export const metadata: Metadata = {
  metadataBase: new URL("https://chez-jeynnifer.example"),
  title: {
    default: "Les Soirées chez Jeynnifer — Plus que des soirées, des expériences",
    template: "%s · Les Soirées chez Jeynnifer",
  },
  description,
  keywords: ["soirée Abidjan", "Game Night", "Loup-Garou", "cinéma plein air", "CinéLune", "sortie", "Chez Jeynnifer"],
  openGraph: {
    title: "Les Soirées chez Jeynnifer",
    description,
    locale: "fr_FR",
    type: "website",
    images: ["/images/og/cine-garden.jpg"],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#0d0907",
  colorScheme: "dark",
};

// Posé avant le premier rendu : active les états "avant animation" seulement
// si le visiteur n'a pas demandé moins d'animations (et seulement avec JS).
const motionBoot = `try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('js-motion')}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${cormorant.variable} ${manrope.variable} ${script.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: motionBoot }} />
      </head>
      <body className="min-h-dvh">
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-100 focus:rounded-full focus:bg-peach focus:px-5 focus:py-2.5 focus:text-cacao"
        >
          Aller au contenu
        </a>
        {children}
      </body>
    </html>
  );
}
