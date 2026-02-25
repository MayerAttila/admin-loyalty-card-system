"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { FiCopy, FiRefreshCw, FiSearch } from "react-icons/fi";
import Button from "@/components/Button";
import DataTable, { type DataTableColumn } from "@/components/DataTable";
import DeleteButton from "@/components/DeleteButton";
import EditButton from "@/components/EditButton";
import {
  createReferralLink as createReferralLinkApi,
  deleteReferralLink as deleteReferralLinkApi,
  getReferralLinks,
  type ReferralLinkRecord,
  type ReferralLinkStatus,
  updateReferralLink as updateReferralLinkApi,
} from "@/api/client/referralLink.api";

const DEFAULT_LANDING_PATH = "/register";

const normalizeCode = (value: string) =>
  value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "-")
    .replace(/[^A-Z0-9_-]/g, "");

const normalizeLandingPath = (value: string) => {
  const trimmed = value.trim() || DEFAULT_LANDING_PATH;
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
};

const generateCode = () => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 6; i += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `REF-${suffix}`;
};

const formatDateTime = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const buildReferralUrl = (code: string, landingPath: string) => {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://admin.loyale.online";
  const appOrigin =
    process.env.NEXT_PUBLIC_APP_URL || origin.replace("admin.", "");
  return `${appOrigin}${normalizeLandingPath(landingPath)}?ref=${encodeURIComponent(code)}`;
};

const copyText = async (value: string) => {
  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === "function"
  ) {
    await navigator.clipboard.writeText(value);
    return;
  }
  if (typeof document === "undefined") {
    throw new Error("Clipboard API unavailable");
  }
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  const ok = document.execCommand("copy");
  document.body.removeChild(textarea);
  if (!ok) throw new Error("Copy command failed");
};

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

export default function ReferralLinksClient() {
  const [links, setLinks] = useState<ReferralLinkRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<ReferralLinkStatus>("ACTIVE");
  const [landingPath, setLandingPath] = useState(DEFAULT_LANDING_PATH);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const data = await getReferralLinks();
        if (!cancelled) setLinks(data);
      } catch (error) {
        console.error("getReferralLinks failed", error);
        if (!cancelled) toast.error(getErrorMessage(error, "Unable to load referral links."));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setCode("");
    setStatus("ACTIVE");
    setLandingPath(DEFAULT_LANDING_PATH);
  };

  const editingLink = useMemo(
    () => links.find((item) => item.id === editingId) ?? null,
    [links, editingId]
  );

  const filteredLinks = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return links;
    return links.filter((link) =>
      [link.code, link.status, link.landingPath].join(" ").toLowerCase().includes(q)
    );
  }, [links, search]);

  const sortedLinks = useMemo(
    () =>
      [...filteredLinks].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    [filteredLinks]
  );

  const previewUrl = useMemo(() => {
    const normalized = normalizeCode(code);
    if (!normalized) return "";
    return buildReferralUrl(normalized, landingPath);
  }, [code, landingPath]);

  const handleSave = async () => {
    if (isSaving) return;

    const normalizedCode = normalizeCode(code);
    if (!normalizedCode) {
      toast.error("Referral code is required.");
      return;
    }

    const normalizedLandingPath = normalizeLandingPath(landingPath);
    if (!/^[-_/A-Za-z0-9]+$/.test(normalizedLandingPath)) {
      toast.error("Landing path contains invalid characters.");
      return;
    }

    const duplicate = links.find(
      (item) => item.code === normalizedCode && (editingId ? item.id !== editingId : true)
    );
    if (duplicate) {
      toast.error("Referral code already exists.");
      return;
    }

    setIsSaving(true);
    try {
      if (editingId) {
        const updated = await updateReferralLinkApi(editingId, {
          code: normalizedCode,
          status,
          landingPath: normalizedLandingPath,
        });
        setLinks((current) =>
          current.map((item) => (item.id === editingId ? updated : item))
        );
        toast.success("Referral link updated.");
      } else {
        const created = await createReferralLinkApi({
          code: normalizedCode,
          status,
          landingPath: normalizedLandingPath,
        });
        setLinks((current) => [created, ...current]);
        toast.success("Referral link created.");
      }

      resetForm();
    } catch (error) {
      console.error("save referral link failed", error);
      toast.error(getErrorMessage(error, "Unable to save referral link."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (row: ReferralLinkRecord) => {
    setEditingId(row.id);
    setCode(row.code);
    setStatus(row.status);
    setLandingPath(row.landingPath);
  };

  const handleDelete = async (row: ReferralLinkRecord) => {
    if (busyId) return;
    setBusyId(row.id);
    try {
      await deleteReferralLinkApi(row.id);
      setLinks((current) => current.filter((item) => item.id !== row.id));
      if (editingId === row.id) resetForm();
      toast.success("Referral link deleted.");
    } catch (error) {
      console.error("delete referral link failed", error);
      toast.error(getErrorMessage(error, "Unable to delete referral link."));
    } finally {
      setBusyId(null);
    }
  };

  const handleToggle = async (row: ReferralLinkRecord) => {
    if (busyId) return;
    setBusyId(row.id);
    try {
      const updated = await updateReferralLinkApi(row.id, {
        status: row.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
      });
      setLinks((current) => current.map((item) => (item.id === row.id ? updated : item)));
    } catch (error) {
      console.error("toggle referral link failed", error);
      toast.error(getErrorMessage(error, "Unable to update referral link status."));
    } finally {
      setBusyId(null);
    }
  };

  const handleCopy = async (row: ReferralLinkRecord) => {
    try {
      await copyText(buildReferralUrl(row.code, row.landingPath));
      toast.success("Referral link copied.");
    } catch (error) {
      console.error("copy referral link failed", error);
      toast.error("Unable to copy referral link.");
    }
  };

  const columns = useMemo<DataTableColumn<ReferralLinkRecord>[]>(
    () => [
      {
        key: "code",
        label: "Code",
        sortable: true,
        width: 210,
        render: (_, row) => <span className="font-semibold text-contrast">{row.code}</span>,
        sortValue: (row) => row.code,
      },
      {
        key: "landingPath",
        label: "Link",
        width: 360,
        render: (_, row) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-contrast/90">{row.landingPath}</p>
            <p className="truncate text-xs text-contrast/55">
              {buildReferralUrl(row.code, row.landingPath)}
            </p>
          </div>
        ),
      },
      {
        key: "status",
        label: "Status",
        sortable: true,
        width: 140,
        render: (_, row) => (
          <span
            className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${
              row.status === "ACTIVE"
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                : "border-contrast/20 bg-contrast/5 text-contrast/60"
            }`}
          >
            {row.status === "ACTIVE" ? "Active" : "Inactive"}
          </span>
        ),
        sortValue: (row) => row.status,
      },
      {
        key: "updatedAt",
        label: "Updated",
        sortable: true,
        width: 190,
        render: (_, row) => (
          <span className="text-sm text-contrast/80">{formatDateTime(row.updatedAt)}</span>
        ),
        sortValue: (row) => new Date(row.updatedAt).getTime(),
      },
      {
        key: "actions",
        label: "Actions",
        align: "right",
        width: 220,
        render: (_, row) => (
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => void handleCopy(row)}
              disabled={busyId === row.id}
              title="Copy referral link"
              aria-label={`Copy referral link ${row.code}`}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-accent-3 bg-primary/40 text-contrast/80 transition hover:border-brand/40 hover:text-brand disabled:opacity-60"
            >
              <FiCopy className="text-sm" />
            </button>
            <EditButton
              title="Edit referral link"
              ariaLabel={`Edit referral link ${row.code}`}
              onClick={() => handleEdit(row)}
              disabled={busyId === row.id}
            />
            <DeleteButton
              title="Delete referral link"
              ariaLabel={`Delete referral link ${row.code}`}
              onConfirm={() => void handleDelete(row)}
              disabled={busyId === row.id}
            />
            <button
              type="button"
              role="switch"
              aria-checked={row.status === "ACTIVE"}
              onClick={() => void handleToggle(row)}
              disabled={busyId === row.id}
              title={row.status === "ACTIVE" ? "Deactivate link" : "Activate link"}
              className="inline-flex items-center gap-2 text-xs font-semibold text-contrast/80 disabled:opacity-60"
            >
              <span
                className={`relative inline-flex h-6 w-11 items-center rounded-full border border-accent-3 transition-colors duration-200 ${
                  row.status === "ACTIVE" ? "bg-brand/80" : "bg-primary/50"
                }`}
              >
                <span
                  className={`inline-block h-4.5 w-4.5 rounded-full bg-primary shadow-sm transition-transform duration-200 ${
                    row.status === "ACTIVE" ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </span>
            </button>
          </div>
        ),
      },
    ],
    [busyId]
  );

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-accent-3 bg-accent-1 p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="xl:max-w-md">
            <h2 className="text-xl font-semibold text-brand">
              {editingLink ? "Edit Referral Link" : "Create Referral Link"}
            </h2>
            <p className="mt-2 text-sm text-contrast/75">
              Define the referral code and target registration path for business
              registration attribution.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="neutral"
              onClick={() => setCode(generateCode())}
              disabled={isSaving}
            >
              <FiRefreshCw className="h-4 w-4" />
              Generate code
            </Button>
            {editingLink ? (
              <Button type="button" size="sm" variant="neutral" onClick={resetForm}>
                Cancel edit
              </Button>
            ) : null}
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <label className="block text-xs text-contrast/70">
            Referral code
            <input
              value={code}
              onChange={(event) => setCode(normalizeCode(event.target.value))}
              placeholder="REF-AGENCY01"
              className="mt-2 h-11 w-full rounded-lg border border-accent-3 bg-primary px-4 text-sm text-contrast outline-none placeholder:text-contrast/50"
            />
          </label>

          <label className="block text-xs text-contrast/70">
            Landing path
            <input
              value={landingPath}
              onChange={(event) => setLandingPath(event.target.value)}
              placeholder="/register"
              className="mt-2 h-11 w-full rounded-lg border border-accent-3 bg-primary px-4 text-sm text-contrast outline-none placeholder:text-contrast/50"
            />
          </label>

          <div className="xl:col-span-2 rounded-xl border border-accent-3 bg-primary/25 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-contrast/60">
              Preview URL
            </p>
            <p className="mt-1 truncate text-sm font-medium text-contrast">
              {previewUrl || "Create a referral code to preview the link"}
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <Button type="button" onClick={() => void handleSave()} disabled={isSaving}>
            {isSaving
              ? "Saving..."
              : editingLink
                ? "Save changes"
                : "Create referral link"}
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-accent-3 bg-accent-1 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-brand">Defined Links</h2>
            <p className="mt-2 text-sm text-contrast/75">
              Manage active and inactive referral links used for business signups.
            </p>
          </div>

          <label className="relative block w-full sm:w-80">
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-contrast/45">
              <FiSearch className="h-4 w-4" />
            </span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search code, path"
              className="h-11 w-full rounded-full border border-accent-3 bg-primary pl-11 pr-4 text-sm text-contrast outline-none placeholder:text-contrast/50"
            />
          </label>
        </div>

        <div className="mt-5">
          <DataTable
            data={sortedLinks}
            columns={columns}
            storageKey="admin-referral-links-table"
            emptyMessage={!isLoading ? "No referral links defined yet." : "Loading referral links..."}
          />
        </div>
      </section>
    </div>
  );
}

