"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";

/** première page vue depuis l'ouverture du site (pour la source de la visite) */
let entrySent = false;
/** dernière page envoyée (évite un doublon si l'effet est rejoué) */
let last = { path: "", at: 0 };

/**
 * Compte les pages vues du site public pour les statistiques de l'admin.
 * Aucun cookie ni identifiant stocké : on envoie seulement la page, et à
 * l'arrivée sur le site, le site d'origine (référent) et un éventuel
 * ?src=… / ?utm_source=… (ex. lien de la bio Instagram : ?src=insta).
 */
export function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (navigator.webdriver) return; // navigateurs automatisés
    if (last.path === pathname && Date.now() - last.at < 2000) return;
    last = { path: pathname, at: Date.now() };
    const entry = !entrySent;
    entrySent = true;
    const params = new URLSearchParams(location.search);
    const body = {
      path: pathname,
      entry,
      ...(entry ? { ref: document.referrer || undefined, src: params.get("src") ?? params.get("utm_source") ?? undefined } : {}),
    };
    fetch(`${API_BASE_URL}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
