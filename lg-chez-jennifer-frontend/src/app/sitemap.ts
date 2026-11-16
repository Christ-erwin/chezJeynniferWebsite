import type { MetadataRoute } from "next";
import { CONCEPTS } from "@/lib/catalog";
import { fetchUpcomingEvents } from "@/lib/events";

const SITE_URL = "https://www.chezjeynnifer.online";

/** Plan du site : pages publiques, concepts, réservations des soirées à venir, pages légales. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const events = await fetchUpcomingEvents();
  const page = (path: string, priority: number, changeFrequency: "daily" | "weekly" | "monthly" | "yearly") => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  });
  return [
    page("/", 1, "weekly"),
    page("/evenements", 0.9, "daily"),
    ...CONCEPTS.map((c) => page(c.href, 0.8, "weekly")),
    ...events.map((e) => page(`/reserver/${e.id}`, 0.7, "daily")),
    ...["/conditions", "/remboursement", "/confidentialite", "/cookies", "/mentions-legales"].map((p) => page(p, 0.3, "yearly")),
  ];
}
