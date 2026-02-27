"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FiSearch } from "react-icons/fi";
import { toast } from "react-toastify";
import DataTable, { type DataTableColumn } from "@/components/DataTable";
import {
  getAdminSubscriptionHistory,
  type AdminSubscriptionHistoryItem,
} from "@/api/client/subscriptionHistory.api";

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

const normalizeStatusLabel = (value: string | null | undefined) => {
  const normalized = (value ?? "").trim();
  if (!normalized || normalized.toUpperCase() === "NONE") return "None";
  return normalized.toUpperCase();
};

const formatChange = (row: AdminSubscriptionHistoryItem) => {
  const from = normalizeStatusLabel(row.previousStatus);
  const to = normalizeStatusLabel(row.nextStatus);
  return `${from} -> ${to}`;
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

export default function SubscriptionHistoryClient() {
  const router = useRouter();
  const [rows, setRows] = useState<AdminSubscriptionHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const data = await getAdminSubscriptionHistory({
          page: 1,
          pageSize: 500,
        });
        if (!cancelled) setRows(data.items ?? []);
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
        toast.error(getErrorMessage(error, "Unable to load subscription history."));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      [
        row.business.name,
        row.source,
        row.eventType ?? "",
        row.stripeSubscriptionId ?? "",
        row.previousStatus ?? "",
        row.nextStatus ?? "",
        row.previousPriceId ?? "",
        row.nextPriceId ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [rows, search]);

  const columns = useMemo<DataTableColumn<AdminSubscriptionHistoryItem>[]>(
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
        key: "business",
        label: "Business",
        sortable: true,
        width: 220,
        render: (_, row) => (
          <div className="min-w-0">
            <p className="truncate font-semibold text-contrast">{row.business.name}</p>
            <p className="truncate text-xs text-contrast/60">{row.business.id}</p>
          </div>
        ),
        sortValue: (row) => row.business.name,
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
        key: "transition",
        label: "Status change",
        sortable: true,
        width: 190,
        render: (_, row) => (
          <span className="font-medium text-contrast/85">{formatChange(row)}</span>
        ),
        sortValue: (row) => formatChange(row),
      },
      {
        key: "details",
        label: "Details",
        width: 260,
        render: (_, row) => (
          <div className="min-w-0">
            <p className="truncate text-sm text-contrast/85">
              Interval: {row.previousInterval || "N/A"} {"->"} {row.nextInterval || "N/A"}
            </p>
            <p className="truncate text-xs text-contrast/60">
              Price: {row.previousPriceId || "N/A"} {"->"} {row.nextPriceId || "N/A"}
            </p>
            <p className="truncate text-xs text-contrast/60">
              Cancel at period end:{" "}
              {row.cancelAtPeriodEnd === null
                ? "N/A"
                : row.cancelAtPeriodEnd
                  ? "Yes"
                  : "No"}
            </p>
          </div>
        ),
      },
      {
        key: "stripeSubscriptionId",
        label: "Stripe subscription",
        width: 240,
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
          <h2 className="text-xl font-semibold text-brand">Subscription history</h2>
          <p className="mt-2 text-sm text-contrast/75">
            Audit plan changes, Stripe sync events, and cancellation transitions.
          </p>
        </div>

        <label className="relative block w-full sm:w-80">
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-contrast/45">
            <FiSearch className="h-4 w-4" />
          </span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search business, event, status"
            className="h-11 w-full rounded-full border border-accent-3 bg-primary pl-11 pr-4 text-sm text-contrast outline-none placeholder:text-contrast/50"
          />
        </label>
      </div>

      <div className="mt-5">
        <DataTable
          data={filtered}
          columns={columns}
          storageKey="admin-subscription-history-table"
          emptyMessage={
            !isLoading
              ? "No subscription history found."
              : "Loading subscription history..."
          }
        />
      </div>
    </section>
  );
}
