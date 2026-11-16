"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { type EventEdition, type Gender, type PackChoice, GENDER_LABEL, formatPrice, paymentFee, stylesFor } from "@/lib/catalog";
import { createOrder, type PaymentMethod } from "@/lib/api";
import { PAYMENT_METHODS, PaymentLogo } from "@/components/PaymentBadges";
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
  // droit à l'image : la soirée est filmée, accord obligatoire avant de payer
  const [consent, setConsent] = useState(false);
  // conditions de vente + politique de confidentialité (loi 2013-450 art. 14 : consentement exprès)
  const [terms, setTerms] = useState(false);
  // pack offert : un choix (modèle + taille) par place, gardé même si on retire puis remet une place
  const [packs, setPacks] = useState<PackChoice[]>([]);
  // participants : sexe (quotas filles / garçons) et nom, un par place
  const [people, setPeople] = useState<{ name: string; gender: Gender | "" }[]>([]);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  // commande envoyée chez l'opérateur : sur téléphone, le lien ouvre l'appli
  // Wave / Orange Money et cette page reste derrière, sans être redirigée
  const [paying, setPaying] = useState<string | null>(null);
  const confirmUrl = paying ? `/reserver/confirmation/${paying}` : null;

  useEffect(() => {
    if (!confirmUrl) return;
    let left = false;
    // retour sur le navigateur après l'appli de paiement → page de confirmation
    // (elle vérifie le statut du paiement et affiche les billets)
    const onVisibility = () => {
      if (document.visibilityState === "hidden") left = true;
      else if (left) window.location.assign(confirmUrl);
    };
    // page restaurée depuis le cache du navigateur (bouton retour)
    const onPageShow = (e: PageTransitionEvent) => e.persisted && window.location.assign(confirmUrl);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [confirmUrl]);

  const seats = event.tiers.reduce((s, t) => s + (qty[t.id] ?? 0) * t.seats, 0);
  const subtotal = event.tiers.reduce((s, t) => s + (qty[t.id] ?? 0) * t.price, 0);
  // frais de paiement Mobile Money à la charge du client (calcul identique au serveur)
  const fee = paymentFee(subtotal, event.paymentFee);
  const total = subtotal + fee;
  const pack = event.pack;
  const seatPacks = useMemo(() => Array.from({ length: pack ? seats : 0 }, (_, i) => packs[i] ?? { style: "", size: "" }), [pack, seats, packs]);
  const setPack = (i: number, patch: Partial<PackChoice>) =>
    setPacks((p) => {
      const next = [...p];
      next[i] = { ...(next[i] ?? { style: "", size: "" }), ...patch };
      return next;
    });
  const genders = event.genders;
  const teams = event.teams?.length ? event.teams : undefined;
  const askPeople = !!genders || !!teams;
  const seatPeople = useMemo(() => Array.from({ length: askPeople ? seats : 0 }, (_, i) => people[i] ?? { name: "", gender: "" as const }), [askPeople, seats, people]);
  const setPerson = (i: number, patch: Partial<{ name: string; gender: Gender }>) => {
    setPeople((p) => {
      const next = [...p];
      next[i] = { ...(next[i] ?? { name: "", gender: "" }), ...patch };
      return next;
    });
    // modèles du pack selon le sexe (ex. « Crop top (fille) ») : on retire un
    // modèle devenu interdit, et on choisit d'office s'il n'en reste qu'un
    if (patch.gender && pack) {
      const allowed = stylesFor(pack.styles, patch.gender);
      const current = packs[i]?.style;
      if (allowed.length === 1) setPack(i, { style: allowed[0] });
      else if (current && !allowed.includes(current)) setPack(i, { style: "" });
    }
  };
  const chosen = (g: Gender) => seatPeople.filter((p) => p.gender === g).length;
  const left = (g: Gender) => event.remainingByGender?.[g] ?? genders?.[g] ?? 0;
  /** étape « participants » (sexe, nom, pack) entre les passes et les infos */
  const perSeat = askPeople || !!pack;
  const n = perSeat ? { infos: 3, pay: 4 } : { infos: 2, pay: 3 };

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (seats === 0) e.items = "Choisis au moins un pass.";
    if (seats > maxSeats)
      e.items = maxSeats < MAX_SEATS ? `Il ne reste que ${maxSeats} place${maxSeats > 1 ? "s" : ""}.` : `Pas plus de ${MAX_SEATS} places par commande.`;
    if (name.trim().length < 2) e.name = "Indique ton nom et prénom.";
    if (!phoneOk(phone)) e.phone = "Numéro à 10 chiffres, ex. 07 07 07 07 07.";
    if (!email.trim()) e.email = "Indique ton e-mail : tes billets y sont envoyés.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = "Adresse e-mail invalide.";
    if (!method) e.method = "Choisis Wave ou Orange Money.";
    if (pack && seatPacks.some((p) => !p.style || !p.size)) e.packs = `Choisis le modèle et la taille pour ${seats > 1 ? "chaque place" : "ton pack"}.`;
    else if (pack && seatPacks.some((p, i) => !stylesFor(pack.styles, seatPeople[i]?.gender).includes(p.style)))
      e.packs = "Ce modèle n'est pas proposé pour ce choix fille / garçon : choisis-en un autre.";
    if (genders) {
      if (seatPeople.some((p) => !p.gender)) e.people = `Indique fille ou garçon pour ${seats > 1 ? "chaque place" : "ta place"}.`;
      for (const g of ["fille", "garcon"] as const) {
        const l = event.remainingByGender?.[g] ?? genders[g];
        if (seatPeople.filter((p) => p.gender === g).length > l)
          e.people = l === 0 ? `Plus de place pour les ${g === "fille" ? "filles" : "garçons"}.` : `Il ne reste que ${l} place${l > 1 ? "s" : ""} pour les ${g === "fille" ? "filles" : "garçons"}.`;
      }
    }
    if (!terms) e.terms = "Coche la case pour accepter les conditions de vente et la politique de confidentialité.";
    if (!consent) e.consent = "Coche la case pour continuer : la soirée est filmée et photographiée.";
    return e;
  }, [seats, maxSeats, name, phone, email, method, pack, seatPacks, genders, seatPeople, event.remainingByGender, consent, terms]);

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
        imageConsent: true,
        termsAccepted: true,
        ...(pack ? { packs: seatPacks } : {}),
        ...(askPeople
          ? { participants: seatPeople.map((p, i) => ({ ...(i > 0 ? { name: p.name.trim() } : {}), ...(p.gender ? { gender: p.gender } : {}) })) }
          : {}),
      });
      try {
        sessionStorage.setItem("jey:last-order", res.order.id);
      } catch {
        /* navigation privée */
      }
      setPaying(res.order.id);
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

        {/* 2 — participants : sexe, nom, pack (éditions qui le demandent) */}
        {perSeat && seats > 0 && (
          <fieldset className="rounded-[1.4rem] border border-line bg-night-2 p-6 sm:p-8">
            <legend className="sr-only">Participants</legend>
            <StepTitle
              n={2}
              title={seats > 1 ? "Les participants" : askPeople ? "Ta place" : "Ton pack"}
              hint={[
                genders ? "Places réparties entre filles et garçons." : "",
                pack ? `${pack.label} offert avec chaque place.` : "",
              ]
                .filter(Boolean)
                .join(" ")}
            />
            {teams && (
              <div className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-night px-4 py-3 text-sm text-paper-muted">
                <span>Équipe tirée au sort au paiement :</span>
                {teams.map((t) => (
                  <span key={t.name} className="inline-flex items-center gap-1.5 font-semibold text-paper">
                    <span className="h-3 w-3 rounded-full" style={{ background: t.color }} aria-hidden /> {t.name}
                  </span>
                ))}
              </div>
            )}
            <ul className="mt-6 space-y-4">
              {Array.from({ length: seats }, (_, i) => {
                const p = seatPacks[i];
                const who = seatPeople[i];
                return (
                  <li key={i} className="space-y-3 rounded-2xl border border-line p-4 sm:p-5">
                    {seats > 1 && <p className="text-sm font-semibold text-paper">Place {i + 1}{i === 0 ? " (toi)" : ""}</p>}
                    {askPeople && i > 0 && (
                      <input
                        value={who.name}
                        onChange={(e) => setPerson(i, { name: e.target.value })}
                        autoComplete="off"
                        aria-label={`Nom et prénom de l'invité (facultatif) — place ${i + 1}`}
                        placeholder="Nom de l'invité (facultatif)"
                        className={inputCls(false)}
                      />
                    )}
                    {genders && (
                      <div
                        className="flex flex-wrap items-center gap-2 outline-none"
                        role="radiogroup"
                        aria-label={`Fille ou garçon — place ${i + 1}`}
                        tabIndex={-1}
                        aria-invalid={!!show("people") && !who.gender}
                      >
                        {(["fille", "garcon"] as const).map((g) => {
                          const full = who.gender !== g && chosen(g) >= left(g);
                          return (
                            <Chip key={g} active={who.gender === g} disabled={full} onClick={() => setPerson(i, { gender: g })}>
                              {GENDER_LABEL[g]}
                              {full && <span className="ml-1.5 text-xs font-normal">· complet</span>}
                            </Chip>
                          );
                        })}
                      </div>
                    )}
                    {pack && p && (
                      <>
                        <div
                          className="flex flex-wrap gap-2 outline-none"
                          role="radiogroup"
                          aria-label={`Modèle — place ${i + 1}`}
                          tabIndex={-1}
                          aria-invalid={!!show("packs") && (!p.style || !p.size)}
                        >
                          {stylesFor(pack.styles, who?.gender).map((s) => (
                            <Chip key={s} active={p.style === s} onClick={() => setPack(i, { style: s })}>
                              {s}
                            </Chip>
                          ))}
                        </div>
                        <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label={`Taille — place ${i + 1}`}>
                          <span className="mr-1 text-xs text-paper-dim">Taille</span>
                          {pack.sizes.map((s) => (
                            <Chip key={s} small active={p.size === s} onClick={() => setPack(i, { size: s })}>
                              {s}
                            </Chip>
                          ))}
                        </div>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
            {show("people") && <FieldError>{errors.people}</FieldError>}
            {show("packs") && <FieldError>{errors.packs}</FieldError>}
          </fieldset>
        )}

        {/* infos */}
        <fieldset className="rounded-[1.4rem] border border-line bg-night-2 p-6 sm:p-8">
          <legend className="sr-only">Tes informations</legend>
          <StepTitle n={n.infos} title="Tes infos" hint="Ta commande est liée à ce numéro." />
          <p className="mt-3 text-xs leading-relaxed text-paper-muted">
            Ces informations servent uniquement à ta commande : paiement, envoi de tes billets et infos pratiques sur la soirée. Elles ne sont
            ni vendues ni utilisées pour de la publicité.{" "}
            <Link href="/confidentialite" target="_blank" className="underline underline-offset-2 hover:text-peach">
              Comment nous protégeons tes données
            </Link>
          </p>
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
            <Field label="E-mail" hint="Tes billets (QR codes) te sont envoyés à cette adresse." error={show("email") ? errors.email : undefined}>
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
          <StepTitle n={n.pay} title="Paiement" hint="Directement depuis ton téléphone." />
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
                    active ? "border-transparent bg-paper text-cacao shadow-[0_14px_40px_-16px_rgba(227,9,43,0.5)]" : "border-line hover:border-line-strong"
                  }`}
                >
                  <PaymentLogo id={m.id} size={48} className="rounded-xl" />
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
            {fee > 0 && (
              <li className="flex justify-between gap-4">
                <span>Frais de paiement {methodName ?? "Mobile Money"}</span>
                <span className="font-semibold tabular-nums">{formatPrice(fee)}</span>
              </li>
            )}
            {perSeat &&
              Array.from({ length: seats }, (_, i) => {
                const p = seatPacks[i];
                const who = seatPeople[i];
                const label = askPeople ? (i === 0 ? name.trim() || "Toi" : who?.name.trim() || `Place ${i + 1}`) : `${pack?.label}${seats > 1 ? ` ${i + 1}` : ""}`;
                const bits = [who?.gender ? GENDER_LABEL[who.gender] : "", p?.style && p.size ? `${p.style} · ${p.size}` : ""].filter(Boolean);
                return (
                  <li key={`seat-${i}`} className="flex justify-between gap-4 text-cacao-muted">
                    <span className="truncate">{label}</span>
                    <span className="text-right">{bits.length ? bits.join(" · ") : "à compléter"}</span>
                  </li>
                );
              })}
          </ul>
          <div className="mt-5 flex items-baseline justify-between border-t border-cacao-line pt-5">
            <span className="text-sm">
              Total · {seats} place{seats > 1 ? "s" : ""}
            </span>
            <span className="t-display text-4xl font-semibold tabular-nums">{formatPrice(total)}</span>
          </div>

          <label className={`mt-6 flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm leading-relaxed transition-colors ${show("terms") ? "border-wine bg-wine/5" : "border-cacao-line"}`}>
            <input
              type="checkbox"
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
              aria-invalid={!!show("terms")}
              aria-describedby={show("terms") ? "terms-error" : undefined}
              className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-wine"
            />
            <span>
              J&apos;accepte les{" "}
              <Link href="/conditions" target="_blank" className="font-semibold underline underline-offset-2">
                conditions de vente
              </Link>{" "}
              et le traitement de mes données selon la{" "}
              <Link href="/confidentialite" target="_blank" className="font-semibold underline underline-offset-2">
                politique de confidentialité
              </Link>
              .
            </span>
          </label>
          {show("terms") && (
            <p id="terms-error" className="mt-2 text-xs font-medium text-wine">
              {errors.terms}
            </p>
          )}

          <label className={`mt-3 flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm leading-relaxed transition-colors ${show("consent") ? "border-wine bg-wine/5" : "border-cacao-line"}`}>
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              aria-invalid={!!show("consent")}
              aria-describedby={show("consent") ? "consent-error" : undefined}
              className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-wine"
            />
            <span>
              <strong className="font-semibold">Droit à l&apos;image.</strong> La soirée est filmée et photographiée. J&apos;accepte, pour moi
              {seats > 1 ? " et les personnes de ma réservation (que j'ai prévenues)" : ""}, d&apos;apparaître sur ces images et qu&apos;elles
              soient publiées par Les Soirées chez Jeynnifer (réseaux sociaux, site, vidéos). Je peux demander le retrait d&apos;une image à tout
              moment.
            </span>
          </label>
          {show("consent") && (
            <p id="consent-error" className="mt-2 text-xs font-medium text-wine">
              {errors.consent}
            </p>
          )}

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
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-cream/30 border-t-cream" />{" "}
                {paying ? "Paiement en cours…" : "Préparation du paiement…"}
              </>
            ) : (
              <>
                <LockIcon className="h-4 w-4" /> {methodName ? `Payer avec ${methodName}` : "Payer"} · {formatPrice(total)}
              </>
            )}
          </button>
          {confirmUrl && (
            <a
              href={confirmUrl}
              className="mt-3 flex w-full items-center justify-center rounded-full border border-cacao px-6 py-3.5 text-[0.95rem] font-semibold text-cacao transition-colors hover:bg-cacao hover:text-cream"
            >
              J&apos;ai payé : voir mes billets
            </a>
          )}
          <p className="mt-4 text-center text-xs leading-relaxed text-cacao-muted">
            Tu valides le paiement sur ton téléphone. Ton billet s&apos;affiche dès la confirmation{teams ? ", avec ton équipe" : ""} et t&apos;est envoyé par e-mail.
          </p>
        </div>
      </aside>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
function Chip({ active, small, disabled, onClick, children }: { active: boolean; small?: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-full border font-semibold transition-colors ${small ? "min-w-11 px-3 py-2 text-sm" : "px-4 py-2.5 text-sm"} ${
        active ? "border-transparent bg-paper text-cacao" : "border-line-strong text-paper-muted hover:border-peach hover:text-paper"
      } disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line-strong disabled:hover:text-paper-muted`}
    >
      {children}
    </button>
  );
}

function StepTitle({ n, title, hint }: { n: number; title: string; hint?: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">{n}</span>
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
