"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type AdminSidebarProps = {
  pendingOrders?: number;
  failedEmailCount?: number;
};

const navigation = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: "⌂",
  },
  {
    name: "Orders",
    href: "/admin/orders",
    icon: "📦",
  },
  {
    name: "Products",
    href: "/admin/products",
    icon: "🍩",
  },
  {
    name: "Customers",
    href: "/admin/customers",
    icon: "👥",
  },
  {
    name: "Reports",
    href: "/admin/reports",
    icon: "📊",
  },
  {
    name: "Email Logs",
    href: "/admin/email-logs",
    icon: "✉",
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: "⚙️",
  },
];

export default function AdminSidebar({
  pendingOrders = 0,
  failedEmailCount = 0,
}: AdminSidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin") {
      return pathname === "/admin";
    }

    return (
      pathname === href ||
      pathname.startsWith(
        `${href}/`
      )
    );
  }

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[280px] border-r border-white/70 bg-[#fff8f5]/95 shadow-[10px_0_30px_rgba(92,64,64,0.06)] backdrop-blur-xl lg:flex lg:flex-col">
      {/* Brand */}
      <div className="px-6 pb-5 pt-7">
        <Link
          href="/admin"
          className="flex items-center gap-4 rounded-[24px] px-2 py-2"
        >
          <div className="flex h-13 w-13 h-[52px] w-[52px] items-center justify-center rounded-[18px] bg-[#f7e7df] text-2xl shadow-[inset_3px_3px_8px_#e4d1ca,inset_-3px_-3px_8px_#ffffff]">
            🍩
          </div>

          <div className="min-w-0">
            <p className="text-xl font-black tracking-[-0.03em] text-[#342828]">
              Doughy
            </p>

            <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.22em] text-[#c77c89]">
              Store Admin
            </p>
          </div>
        </Link>
      </div>

      {/* Divider */}
      <div className="mx-6 h-px bg-[#eddcd6]" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-6">
        <p className="mb-3 px-4 text-[9px] font-black uppercase tracking-[0.22em] text-[#b19a9a]">
          Management
        </p>

        <div className="space-y-2">
          {navigation.map((item) => {
            const active =
              isActive(item.href);

            const showOrderBadge =
              item.href ===
                "/admin/orders" &&
              pendingOrders > 0;

            const showEmailBadge =
              item.href ===
                "/admin/email-logs" &&
              failedEmailCount > 0;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center gap-3 rounded-[20px] px-3.5 py-3 text-sm font-black transition-all duration-200 ${
                  active
                    ? "bg-[#df91a0] text-white shadow-[6px_6px_14px_#d9c6c0,-4px_-4px_10px_#ffffff]"
                    : "text-[#806d6d] hover:translate-x-1 hover:bg-[#f8e9e2] hover:text-[#c97888]"
                }`}
              >
                {/* Active indicator */}
                {active && (
                  <span className="absolute -left-1 h-7 w-1 rounded-full bg-white/90" />
                )}

                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] text-base transition ${
                    active
                      ? "bg-white/20"
                      : "bg-[#f7e7df] group-hover:bg-[#f1d8dc]"
                  }`}
                >
                  {item.icon}
                </span>

                <span className="min-w-0 flex-1">
                  {item.name}
                </span>

                {showOrderBadge && (
                  <span
                    className={`flex min-w-6 items-center justify-center rounded-full px-2 py-1 text-[9px] font-black ${
                      active
                        ? "bg-white text-[#c97888]"
                        : "bg-[#df91a0] text-white"
                    }`}
                  >
                    {pendingOrders >
                    99
                      ? "99+"
                      : pendingOrders}
                  </span>
                )}

                {showEmailBadge && (
                  <span
                    className={`flex min-w-6 items-center justify-center rounded-full px-2 py-1 text-[9px] font-black ${
                      active
                        ? "bg-white text-[#a84f61]"
                        : "bg-[#a84f61] text-white"
                    }`}
                  >
                    {failedEmailCount >
                    99
                      ? "99+"
                      : failedEmailCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <p className="mb-3 px-4 text-[9px] font-black uppercase tracking-[0.22em] text-[#b19a9a]">
            Quick Actions
          </p>

          <Link
            href="/admin/products/new"
            className="group flex items-center gap-3 rounded-[20px] border border-white/60 bg-[#f8e9e2] px-3.5 py-3 text-sm font-black text-[#806d6d] shadow-[4px_4px_10px_#ddcbc5,-4px_-4px_10px_#ffffff] transition-all hover:-translate-y-0.5 hover:text-[#c97888]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#fff8f5] text-lg transition group-hover:rotate-90">
              ＋
            </span>

            Add Product
          </Link>
        </div>
      </nav>

      {/* Footer Profile */}
      <div className="border-t border-[#eddcd6] p-5">
        <div className="rounded-[24px] border border-white/60 bg-[#f8e9e2] p-4 shadow-[4px_4px_10px_#ddcbc5,-4px_-4px_10px_#ffffff]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#df91a0] text-sm font-black text-white shadow-sm">
              D
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-black text-[#342828]">
                Doughy Admin
              </p>

              <p className="mt-0.5 truncate text-[9px] font-black uppercase tracking-[0.12em] text-[#a78e8e]">
                Store Management
              </p>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-[9px] font-bold text-[#b19a9a]">
          Doughy Admin Dashboard
        </p>
      </div>
    </aside>
  );
}