import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import BusinessesClient from "./BusinessesClient";

export default async function BusinessesPage() {
  const session = await getAdminSession();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <section className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-contrast/60">
          Monitoring
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-brand">Businesses</h1>
        <p className="mt-2 text-sm text-contrast/80">
          View registered businesses, promo code attribution, and billing status.
        </p>
      </header>

      <BusinessesClient />
    </section>
  );
}

