"use client";

import Link from "next/link";
import { EventForm } from "@/components/admin/EventForm";
import { PageHead } from "@/components/admin/ui";

export default function NewEventPage() {
  return (
    <div className="space-y-8">
      <Link href="/admin/evenements" className="text-sm text-paper-muted hover:text-peach">← Éditions</Link>
      <PageHead title="Nouvelle édition" sub="Commence en brouillon, passe « En ligne » quand tout est prêt." />
      <EventForm />
    </div>
  );
}
