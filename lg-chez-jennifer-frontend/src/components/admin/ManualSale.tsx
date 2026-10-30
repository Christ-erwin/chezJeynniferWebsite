"use client";

import { useState } from "react";
import { adminApi, METHOD_LABEL, type AdminEvent, type AdminOrder, type AdminPaymentMethod } from "@/lib/admin-api";
import { Button, ErrorNote, fcfa, Field, Input, Overlay, Select } from "./ui";

/**
 * Vente enregistrée à la main (espèces à l'entrée, transfert Wave direct,
 * réservation WhatsApp…). La commande est créée payée et les billets émis.
 */
export function ManualSale({
  events,
  defaultEventId,
  onClose,
  onDone,
}: {
  events: AdminEvent[];
  defaultEventId?: string;
  onClose: () => void;
  onDone: (o: AdminOrder) => void;
}) {
  const [eventId, setEventId] = useState(defaultEventId && events.some((e) => e.id === defaultEventId) ? defaultEventId : (events[0]?.id ?? ""));
  const [qty, setQty] = useState<Record<string, number>>({});
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [method, setMethod] = useState<AdminPaymentMethod>("cash");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const event = events.find((e) => e.id === eventId);
  const total = event?.tiers.reduce((s, t) => s + (qty[t.id] ?? 0) * t.price, 0) ?? 0;
  const seats = event?.tiers.reduce((s, t) => s + (qty[t.id] ?? 0) * t.seats, 0) ?? 0;
  const left = event ? event.capacity - event.seatsTaken : 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!event) return;
    setBusy(true);
    setError(null);
    try {
      const order = await adminApi.createManualOrder({
        eventId,
        items: event.tiers.map((t) => ({ tierId: t.id, quantity: qty[t.id] ?? 0 })).filter((i) => i.quantity > 0),
        buyer: { name: name.trim(), phone, ...(email.trim() ? { email: email.trim() } : {}) },
        method,
      });
      onDone(order);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <Overlay title="Vente sur place" onClose={onClose}>
      {events.length === 0 ? (
        <p className="text-paper-muted">Aucune édition ouverte à la vente.</p>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-5">
          <Field label="Édition" hint={event ? `${left} place${left > 1 ? "s" : ""} encore disponible${left > 1 ? "s" : ""}.` : undefined}>
            {(id) => (
              <Select id={id} value={eventId} onChange={(e) => { setEventId(e.target.value); setQty({}); }}>
                {events.map((e) => <option key={e.id} value={e.id}>{e.title} · {e.startISO.slice(0, 10)}</option>)}
              </Select>
            )}
          </Field>

          {event && (
            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-paper">Passes</legend>
              <ul className="space-y-2">
                {event.tiers.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-2.5">
                    <span className="text-sm text-paper">{t.label} <span className="text-paper-dim">· {fcfa(t.price)}</span></span>
                    <div className="w-20 shrink-0">
                    <Input
                      type="number"
                      min={0}
                      max={50}
                      aria-label={`Quantité ${t.label}`}
                      value={qty[t.id] ?? 0}
                      onChange={(e) => setQty((q) => ({ ...q, [t.id]: Math.max(0, Math.min(50, Number(e.target.value) || 0)) }))}
                      className="text-center"
                    />
                    </div>
                  </li>
                ))}
              </ul>
            </fieldset>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom du client">{(id) => <Input id={id} value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />}</Field>
            <Field label="Téléphone">{(id) => <Input id={id} type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07 07 07 07 07" />}</Field>
            <Field label="E-mail (optionnel)" className="sm:col-span-2">{(id) => <Input id={id} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />}</Field>
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-paper">Encaissé par</legend>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(METHOD_LABEL) as AdminPaymentMethod[]).map((m) => (
                <label key={m} className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-medium has-focus-visible:ring-2 has-focus-visible:ring-peach/40 ${method === m ? "border-peach bg-peach/10 text-paper" : "border-line-strong text-paper-muted"}`}>
                  <input type="radio" name="method" className="sr-only" checked={method === m} onChange={() => setMethod(m)} />
                  {METHOD_LABEL[m]}
                </label>
              ))}
            </div>
          </fieldset>

          {error && <ErrorNote>{error}</ErrorNote>}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
            <p className="text-paper-muted">
              {seats} place{seats > 1 ? "s" : ""} · <strong className="text-lg text-peach">{fcfa(total)}</strong>
            </p>
            <Button type="submit" variant="primary" disabled={busy || seats === 0}>
              {busy ? "Enregistrement…" : "Enregistrer la vente"}
            </Button>
          </div>
          <p className="text-xs text-paper-dim">La commande est enregistrée comme payée et les billets sont émis immédiatement.</p>
        </form>
      )}
    </Overlay>
  );
}
