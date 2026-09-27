"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";

type Order = {
  id: number;
  customer_name: string;
  customer_email: string;
  total: number;
  status: string | null;
  created_at: string;
};

type OrderItem = {
  id: number;
  order_id: number;
  product_id: number | null;
  product_name: string;
  price: number;
  quantity: number;
  created_at: string;
};

type RangeKey =
  | "7d"
  | "30d"
  | "90d"
  | "all";

const rangeOptions: {
  value: RangeKey;
  label: string;
}[] = [
  {
    value: "7d",
    label: "Last 7 Days",
  },
  {
    value: "30d",
    label: "Last 30 Days",
  },
  {
    value: "90d",
    label: "Last 90 Days",
  },
  {
    value: "all",
    label: "All Time",
  },
];

export default function AdminReportsPage() {
  const [orders, setOrders] =
    useState<Order[]>([]);

  const [orderItems, setOrderItems] =
    useState<OrderItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [range, setRange] =
    useState<RangeKey>("30d");

  const [
    realtimeConnected,
    setRealtimeConnected,
  ] = useState(false);

  async function loadReports(
    showLoading = true
  ) {
    if (showLoading) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    setErrorMessage("");

    try {
      const [
        ordersResult,
        itemsResult,
      ] = await Promise.all([
        supabase
          .from("orders")
          .select(
            "id, customer_name, customer_email, total, status, created_at"
          )
          .order("created_at", {
            ascending: false,
          }),
        supabase
          .from("order_items")
          .select(
            "id, order_id, product_id, product_name, price, quantity, created_at"
          )
          .order("created_at", {
            ascending: false,
          }),
      ]);

      if (ordersResult.error) {
        throw ordersResult.error;
      }

      if (itemsResult.error) {
        throw itemsResult.error;
      }

      setOrders(
        (ordersResult.data || []) as Order[]
      );

      setOrderItems(
        (itemsResult.data ||
          []) as OrderItem[]
      );
    } catch (error) {
      console.warn(
        "Reports loading failed:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load reports."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadReports();

    const ordersChannel = supabase
      .channel(
        "admin-reports-orders"
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          loadReports(false);
        }
      )
      .subscribe((status) => {
        setRealtimeConnected(
          status === "SUBSCRIBED"
        );
      });

    const itemsChannel = supabase
      .channel(
        "admin-reports-order-items"
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "order_items",
        },
        () => {
          loadReports(false);
        }
      )
      .subscribe();

    return () => {
      setRealtimeConnected(false);

      supabase.removeChannel(
        ordersChannel
      );

      supabase.removeChannel(
        itemsChannel
      );
    };
  }, []);

  function getStartDate() {
    if (range === "all") {
      return null;
    }

    const days =
      range === "7d"
        ? 7
        : range === "30d"
          ? 30
          : 90;

    const start = new Date();

    start.setDate(
      start.getDate() - days
    );

    return start;
  }

  const filteredOrders =
    useMemo(() => {
      const start = getStartDate();

      if (!start) {
        return orders;
      }

      return orders.filter(
        (order) =>
          new Date(
            order.created_at
          ) >= start
      );
    }, [orders, range]);

  const filteredOrderIds =
    useMemo(() => {
      return new Set(
        filteredOrders.map(
          (order) => order.id
        )
      );
    }, [filteredOrders]);

  const filteredItems =
    useMemo(() => {
      return orderItems.filter(
        (item) =>
          filteredOrderIds.has(
            item.order_id
          )
      );
    }, [
      orderItems,
      filteredOrderIds,
    ]);

  const nonCancelledOrders =
    useMemo(() => {
      return filteredOrders.filter(
        (order) =>
          (order.status || "")
            .toLowerCase() !==
          "cancelled"
      );
    }, [filteredOrders]);

  const completedOrders =
    useMemo(() => {
      return filteredOrders.filter(
        (order) =>
          (order.status || "")
            .toLowerCase() ===
          "completed"
      );
    }, [filteredOrders]);

  const totalRevenue =
    useMemo(() => {
      return nonCancelledOrders.reduce(
        (sum, order) =>
          sum +
          Number(order.total || 0),
        0
      );
    }, [nonCancelledOrders]);

  const averageOrderValue =
    nonCancelledOrders.length > 0
      ? totalRevenue /
        nonCancelledOrders.length
      : 0;

  const completionRate =
    filteredOrders.length > 0
      ? Math.round(
          (completedOrders.length /
            filteredOrders.length) *
            100
        )
      : 0;

  const uniqueCustomers =
    useMemo(() => {
      const emails = new Set(
        filteredOrders
          .map((order) =>
            order.customer_email
              ?.trim()
              .toLowerCase()
          )
          .filter(Boolean)
      );

      return emails.size;
    }, [filteredOrders]);

  const statusBreakdown =
    useMemo(() => {
      const counts =
        new Map<string, number>();

      for (const order of filteredOrders) {
        const status =
          (
            order.status ||
            "pending"
          ).toLowerCase();

        counts.set(
          status,
          (counts.get(status) || 0) +
            1
        );
      }

      return Array.from(
        counts.entries()
      )
        .map(
          ([status, count]) => ({
            status,
            count,
            percent:
              filteredOrders.length > 0
                ? Math.round(
                    (count /
                      filteredOrders.length) *
                      100
                  )
                : 0,
          })
        )
        .sort(
          (a, b) =>
            b.count - a.count
        );
    }, [filteredOrders]);

  const topProducts =
    useMemo(() => {
      const map = new Map<
        string,
        {
          product_name: string;
          quantity: number;
          revenue: number;
        }
      >();

      for (const item of filteredItems) {
        const key =
          item.product_name ||
          "Unknown Product";

        const current =
          map.get(key) || {
            product_name: key,
            quantity: 0,
            revenue: 0,
          };

        current.quantity +=
          Number(item.quantity || 0);

        current.revenue +=
          Number(item.price || 0) *
          Number(item.quantity || 0);

        map.set(key, current);
      }

      return Array.from(
        map.values()
      )
        .sort(
          (a, b) =>
            b.quantity - a.quantity
        )
        .slice(0, 5);
    }, [filteredItems]);

  const dailyRevenue =
    useMemo(() => {
      const map = new Map<
        string,
        number
      >();

      for (const order of nonCancelledOrders) {
        const date =
          new Date(
            order.created_at
          );

        const key =
          date.toLocaleDateString(
            "en-CA"
          );

        map.set(
          key,
          (map.get(key) || 0) +
            Number(order.total || 0)
        );
      }

      return Array.from(
        map.entries()
      )
        .map(([date, revenue]) => ({
          date,
          revenue,
        }))
        .sort(
          (a, b) =>
            new Date(
              a.date
            ).getTime() -
            new Date(
              b.date
            ).getTime()
        )
        .slice(-14);
    }, [nonCancelledOrders]);

  const maxDailyRevenue =
    Math.max(
      ...dailyRevenue.map(
        (item) => item.revenue
      ),
      1
    );

  function formatCurrency(
    value: number
  ) {
    return Number(
      value || 0
    ).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function formatShortDate(
    value: string
  ) {
    return new Date(
      `${value}T00:00:00`
    ).toLocaleDateString(
      "en-PH",
      {
        month: "short",
        day: "numeric",
      }
    );
  }

  function formatStatus(
    value: string
  ) {
    return value
      .split("_")
      .map(
        (word) =>
          word.charAt(0).toUpperCase() +
          word.slice(1)
      )
      .join(" ");
  }

  function getStatusClasses(
    status: string
  ) {
    switch (status) {
      case "completed":
        return "bg-[#e4f6e9] text-[#4f8a61]";

      case "cancelled":
        return "bg-[#fce4e7] text-[#a84f61]";

      case "confirmed":
        return "bg-[#e7efff] text-[#4c69a8]";

      case "preparing":
        return "bg-[#fff0d9] text-[#a66b24]";

      case "out_for_delivery":
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
              Loading reports...
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
            <Link
              href="/admin"
              className="text-sm font-bold text-[#c97888] transition hover:text-[#a85f70]"
            >
              ← Back to Dashboard
            </Link>

            <p className="mt-8 text-sm font-bold uppercase tracking-[0.25em] text-[#c97888]">
              Doughy Admin
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
              Reports & Analytics
            </h1>

            <p className="mt-3 max-w-2xl text-[#806e6e]">
              Track store performance,
              revenue, order activity, and
              best-selling products.
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
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  realtimeConnected
                    ? "bg-[#4f8a61]"
                    : "bg-[#a58f8f]"
                }`}
              />

              {realtimeConnected
                ? "Reports Live"
                : "Connecting..."}
            </div>

            <button
              type="button"
              onClick={() =>
                loadReports(false)
              }
              disabled={refreshing}
              className="rounded-full bg-[#fff8f5] px-5 py-3 text-xs font-black text-[#806e6e] shadow-[5px_5px_12px_#d8c5c0,-4px_-4px_10px_#ffffff] transition hover:-translate-y-0.5 hover:text-[#c97888] disabled:opacity-60"
            >
              {refreshing
                ? "Refreshing..."
                : "↻ Refresh"}
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-7 rounded-2xl border border-[#efb9c1] bg-[#fce4e7] px-5 py-4 text-sm font-bold text-[#a84f61]">
            ✕ {errorMessage}
          </div>
        )}

        {/* RANGE FILTER */}

        <div className="mt-8 flex flex-wrap gap-2">
          {rangeOptions.map(
            (option) => (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  setRange(
                    option.value
                  )
                }
                className={`rounded-full px-5 py-3 text-xs font-black transition ${
                  range === option.value
                    ? "bg-[#e8a0ad] text-white shadow-[5px_5px_12px_#d8c5c0,-4px_-4px_10px_#ffffff]"
                    : "bg-[#fff8f5] text-[#806e6e] shadow-[4px_4px_10px_#d8c5c0,-3px_-3px_8px_#ffffff] hover:text-[#c97888]"
                }`}
              >
                {option.label}
              </button>
            )
          )}
        </div>

        {/* STATS */}

        <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-[28px] bg-[#fff8f5] p-6 shadow-[8px_8px_18px_#d8c5c0,-7px_-7px_16px_#ffffff]">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#a58f8f]">
              Revenue
            </p>

            <p className="mt-3 text-2xl font-black text-[#c97888]">
              ₱{formatCurrency(
                totalRevenue
              )}
            </p>

            <p className="mt-2 text-sm text-[#806e6e]">
              Excludes cancelled
            </p>
          </div>

          <div className="rounded-[28px] bg-[#fff8f5] p-6 shadow-[8px_8px_18px_#d8c5c0,-7px_-7px_16px_#ffffff]">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#a58f8f]">
              Orders
            </p>

            <p className="mt-3 text-3xl font-black">
              {filteredOrders.length}
            </p>

            <p className="mt-2 text-sm text-[#806e6e]">
              Total in period
            </p>
          </div>

          <div className="rounded-[28px] bg-[#fff8f5] p-6 shadow-[8px_8px_18px_#d8c5c0,-7px_-7px_16px_#ffffff]">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#a58f8f]">
              Avg. Order
            </p>

            <p className="mt-3 text-2xl font-black">
              ₱{formatCurrency(
                averageOrderValue
              )}
            </p>

            <p className="mt-2 text-sm text-[#806e6e]">
              Average basket value
            </p>
          </div>

          <div className="rounded-[28px] bg-[#fff8f5] p-6 shadow-[8px_8px_18px_#d8c5c0,-7px_-7px_16px_#ffffff]">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#a58f8f]">
              Customers
            </p>

            <p className="mt-3 text-3xl font-black">
              {uniqueCustomers}
            </p>

            <p className="mt-2 text-sm text-[#806e6e]">
              Unique emails
            </p>
          </div>

          <div className="rounded-[28px] bg-[#fff8f5] p-6 shadow-[8px_8px_18px_#d8c5c0,-7px_-7px_16px_#ffffff]">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#4f8a61]">
              Completion
            </p>

            <p className="mt-3 text-3xl font-black text-[#4f8a61]">
              {completionRate}%
            </p>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e6e0dc]">
              <div
                className="h-full rounded-full bg-[#8ec79c] transition-all"
                style={{
                  width:
                    `${completionRate}%`,
                }}
              />
            </div>
          </div>
        </section>

        {/* REVENUE + STATUS */}

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-[30px] bg-[#fff8f5] p-6 shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff] sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-[#c97888]">
                  Revenue Trend
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  Recent Daily Sales
                </h2>
              </div>

              <span className="rounded-full bg-[#f9ebe2] px-4 py-2 text-xs font-black text-[#806e6e]">
                Last 14 active days
              </span>
            </div>

            {dailyRevenue.length === 0 ? (
              <div className="py-16 text-center text-sm font-semibold text-[#806e6e]">
                No sales data for this
                period.
              </div>
            ) : (
              <div className="mt-8 overflow-x-auto">
                <div className="flex min-w-[560px] items-end gap-3">
                  {dailyRevenue.map(
                    (item) => {
                      const height =
                        Math.max(
                          12,
                          Math.round(
                            (item.revenue /
                              maxDailyRevenue) *
                              180
                          )
                        );

                      return (
                        <div
                          key={item.date}
                          className="flex min-w-0 flex-1 flex-col items-center"
                        >
                          <div className="flex h-[210px] w-full items-end justify-center">
                            <div
                              title={`₱${formatCurrency(
                                item.revenue
                              )}`}
                              className="w-full max-w-10 rounded-t-[14px] bg-[#e8a0ad] transition-all hover:bg-[#d88a9a]"
                              style={{
                                height:
                                  `${height}px`,
                              }}
                            />
                          </div>

                          <p className="mt-3 text-[10px] font-black text-[#806e6e]">
                            {formatShortDate(
                              item.date
                            )}
                          </p>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-[30px] bg-[#fff8f5] p-6 shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff] sm:p-8">
            <p className="text-sm font-bold uppercase tracking-wider text-[#c97888]">
              Order Status
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Workflow Breakdown
            </h2>

            <div className="mt-7 space-y-5">
              {statusBreakdown.map(
                (item) => (
                  <div key={item.status}>
                    <div className="flex items-center justify-between gap-4">
                      <span
                        className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${getStatusClasses(
                          item.status
                        )}`}
                      >
                        {formatStatus(
                          item.status
                        )}
                      </span>

                      <span className="text-sm font-black">
                        {item.count}
                      </span>
                    </div>

                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#eee2dd]">
                      <div
                        className="h-full rounded-full bg-[#e8a0ad]"
                        style={{
                          width:
                            `${item.percent}%`,
                        }}
                      />
                    </div>

                    <p className="mt-1 text-right text-[10px] font-bold text-[#a58f8f]">
                      {item.percent}%
                    </p>
                  </div>
                )
              )}

              {statusBreakdown.length ===
                0 && (
                <p className="py-8 text-center text-sm font-semibold text-[#806e6e]">
                  No orders for this
                  period.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* TOP PRODUCTS */}

        <section className="mt-8 rounded-[30px] bg-[#fff8f5] p-6 shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff] sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-[#c97888]">
                Product Performance
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Top Selling Products
              </h2>
            </div>

            <Link
              href="/admin/products"
              className="text-sm font-black text-[#c97888] hover:text-[#a85f70]"
            >
              Manage Products →
            </Link>
          </div>

          <div className="mt-7 overflow-hidden rounded-[24px] bg-[#f9ebe2]">
            {topProducts.length > 0 ? (
              <div className="divide-y divide-[#ead8d0]">
                {topProducts.map(
                  (product, index) => (
                    <div
                      key={
                        product.product_name
                      }
                      className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff8f5] text-sm font-black text-[#c97888]">
                          #{index + 1}
                        </div>

                        <div>
                          <p className="font-black">
                            {
                              product.product_name
                            }
                          </p>

                          <p className="mt-1 text-xs font-semibold text-[#806e6e]">
                            {
                              product.quantity
                            }{" "}
                            item
                            {product.quantity ===
                            1
                              ? ""
                              : "s"}{" "}
                            sold
                          </p>
                        </div>
                      </div>

                      <p className="text-lg font-black text-[#c97888]">
                        ₱
                        {formatCurrency(
                          product.revenue
                        )}
                      </p>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="p-10 text-center">
                <div className="text-5xl">
                  🍩
                </div>

                <p className="mt-4 text-sm font-bold text-[#806e6e]">
                  No product sales data
                  yet.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* RECENT ORDERS */}

        <section className="mt-8 overflow-hidden rounded-[30px] bg-[#fff8f5] shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff]">
          <div className="flex flex-col gap-3 border-b border-[#ead8d0] p-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-[#c97888]">
                Recent Activity
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Orders in Period
              </h2>
            </div>

            <Link
              href="/admin/orders"
              className="text-sm font-black text-[#c97888] hover:text-[#a85f70]"
            >
              View All Orders →
            </Link>
          </div>

          {filteredOrders.length ===
          0 ? (
            <div className="p-12 text-center">
              <p className="text-sm font-bold text-[#806e6e]">
                No orders in this
                period.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#ead8d0]">
              {filteredOrders
                .slice(0, 8)
                .map((order) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="flex flex-col gap-4 px-6 py-5 transition hover:bg-[#f9ebe2]/60 sm:flex-row sm:items-center sm:justify-between sm:px-8"
                  >
                    <div>
                      <p className="font-black">
                        Order #{order.id}
                      </p>

                      <p className="mt-1 text-sm text-[#806e6e]">
                        {
                          order.customer_name
                        }
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <span
                        className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${getStatusClasses(
                          (
                            order.status ||
                            "pending"
                          ).toLowerCase()
                        )}`}
                      >
                        {formatStatus(
                          (
                            order.status ||
                            "pending"
                          ).toLowerCase()
                        )}
                      </span>

                      <span className="font-black text-[#c97888]">
                        ₱
                        {formatCurrency(
                          Number(
                            order.total ||
                              0
                          )
                        )}
                      </span>
                    </div>
                  </Link>
                ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
