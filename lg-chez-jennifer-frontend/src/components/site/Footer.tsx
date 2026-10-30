import Link from "next/link";
import { CONCEPTS } from "@/lib/catalog";
import { SITE, whatsappLink } from "@/lib/site";
import { Logo, PassButton, StringLights } from "@/components/ui";
import { InstagramIcon, WhatsappIcon } from "@/components/icons";

export function Footer() {
  return (
    <footer id="contact" className="relative overflow-hidden border-t border-line bg-night">
      <StringLights className="h-16 w-full opacity-80" count={26} sag={0.55} />

      {/* grand appel final */}
      <div className="mx-auto max-w-[1400px] px-5 pb-16 pt-14 text-center sm:px-8">
        <p className="t-script text-4xl text-peach sm:text-5xl" data-reveal>
          On t&apos;attend ?
        </p>
        <h2 className="t-display mx-auto mt-3 max-w-3xl text-5xl text-paper sm:text-7xl" data-split>
          Viens comme tu es, repars avec des souvenirs.
        </h2>
        <div className="mt-10 flex justify-center" data-reveal>
          <PassButton href="/evenements">Prendre mon pass</PassButton>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] border-t border-line px-5 py-12 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Logo className="text-lg" />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-paper-dim">{SITE.vision}</p>
          </div>

          <nav aria-label="Nos soirées">
            <p className="t-label mb-2">Nos soirées</p>
            <ul className="text-sm">
              {CONCEPTS.map((c) => (
                <li key={c.slug}>
                  <Link href={c.href} className="inline-block py-2.5 text-paper-muted transition-colors hover:text-peach">
                    {c.displayName}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Infos">
            <p className="t-label mb-2">Infos</p>
            <ul className="text-sm">
              <li><Link href="/evenements" className="inline-block py-2.5 text-paper-muted hover:text-peach">Événements</Link></li>
              <li><Link href="/#a-propos" className="inline-block py-2.5 text-paper-muted hover:text-peach">À propos</Link></li>
              <li><Link href="/#faq" className="inline-block py-2.5 text-paper-muted hover:text-peach">FAQ</Link></li>
            </ul>
          </nav>

          <div>
            <p className="t-label mb-2">Nous écrire</p>
            <ul className="text-sm">
              <li>
                <a href={whatsappLink("Bonjour ! J'ai une question sur Les Soirées chez Jeynnifer.")} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2.5 py-2.5 text-paper-muted hover:text-peach">
                  <WhatsappIcon className="h-4 w-4 text-peach" /> {SITE.contact.whatsappDisplay}
                </a>
              </li>
              <li>
                <a href={`https://instagram.com/${SITE.contact.instagram}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2.5 py-2.5 text-paper-muted hover:text-peach">
                  <InstagramIcon className="h-4 w-4 text-peach" /> @{SITE.contact.instagram}
                </a>
              </li>
            </ul>
            <p className="mt-6 text-sm text-paper-dim">
              Une expérience imaginée avec <span className="text-paper">{SITE.organizer.name}</span>
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 text-xs text-paper-dim sm:flex-row">
          <p>© {new Date().getFullYear()} {SITE.name}. Abidjan, Côte d&apos;Ivoire.</p>
          <p>Paiement sécurisé · Wave · Orange Money</p>
        </div>
      </div>
    </footer>
  );
}
