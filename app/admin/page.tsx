"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabase";

type Order = {
  id: number;
  customer_name: string | null;
  customer_email: string | null;
  total: number | null;
  status: string | null;
  created_at: string;
};

type Product = {
  id: number;
};

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [productCount, setProductCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  async function loadDashboard() {
    setLoading(true);
    setErrorMessage("");

    try {
      const [
        ordersResult,
        productsResult,
      ] = await Promise.all([
        supabase
          .from("orders")
          .select(
            `
              id,
              customer_name,
              customer_email,
              total,
              status,
              created_at
            `
          )
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("products")
          .select("id"),
      ]);

      if (ordersResult.error) {
        throw new Error(
          ordersResult.error.message ||
            "Unable to load orders."
        );
      }

      if (productsResult.error) {
        throw new Error(
          productsResult.error.message ||
            "Unable to load products."
        );
      }

      const loadedOrders =
        (ordersResult.data as Order[]) || [];

      const loadedProducts =
        (productsResult.data as Product[]) || [];

      setOrders(loadedOrders);
      setProductCount(loadedProducts.length);


    } catch (error) {
      console.error(
        "Dashboard loading failed:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();

    const ordersChannel = supabase
      .channel("admin-dashboard-orders-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          console.log(
            "Admin Dashboard realtime event:",
            payload
          );

          if (payload.eventType === "INSERT") {
            const newOrder = payload.new as Order;

            setOrders((current) => {
              const alreadyExists = current.some(
                (order) => order.id === newOrder.id
              );

              if (alreadyExists) {
                return current;
              }

              return [newOrder, ...current].sort(
                (a, b) =>
                  new Date(b.created_at).getTime() -
                  new Date(a.created_at).getTime()
              );
            });

            return;
          }

          if (payload.eventType === "UPDATE") {
            const updatedOrder = payload.new as Order;

            setOrders((current) =>
              current.map((order) =>
                order.id === updatedOrder.id
                  ? updatedOrder
                  : order
              )
            );

            return;
          }

          if (payload.eventType === "DELETE") {
            const deletedOrder = payload.old as {
              id?: number;
            };

            if (!deletedOrder.id) {
              return;
            }

            setOrders((current) =>
              current.filter(
                (order) => order.id !== deletedOrder.id
              )
            );
          }
        }
      )
      .subscribe((status) => {
        console.log(
          "Admin Dashboard realtime subscription:",
          status
        );

        if (status === "SUBSCRIBED") {
          setRealtimeConnected(true);
          return;
        }

        if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          setRealtimeConnected(false);
        }
      });

    return () => {
      setRealtimeConnected(false);
      supabase.removeChannel(ordersChannel);
    };
  }, []);

  const totalOrders = orders.length;

  const totalRevenue = useMemo(() => {
    return orders.reduce((sum, order) => {
      if (
        (order.status || "").toLowerCase() ===
        "cancelled"
      ) {
        return sum;
      }

      return sum + Number(order.total || 0);
    }, 0);
  }, [orders]);

  const pendingOrders = useMemo(() => {
    return orders.filter(
      (order) =>
        (order.status || "pending")
          .toLowerCase() === "pending"
    ).length;
  }, [orders]);

  const completedOrders = useMemo(() => {
    return orders.filter(
      (order) =>
        (order.status || "")
          .toLowerCase() === "completed"
    ).length;
  }, [orders]);

  const customerCount = useMemo(() => {
    const uniqueCustomers = new Set(
      orders
        .map((order) =>
          order.customer_email
            ?.trim()
            .toLowerCase()
        )
        .filter(Boolean)
    );

    return uniqueCustomers.size;
  }, [orders]);

  function formatCurrency(value: number) {
    return Number(value || 0).toLocaleString(
      "en-PH",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString(
      "en-PH",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  }

  function getStatusStyle(status: string | null) {
    switch (
      (status || "pending").toLowerCase()
    ) {
      case "completed":
        return "bg-[#e4f6e9] text-[#4f8a61]";

      case "cancelled":
        return "bg-[#fce4e7] text-[#a84f61]";

      case "confirmed":
        return "bg-[#e7efff] text-[#4c69a8]";

      case "preparing":
        return "bg-[#fff1d8] text-[#a76b25]";

      case "out_for_delivery":
      case "out for delivery":
        return "bg-[#eee5ff] text-[#7652a8]";

      default:
        return "bg-[#f9ebe2] text-[#806e6e]";
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7eee9] px-6 py-10 text-[#2d2424]">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[30px] bg-[#fff8f5] p-16 text-center shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff]">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#f1d8d1] border-t-[#e8a0ad]" />

            <p className="mt-5 text-sm font-bold text-[#806e6e]">
              Loading dashboard...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7eee9] px-6 py-10 text-[#2d2424]">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#c97888]">
              Doughy Admin
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
              Dashboard
            </h1>

            <p className="mt-3 text-[#806e6e]">
              Manage your Doughy store from one
              place.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-black ${
                realtimeConnected
                  ? "bg-[#e4f6e9] text-[#4f8a61]"
                  : "bg-[#f3e8e4] text-[#806e6e]"
              }`}
            >
              <span className="relative flex h-2.5 w-2.5">
                {realtimeConnected && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#6aa67a] opacity-50" />
                )}

                <span
                  className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                    realtimeConnected
                      ? "bg-[#4f8a61]"
                      : "bg-[#a58f8f]"
                  }`}
                />
              </span>

              {realtimeConnected
                ? "Live Dashboard"
                : "Connecting..."}
            </div>

            <button
              type="button"
              onClick={loadDashboard}
              disabled={loading}
              className="rounded-full bg-[#e8a0ad] px-7 py-3.5 text-sm font-bold text-white shadow-[5px_5px_12px_#d8c5c0,-4px_-4px_10px_#ffffff] transition hover:-translate-y-0.5 hover:bg-[#d88a9a] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4">
                  <RefreshIcon />
                </span>
                Refresh
              </span>
            </button>
          </div>
        </div>

        {/* ERROR */}

        {errorMessage && (
          <div className="mt-8 rounded-[20px] border border-[#efb9c1] bg-[#fce4e7] px-5 py-4 text-sm font-semibold text-[#a84f61]">
            <p className="font-black">
              Something went wrong
            </p>

            <p className="mt-1 break-words font-medium">
              {errorMessage}
            </p>
          </div>
        )}

        {/* STATISTICS */}

        <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

          {/* ORDERS */}

          <div className="rounded-[28px] bg-[#fff8f5] p-6 shadow-[8px_8px_18px_#d8c5c0,-6px_-6px_15px_#ffffff]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                Total Orders
              </p>

              <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#f9ebe2] text-[#c97888]">
                <span className="h-5 w-5">
                  <OrdersIcon />
                </span>
              </span>
            </div>

            <p className="mt-5 text-4xl font-black">
              {totalOrders}
            </p>
          </div>

          {/* REVENUE */}

          <div className="rounded-[28px] bg-[#fff8f5] p-6 shadow-[8px_8px_18px_#d8c5c0,-6px_-6px_15px_#ffffff]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                Active Revenue
              </p>

              <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#f9ebe2] text-[#c97888]">
                <span className="h-5 w-5">
                  <RevenueIcon />
                </span>
              </span>
            </div>

            <p className="mt-5 text-2xl font-black text-[#c97888]">
              ₱{formatCurrency(totalRevenue)}
            </p>

            <p className="mt-2 text-xs font-semibold text-[#a58f8f]">
              Excludes cancelled orders
            </p>
          </div>

          {/* CUSTOMERS */}

          <div className="rounded-[28px] bg-[#fff8f5] p-6 shadow-[8px_8px_18px_#d8c5c0,-6px_-6px_15px_#ffffff]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                Customers
              </p>

              <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#f9ebe2] text-[#c97888]">
                <span className="h-5 w-5">
                  <CustomersIcon />
                </span>
              </span>
            </div>

            <p className="mt-5 text-4xl font-black">
              {customerCount}
            </p>
          </div>

          {/* PRODUCTS */}

          <div className="rounded-[28px] bg-[#fff8f5] p-6 shadow-[8px_8px_18px_#d8c5c0,-6px_-6px_15px_#ffffff]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                Products
              </p>

              <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#f9ebe2] text-[#c97888]">
                <span className="h-5 w-5">
                  <DonutIcon />
                </span>
              </span>
            </div>

            <p className="mt-5 text-4xl font-black">
              {productCount}
            </p>
          </div>
        </div>

        {/* ORDER STATUS SUMMARY */}

        <div className="mt-6 grid gap-5 sm:grid-cols-2">

          <div className="rounded-[28px] bg-[#fff8f5] p-6 shadow-[8px_8px_18px_#d8c5c0,-6px_-6px_15px_#ffffff]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                  Pending Orders
                </p>

                <p className="mt-3 text-3xl font-black text-[#a76b25]">
                  {pendingOrders}
                </p>
              </div>

              <span className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[#fff1d8] text-[#a76b25]">
                <span className="h-6 w-6">
                  <ClockIcon />
                </span>
              </span>
            </div>

            <Link
              href="/admin/orders"
              className="mt-5 inline-block text-sm font-bold text-[#c97888] hover:text-[#a85f70]"
            >
              <span className="inline-flex items-center gap-1.5">
                Manage Orders
                <span className="h-4 w-4">
                  <ArrowRightIcon />
                </span>
              </span>
            </Link>
          </div>

          <div className="rounded-[28px] bg-[#fff8f5] p-6 shadow-[8px_8px_18px_#d8c5c0,-6px_-6px_15px_#ffffff]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                  Completed Orders
                </p>

                <p className="mt-3 text-3xl font-black text-[#4f8a61]">
                  {completedOrders}
                </p>
              </div>

              <span className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[#e4f6e9] text-[#4f8a61]">
                <span className="h-6 w-6">
                  <CheckCircleIcon />
                </span>
              </span>
            </div>

            <Link
              href="/admin/orders"
              className="mt-5 inline-block text-sm font-bold text-[#c97888] hover:text-[#a85f70]"
            >
              <span className="inline-flex items-center gap-1.5">
                View Orders
                <span className="h-4 w-4">
                  <ArrowRightIcon />
                </span>
              </span>
            </Link>
          </div>

        </div>

        {/* QUICK ACTIONS */}

        <section className="mt-8 rounded-[30px] bg-[#fff8f5] p-6 shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff] sm:p-8">

          <p className="text-sm font-bold uppercase tracking-wider text-[#c97888]">
            Quick Actions
          </p>

          <h2 className="mt-2 text-2xl font-black">
            Store Management
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <Link
              href="/admin/orders"
              className="rounded-[22px] bg-[#f9ebe2] p-5 transition hover:-translate-y-1"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#f9ebe2] text-[#c97888]">
                <span className="h-5 w-5">
                  <OrdersIcon />
                </span>
              </span>

              <p className="mt-3 font-black">
                Manage Orders
              </p>

              <p className="mt-1 text-sm text-[#806e6e]">
                View and update orders.
              </p>
            </Link>

            <Link
              href="/admin/products"
              className="rounded-[22px] bg-[#f9ebe2] p-5 transition hover:-translate-y-1"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#f9ebe2] text-[#c97888]">
                <span className="h-5 w-5">
                  <DonutIcon />
                </span>
              </span>

              <p className="mt-3 font-black">
                Manage Products
              </p>

              <p className="mt-1 text-sm text-[#806e6e]">
                Add, edit, or delete products.
              </p>
            </Link>

            <Link
              href="/admin/products/new"
              className="rounded-[22px] bg-[#f9ebe2] p-5 transition hover:-translate-y-1"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#fff8f5] text-[#c97888] shadow-[3px_3px_8px_#dfccc6,-3px_-3px_8px_#ffffff]">
                <span className="h-5 w-5">
                  <PlusIcon />
                </span>
              </span>

              <p className="mt-3 font-black">
                Add Product
              </p>

              <p className="mt-1 text-sm text-[#806e6e]">
                Create a new store product.
              </p>
            </Link>

            <Link
              href="/admin/customers"
              className="rounded-[22px] bg-[#f9ebe2] p-5 transition hover:-translate-y-1"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#f9ebe2] text-[#c97888]">
                <span className="h-5 w-5">
                  <CustomersIcon />
                </span>
              </span>

              <p className="mt-3 font-black">
                Customers
              </p>

              <p className="mt-1 text-sm text-[#806e6e]">
                View customer information.
              </p>
            </Link>

          </div>
        </section>

        {/* RECENT ORDERS */}

        <section className="mt-8 overflow-hidden rounded-[30px] bg-[#fff8f5] shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff]">

          <div className="flex flex-col gap-3 border-b border-[#ead8d1] p-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">

            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-[#c97888]">
                Latest Activity
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Recent Orders
              </h2>
            </div>

            <Link
              href="/admin/orders"
              className="text-sm font-bold text-[#c97888] hover:text-[#a85f70]"
            >
              <span className="inline-flex items-center gap-1.5">
                View All Orders
                <span className="h-4 w-4">
                  <ArrowRightIcon />
                </span>
              </span>
            </Link>

          </div>

          {orders.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#f9ebe2] text-[#c97888] shadow-[inset_4px_4px_10px_#ddcac4,inset_-4px_-4px_10px_#ffffff]">
                <span className="h-7 w-7">
                  <OrdersIcon />
                </span>
              </div>

              <h3 className="mt-4 text-xl font-black">
                No orders yet
              </h3>

              <p className="mt-2 text-sm text-[#806e6e]">
                Orders will appear here when
                customers place them.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#ead8d1]">

              {orders
                .slice(0, 8)
                .map((order) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="block p-6 transition hover:bg-[#fff3ef] sm:px-8"
                  >

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                      <div className="min-w-0">

                        <div className="flex flex-wrap items-center gap-3">

                          <p className="font-black">
                            Order #{order.id}
                          </p>

                          <span
                            className={`rounded-full px-3 py-1.5 text-xs font-bold ${getStatusStyle(
                              order.status
                            )}`}
                          >
                            {order.status ||
                              "Pending"}
                          </span>

                        </div>

                        <p className="mt-2 font-semibold text-[#806e6e]">
                          {order.customer_name ||
                            "Customer"}
                        </p>

                        <p className="mt-1 break-all text-xs text-[#a58f8f]">
                          {order.customer_email ||
                            "No email"}
                        </p>

                        <p className="mt-2 text-xs text-[#a58f8f]">
                          {formatDate(
                            order.created_at
                          )}
                        </p>

                      </div>

                      <div className="shrink-0 sm:text-right">

                        <p className="text-lg font-black text-[#c97888]">
                          ₱
                          {formatCurrency(
                            Number(
                              order.total || 0
                            )
                          )}
                        </p>

                        <p className="mt-1 text-xs font-bold text-[#a58f8f]">
                          <span className="inline-flex items-center gap-1">
                            View Details
                            <span className="h-3.5 w-3.5">
                              <ArrowRightIcon />
                            </span>
                          </span>
                        </p>

                      </div>

                    </div>

                  </Link>
                ))}

            </div>
          )}

        </section>

        {/* FOOTER */}

        <div className="mt-8 text-center text-xs font-semibold text-[#a58f8f]">
          Doughy Admin Panel
        </div>

      </div>
    </main>
  );
}

/* =========================================================
   DOUGHY ADMIN DASHBOARD SVG ICONS
========================================================= */

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true">
      <path d="M19 8A7 7 0 1 0 19.5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M19 4V8H15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function OrdersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true">
      <path d="M4 7.5L12 3.5L20 7.5V17L12 21L4 17V7.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M4.5 7.7L12 11.5L19.5 7.7M12 11.5V20.5" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

function RevenueIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M14.8 8.5H10.8C9.7 8.5 9 9.1 9 10C9 10.9 9.7 11.4 10.8 11.6L13.2 12C14.4 12.2 15 12.8 15 13.7C15 14.7 14.2 15.5 13 15.5H9.2M12 6.8V17.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function CustomersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true">
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3.8 18C4.2 14.8 6.1 13 9 13C11.9 13 13.8 14.8 14.2 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="17" cy="9" r="2.3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M15.5 14C18.2 13.6 20 15 20.4 17.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function DonutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5.2 9.5C7.5 7.7 9.4 8.8 11.2 7.6C13.4 6.2 15.2 8.1 18.7 8.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7.5V12L15 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 12.2L10.7 15L16.5 9" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true">
      <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true">
      <path d="M5 12H19M14 7L19 12L14 17" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

