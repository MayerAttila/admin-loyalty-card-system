import ReferralLinksClient from "./ReferralLinksClient";

export default function ReferralsPage() {
  return (
    <section className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-contrast/60">
          Growth
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-brand">Referral Links</h1>
        <p className="mt-2 text-sm text-contrast/80">
          Define referral links that are used during business registration and
          tracked on the created business record.
        </p>
      </header>

      <ReferralLinksClient />
    </section>
  );
}

