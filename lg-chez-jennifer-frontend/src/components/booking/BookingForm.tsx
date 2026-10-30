"use client";

import { useMemo, useState } from "react";
import { type EventEdition, formatPrice } from "@/lib/catalog";
import { createOrder, type PaymentMethod } from "@/lib/api";
import { PAYMENT_METHODS } from "@/components/PaymentBadges";
import { CheckIcon, LockIcon, MinusIcon, PlusIcon } from "@/components/icons";

/** Même règle que le backend : numéro ivoirien à 10 chiffres. */
function phoneOk(raw: string) {
  const d = raw.replace(/\D/g, "");
  const local = d.startsWith("225") && d.length === 13 ? d.slice(3) : d;
  return /^(01|05|07|21|25|27)\d{8}$/.test(local);
}

function formatPhone(raw: string) {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("225") && d.length > 10) d = d.slice(3);
  return d.slice(0, 10).replace(/(\d{2})(?=\d)/g, "$1 ");
}

const MAX_SEATS = 10;

export function BookingForm({ event }: { event: EventEdition }) {
  const maxSeats = Math.min(MAX_SEATS, event.remaining);
  const [qty, setQty] = useState<Record<string, number>>(() =>
    Object.fromEntries(event.tiers.map((t, i) => [t.id, i === 0 ? 1 : 0])),
  );
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const seats = event.tiers.reduce((s, t) => s + (qty[t.id] ?? 0) * t.seats, 0);
  const total = event.tiers.reduce((s, t) => s + (qty[t.id] ?? 0) * t.price, 0);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (seats === 0) e.items = "Choisis au moins un pass.";
    if (seats > maxSeats)
      e.items = maxSeats < MAX_SEATS ? `Il ne reste que ${maxSeats} place${maxSeats > 1 ? "s" : ""}.` : `Pas plus de ${MAX_SEATS} places par commande.`;
    if (name.trim().length < 2) e.name = "Indique ton nom et prénom.";
    if (!phoneOk(phone)) e.phone = "Numéro à 10 chiffres, ex. 07 07 07 07 07.";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Adresse e-mail invalide.";
    if (!method) e.method = "Choisis Wave ou Orange Money.";
    return e;
  }, [seats, maxSeats, name, phone, email, method]);

  const show = (k: string) => (touched[k] || touched.submit) && errors[k];

  const step = (id: string, delta: number) =>
    setQty((q) => ({ ...q, [id]: Math.max(0, Math.min(MAX_SEATS, (q[id] ?? 0) + delta)) }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched((t) => ({ ...t, submit: true }));
    setServerError(null);
    if (Object.keys(errors).length) {
      document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
      return;
    }
    setSubmitting(true);
    try {
      const res = await createOrder({
        eventId: event.id,
        items: event.tiers.map((t) => ({ tierId: t.id, quantity: qty[t.id] ?? 0 })).filter((i) => i.quantity > 0),
        buyer: { name: name.trim(), phone, ...(email ? { email: email.trim() } : {}) },
        paymentMethod: method!,
      });
      try {
        sessionStorage.setItem("jey:last-order", res.order.id);
      } catch {
        /* navigation privée */
      }
      window.location.assign(res.payment.url);
    } catch (err) {
      setServerError((err as Error).message);
      setSubmitting(false);
    }
  }

  const methodName = PAYMENT_METHODS.find((m) => m.id === method)?.name;

  return (
    <form onSubmit={submit} noValidate className="grid gap-8 lg:grid-cols-[1fr_380px] lg:gap-10">
      <div className="space-y-6">
        {/* 1 — passes */}
        <fieldset className="rounded-[1.4rem] border border-line bg-night-2 p-6 sm:p-8">
          <legend className="sr-only">Tes passes</legend>
          <StepTitle n={1} title="Tes passes" />
          {event.remaining <= 10 && (
            <p className="mt-3 text-sm font-semibold text-ember">
              Plus que {event.remaining} place{event.remaining > 1 ? "s" : ""} pour cette soirée.
            </p>
          )}
          <ul className="mt-6 space-y-3">
            {event.tiers.map((t) => {
              const n = qty[t.id] ?? 0;
              return (
                <li
                  key={t.id}
                  className={`flex flex-col gap-4 rounded-2xl border p-5 transition-colors sm:flex-row sm:items-center sm:justify-between ${
                    n > 0 ? "border-peach/50 bg-peach/[0.06]" : "border-line"
                  }`}
                >
                  <div>
                    <p className="t-display text-2xl text-paper">
                      {t.label} <span className="ml-1 font-sans text-base font-semibold text-peach">{formatPrice(t.price)}</span>
                    </p>
                    <p className="mt-1 text-sm text-paper-muted">{t.description}</p>
                    <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-paper-dim">
                      {t.perks.map((p) => (
                        <li key={p} className="flex items-center gap-1.5">
                          <CheckIcon className="h-3.5 w-3.5 text-peach" /> {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex items-center gap-3 self-end sm:self-auto" role="group" aria-label={`Nombre de ${t.label}`}>
                    <button type="button" onClick={() => step(t.id, -1)} disabled={n === 0} aria-label={`Retirer un ${t.label}`} className="flex h-11 w-11 items-center justify-center rounded-full border border-line-strong text-paper transition-colors hover:border-peach disabled:opacity-30">
                      <MinusIcon className="h-4 w-4" />
                    </button>
                    <output aria-live="polite" className="w-6 text-center text-xl font-semibold tabular-nums text-paper">{n}</output>
                    <button type="button" onClick={() => step(t.id, 1)} disabled={seats + t.seats > maxSeats} aria-label={`Ajouter un ${t.label}`} className="flex h-11 w-11 items-center justify-center rounded-full border border-line-strong text-paper transition-colors hover:border-peach disabled:opacity-30">
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          {show("items") && <FieldError>{errors.items}</FieldError>}
        </fieldset>

        {/* 2 — infos */}
        <fieldset className="rounded-[1.4rem] border border-line bg-night-2 p-6 sm:p-8">
          <legend className="sr-only">Tes informations</legend>
          <StepTitle n={2} title="Tes infos" hint="Ton billet est lié à ce numéro." />
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Field label="Nom et prénom" error={show("name") ? errors.name : undefined} className="sm:col-span-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                autoComplete="name"
                aria-invalid={!!show("name")}
                placeholder="Awa Koné"
                className={inputCls(!!show("name"))}
              />
            </Field>
            <Field label="Téléphone (Mobile Money)" error={show("phone") ? errors.phone : undefined}>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-paper-dim">+225</span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                  inputMode="tel"
                  autoComplete="tel-national"
                  aria-invalid={!!show("phone")}
                  placeholder="07 07 07 07 07"
                  className={`${inputCls(!!show("phone"))} pl-16`}
                />
              </div>
            </Field>
            <Field label="E-mail (facultatif)" hint="Pour recevoir ton billet aussi par e-mail." error={show("email") ? errors.email : undefined}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                autoComplete="email"
                aria-invalid={!!show("email")}
                placeholder="awa@exemple.com"
                className={inputCls(!!show("email"))}
              />
            </Field>
          </div>
        </fieldset>

        {/* 3 — paiement */}
        <fieldset className="rounded-[1.4rem] border border-line bg-night-2 p-6 sm:p-8">
          <legend className="sr-only">Moyen de paiement</legend>
          <StepTitle n={3} title="Paiement" hint="Directement depuis ton téléphone." />
          <div className="mt-6 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Moyen de paiement" aria-invalid={!!show("method")}>
            {PAYMENT_METHODS.map((m) => {
              const active = method === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setMethod(m.id)}
                  className={`relative flex items-center gap-4 rounded-2xl border p-5 text-left transition-all duration-300 ${
                    active ? "border-transparent bg-paper text-cacao shadow-[0_14px_40px_-16px_rgba(246,201,167,0.5)]" : "border-line hover:border-line-strong"
                  }`}
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-black" style={{ background: m.color, color: m.ink }}>
                    {m.id === "wave" ? "W" : "OM"}
                  </span>
                  <span>
                    <span className={`block text-lg font-bold ${active ? "text-cacao" : "text-paper"}`}>{m.name}</span>
                    <span className={`block text-xs ${active ? "text-cacao-muted" : "text-paper-dim"}`}>{m.hint}</span>
                  </span>
                  <span className={`absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full border ${active ? "border-cacao bg-cacao text-peach" : "border-line-strong"}`}>
                    {active && <CheckIcon className="h-3 w-3" />}
                  </span>
                </button>
              );
            })}
          </div>
          {show("method") && <FieldError>{errors.method}</FieldError>}
        </fieldset>
      </div>

      {/* récapitulatif */}
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-[1.4rem] bg-cream p-6 text-cacao sm:p-8">
          <p className="t-label text-cacao-muted">Récapitulatif</p>
          <ul className="mt-5 space-y-2 text-sm">
            {event.tiers
              .filter((t) => (qty[t.id] ?? 0) > 0)
              .map((t) => (
                <li key={t.id} className="flex justify-between gap-4">
                  <span>
                    {qty[t.id]} × {t.label}
                  </span>
                  <span className="font-semibold tabular-nums">{formatPrice(qty[t.id] * t.price)}</span>
                </li>
              ))}
            {seats === 0 && <li className="text-cacao-muted">Aucun pass sélectionné.</li>}
          </ul>
          <div className="mt-5 flex items-baseline justify-between border-t border-cacao-line pt-5">
            <span className="text-sm">
              Total · {seats} place{seats > 1 ? "s" : ""}
            </span>
            <span className="t-display text-4xl font-semibold tabular-nums">{formatPrice(total)}</span>
          </div>

          {serverError && (
            <p role="alert" className="mt-5 rounded-xl bg-wine/10 px-4 py-3 text-sm text-wine">
              {serverError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-full bg-cacao px-6 py-4 text-[0.95rem] font-semibold text-cream transition-colors hover:bg-wine disabled:cursor-wait disabled:opacity-70"
          >
            {submitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-cream/30 border-t-cream" /> Préparation du paiement…
              </>
            ) : (
              <>
                <LockIcon className="h-4 w-4" /> {methodName ? `Payer avec ${methodName}` : "Payer"} · {formatPrice(total)}
              </>
            )}
          </button>
          <p className="mt-4 text-center text-xs leading-relaxed text-cacao-muted">
            Tu valides le paiement sur ton téléphone. Ton billet s&apos;affiche dès la confirmation.
          </p>
        </div>
      </aside>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
function StepTitle({ n, title, hint }: { n: number; title: string; hint?: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-peach text-sm font-bold text-cacao">{n}</span>
      <div>
        <p className="t-display text-3xl text-paper">{title}</p>
        {hint && <p className="text-sm text-paper-dim">{hint}</p>}
      </div>
    </div>
  );
}

function Field({ label, hint, error, className = "", children }: { label: string; hint?: string; error?: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-medium text-paper">{label}</span>
      {children}
      {error ? <FieldError>{error}</FieldError> : hint ? <span className="mt-1.5 block text-xs text-paper-dim">{hint}</span> : null}
    </label>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return (
    <span role="alert" className="mt-2 block text-sm text-[#ff9b8a]">
      {children}
    </span>
  );
}

function inputCls(invalid: boolean) {
  return `w-full rounded-xl border bg-night px-4 py-3.5 text-paper placeholder:text-paper-dim/60 outline-none transition-colors focus:border-peach ${
    invalid ? "border-[#ff9b8a]/70" : "border-line-strong"
  }`;
}
