import Image from "next/image";
import Link from "next/link";
import { CONCEPTS } from "@/lib/catalog";
import { Tilt } from "@/components/motion/Tilt";
import { Heart } from "@/components/ui";
import { ArrowRightIcon } from "@/components/icons";

/**
 * "Nos concepts" — la seule grande section claire de la home : une respiration
 * crème entre deux nuits, comme sur la maquette.
 */
export function Concepts() {
  return (
    <section id="univers" className="relative bg-cream py-24 text-cacao sm:py-32">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="grid items-end gap-8 lg:grid-cols-[1.1fr_1fr_auto]">
          <div>
            <p className="t-label text-cacao-muted" data-reveal>Nos concepts</p>
            <h2 className="t-display mt-4 text-5xl text-cacao sm:text-6xl" data-split>
              Trois univers, une même ambiance
            </h2>
            <Heart className="mt-4 text-wine" />
          </div>
          <p className="max-w-md text-[1.05rem] leading-relaxed text-cacao-muted" data-reveal>
            Chaque soirée a sa propre identité, mais toutes partagent la même essence : des moments de qualité,
            des rencontres authentiques et une ambiance inoubliable.
          </p>
          <p className="t-script hidden -rotate-6 text-4xl text-wine/80 lg:block" data-reveal>
            Choisis
            <br />
            ton univers !
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3 [&>*]:min-w-0" data-stagger>
          {CONCEPTS.map((c) => (
            <Tilt key={c.slug} className="h-full">
              <Link
                href={c.href}
                className="group relative flex h-full flex-col overflow-hidden rounded-[1.4rem] bg-night text-paper shadow-[0_30px_60px_-30px_rgba(43,26,20,0.6)]"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={c.cover}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover transition-transform duration-[1.6s] ease-(--ease-soft) group-hover:scale-[1.07]"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-night via-night/40 to-transparent" />
                  {/* reflet qui suit le pointeur */}
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 [background:radial-gradient(500px_circle_at_var(--mx,50%)_var(--my,50%),rgba(255,220,180,0.18),transparent_45%)]" />
                </div>
                <div className="relative -mt-16 flex flex-1 flex-col items-center px-5 pb-8 text-center sm:px-7">
                  <h3 className="t-caps text-[clamp(1.75rem,9vw,2.3rem)]" style={{ color: c.accent === "#c8c0ff" ? "#e9e4ff" : "#f5e9da" }}>
                    {c.displayName}
                  </h3>
                  <p className="t-caps mt-1 text-sm tracking-[0.24em] text-paper-muted">chez Jeynnifer</p>
                  <p className="mt-5 flex-1 text-[0.95rem] leading-relaxed text-paper-muted">{c.pitch}</p>
                  <span className="mt-7 inline-flex items-center gap-3 rounded-full border border-paper/25 px-6 py-3 text-sm font-semibold transition-colors group-hover:border-peach group-hover:text-peach">
                    En savoir plus <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
                <span aria-hidden className="absolute inset-x-0 top-0 h-[3px] opacity-80" style={{ background: c.accent }} />
              </Link>
            </Tilt>
          ))}
        </div>
      </div>
    </section>
  );
}
