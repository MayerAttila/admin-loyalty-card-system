"use client";

import React, { useEffect, useMemo, useState } from "react";
import { FaAngleDown, FaAngleUp } from "react-icons/fa";
import CustomDropdown from "@/components/CustomDropdown";

export type DataTableColumn<T> = {
  key: string;
  label: string;
  sortable?: boolean;
  width?: number;
  align?: "left" | "right";
  render?: (value: unknown, row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
};

type SortDirection = "asc" | "desc";

type DataTableProps<T> = {
  data: T[];
  columns: DataTableColumn<T>[];
  storageKey?: string;
  emptyMessage?: string;
  defaultSortKey?: string;
  defaultSortDirection?: SortDirection;
  respectStoredSort?: boolean;
  visibleRowCountOptions?: number[];
  defaultVisibleRowCount?: number;
  viewportOffsetPx?: number;
  showVisibleRowControl?: boolean;
};

type ResizeState = {
  key: string;
  startX: number;
  startWidth: number;
};

const DEFAULT_WIDTH = 180;
const MIN_WIDTH = 110;
const DEFAULT_VISIBLE_ROW_OPTIONS = [20, 50, 100];
const DEFAULT_VISIBLE_ROW_COUNT = 20;
const DEFAULT_VIEWPORT_OFFSET_PX = 260;
const ESTIMATED_HEADER_HEIGHT_PX = 48;
const ESTIMATED_ROW_HEIGHT_PX = 44;
const ESTIMATED_EMPTY_STATE_HEIGHT_PX = 84;

function buildDefaultWidths<T>(columns: DataTableColumn<T>[]) {
  return columns.reduce<Record<string, number>>((acc, column) => {
    acc[column.key] = column.width ?? DEFAULT_WIDTH;
    return acc;
  }, {});
}

function getStorageId(storageKey?: string) {
  return storageKey ? `datatable:${storageKey}` : null;
}

function buildVisibleRowOptions(values?: number[]) {
  const source = values?.length ? values : DEFAULT_VISIBLE_ROW_OPTIONS;
  const normalized = Array.from(
    new Set(
      source
        .map((value) => Number.parseInt(String(value), 10))
        .filter((value) => Number.isInteger(value) && value > 0),
    ),
  ).sort((a, b) => a - b);

  return normalized.length > 0 ? normalized : DEFAULT_VISIBLE_ROW_OPTIONS;
}

const DataTable = <T,>({
  data,
  columns,
  storageKey,
  emptyMessage = "No data found.",
  defaultSortKey,
  defaultSortDirection = "asc",
  respectStoredSort = true,
  visibleRowCountOptions,
  defaultVisibleRowCount = DEFAULT_VISIBLE_ROW_COUNT,
  viewportOffsetPx = DEFAULT_VIEWPORT_OFFSET_PX,
  showVisibleRowControl = true,
}: DataTableProps<T>) => {
  const rowCountOptions = useMemo(
    () => buildVisibleRowOptions(visibleRowCountOptions),
    [visibleRowCountOptions],
  );
  const resolvedDefaultVisibleRowCount = rowCountOptions.includes(defaultVisibleRowCount)
    ? defaultVisibleRowCount
    : rowCountOptions[0] ?? DEFAULT_VISIBLE_ROW_COUNT;
  const fallbackSortKey =
    columns.find((column) => column.sortable)?.key ?? null;
  const resolvedSortKey =
    defaultSortKey &&
    columns.some((column) => column.key === defaultSortKey && column.sortable)
      ? defaultSortKey
      : fallbackSortKey;
  const [sortKey, setSortKey] = useState<string | null>(resolvedSortKey);
  const [sortDirection, setSortDirection] =
    useState<SortDirection>(defaultSortDirection);
  const [columnWidths, setColumnWidths] = useState(() =>
    buildDefaultWidths(columns)
  );
  const [resizing, setResizing] = useState<ResizeState | null>(null);
  const [isHydrated, setIsHydrated] = useState(!storageKey);
  const [visibleRowCount, setVisibleRowCount] = useState<number>(
    resolvedDefaultVisibleRowCount,
  );
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const storageId = getStorageId(storageKey);
    if (!storageId) return;

    try {
      const raw = localStorage.getItem(storageId);
      if (!raw) {
        setIsHydrated(true);
        return;
      }

      const parsed = JSON.parse(raw) as {
        widths?: Record<string, number>;
        sortKey?: string | null;
        sortDirection?: SortDirection;
        visibleRowCount?: number;
      };

      if (parsed.widths) {
        setColumnWidths((prev) => ({
          ...prev,
          ...parsed.widths,
        }));
      }

      if (respectStoredSort && parsed.sortKey) {
        setSortKey(parsed.sortKey);
      } else {
        setSortKey(resolvedSortKey);
      }

      if (respectStoredSort && parsed.sortDirection) {
        setSortDirection(parsed.sortDirection);
      } else {
        setSortDirection(defaultSortDirection);
      }

      const nextVisibleRowCount =
        typeof parsed.visibleRowCount === "number" &&
        rowCountOptions.includes(parsed.visibleRowCount)
          ? parsed.visibleRowCount
          : resolvedDefaultVisibleRowCount;
      setVisibleRowCount(nextVisibleRowCount);
    } catch {
    } finally {
      setIsHydrated(true);
    }
  }, [
    storageKey,
    respectStoredSort,
    resolvedDefaultVisibleRowCount,
    defaultSortDirection,
    resolvedSortKey,
    rowCountOptions,
  ]);

  useEffect(() => {
    if (!storageKey) {
      setVisibleRowCount(resolvedDefaultVisibleRowCount);
    }
  }, [storageKey, resolvedDefaultVisibleRowCount]);

  useEffect(() => {
    const storageId = getStorageId(storageKey);
    if (!storageId || !isHydrated) return;

    const payload = JSON.stringify({
      widths: columnWidths,
      sortKey,
      sortDirection,
      visibleRowCount,
    });

    localStorage.setItem(storageId, payload);
  }, [storageKey, columnWidths, sortKey, sortDirection, visibleRowCount, isHydrated]);

  useEffect(() => {
    if (!resizing) return;

    const handleMove = (event: MouseEvent) => {
      const delta = event.clientX - resizing.startX;
      const nextWidth = Math.max(MIN_WIDTH, resizing.startWidth + delta);
      setColumnWidths((prev) => ({
        ...prev,
        [resizing.key]: nextWidth,
      }));
    };

    const handleUp = () => {
      setResizing(null);
    };

    document.body.style.cursor = "col-resize";
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);

    return () => {
      document.body.style.cursor = "";
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [resizing]);

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    const column = columns.find((col) => col.key === sortKey);
    if (!column || !column.sortable) return data;

    const sorted = [...data];
    sorted.sort((a, b) => {
      const getValue = (row: T) => {
        if (column.sortValue) return column.sortValue(row);
        const raw = (row as Record<string, unknown>)[column.key];
        if (typeof raw === "boolean") return raw ? 1 : 0;
        return raw ?? "";
      };

      const aValue = getValue(a);
      const bValue = getValue(b);

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      const comparison = String(aValue).localeCompare(String(bValue));
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [data, sortKey, sortDirection, columns]);

  const totalRows = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / visibleRowCount));

  useEffect(() => {
    setCurrentPage((prev) => Math.min(Math.max(1, prev), totalPages));
  }, [totalPages]);

  const pageStartIndex = totalRows === 0 ? 0 : (currentPage - 1) * visibleRowCount;
  const paginatedData = useMemo(
    () => sortedData.slice(pageStartIndex, pageStartIndex + visibleRowCount),
    [sortedData, pageStartIndex, visibleRowCount],
  );
  const pageEndIndex = Math.min(pageStartIndex + paginatedData.length, totalRows);

  const handleSort = (key: string) => {
    if (key === sortKey) {
      setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(key);
    setSortDirection("asc");
  };

  const startResize = (
    key: string,
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setResizing({
      key,
      startX: event.clientX,
      startWidth: columnWidths[key] ?? DEFAULT_WIDTH,
    });
  };

  const renderSortIndicator = (key: string) => {
    if (key !== sortKey) return null;
    return (
      <span className="ml-1 inline-flex text-contrast/60">
        {sortDirection === "asc" ? (
          <FaAngleUp className="text-xs" />
        ) : (
          <FaAngleDown className="text-xs" />
        )}
      </span>
    );
  };

  const estimatedRowsHeightPx =
    totalRows === 0
      ? ESTIMATED_EMPTY_STATE_HEIGHT_PX
      : Math.max(1, paginatedData.length) * ESTIMATED_ROW_HEIGHT_PX;
  const tableViewportMaxHeight = `min(calc(100vh - ${viewportOffsetPx}px), ${
    ESTIMATED_HEADER_HEIGHT_PX + estimatedRowsHeightPx
  }px)`;
  const shouldConstrainViewport =
    totalRows > 0 && paginatedData.length >= visibleRowCount;

  const visibleRowDropdownOptions = rowCountOptions.map((count) => ({
    value: String(count),
    label: String(count),
  }));

  return (
    <div className="overflow-hidden rounded-xl border border-accent-3 bg-primary/40 shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
      <div
        className="overflow-auto [scrollbar-width:thin] [scrollbar-color:rgb(var(--color-accent-4)/0.7)_transparent] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-[rgb(var(--color-accent-4)/0.7)] [&::-webkit-scrollbar-thumb]:bg-clip-padding [&::-webkit-scrollbar-thumb:hover]:bg-[rgb(var(--color-accent-4)/0.9)]"
        style={{ maxHeight: shouldConstrainViewport ? tableViewportMaxHeight : undefined }}
      >
      <table className="min-w-full table-fixed text-left text-sm text-contrast">
        <thead className="border-b border-accent-3 text-xs uppercase tracking-wide text-contrast/70">
          <tr>
            {columns.map((column) => {
              const isRightAligned = column.align === "right";
              const width = columnWidths[column.key] ?? DEFAULT_WIDTH;
              const isLast = column.key === columns[columns.length - 1]?.key;

              return (
                <th
                  key={column.key}
                  className={`sticky top-0 z-10 bg-accent-1/95 px-4 py-3 backdrop-blur-sm ${
                    isRightAligned ? "text-right" : "text-left"
                  }`}
                  style={{ width }}
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      className="group inline-flex items-center gap-1 text-left"
                      onClick={() => handleSort(column.key)}
                    >
                      <span className="group-hover:text-contrast">
                        {column.label}
                      </span>
                      {renderSortIndicator(column.key)}
                    </button>
                  ) : (
                    column.label
                  )}
                  {!isLast ? (
                    <>
                      <div
                        className="absolute right-0 top-0 h-full w-3 cursor-col-resize"
                        onMouseDown={(event) => startResize(column.key, event)}
                      />
                      <div className="pointer-events-none absolute right-0 top-1/2 h-5 w-px -translate-y-1/2 bg-accent-4/70" />
                    </>
                  ) : null}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {totalRows === 0 ? (
            <tr>
              <td
                className="px-4 py-6 text-center text-contrast/70"
                colSpan={columns.length}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            paginatedData.map((row, index) => (
              <tr
                key={`row-${pageStartIndex + index}`}
                className={`border-b border-accent-3/60 transition-colors ${
                  (pageStartIndex + index) % 2 === 0
                    ? "bg-primary/40"
                    : "bg-accent-1/50"
                } hover:bg-accent-2/60`}
              >
                {columns.map((column) => {
                  const value = (row as Record<string, unknown>)[column.key];
                  const isRightAligned = column.align === "right";

                  return (
                    <td
                      key={`${column.key}-${index}`}
                      className={`px-4 py-4 ${
                        isRightAligned ? "text-right" : "text-left"
                      }`}
                    >
                      {column.render
                        ? column.render(value, row)
                        : String(value ?? "")}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>

      {showVisibleRowControl ? (
        <div className="flex flex-col gap-2 border-t border-accent-3 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-start gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-contrast/60">
              Rows per page
            </span>
            <CustomDropdown
              value={String(visibleRowCount)}
              options={visibleRowDropdownOptions}
              onChange={(value) => {
                const nextValue = Number.parseInt(value, 10);
                if (!Number.isInteger(nextValue)) return;
                setVisibleRowCount(nextValue);
                setCurrentPage(1);
              }}
              ariaLabel="Rows per page"
              menuPlacement="top"
              menuAlign="left"
              matchButtonWidth
              renderInPortal
              buttonClassName="h-8 min-w-[78px] justify-between rounded-lg bg-accent-1 px-2 text-xs"
              menuClassName="w-auto min-w-[78px]"
            />
            <span className="text-xs text-contrast/60">
              {totalRows === 0 ? "0-0 of 0" : `${pageStartIndex + 1}-${pageEndIndex} of ${totalRows}`}
            </span>
          </div>
          <div className="flex items-center justify-start gap-2 sm:justify-end">
            <button
              type="button"
              className="rounded-lg border border-accent-3 bg-accent-1 px-3 py-1.5 text-xs font-medium text-contrast transition hover:border-brand/60 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage <= 1 || totalRows === 0}
            >
              Prev
            </button>
            <span className="text-xs text-contrast/70">
              Page {totalRows === 0 ? 0 : currentPage} / {totalRows === 0 ? 0 : totalPages}
            </span>
            <button
              type="button"
              className="rounded-lg border border-accent-3 bg-accent-1 px-3 py-1.5 text-xs font-medium text-contrast transition hover:border-brand/60 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage >= totalPages || totalRows === 0}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default DataTable;
