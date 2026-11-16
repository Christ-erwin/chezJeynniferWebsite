import type { MetadataRoute } from "next";

const SITE_URL = "https://www.chezjeynnifer.online";

/**
 * Moteurs de recherche et agents IA bienvenus sur les pages publiques.
 * Exclus : l'administration, l'écran de jeu, les pages propres à une commande.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/ecran", "/reserver/confirmation", "/paiement", "/statut"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
