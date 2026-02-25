import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AdminSidebar from "@/components/AdminSidebar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Loyale Admin",
  description: "Referral and platform admin tools",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-primary text-contrast antialiased`}
      >
        <div className="min-h-screen bg-primary">
          <div className="mx-auto flex min-h-screen max-w-[1600px]">
            <AdminSidebar />
            <main className="min-w-0 flex-1 p-4 md:p-6">
              <div className="rounded-2xl border border-accent-3 bg-accent-1/40 p-4 md:p-6">
                {children}
              </div>
            </main>
          </div>
        </div>
        <ToastContainer
          position="bottom-right"
          autoClose={2500}
          hideProgressBar
          newestOnTop
          theme="dark"
          toastClassName="!bg-accent-1 !text-contrast !border !border-accent-3"
        />
      </body>
    </html>
  );
}
