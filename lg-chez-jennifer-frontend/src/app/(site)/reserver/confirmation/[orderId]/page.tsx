import type { Metadata } from "next";
import { Confirmation } from "@/components/booking/Confirmation";

export const metadata: Metadata = { title: "Ma réservation", robots: { index: false } };

export default async function ConfirmationPage({ params }: PageProps<"/reserver/confirmation/[orderId]">) {
  const { orderId } = await params;
  return <Confirmation orderId={orderId} />;
}
