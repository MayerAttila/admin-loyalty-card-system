"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FiSearch, FiTag, FiUser, FiX } from "react-icons/fi";
import { toast } from "react-toastify";
import {
  getAdminBusinesses,
  type AdminBusinessRecord,
} from "@/api/client/adminBusiness.api";
import {
  getAdminSubscriptionHistory,
  type AdminSubscriptionHistoryItem,
} from "@/api/client/subscriptionHistory.api";
import DataTable, { type DataTableColumn } from "@/components/DataTable";

const formatDateTime = (iso: string | null | undefined) => {
  if (!iso) return "N/A";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatSubscription = (row: AdminBusinessRecord) => {
  const status = (row.subscription.status || "NONE").toUpperCase();
  if (status === "NONE") return "None";
  const interval = row.subscription.interval?.toLowerCase();
  const intervalLabel = interval ? ` (${interval})` : "";
  return `${status}${intervalLabel}`;
};

const getSubscriptionType = (row: AdminBusinessRecord) => {
  const status = (row.subscription.status || "NONE").toUpperCase();
  const interval = row.subscription.interval?.toLowerCase();

  if (status === "TRIAL") return "Trial";
  if (status === "NONE") return "No subscription";

  if (interval === "month") return "Monthly";
  if (interval === "year") return "Annual";
  if (interval) return interval.charAt(0).toUpperCase() + interval.slice(1);

  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

const getStatusBadgeClassName = (statusValue: string | null | undefined) => {
  const status = (statusValue || "NONE").toUpperCase();
  if (status === "ACTIVE") {
    return "border-emerald-400/30 bg-emerald-500/10 text-emerald-200";
  }
  if (status === "TRIAL") {
    return "border-sky-400/30 bg-sky-500/10 text-sky-200";
  }
  if (status === "CANCELED") {
    return "border-contrast/20 bg-contrast/5 text-contrast/65";
  }
  if (status === "INCOMPLETE" || status === "PAST_DUE") {
    return "border-amber-400/30 bg-amber-500/10 text-amber-200";
  }

  return "border-contrast/20 bg-contrast/5 text-contrast/65";
};

const getErrorStatus = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "response" in error &&
  (error as { response?: { status?: number } }).response?.status;

const getErrorMessage = (error: unknown, fallback: string) => {
  const maybeMessage =
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    (error as { response?: { data?: { message?: string } } }).response?.data?.message;
  return typeof maybeMessage === "string" && maybeMessage.trim()
    ? maybeMessage
    : fallback;
};

const formatHistoryStatus = (value: string | null | undefined) => {
  const normalized = (value ?? "").trim().toUpperCase();
  return normalized && normalized !== "NONE" ? normalized : "None";
};

export default function BusinessesClient() {
  const router = useRouter();
  const [rows, setRows] = useState<AdminBusinessRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState<AdminBusinessRecord | null>(null);
  const [historyRows, setHistoryRows] = useState<AdminSubscriptionHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedBusiness) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [selectedBusiness]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const data = await getAdminBusinesses();
        if (!cancelled) setRows(data);
      } catch (error) {
        if (cancelled) return;
        const status = getErrorStatus(error);
        if (status === 401) {
          router.replace("/login");
          return;
        }
        if (status === 403) {
          router.replace("/login?switch=1");
          return;
        }
        toast.error(getErrorMessage(error, "Unable to load businesses."));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (!selectedBusiness?.id) return;
    let cancelled = false;

    const run = async () => {
      setHistoryLoading(true);
      setHistoryError(null);
      try {
        const data = await getAdminSubscriptionHistory({
          businessId: selectedBusiness.id,
          page: 1,
          pageSize: 200,
        });
        if (!cancelled) {
          setHistoryRows(data.items ?? []);
        }
      } catch (error) {
        if (cancelled) return;
        const status = getErrorStatus(error);
        if (status === 401) {
          router.replace("/login");
          return;
        }
        if (status === 403) {
          router.replace("/login?switch=1");
          return;
        }
        setHistoryError(getErrorMessage(error, "Unable to load billing history."));
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [router, selectedBusiness?.id]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      [
        row.name,
        row.owner?.name ?? "",
        row.owner?.email ?? "",
        row.referral?.code ?? "",
        row.subscription.status,
        row.subscription.interval ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [rows, search]);

  const historyColumns = useMemo<DataTableColumn<AdminSubscriptionHistoryItem>[]>(
    () => [
      {
        key: "createdAt",
        label: "Time",
        sortable: true,
        width: 190,
        render: (_, row) => (
          <span className="text-sm text-contrast/85">{formatDateTime(row.createdAt)}</span>
        ),
        sortValue: (row) => new Date(row.createdAt).getTime(),
      },
      {
        key: "eventType",
        label: "Event",
        sortable: true,
        width: 200,
        render: (_, row) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-contrast/90">
              {row.eventType || "status.sync"}
            </p>
            <p className="truncate text-xs uppercase tracking-wide text-contrast/60">
              {row.source}
            </p>
          </div>
        ),
        sortValue: (row) => row.eventType ?? "",
      },
      {
        key: "status",
        label: "Status change",
        sortable: true,
        width: 180,
        render: (_, row) => (
          <span className="font-medium text-contrast/85">
            {formatHistoryStatus(row.previousStatus)} {"->"}{" "}
            {formatHistoryStatus(row.nextStatus)}
          </span>
        ),
        sortValue: (row) =>
          `${formatHistoryStatus(row.previousStatus)}-${formatHistoryStatus(row.nextStatus)}`,
      },
      {
        key: "interval",
        label: "Interval",
        width: 160,
        render: (_, row) => (
          <span className="text-sm text-contrast/80">
            {row.previousInterval || "N/A"} {"->"} {row.nextInterval || "N/A"}
          </span>
        ),
      },
      {
        key: "price",
        label: "Price",
        width: 240,
        render: (_, row) => (
          <span className="block truncate text-xs text-contrast/75">
            {row.previousPriceId || "N/A"} {"->"} {row.nextPriceId || "N/A"}
          </span>
        ),
      },
      {
        key: "cancelAtPeriodEnd",
        label: "Cancel End",
        width: 130,
        render: (_, row) => (
          <span className="text-sm text-contrast/80">
            {row.cancelAtPeriodEnd === null
              ? "N/A"
              : row.cancelAtPeriodEnd
                ? "Yes"
                : "No"}
          </span>
        ),
      },
      {
        key: "stripeSubscriptionId",
        label: "Stripe Sub",
        width: 220,
        render: (_, row) => (
          <span className="block truncate text-xs text-contrast/70">
            {row.stripeSubscriptionId || "N/A"}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <section className="rounded-2xl border border-accent-3 bg-accent-1 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-brand">Registered businesses</h2>
          <p className="mt-2 text-sm text-contrast/75">
            Track which businesses used promo links and monitor their subscription status.
          </p>
        </div>

        <label className="relative block w-full sm:w-80">
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-contrast/45">
            <FiSearch className="h-4 w-4" />
          </span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search business, owner, promo code"
            className="h-11 w-full rounded-full border border-accent-3 bg-primary pl-11 pr-4 text-sm text-contrast outline-none placeholder:text-contrast/50"
          />
        </label>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, index) => (
              <article
                key={`business-skeleton-${index}`}
                className="rounded-xl border border-accent-3 bg-primary/35 p-4"
              >
                <div className="h-4 w-1/3 animate-pulse rounded bg-accent-2" />
                <div className="mt-3 h-6 w-2/3 animate-pulse rounded bg-accent-2" />
                <div className="mt-4 space-y-2">
                  <div className="h-4 w-full animate-pulse rounded bg-accent-2" />
                  <div className="h-4 w-5/6 animate-pulse rounded bg-accent-2" />
                  <div className="h-4 w-4/6 animate-pulse rounded bg-accent-2" />
                </div>
              </article>
            ))
          : null}

        {!isLoading && filtered.length === 0 ? (
          <div className="rounded-xl border border-accent-3 bg-primary/25 p-5 text-sm text-contrast/70 sm:col-span-2 xl:col-span-3">
            No registered businesses found.
          </div>
        ) : null}

        {!isLoading
          ? filtered.map((row) => {
              const statusLabel = formatSubscription(row);
              const subscriptionType = getSubscriptionType(row);

              return (
                <article
                  key={row.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedBusiness(row)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedBusiness(row);
                    }
                  }}
                  className="cursor-pointer rounded-xl border border-accent-3 bg-primary/35 p-4 shadow-[0_10px_24px_rgba(0,0,0,0.14)] transition hover:border-brand/35 hover:bg-accent-1/70"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.16em] text-contrast/60">
                        Business
                      </p>
                      <h3 className="truncate text-lg font-semibold text-contrast">
                        {row.name}
                      </h3>
                    </div>
                    <span
                      className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClassName(
                        row.subscription.status
                      )}`}
                    >
                      {statusLabel}
                    </span>
                  </div>

                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <FiUser className="mt-0.5 h-4 w-4 shrink-0 text-contrast/55" />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-contrast/90">
                          {row.owner?.name || "No owner"}
                        </p>
                        <p className="truncate text-xs text-contrast/60">
                          {row.owner?.email || "No owner account"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-lg border border-accent-3 bg-accent-1/40 px-3 py-2">
                      <p className="text-xs uppercase tracking-[0.14em] text-contrast/60">
                        Subscription type
                      </p>
                      <p className="truncate font-semibold text-contrast/90">
                        {subscriptionType}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-lg border border-accent-3 bg-accent-1/40 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <FiTag className="h-4 w-4 text-contrast/55" />
                        <p className="text-xs uppercase tracking-[0.14em] text-contrast/60">
                          Promo code
                        </p>
                      </div>
                      <p className="truncate font-semibold text-brand">
                        {row.referral?.code || "None"}
                      </p>
                    </div>

                    <div className="rounded-lg border border-accent-3 bg-accent-1/40 px-3 py-2">
                      <p className="text-xs uppercase tracking-[0.14em] text-contrast/60">
                        Billing
                      </p>
                      <p className="mt-1 text-xs text-contrast/75">
                        {row.subscription.currentPeriodEnd
                          ? `Renews: ${formatDateTime(row.subscription.currentPeriodEnd)}`
                          : row.subscription.trialEndsAt
                            ? `Trial ends: ${formatDateTime(row.subscription.trialEndsAt)}`
                            : "No active billing period"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-accent-3 pt-3 text-xs text-contrast/55">
                    <span>Created {formatDateTime(row.createdAt)}</span>
                    <span>Updated {formatDateTime(row.updatedAt)}</span>
                  </div>
                </article>
              );
            })
          : null}
      </div>

      {selectedBusiness ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4">
          <div className="flex h-[92vh] w-[min(96vw,1700px)] flex-col overflow-hidden rounded-2xl border border-accent-3 bg-accent-1 shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-accent-3 px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-contrast/60">Billing</p>
                <h3 className="mt-1 text-xl font-semibold text-brand">
                  {selectedBusiness.name} History
                </h3>
                <p className="mt-1 text-xs text-contrast/65">
                  Subscription and billing state changes for this business.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close billing history"
                onClick={() => {
                  setSelectedBusiness(null);
                  setHistoryRows([]);
                  setHistoryError(null);
                }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-accent-3 bg-primary/40 text-contrast/80 transition hover:border-brand/35 hover:text-brand"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-auto p-5 [scrollbar-width:thin] [scrollbar-color:rgb(var(--color-accent-4)/0.7)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[rgb(var(--color-accent-4)/0.7)]">
              {historyLoading ? (
                <p className="text-sm text-contrast/70">Loading billing history...</p>
              ) : null}

              {!historyLoading && historyError ? (
                <p className="text-sm text-red-300">{historyError}</p>
              ) : null}

              {!historyLoading && !historyError ? (
                <DataTable
                  key={`billing-history-${selectedBusiness.id}`}
                  data={historyRows}
                  columns={historyColumns}
                  storageKey={`admin-business-billing-history-${selectedBusiness.id}`}
                  emptyMessage="No billing history entries found for this business."
                  defaultSortKey="createdAt"
                  defaultSortDirection="desc"
                  respectStoredSort={false}
                  viewportOffsetPx={320}
                />
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
