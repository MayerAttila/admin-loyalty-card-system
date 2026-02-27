"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FiSearch } from "react-icons/fi";
import { toast } from "react-toastify";
import DataTable, { type DataTableColumn } from "@/components/DataTable";
import {
  getAdminBusinesses,
  type AdminBusinessRecord,
} from "@/api/client/adminBusiness.api";

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

export default function BusinessesClient() {
  const router = useRouter();
  const [rows, setRows] = useState<AdminBusinessRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

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

  const columns = useMemo<DataTableColumn<AdminBusinessRecord>[]>(
    () => [
      {
        key: "name",
        label: "Business",
        sortable: true,
        width: 260,
        render: (_, row) => (
          <div className="min-w-0">
            <p className="truncate font-semibold text-contrast">{row.name}</p>
            <p className="truncate text-xs text-contrast/60">
              Registered: {formatDateTime(row.createdAt)}
            </p>
          </div>
        ),
        sortValue: (row) => row.name,
      },
      {
        key: "owner",
        label: "Owner",
        width: 260,
        render: (_, row) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-contrast/90">
              {row.owner?.name || "N/A"}
            </p>
            <p className="truncate text-xs text-contrast/60">
              {row.owner?.email || "No owner account"}
            </p>
          </div>
        ),
      },
      {
        key: "referral",
        label: "Promo code",
        width: 170,
        sortable: true,
        render: (_, row) =>
          row.referral ? (
            <span className="inline-flex rounded-full border border-brand/35 bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">
              {row.referral.code}
            </span>
          ) : (
            <span className="text-sm text-contrast/60">None</span>
          ),
        sortValue: (row) => row.referral?.code ?? "",
      },
      {
        key: "subscription",
        label: "Subscription",
        width: 240,
        sortable: true,
        render: (_, row) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-contrast/90">
              {formatSubscription(row)}
            </p>
            <p className="truncate text-xs text-contrast/60">
              {row.subscription.currentPeriodEnd
                ? `Renews: ${formatDateTime(row.subscription.currentPeriodEnd)}`
                : row.subscription.trialEndsAt
                  ? `Trial ends: ${formatDateTime(row.subscription.trialEndsAt)}`
                  : "No active billing period"}
            </p>
          </div>
        ),
        sortValue: (row) => formatSubscription(row),
      },
      {
        key: "updatedAt",
        label: "Updated",
        width: 180,
        sortable: true,
        render: (_, row) => (
          <span className="text-sm text-contrast/80">{formatDateTime(row.updatedAt)}</span>
        ),
        sortValue: (row) => new Date(row.updatedAt).getTime(),
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

      <div className="mt-5">
        <DataTable
          data={filtered}
          columns={columns}
          storageKey="admin-businesses-table"
          emptyMessage={
            !isLoading ? "No registered businesses found." : "Loading businesses..."
          }
        />
      </div>
    </section>
  );
}

