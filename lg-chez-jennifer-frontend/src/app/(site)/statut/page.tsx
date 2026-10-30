import Link from "next/link";
import { API_BASE_URL, getHealth, type HealthResponse } from "@/lib/api";

export const metadata = { title: "Statut de l'API" };

type LinkState =
  | { ok: true; data: HealthResponse }
  | { ok: false; error: string };

async function checkBackend(): Promise<LinkState> {
  try {
    return { ok: true, data: await getHealth() };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export default async function StatutPage() {
  const state = await checkBackend();

  return (
    <main id="contenu" className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <p className="t-label">Diagnostic</p>
        <h1 className="t-display text-3xl text-paper">Liaison frontend ⇄ backend</h1>
        <p className="text-paper-muted">
          Cette page vérifie que le site vitrine joint bien l&apos;API de
          billetterie.
        </p>
      </header>

      <section
        aria-live="polite"
        className="rounded-xl border border-line bg-night-2 p-5"
      >
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className={`inline-block h-2.5 w-2.5 rounded-full ${
              state.ok ? "bg-emerald-500" : "bg-wolf"
            }`}
          />
          <span className="font-medium text-paper">
            {state.ok ? "API connectée" : "API injoignable"}
          </span>
        </div>

        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 font-mono text-sm">
          <dt className="text-paper-dim">Endpoint</dt>
          <dd className="text-paper-muted">{API_BASE_URL}/health</dd>
          {state.ok ? (
            <>
              <dt className="text-paper-dim">Service</dt>
              <dd className="text-paper-muted">{state.data.service}</dd>
              <dt className="text-paper-dim">Horodatage</dt>
              <dd className="text-paper-muted">{state.data.timestamp}</dd>
            </>
          ) : (
            <>
              <dt className="text-paper-dim">Erreur</dt>
              <dd className="text-wolf-bright">{state.error}</dd>
            </>
          )}
        </dl>
      </section>

      <Link
        href="/"
        className="font-mono text-xs uppercase tracking-[0.18em] text-paper-muted hover:text-paper"
      >
        ← Retour au site
      </Link>
    </main>
  );
}
