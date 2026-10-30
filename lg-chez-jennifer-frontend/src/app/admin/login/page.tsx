"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/admin-api";
import { notifySession } from "@/components/admin/AdminShell";
import { Button, ErrorNote, Field, Input } from "@/components/admin/ui";
import { Logo } from "@/components/ui";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return setError("Entre ton mot de passe.");
    setBusy(true);
    setError(null);
    try {
      const s = await adminApi.login(password);
      notifySession();
      const next = new URLSearchParams(location.search).get("next");
      const safe = next && next.startsWith("/admin") && !next.startsWith("/admin/login") ? next : null;
      router.replace(s.role === "staff" ? "/admin/controle" : (safe ?? "/admin"));
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <main id="contenu" className="relative grid min-h-dvh place-items-center overflow-hidden px-4">
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,196,160,0.14),transparent_65%)]" />
      <form onSubmit={submit} noValidate className="relative w-full max-w-sm rounded-3xl border border-line bg-night-2 p-8 shadow-2xl">
        <Logo className="text-lg" />
        <h1 className="t-display mt-6 text-4xl text-paper">Espace équipe</h1>
        <p className="mt-1 text-sm text-paper-muted">Gestion des soirées, des ventes et de l&apos;accueil.</p>
        <Field label="Mot de passe" className="mt-8" hint="Admin : tout gérer. Accueil : contrôle des billets uniquement.">
          {(id) => (
            <Input
              id={id}
              type="password"
              autoComplete="current-password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!error}
            />
          )}
        </Field>
        {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}
        <Button type="submit" variant="primary" className="mt-6 w-full" disabled={busy}>
          {busy ? "Connexion…" : "Se connecter"}
        </Button>
      </form>
    </main>
  );
}
