"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { adminApi, METHOD_LABEL, ORDER_STATUS, type AdminEvent, type AdminOrder, type AdminOrderStatus } from "@/lib/admin-api";
import { useLoad } from "@/components/admin/useLoad";
import { ManualSale } from "@/components/admin/ManualSale";
import { OrderPanel } from "@/components/admin/OrderPanel";
import { Badge, Button, Card, dateTime, DownloadIcon, Empty, ErrorNote, fcfa, Input, PageHead, PlusIcon, SearchIcon, Select, Skeleton } from "@/components/admin/ui";

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <Orders />
    </Suspense>
  );
}

function Orders() {
  const router = useRouter();
  const sp = useSearchParams();
  const eventId = sp.get("eventId") ?? "";
  const status = sp.get("status") ?? "";
  const selected = sp.get("o");
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [qLive, setQLive] = useState(q);
  const [selling, setSelling] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // recherche : on attend que la saisie se calme
  useEffect(() => {
    const t = setTimeout(() => setQLive(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const filter = { eventId, status, q: qLive };
  const events = useLoad(adminApi.events);
  const orders = useLoad(() => adminApi.orders(filter), JSON.stringify(filter));

  const setParam = (k: string, v: string | null) => {
    const p = new URLSearchParams(sp.toString());
    if (v) p.set(k, v);
    else p.delete(k);
    router.replace(`/admin/commandes${p.size ? `?${p}` : ""}`, { scroll: false });
  };

  const list = orders.data ?? [];
  const paid = list.filter((o) => o.status === "paid");
  const current = selected ? list.find((o) => o.id === selected) : undefined;

  const onChanged = (o: AdminOrder) => {
    orders.reload();
    setParam("o", o.id);
  };

  return (
    <div className="space-y-6">
      <PageHead
        title="Commandes"
        sub={
          orders.data
            ? `${list.length} commande${list.length > 1 ? "s" : ""} · ${paid.length} payée${paid.length > 1 ? "s" : ""} · ${fcfa(paid.reduce((s, o) => s + o.total, 0))}`
            : "Chargement…"
        }
        actions={
          <>
            <Button
              size="sm"
              onClick={() => adminApi.exportCsv(filter).then(() => setExportError(null), (e: Error) => setExportError(e.message))}
            >
              <DownloadIcon /> Export CSV
            </Button>
            <Button size="sm" variant="primary" onClick={() => setSelling(true)}>
              <PlusIcon /> Vente sur place
            </Button>
          </>
        }
      />

      {/* filtres */}
      <div className="grid gap-3 sm:grid-cols-[1fr_220px_180px]">
        <label className="relative block">
          <span className="sr-only">Rechercher</span>
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-paper-dim" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom, téléphone, référence, code billet…" className="pl-10" type="search" />
        </label>
        <label>
          <span className="sr-only">Édition</span>
          <Select value={eventId} onChange={(e) => setParam("eventId", e.target.value || null)}>
            <option value="">Toutes les éditions</option>
            {events.data?.map((e) => <option key={e.id} value={e.id}>{e.title} · {e.startISO.slice(0, 10)}</option>)}
          </Select>
        </label>
        <label>
          <span className="sr-only">Statut</span>
          <Select value={status} onChange={(e) => setParam("status", e.target.value || null)}>
            <option value="">Tous les statuts</option>
            {(Object.keys(ORDER_STATUS) as AdminOrderStatus[]).map((s) => <option key={s} value={s}>{ORDER_STATUS[s].label}</option>)}
          </Select>
        </label>
      </div>

      {orders.error && <ErrorNote>{orders.error}</ErrorNote>}
      {exportError && <ErrorNote>{exportError}</ErrorNote>}

      <Card className="overflow-hidden">
        {orders.loading && !orders.data ? (
          <div className="p-6"><Skeleton className="h-60" /></div>
        ) : list.length === 0 ? (
          <Empty>Aucune commande ne correspond.</Empty>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="hidden border-b border-line text-xs uppercase tracking-[0.1em] text-paper-dim md:table-header-group">
              <tr>
                <th className="px-5 py-3 font-semibold">Réf.</th>
                <th className="px-3 py-3 font-semibold">Client</th>
                <th className="px-3 py-3 font-semibold">Édition</th>
                <th className="px-3 py-3 text-right font-semibold">Total</th>
                <th className="px-3 py-3 font-semibold">Paiement</th>
                <th className="px-3 py-3 font-semibold">Statut</th>
                <th className="px-5 py-3 text-right font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.map((o) => (
                <tr
                  key={o.id}
                  onClick={() => setParam("o", o.id)}
                  className={`grid cursor-pointer grid-cols-[1fr_auto] gap-x-3 gap-y-1 px-5 py-3.5 transition-colors hover:bg-paper/3 md:table-row md:p-0 ${o.id === selected ? "bg-peach/6" : ""}`}
                >
                  <td className="font-mono text-paper-muted md:px-5 md:py-3.5">
                    <button type="button" className="cursor-pointer text-left hover:text-peach" onClick={(e) => { e.stopPropagation(); setParam("o", o.id); }}>
                      {o.reference}
                    </button>
                  </td>
                  <td className="col-span-2 row-start-2 md:px-3 md:py-3.5">
                    <span className="font-medium text-paper">{o.buyer.name}</span>
                    <span className="block text-xs text-paper-dim">{o.buyer.phone}</span>
                  </td>
                  <td className="col-span-2 text-paper-muted md:px-3 md:py-3.5">{o.eventTitle}</td>
                  <td className="row-start-1 text-right font-semibold tabular-nums text-paper md:px-3 md:py-3.5">{fcfa(o.total)}</td>
                  <td className="text-paper-muted md:px-3 md:py-3.5">{METHOD_LABEL[o.paymentMethod]}{o.provider === "manual" && <span className="text-paper-dim"> · admin</span>}</td>
                  <td className="text-right md:px-3 md:py-3.5 md:text-left"><Badge tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Badge></td>
                  <td className="hidden whitespace-nowrap text-right text-xs text-paper-dim md:table-cell md:px-5 md:py-3.5">{dateTime(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {current && <OrderPanel order={current} onClose={() => setParam("o", null)} onChanged={onChanged} />}
      {selling && (
        <ManualSale
          events={(events.data ?? []).filter((e: AdminEvent) => e.status !== "cancelled")}
          defaultEventId={eventId}
          onClose={() => setSelling(false)}
          onDone={(o) => {
            setSelling(false);
            onChanged(o);
          }}
        />
      )}
    </div>
  );
}
