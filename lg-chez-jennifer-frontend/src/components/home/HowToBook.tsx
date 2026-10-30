import { PassButton, Heart } from "@/components/ui";
import { PaymentBadges } from "@/components/PaymentBadges";
import { CalendarIcon, TicketIcon, PhoneIcon } from "@/components/icons";

const STEPS = [
  {
    icon: CalendarIcon,
    title: "Choisis ta soirée",
    text: "Game Night, Loup-Garou ou CinéLune : parcours le calendrier et trouve la date qui te ressemble.",
  },
  {
    icon: TicketIcon,
    title: "Prends ton pass",
    text: "Solo ou Duo, entre amis ou en couple. Tu indiques ton nom et ton numéro, c'est tout.",
  },
  {
    icon: PhoneIcon,
    title: "Paie en un geste",
    text: "Wave ou Orange Money, directement depuis ton téléphone. Ton billet arrive aussitôt avec son QR code.",
  },
];

export function HowToBook() {
  return (
    <section className="relative bg-cream py-24 text-cacao sm:py-32">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="max-w-2xl">
          <p className="t-label text-cacao-muted" data-reveal>Réserver</p>
          <h2 className="t-display mt-4 text-5xl text-cacao sm:text-6xl" data-split>
            Ton pass en trois gestes, sans quitter le site.
          </h2>
          <Heart className="mt-4 text-wine" />
        </div>

        <ol className="mt-14 grid gap-6 md:grid-cols-3" data-stagger>
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="relative rounded-[1.4rem] border border-cacao-line bg-cream-2/50 p-8">
              <span className="t-display absolute right-6 top-4 text-7xl font-light text-cacao/10">{i + 1}</span>
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-cacao text-peach">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="t-display mt-6 text-3xl text-cacao">{title}</h3>
              <p className="mt-3 leading-relaxed text-cacao-muted">{text}</p>
            </li>
          ))}
        </ol>

        <div className="mt-12 flex flex-col items-start justify-between gap-6 rounded-[1.4rem] bg-cacao p-8 text-paper sm:flex-row sm:items-center sm:p-10" data-reveal>
          <div>
            <p className="t-display text-3xl">Paiement sécurisé, 100 % mobile</p>
            <p className="mt-2 text-sm text-paper-muted">Aucune carte bancaire nécessaire.</p>
            <PaymentBadges className="mt-5" />
          </div>
          <PassButton href="/evenements">Prendre mon pass</PassButton>
        </div>
      </div>
    </section>
  );
}
