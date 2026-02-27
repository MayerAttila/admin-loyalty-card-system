"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiLink,
  FiLogOut,
  FiShield,
  FiStar,
} from "react-icons/fi";
import { signOut } from "@/api/client/auth.api";

const navItems = [
  { href: "/referrals", label: "Referrals", icon: FiLink },
];

const AdminSidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const activePath = useMemo(() => pathname ?? "/", [pathname]);

  return (
    <>
      {!mobileOpen ? (
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setMobileOpen(true)}
          className="fixed left-4 top-4 z-[60] rounded-lg border border-accent-4 bg-accent-1 p-2 text-contrast shadow md:hidden"
        >
          <FiChevronRight className="h-4 w-4" />
        </button>
      ) : null}

      {mobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col overflow-hidden border-r border-accent-3 bg-accent-1 transition-transform duration-200 md:inset-y-auto md:left-auto md:sticky md:top-0 md:h-screen md:translate-x-0 md:transition-[width] md:duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "md:w-16" : "md:w-64"}`}
      >
        <div className="flex items-center justify-between px-4 py-5">
          <div
            className={`flex min-w-0 items-center gap-3 overflow-hidden transition-all ${
              collapsed ? "opacity-0" : "opacity-100"
            }`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent-3 bg-accent-2 text-brand">
              <FiShield className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex flex-col justify-center">
              <p className="truncate text-xs text-contrast/70">Loyale</p>
              <h1 className="truncate whitespace-nowrap text-base font-semibold text-brand">
                Admin Portal
              </h1>
            </div>
          </div>

          <button
            type="button"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setCollapsed((prev) => !prev)}
            className="hidden rounded-lg border border-accent-4 p-2 text-contrast transition hover:bg-accent-2 md:inline-flex"
          >
            {collapsed ? (
              <FiChevronRight className="h-4 w-4" />
            ) : (
              <FiChevronLeft className="h-4 w-4" />
            )}
          </button>

          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg border border-accent-4 p-2 text-contrast transition hover:bg-accent-2 md:hidden"
          >
            <FiChevronLeft className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activePath === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                aria-label={item.label}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "border-brand/40 bg-brand/10 text-brand"
                    : "border-transparent text-contrast hover:border-accent-4 hover:bg-accent-2"
                } ${collapsed ? "justify-center" : ""}`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed ? <span className="whitespace-nowrap">{item.label}</span> : null}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-accent-3 px-3 py-4">
          <div className="flex items-start gap-2 rounded-xl border border-accent-3 bg-primary/30 p-3">
            <FiStar className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            {!collapsed ? (
              <p className="text-xs leading-relaxed text-contrast/75">
                Admin-only tools for referral links and future partner features.
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={async () => {
              await signOut();
              router.push("/login");
            }}
            title="Sign out"
            aria-label="Sign out"
            className={`flex w-full items-center gap-3 rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-primary transition hover:brightness-110 ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <FiLogOut className="h-5 w-5 shrink-0 text-primary" />
            {!collapsed ? <span className="whitespace-nowrap">Sign out</span> : null}
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
