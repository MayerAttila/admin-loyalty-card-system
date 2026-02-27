"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import AdminSidebar from "@/components/AdminSidebar";

export default function AdminLayoutShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isLoginRoute = pathname === "/login";

  if (isLoginRoute) {
    return (
      <div className="min-h-screen bg-primary text-contrast">
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-primary text-contrast">
      <AdminSidebar />
      <main className="min-w-0 flex-1 px-6 py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
