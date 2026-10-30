"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { clearSession, getSession, type AdminSession, type Role } from "@/lib/admin-api";
import { Logo } from "@/components/ui";
import { CalendarIcon, DashboardIcon, ExternalIcon, LogoutIcon, MoonIcon, ReceiptIcon, ScanIcon } from "./ui";

const NAV: { href: string; label: string; icon: typeof DashboardIcon; roles: Role[] }[] = [
  { href: "/admin", label: "Tableau de bord", icon: DashboardIcon, roles: ["admin"] },
  { href: "/admin/evenements", label: "Éditions", icon: CalendarIcon, roles: ["admin"] },
  { href: "/admin/commandes", label: "Commandes", icon: ReceiptIcon, roles: ["admin"] },
  { href: "/admin/controle", label: "Contrôle", icon: ScanIcon, roles: ["admin", "staff"] },
  { href: "/admin/loup-garou", label: "Loup-Garou", icon: MoonIcon, roles: ["admin", "staff"] },
];

const SessionContext = createContext<AdminSession | null>(null);
export const useAdminSession = () => useContext(SessionContext);

/* La session vit dans localStorage : on la lit comme une source externe. */
const subscribe = (cb: () => void) => {
  window.addEventListener("storage", cb);
  window.addEventListener("jey:session", cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener("jey:session", cb);
  };
};
const snapshot = () => {
  const s = getSession();
  return s ? JSON.stringify(s) : "";
};

export function notifySession() {
  window.dispatchEvent(new Event("jey:session"));
}

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  // undefined = rendu serveur (on ne sait pas encore), "" = pas de session
  const raw = useSyncExternalStore(subscribe, snapshot, () => undefined);
  const session = useMemo<AdminSession | null>(() => (raw ? (JSON.parse(raw) as AdminSession) : null), [raw]);
  const onLogin = pathname.startsWith("/admin/login");
  const allowed = session ? NAV.filter((n) => n.roles.includes(session.role)) : [];
  const forbidden = !!session && !onLogin && !allowed.some((n) => isActive(pathname, n.href));
  const home = allowed[0]?.href ?? "/admin";

  useEffect(() => {
    if (raw === undefined || onLogin) return;
    if (!session) router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
    else if (forbidden) router.replace(home);
  }, [raw, onLogin, session, forbidden, home, router, pathname]);

  if (onLogin) return <>{children}</>;
  if (!session || forbidden) {
    return (
      <div className="grid min-h-dvh place-items-center text-paper-muted" aria-busy="true">
        Chargement…
      </div>
    );
  }

  const logout = () => {
    clearSession();
    notifySession();
    router.replace("/admin/login");
  };

  return (
    <SessionContext.Provider value={session}>
      <div className="min-h-dvh lg:grid lg:grid-cols-[248px_1fr]">
        {/* barre latérale (bureau) */}
        <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-night-2/60 px-4 py-6 lg:flex">
          <Link href={home} className="px-2">
            <Logo className="text-[1.05rem]" />
          </Link>
          <p className="mt-1 px-2 text-xs font-semibold uppercase tracking-[0.18em] text-paper-dim">Espace {session.role === "admin" ? "admin" : "accueil"}</p>
          <nav className="mt-8 flex flex-col gap-1" aria-label="Administration">
            {allowed.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.95rem] font-medium transition-colors ${
                    active ? "bg-peach/12 text-peach" : "text-paper-muted hover:bg-paper/5 hover:text-paper"
                  }`}
                >
                  <Icon /> {label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto flex flex-col gap-1 border-t border-line pt-4">
            <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-paper-muted hover:bg-paper/5 hover:text-paper">
              <ExternalIcon /> Voir le site
            </a>
            <button type="button" onClick={logout} className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-paper-muted hover:bg-paper/5 hover:text-paper">
              <LogoutIcon /> Se déconnecter
            </button>
          </div>
        </aside>

        {/* en-tête (mobile) */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-night/90 px-4 py-3 backdrop-blur lg:hidden">
          <Logo className="text-[0.95rem]" />
          <button type="button" onClick={logout} aria-label="Se déconnecter" className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-paper-muted hover:text-paper">
            <LogoutIcon />
          </button>
        </header>

        <main id="contenu" className="min-w-0 px-4 pb-28 pt-6 sm:px-8 lg:pb-12 lg:pt-10">
          <div className="mx-auto max-w-[1180px]">{children}</div>
        </main>

        {/* onglets (mobile) */}
        {allowed.length > 1 && (
          <nav aria-label="Administration" className="fixed inset-x-0 bottom-0 z-30 grid border-t border-line bg-night/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" style={{ gridTemplateColumns: `repeat(${allowed.length}, 1fr)` }}>
            {allowed.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex flex-col items-center gap-1 py-2.5 text-[0.7rem] font-semibold ${active ? "text-peach" : "text-paper-muted"}`}>
                  <Icon /> {label === "Tableau de bord" ? "Accueil" : label}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </SessionContext.Provider>
  );
}
