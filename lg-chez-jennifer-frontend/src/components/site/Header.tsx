"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/lib/site";
import { Logo, PassButton } from "@/components/ui";

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Position bornée à [0, max] : le rebond élastique d'iOS (scrollY négatif
    // ou au-delà du bas de page) ne doit pas être pris pour un changement de sens.
    const pos = () => {
      const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      return Math.min(Math.max(window.scrollY, 0), max);
    };
    let last = pos();
    let anchor = last; // position où le sens de défilement a changé
    let dir = 0;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = pos();
      setScrolled(y > 30);
      const d = Math.sign(y - last);
      if (d !== 0 && d !== dir) {
        dir = d;
        anchor = last;
      }
      // se cache après 40 px de descente, revient après 40 px de remontée :
      // les petits à-coups du doigt sur mobile ne le font plus clignoter
      if (y < 400) setHidden(false);
      else if (dir > 0 && y - anchor > 40) setHidden(true);
      else if (dir < 0 && anchor - y > 40) setHidden(false);
      last = y;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // referme le menu mobile quand la route change (ajustement au rendu, sans effet)
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : !href.includes("#") && pathname.startsWith(href);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[transform,background-color,border-color] duration-500 ease-(--ease-soft) ${
        hidden && !open ? "-translate-y-full" : "translate-y-0"
      } ${scrolled || open ? "border-b border-line bg-night/80 backdrop-blur-xl" : "border-b border-transparent"}`}
    >
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-6 px-5 py-3 sm:px-8 lg:py-4">
        <Link href="/" aria-label="Les Soirées chez Jeynnifer — accueil" className="text-[0.95rem] sm:text-base">
          <Logo className="text-[1.05rem] sm:text-[1.2rem]" />
        </Link>

        <nav aria-label="Navigation principale" className="hidden items-center gap-8 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`relative py-1 text-[0.88rem] font-medium transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:bg-brand after:transition-transform after:duration-500 ${
                isActive(item.href)
                  ? "text-paper after:scale-x-100"
                  : "text-paper-muted after:scale-x-0 hover:text-paper hover:after:scale-x-100"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden sm:block">
            <PassButton href="/evenements" arrow={false} className="whitespace-nowrap px-6 py-2.5 text-sm">
              Prendre mon pass
            </PassButton>
          </span>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-line-strong text-paper lg:hidden"
          >
            <span className="relative block h-3 w-5">
              <span className={`absolute left-0 block h-px w-full bg-current transition-transform duration-300 ${open ? "top-1.5 rotate-45" : "top-0"}`} />
              <span className={`absolute left-0 top-1.5 block h-px w-full bg-current transition-opacity ${open ? "opacity-0" : ""}`} />
              <span className={`absolute left-0 block h-px w-full bg-current transition-transform duration-300 ${open ? "top-1.5 -rotate-45" : "top-3"}`} />
            </span>
          </button>
        </div>
      </div>

      <div id="menu-mobile" hidden={!open} className="h-[calc(100dvh-4.5rem)] overflow-y-auto border-t border-line bg-night lg:hidden">
        <nav aria-label="Navigation mobile" className="flex flex-col px-5 py-6">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="t-display border-b border-line py-4 text-3xl text-paper">
              {item.label}
            </Link>
          ))}
          <PassButton href="/evenements" className="mt-8 w-full">
            Prendre mon pass
          </PassButton>
        </nav>
      </div>
    </header>
  );
}
