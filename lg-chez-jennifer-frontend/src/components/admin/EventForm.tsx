"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi, type AdminEvent, type EventInput, type EventStatus } from "@/lib/admin-api";
import { CONCEPTS, type ConceptSlug } from "@/lib/catalog";
import { Button, Card, ErrorNote, Field, Input, PlusIcon, Select, Textarea, TrashIcon } from "./ui";

/** Visuels déjà présents dans /public/images (ou une URL https). */
const COVERS = [
  "ev-halloween.jpg", "ev-gn.jpg", "ev-cine.jpg", "lg-scene.jpg", "lg-moon.jpg", "lg-group.png", "lg-cards.png",
  "gn-table.jpg", "gn-friends.jpg", "gn-jenga.jpg", "gn-drinks.jpg", "gn-boxes.jpg",
  "cine-garden.jpg", "cine-wide.jpg", "cine-popcorn.jpg", "cine-small.jpg",
].map((n) => `/images/${n}`);

type TierDraft = { key: string; id?: string; label: string; price: string; seats: string; description: string; perks: string };

let seq = 0;
const newKey = () => `t${++seq}`;

function toDraft(e?: AdminEvent) {
  // Abidjan = UTC+0 toute l'année : l'heure ISO est l'heure locale.
  const iso = e?.startISO ?? "";
  return {
    title: e?.title ?? "",
    subtitle: e?.subtitle ?? "",
    concepts: e?.concepts ?? ([] as ConceptSlug[]),
    date: iso.slice(0, 10),
    time: iso.slice(11, 16) || "19:00",
    doors: e?.doors ?? "19h00",
    endLabel: e?.endLabel ?? "00h00",
    venueName: e?.venue.name ?? "Lieu secret",
    city: e?.venue.city ?? "Abidjan",
    address: e?.venue.address ?? "",
    revealed: e?.venue.revealedAfterBooking ?? true,
    cover: e?.cover ?? COVERS[0],
    capacity: String(e?.capacity ?? 60),
    status: e?.status ?? ("draft" as EventStatus),
    note: e?.note ?? "",
    tiers: (e?.tiers.length
      ? e.tiers.map((t) => ({ key: newKey(), id: t.id, label: t.label, price: String(t.price), seats: String(t.seats), description: t.description, perks: t.perks.join("\n") }))
      : [
          { key: newKey(), label: "Pass Solo", price: "5000", seats: "1", description: "Une place pour toi.", perks: "" },
          { key: newKey(), label: "Pass Duo", price: "9000", seats: "2", description: "Deux places, à partager.", perks: "" },
        ]) as TierDraft[],
  };
}

export function EventForm({ event }: { event?: AdminEvent }) {
  const router = useRouter();
  const [d, setD] = useState(() => toDraft(event));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const sold = new Set(event?.soldTierIds ?? []);

  const set = <K extends keyof typeof d>(k: K, v: (typeof d)[K]) => {
    setSaved(false);
    setD((s) => ({ ...s, [k]: v }));
  };
  const setTier = (key: string, patch: Partial<TierDraft>) =>
    set("tiers", d.tiers.map((t) => (t.key === key ? { ...t, ...patch } : t)));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!d.date) return setError("Choisis la date de la soirée.");
    const input: EventInput = {
      title: d.title,
      subtitle: d.subtitle,
      concepts: d.concepts,
      startISO: `${d.date}T${d.time || "19:00"}:00.000Z`,
      doors: d.doors,
      endLabel: d.endLabel,
      venue: { name: d.venueName, city: d.city, address: d.address || undefined, revealedAfterBooking: d.revealed },
      cover: d.cover,
      capacity: Number(d.capacity),
      status: d.status,
      note: d.note || undefined,
      tiers: d.tiers.map((t) => ({
        id: t.id ?? "",
        label: t.label,
        price: Number(t.price),
        seats: Number(t.seats),
        description: t.description,
        perks: t.perks.split("\n").map((p) => p.trim()).filter(Boolean),
      })),
    };
    setBusy(true);
    try {
      if (event) {
        const next = await adminApi.updateEvent(event.id, input);
        setD(toDraft({ ...event, ...next }));
        setSaved(true);
        router.refresh();
      } else {
        const created = await adminApi.createEvent(input);
        router.replace(`/admin/evenements/${created.id}`);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!event || !confirm(`Supprimer définitivement « ${event.title} » ?`)) return;
    setBusy(true);
    try {
      await adminApi.deleteEvent(event.id);
      router.replace("/admin/evenements");
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <Card className="space-y-5 p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-paper">La soirée</h2>
          <Field label="Titre">{(id) => <Input id={id} value={d.title} onChange={(e) => set("title", e.target.value)} placeholder="Halloween" maxLength={80} required />}</Field>
          <Field label="Sous-titre" hint="Une phrase d'accroche, optionnelle.">
            {(id) => <Input id={id} value={d.subtitle} onChange={(e) => set("subtitle", e.target.value)} maxLength={140} />}
          </Field>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-paper">Univers</legend>
            <div className="flex flex-wrap gap-2">
              {CONCEPTS.map((c) => {
                const on = d.concepts.includes(c.slug);
                return (
                  <label key={c.slug} className={`flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors has-focus-visible:ring-2 has-focus-visible:ring-peach/40 ${on ? "border-peach bg-peach/10 text-paper" : "border-line-strong text-paper-muted hover:text-paper"}`}>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={on}
                      onChange={() => set("concepts", on ? d.concepts.filter((s) => s !== c.slug) : [...d.concepts, c.slug])}
                    />
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.accent }} />
                    {c.name}
                  </label>
                );
              })}
            </div>
          </fieldset>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date">{(id) => <Input id={id} type="date" value={d.date} onChange={(e) => set("date", e.target.value)} required />}</Field>
            <Field label="Heure de début" hint="Heure d'Abidjan.">{(id) => <Input id={id} type="time" value={d.time} onChange={(e) => set("time", e.target.value)} />}</Field>
            <Field label="Ouverture des portes">{(id) => <Input id={id} value={d.doors} onChange={(e) => set("doors", e.target.value)} placeholder="19h00" maxLength={20} />}</Field>
            <Field label="Fin (affichée)">{(id) => <Input id={id} value={d.endLabel} onChange={(e) => set("endLabel", e.target.value)} placeholder="00h00" maxLength={20} />}</Field>
          </div>
          <Field label="Note pour les invités" hint="Dress code, consignes… Affichée sur la page de réservation.">
            {(id) => <Textarea id={id} rows={2} value={d.note} onChange={(e) => set("note", e.target.value)} maxLength={400} />}
          </Field>
        </Card>

        <Card className="space-y-5 p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-paper">Le lieu</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom affiché">{(id) => <Input id={id} value={d.venueName} onChange={(e) => set("venueName", e.target.value)} maxLength={100} />}</Field>
            <Field label="Ville / quartier">{(id) => <Input id={id} value={d.city} onChange={(e) => set("city", e.target.value)} maxLength={60} />}</Field>
          </div>
          <Field label="Adresse exacte" hint="Jamais publiée sur le site : envoyée uniquement avec les billets payés.">
            {(id) => <Textarea id={id} rows={2} value={d.address} onChange={(e) => set("address", e.target.value)} maxLength={240} />}
          </Field>
          <label className="flex cursor-pointer items-start gap-3 text-sm text-paper-muted">
            <input type="checkbox" checked={d.revealed} onChange={(e) => set("revealed", e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#ffc4a0]" />
            Afficher « adresse communiquée après paiement » sur le site
          </label>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-paper">Passes & tarifs</h2>
              <p className="text-sm text-paper-muted">Prix en FCFA, multiples de 5 (Mobile Money).</p>
            </div>
            <Button size="sm" onClick={() => set("tiers", [...d.tiers, { key: newKey(), label: "", price: "", seats: "1", description: "", perks: "" }])}>
              <PlusIcon /> Ajouter
            </Button>
          </div>
          <ul className="mt-5 space-y-4">
            {d.tiers.map((t) => {
              const locked = !!t.id && sold.has(t.id);
              return (
                <li key={t.key} className="rounded-xl border border-line bg-night/50 p-4">
                  <div className="grid gap-3 sm:grid-cols-[1fr_140px_100px_auto] sm:items-end">
                    <Field label="Nom du pass">{(id) => <Input id={id} value={t.label} onChange={(e) => setTier(t.key, { label: e.target.value })} placeholder="Pass Solo" maxLength={60} />}</Field>
                    <Field label="Prix (FCFA)">{(id) => <Input id={id} inputMode="numeric" value={t.price} onChange={(e) => setTier(t.key, { price: e.target.value.replace(/\D/g, "") })} />}</Field>
                    <Field label="Places">
                      {(id) => <Input id={id} type="number" min={1} max={10} value={t.seats} disabled={locked} title={locked ? "Déjà vendu : non modifiable" : undefined} onChange={(e) => setTier(t.key, { seats: e.target.value })} />}
                    </Field>
                    <Button
                      variant="danger"
                      size="sm"
                      className="h-[46px]"
                      disabled={locked || d.tiers.length === 1}
                      aria-label={`Retirer ${t.label || "ce pass"}`}
                      title={locked ? "Déjà vendu : passe l'édition en annulée plutôt" : undefined}
                      onClick={() => set("tiers", d.tiers.filter((x) => x.key !== t.key))}
                    >
                      <TrashIcon />
                    </Button>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <Field label="Description">{(id) => <Input id={id} value={t.description} onChange={(e) => setTier(t.key, { description: e.target.value })} maxLength={240} />}</Field>
                    <Field label="Avantages" hint="Un par ligne.">{(id) => <Textarea id={id} rows={2} value={t.perks} onChange={(e) => setTier(t.key, { perks: e.target.value })} />}</Field>
                  </div>
                  {locked && <p className="mt-2 text-xs text-amber-200">Déjà vendu : le nombre de places de ce pass est figé.</p>}
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <aside className="space-y-6 xl:sticky xl:top-8 xl:self-start">
        <Card className="space-y-5 p-5 sm:p-6">
          <Field label="Statut" hint="« En ligne » : visible et réservable sur le site.">
            {(id) => (
              <Select id={id} value={d.status} onChange={(e) => set("status", e.target.value as EventStatus)}>
                <option value="draft">Brouillon</option>
                <option value="published">En ligne</option>
                <option value="cancelled">Annulée</option>
              </Select>
            )}
          </Field>
          <Field label="Capacité totale" hint={event ? `${event.seatsTaken} place(s) déjà réservée(s).` : "Nombre de personnes maximum."}>
            {(id) => <Input id={id} type="number" min={Math.max(1, event?.seatsTaken ?? 1)} max={5000} value={d.capacity} onChange={(e) => set("capacity", e.target.value)} />}
          </Field>
          {error && <ErrorNote>{error}</ErrorNote>}
          {saved && <p role="status" className="rounded-xl bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">Modifications enregistrées.</p>}
          <Button type="submit" variant="primary" className="w-full" disabled={busy}>
            {busy ? "Enregistrement…" : event ? "Enregistrer" : "Créer l'édition"}
          </Button>
          {event && (
            <Button variant="danger" size="sm" className="w-full" disabled={busy} onClick={remove}>
              <TrashIcon /> Supprimer
            </Button>
          )}
        </Card>

        <Card className="p-5 sm:p-6">
          <p className="text-sm font-semibold text-paper">Visuel</p>
          <div className="relative mt-3 aspect-[16/10] w-full overflow-hidden rounded-xl bg-night">
            <Image src={d.cover} alt="" fill sizes="340px" unoptimized={d.cover.startsWith("http")} className="object-cover" />
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2" role="radiogroup" aria-label="Choisir un visuel">
            {COVERS.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={d.cover === c}
                aria-label={c.replace("/images/", "")}
                onClick={() => set("cover", c)}
                className={`aspect-square cursor-pointer overflow-hidden rounded-lg ring-2 transition ${d.cover === c ? "ring-peach" : "ring-transparent opacity-70 hover:opacity-100"}`}
              >
                <Image src={c} alt="" width={80} height={80} sizes="80px" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
          <Field label="Ou une URL d'image (https)" className="mt-4">
            {(id) => <Input id={id} type="url" value={COVERS.includes(d.cover) ? "" : d.cover} placeholder="https://…" onChange={(e) => set("cover", e.target.value || COVERS[0])} />}
          </Field>
        </Card>
      </aside>
    </form>
  );
}
