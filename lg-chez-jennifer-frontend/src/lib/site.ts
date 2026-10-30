export const SITE = {
  name: "Les Soirées chez Jeynnifer",
  promise:
    "Pas besoin d'une musique assourdissante pour passer une bonne soirée. On vient pour jouer, rire, discuter, rencontrer de nouvelles personnes, manger, boire un verre, regarder un film — et surtout partager un vrai moment ensemble.",
  vision:
    "Des rendez-vous à taille humaine, dans des lieux choisis et aménagés pour une atmosphère cozy, conviviale et chaleureuse.",
  contact: {
    whatsapp: "+2250787879780",
    whatsappDisplay: "+225 07 87 87 97 80",
    instagram: "lessoireeschezjeynnifer",
  },
  organizer: { name: "l'agence 22", line: "We create what people remember." },
} as const;

export const NAV = [
  { href: "/", label: "Accueil" },
  { href: "/#univers", label: "Nos soirées" },
  { href: "/evenements", label: "Événements" },
  { href: "/#a-propos", label: "À propos" },
  { href: "/#faq", label: "FAQ" },
  { href: "/#contact", label: "Contact" },
] as const;

export function whatsappLink(message: string): string {
  return `https://wa.me/${SITE.contact.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}
