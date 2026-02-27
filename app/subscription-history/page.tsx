import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import SubscriptionHistoryClient from "./SubscriptionHistoryClient";

export default async function SubscriptionHistoryPage() {
  const session = await getAdminSession();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <section className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-contrast/60">
          Billing
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-brand">Subscription History</h1>
        <p className="mt-2 text-sm text-contrast/80">
          View tracked subscription lifecycle events for all registered businesses.
        </p>
      </header>

      <SubscriptionHistoryClient />
    </section>
  );
}
