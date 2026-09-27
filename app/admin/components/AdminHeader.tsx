"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { supabase } from "@/lib/supabase";

const pageDetails = [
  {
    match: "/admin",
    title: "Dashboard",
    description: "Overview of your Doughy store.",
  },
  {
    match: "/admin/orders",
    title: "Orders",
    description: "Manage customer orders and fulfillment.",
  },
  {
    match: "/admin/products",
    title: "Products",
    description: "Manage your product catalog and pricing.",
  },
  {
    match: "/admin/customers",
    title: "Customers",
    description: "View and manage your customers.",
  },
  {
    match: "/admin/reports",
    title: "Reports",
    description: "Review store performance and activity.",
  },
  {
    match: "/admin/email-logs",
    title: "Email Logs",
    description: "Review order email delivery activity.",
  },
  {
    match: "/admin/settings",
    title: "Settings",
    description: "Manage store preferences and configuration.",
  },
];

export default function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();

  const [loggingOut, setLoggingOut] =
    useState(false);

  const currentPage = useMemo(() => {
    if (pathname === "/admin") {
      return pageDetails[0];
    }

    const matchedPage = pageDetails
      .slice(1)
      .find(
        (page) =>
          pathname === page.match ||
          pathname.startsWith(
            `${page.match}/`
          )
      );

    return (
      matchedPage || {
        title: "Admin",
        description:
          "Manage your Doughy store.",
      }
    );
  }, [pathname]);

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      const { error } =
        await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      router.replace("/admin/login");
      router.refresh();
    } catch (error) {
      console.error(
        "Logout failed:",
        error
      );

      setLoggingOut(false);

      alert(
        "Unable to logout. Please try again."
      );
    }
  }

  return (
    <header className="mb-8">
      <div className="rounded-[30px] border border-white/70 bg-[#fff8f5]/90 px-5 py-5 shadow-[10px_10px_24px_#d8c5c0,-8px_-8px_20px_#ffffff] backdrop-blur-xl sm:px-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          {/* Page Info */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#df91a0]" />

              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#bd7885]">
                Doughy Admin
              </p>
            </div>

            <h1 className="text-2xl font-black tracking-tight text-[#342828] sm:text-3xl">
              {currentPage.title}
            </h1>

            <p className="mt-1 text-sm font-medium text-[#927b7b]">
              {currentPage.description}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-[#f9ebe2] px-4 py-2.5 text-xs font-black text-[#765f5f] shadow-[4px_4px_10px_#d8c5c0,-4px_-4px_10px_#ffffff] transition-all hover:-translate-y-0.5 hover:text-[#c97888]"
            >
              View Store
              <span>↗</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex items-center justify-center rounded-full bg-[#f6dfe3] px-5 py-2.5 text-xs font-black text-[#a95465] shadow-[4px_4px_10px_#d8c5c0,-4px_-4px_10px_#ffffff] transition-all hover:-translate-y-0.5 hover:bg-[#f2d1d7] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loggingOut
                ? "Logging out..."
                : "Logout"}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}