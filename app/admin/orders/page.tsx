"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabase";

type Order = {
  id: number;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  delivery_address: string | null;
  delivery_city: string | null;
  order_notes: string | null;
  payment_method: string | null;
  subtotal: number | null;
  delivery_fee: number | null;
  total: number | null;
  status: string | null;
  created_at: string;
};

const STATUS_OPTIONS = [
  "pending",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "completed",
  "cancelled",
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [updatingStatusId, setUpdatingStatusId] =
    useState<number | null>(null);

  /*
  ========================================
  LOAD ORDERS
  ========================================
  */

  async function loadOrders() {
    setLoading(true);
    setErrorMessage("");

    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          customer_name,
          customer_email,
          customer_phone,
          delivery_address,
          delivery_city,
          order_notes,
          payment_method,
          subtotal,
          delivery_fee,
          total,
          status,
          created_at
        `)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(
          "Error loading orders:",
          error
        );

        throw new Error(
          error.message ||
            "Unable to load orders."
        );
      }

      setOrders((data as Order[]) || []);
    } catch (error) {
      console.error(
        "Orders loading failed:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load orders."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();

    const ordersChannel = supabase
      .channel("admin-orders-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          console.log(
            "Admin Orders realtime event:",
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
          "Admin Orders realtime subscription:",
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

  /*
  ========================================
  FORMATTERS
  ========================================
  */

  function formatCurrency(
    value: number | null
  ) {
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

  function formatStatus(
    status: string | null
  ) {
    if (!status) {
      return "Pending";
    }

    return status
      .split("_")
      .map(
        (word) =>
          word.charAt(0).toUpperCase() +
          word.slice(1)
      )
      .join(" ");
  }

  /*
  ========================================
  STATUS STYLING
  ========================================
  */

  function getStatusClasses(
    status: string | null
  ) {
    switch (status) {
      case "confirmed":
        return "bg-[#e7efff] text-[#4c69a8]";

      case "preparing":
        return "bg-[#fff0d9] text-[#a66b24]";

      case "out_for_delivery":
        return "bg-[#eee5ff] text-[#7652a8]";

      case "completed":
        return "bg-[#e4f6e9] text-[#4f8a61]";

      case "cancelled":
        return "bg-[#fce4e7] text-[#a84f61]";

      case "pending":
      default:
        return "bg-[#f9ebe2] text-[#806e6e]";
    }
  }

  /*
  ========================================
  SEARCH + FILTER
  ========================================
  */

  const filteredOrders = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !searchValue ||
        String(order.id).includes(
          searchValue
        ) ||
        (order.customer_name || "")
          .toLowerCase()
          .includes(searchValue) ||
        (order.customer_email || "")
          .toLowerCase()
          .includes(searchValue) ||
        (order.customer_phone || "")
          .toLowerCase()
          .includes(searchValue) ||
        (order.delivery_city || "")
          .toLowerCase()
          .includes(searchValue);

      const matchesStatus =
        statusFilter === "All" ||
        (order.status || "pending") ===
          statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  /*
  ========================================
  STATISTICS
  ========================================
  */

  const totalOrders = orders.length;

  const pendingOrders = orders.filter(
    (order) =>
      !order.status ||
      order.status === "pending"
  ).length;

  const completedOrders = orders.filter(
    (order) =>
      order.status === "completed"
  ).length;

  const cancelledOrders = orders.filter(
    (order) =>
      order.status === "cancelled"
  ).length;

  /*
    Cancelled orders are intentionally
    excluded from revenue.
  */
  const totalRevenue = orders.reduce(
    (sum, order) => {
      if (order.status === "cancelled") {
        return sum;
      }

      return sum + Number(order.total || 0);
    },
    0
  );

  /*
  ========================================
  STATUS UPDATE
  ========================================
  */

  async function handleStatusChange(
    orderId: number,
    newStatus: string
  ) {
    const currentOrder = orders.find(
      (order) => order.id === orderId
    );

    if (!currentOrder) {
      return;
    }

    /*
      Cancelled is a terminal state.

      Once cancelled, the admin cannot
      accidentally restore the order.
    */
    if (
      currentOrder.status === "cancelled"
    ) {
      setErrorMessage(
        `Order #${orderId} is cancelled and can no longer be moved back into the delivery workflow.`
      );

      return;
    }

    /*
      Completed is also protected here.
      This prevents accidentally moving
      delivered orders backwards.
    */
    if (
      currentOrder.status === "completed"
    ) {
      setErrorMessage(
        `Order #${orderId} has already been completed and its status is locked.`
      );

      return;
    }

    /*
      If admin manually chooses Cancelled,
      require confirmation.
    */
    if (newStatus === "cancelled") {
      const confirmed = window.confirm(
        `Cancel Order #${orderId}?\n\nOnce cancelled, this order will be locked and cannot be returned to the delivery workflow.`
      );

      if (!confirmed) {
        return;
      }
    }

    setUpdatingStatusId(orderId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      /*
        Important protection:

        We update only if the database
        status is still the same as the
        status currently displayed.

        This helps prevent overwriting a
        customer cancellation that happened
        just before the admin changed status.
      */
      let query = supabase
        .from("orders")
        .update({
          status: newStatus,
        })
        .eq("id", orderId);

      if (currentOrder.status) {
        query = query.eq(
          "status",
          currentOrder.status
        );
      } else {
        query = query.is(
          "status",
          null
        );
      }

      const {
        data,
        error,
      } = await query
        .select()
        .maybeSingle();

      if (error) {
        console.error(
          "Order status update error:",
          error
        );

        throw new Error(
          error.message ||
            "Unable to update order status."
        );
      }

      /*
        No row returned means the status
        changed somewhere else first.
      */
      if (!data) {
        setErrorMessage(
          `Order #${orderId} was not updated because its status changed before your update was processed. The latest order data has been loaded.`
        );

        await loadOrders();
        return;
      }

      setOrders((current) =>
        current.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: newStatus,
              }
            : order
        )
      );

      setSuccessMessage(
        newStatus === "cancelled"
          ? `Order #${orderId} has been cancelled and locked.`
          : `Order #${orderId} updated to ${formatStatus(
              newStatus
            )}.`
      );
    } catch (error) {
      console.error(
        "Order status update failed:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update order status."
      );
    } finally {
      setUpdatingStatusId(null);
    }
  }

  /*
  ========================================
  LOADING
  ========================================
  */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7eee9] px-6 py-10 text-[#2d2424]">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[30px] bg-[#fff8f5] p-16 text-center shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff]">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#f1d8d1] border-t-[#e8a0ad]" />

            <p className="mt-5 text-sm font-bold text-[#806e6e]">
              Loading orders...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7eee9] px-6 py-10 text-[#2d2424]">
      <div className="mx-auto max-w-7xl">
        {/* ========================================
            HEADER
        ======================================== */}

        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              href="/admin"
              className="text-sm font-bold text-[#c97888] hover:text-[#a85f70]"
            >
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4"><ArrowLeftIcon /></span>
                Back to Dashboard
              </span>
            </Link>

            <p className="mt-8 text-sm font-bold uppercase tracking-[0.25em] text-[#c97888]">
              Doughy Admin
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
              Orders
            </h1>

            <p className="mt-3 text-[#806e6e]">
              Manage customer orders and update
              their status.
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
                ? "Live Orders"
                : "Connecting..."}
            </div>

            <button
              type="button"
              onClick={loadOrders}
              disabled={loading}
              className="rounded-full bg-[#e8a0ad] px-7 py-3.5 text-sm font-bold text-white shadow-[5px_5px_12px_#d8c5c0,-4px_-4px_10px_#ffffff] transition hover:-translate-y-0.5 hover:bg-[#d88a9a] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4"><RefreshIcon /></span>
                Refresh
              </span>
            </button>
          </div>
        </div>

        {/* ========================================
            ERROR
        ======================================== */}

        {errorMessage && (
          <div className="mt-8 rounded-[20px] border border-[#efb9c1] bg-[#fce4e7] px-5 py-4 text-sm font-semibold text-[#a84f61]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-black">
                  Something went wrong
                </p>

                <p className="mt-1 break-words font-medium">
                  {errorMessage}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setErrorMessage("")
                }
                className="shrink-0 font-black"
                aria-label="Close error message"
              >
                <span className="block h-4 w-4"><CloseIcon /></span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================
            SUCCESS
        ======================================== */}

        {successMessage && (
          <div className="mt-8 rounded-[20px] border border-[#b9dfc4] bg-[#e4f6e9] px-5 py-4 text-sm font-semibold text-[#4f8a61]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-black">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4"><CheckCircleIcon /></span>
                    Order Updated
                  </span>
                </p>

                <p className="mt-1 font-medium">
                  {successMessage}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSuccessMessage("")
                }
                className="shrink-0 font-black"
                aria-label="Close success message"
              >
                <span className="block h-4 w-4"><CloseIcon /></span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================
            STATISTICS
        ======================================== */}

        <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
          {/* TOTAL */}

          <div className="rounded-[28px] bg-[#fff8f5] p-6 shadow-[8px_8px_18px_#d8c5c0,-6px_-6px_15px_#ffffff]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                Total Orders
              </p>

              <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#f9ebe2] text-[#c97888]">
                <span className="h-5 w-5"><OrdersIcon /></span>
              </span>
            </div>

            <p className="mt-5 text-4xl font-black">
              {totalOrders}
            </p>
          </div>

          {/* PENDING */}

          <div className="rounded-[28px] bg-[#fff8f5] p-6 shadow-[8px_8px_18px_#d8c5c0,-6px_-6px_15px_#ffffff]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                Pending
              </p>

              <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#fff0d9] text-[#a66b24]">
                <span className="h-5 w-5"><ClockIcon /></span>
              </span>
            </div>

            <p className="mt-5 text-4xl font-black text-[#a66b24]">
              {pendingOrders}
            </p>
          </div>

          {/* COMPLETED */}

          <div className="rounded-[28px] bg-[#fff8f5] p-6 shadow-[8px_8px_18px_#d8c5c0,-6px_-6px_15px_#ffffff]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                Completed
              </p>

              <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#e4f6e9] text-[#4f8a61]">
                <span className="h-5 w-5"><CheckCircleIcon /></span>
              </span>
            </div>

            <p className="mt-5 text-4xl font-black text-[#4f8a61]">
              {completedOrders}
            </p>
          </div>

          {/* CANCELLED */}

          <div className="rounded-[28px] bg-[#fff8f5] p-6 shadow-[8px_8px_18px_#d8c5c0,-6px_-6px_15px_#ffffff]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                Cancelled
              </p>

              <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#fce4e7] text-[#a84f61]">
                <span className="h-5 w-5"><CancelIcon /></span>
              </span>
            </div>

            <p className="mt-5 text-4xl font-black text-[#a84f61]">
              {cancelledOrders}
            </p>
          </div>

          {/* REVENUE */}

          <div className="rounded-[28px] bg-[#fff8f5] p-6 shadow-[8px_8px_18px_#d8c5c0,-6px_-6px_15px_#ffffff]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                Active Revenue
              </p>

              <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#f9ebe2] text-[#c97888]">
                <span className="h-5 w-5"><RevenueIcon /></span>
              </span>
            </div>

            <p className="mt-5 text-2xl font-black text-[#c97888]">
              ₱{formatCurrency(totalRevenue)}
            </p>

            <p className="mt-2 text-xs font-semibold text-[#a58f8f]">
              Excludes cancelled orders
            </p>
          </div>
        </div>

        {/* ========================================
            SEARCH + FILTER
        ======================================== */}

        <section className="mt-8 rounded-[30px] bg-[#fff8f5] p-6 shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff]">
          <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
            <div>
              <label
                htmlFor="order-search"
                className="mb-2 block text-sm font-bold"
              >
                Search Orders
              </label>

              <input
                id="order-search"
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search by order ID, customer, email, phone, or city..."
                className="w-full rounded-2xl border border-[#ead8d0] bg-[#f9ebe2] px-4 py-3 outline-none transition placeholder:text-[#b9a3a3] focus:border-[#e8a0ad] focus:ring-2 focus:ring-[#e8a0ad]/20"
              />
            </div>

            <div>
              <label
                htmlFor="status-filter"
                className="mb-2 block text-sm font-bold"
              >
                Status
              </label>

              <select
                id="status-filter"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
                className="w-full rounded-2xl border border-[#ead8d0] bg-[#f9ebe2] px-4 py-3 outline-none transition focus:border-[#e8a0ad] focus:ring-2 focus:ring-[#e8a0ad]/20"
              >
                <option value="All">
                  All Statuses
                </option>

                {STATUS_OPTIONS.map(
                  (status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {formatStatus(status)}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          <p className="mt-4 text-sm text-[#806e6e]">
            Showing{" "}
            <span className="font-black text-[#2d2424]">
              {filteredOrders.length}
            </span>{" "}
            of{" "}
            <span className="font-black text-[#2d2424]">
              {orders.length}
            </span>{" "}
            orders
          </p>
        </section>

        {/* ========================================
            ORDERS
        ======================================== */}

        {filteredOrders.length === 0 ? (
          <div className="mt-8 rounded-[30px] bg-[#fff8f5] p-16 text-center shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff]">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[26px] bg-[#f9ebe2] text-[#c97888] shadow-[inset_4px_4px_10px_#ddcac4,inset_-4px_-4px_10px_#ffffff]">
              <span className="h-9 w-9"><OrdersIcon /></span>
            </div>

            <h2 className="mt-5 text-2xl font-black">
              No orders found
            </h2>

            <p className="mt-2 text-sm text-[#806e6e]">
              No orders match your current
              search or filter.
            </p>
          </div>
        ) : (
          <div className="mt-8 overflow-hidden rounded-[30px] bg-[#fff8f5] shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff]">
            {/* ========================================
                DESKTOP
            ======================================== */}

            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-[#ead8d1] text-left">
                    <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                      Order
                    </th>

                    <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                      Customer
                    </th>

                    <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                      Location
                    </th>

                    <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                      Payment
                    </th>

                    <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                      Total
                    </th>

                    <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                      Status
                    </th>

                    <th className="px-6 py-5 text-right text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                      Date
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredOrders.map(
                    (order) => {
                      const isCancelled =
                        order.status ===
                        "cancelled";

                      const isCompleted =
                        order.status ===
                        "completed";

                      const isLocked =
                        isCancelled ||
                        isCompleted;

                      return (
                        <tr
                          key={order.id}
                          className={`border-b border-[#ead8d1] transition ${
                            isCancelled
                              ? "bg-[#fff7f7] opacity-80"
                              : "hover:bg-[#fff3ef]"
                          }`}
                        >
                          {/* ORDER */}

                          <td className="px-6 py-5">
                            <Link
                              href={`/admin/orders/${order.id}`}
                              className="group"
                            >
                              <p className="font-black text-[#2d2424] group-hover:text-[#c97888]">
                                #{order.id}
                              </p>

                              <p className="mt-1 text-xs text-[#c97888]">
                                <span className="inline-flex items-center gap-1">
                                  View Details
                                  <span className="h-3.5 w-3.5"><ArrowRightIcon /></span>
                                </span>
                              </p>
                            </Link>
                          </td>

                          {/* CUSTOMER */}

                          <td className="px-6 py-5">
                            <p className="font-black">
                              {order.customer_name ||
                                "Customer"}
                            </p>

                            <p className="mt-1 text-xs text-[#806e6e]">
                              {order.customer_email ||
                                "No email"}
                            </p>

                            <p className="mt-1 text-xs text-[#806e6e]">
                              {order.customer_phone ||
                                "No phone"}
                            </p>
                          </td>

                          {/* LOCATION */}

                          <td className="px-6 py-5">
                            <p className="max-w-[220px] text-sm font-semibold text-[#806e6e]">
                              {order.delivery_address ||
                                "No address"}
                            </p>

                            {order.delivery_city && (
                              <p className="mt-1 text-xs text-[#a58f8f]">
                                {
                                  order.delivery_city
                                }
                              </p>
                            )}
                          </td>

                          {/* PAYMENT */}

                          <td className="px-6 py-5">
                            <span className="rounded-full bg-[#f9ebe2] px-3 py-2 text-xs font-bold text-[#806e6e]">
                              {order.payment_method ||
                                "Not specified"}
                            </span>
                          </td>

                          {/* TOTAL */}

                          <td className="px-6 py-5">
                            <span
                              className={`font-black ${
                                isCancelled
                                  ? "text-[#a58f8f] line-through"
                                  : "text-[#c97888]"
                              }`}
                            >
                              ₱
                              {formatCurrency(
                                order.total
                              )}
                            </span>
                          </td>

                          {/* STATUS */}

                          <td className="px-6 py-5">
                            {isLocked ? (
                              <div>
                                <span
                                  className={`inline-flex rounded-full px-3 py-2 text-xs font-black ${getStatusClasses(
                                    order.status
                                  )}`}
                                >
                                  {isCancelled
                                    ? "🔒 Cancelled"
                                    : "✓ Completed"}
                                </span>

                                <p className="mt-2 text-[10px] font-bold text-[#a58f8f]">
                                  Status locked
                                </p>
                              </div>
                            ) : (
                              <select
                                value={
                                  order.status ||
                                  "pending"
                                }
                                onChange={(
                                  event
                                ) =>
                                  handleStatusChange(
                                    order.id,
                                    event.target
                                      .value
                                  )
                                }
                                disabled={
                                  updatingStatusId ===
                                  order.id
                                }
                                className={`rounded-full border-0 px-3 py-2 text-xs font-bold outline-none ${getStatusClasses(
                                  order.status
                                )} disabled:cursor-not-allowed disabled:opacity-60`}
                              >
                                {STATUS_OPTIONS.map(
                                  (status) => (
                                    <option
                                      key={
                                        status
                                      }
                                      value={
                                        status
                                      }
                                    >
                                      {formatStatus(
                                        status
                                      )}
                                    </option>
                                  )
                                )}
                              </select>
                            )}
                          </td>

                          {/* DATE */}

                          <td className="px-6 py-5 text-right">
                            <span className="text-xs font-semibold text-[#806e6e]">
                              {formatDate(
                                order.created_at
                              )}
                            </span>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>

            {/* ========================================
                MOBILE
            ======================================== */}

            <div className="lg:hidden">
              {filteredOrders.map(
                (order) => {
                  const isCancelled =
                    order.status ===
                    "cancelled";

                  const isCompleted =
                    order.status ===
                    "completed";

                  const isLocked =
                    isCancelled ||
                    isCompleted;

                  return (
                    <div
                      key={order.id}
                      className={`border-b border-[#ead8d1] p-6 last:border-b-0 ${
                        isCancelled
                          ? "bg-[#fff7f7]"
                          : ""
                      }`}
                    >
                      {/* ORDER HEADER */}

                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-[#c97888]">
                            Order
                          </p>

                          <h2 className="mt-1 text-xl font-black">
                            #{order.id}
                          </h2>
                        </div>

                        <span
                          className={`rounded-full px-3 py-2 text-xs font-bold ${getStatusClasses(
                            order.status
                          )}`}
                        >
                          {isCancelled
                            ? (
                                <span className="inline-flex items-center gap-1.5">
                                  <span className="h-3.5 w-3.5"><LockIcon /></span>
                                  Cancelled
                                </span>
                              )
                            : formatStatus(
                                order.status
                              )}
                        </span>
                      </div>

                      {/* CANCELLED NOTICE */}

                      {isCancelled && (
                        <div className="mt-5 rounded-2xl border border-[#efb9c1] bg-[#fce4e7] p-4">
                          <p className="text-sm font-black text-[#a84f61]">
                            Order Cancelled
                          </p>

                          <p className="mt-1 text-xs leading-5 text-[#806e6e]">
                            This order has
                            been cancelled
                            and is permanently
                            locked from the
                            delivery workflow.
                          </p>
                        </div>
                      )}

                      {/* CUSTOMER */}

                      <div className="mt-6">
                        <p className="text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                          Customer
                        </p>

                        <p className="mt-1 font-black">
                          {order.customer_name ||
                            "Customer"}
                        </p>

                        <p className="mt-1 break-all text-xs text-[#806e6e]">
                          {order.customer_email ||
                            "No email"}
                        </p>

                        <p className="mt-1 text-xs text-[#806e6e]">
                          {order.customer_phone ||
                            "No phone"}
                        </p>
                      </div>

                      {/* DELIVERY */}

                      <div className="mt-5">
                        <p className="text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                          Delivery Address
                        </p>

                        <p className="mt-1 text-sm font-semibold text-[#806e6e]">
                          {order.delivery_address ||
                            "No address"}
                        </p>

                        {order.delivery_city && (
                          <p className="mt-1 text-xs text-[#a58f8f]">
                            {
                              order.delivery_city
                            }
                          </p>
                        )}
                      </div>

                      {/* PAYMENT + TOTAL */}

                      <div className="mt-6 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-[#a58f8f]">
                            Payment
                          </p>

                          <p className="mt-1 text-sm font-bold text-[#806e6e]">
                            {order.payment_method ||
                              "Not specified"}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-[#a58f8f]">
                            Total
                          </p>

                          <p
                            className={`mt-1 font-black ${
                              isCancelled
                                ? "text-[#a58f8f] line-through"
                                : "text-[#c97888]"
                            }`}
                          >
                            ₱
                            {formatCurrency(
                              order.total
                            )}
                          </p>
                        </div>
                      </div>

                      {/* STATUS */}

                      <div className="mt-6">
                        <label
                          htmlFor={`status-${order.id}`}
                          className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#a58f8f]"
                        >
                          Order Status
                        </label>

                        {isLocked ? (
                          <div
                            className={`w-full rounded-2xl px-4 py-3 text-sm font-black ${getStatusClasses(
                              order.status
                            )}`}
                          >
                            <div className="flex items-center justify-between">
                              <span>
                                {isCancelled
                                  ? (
                                      <span className="inline-flex items-center gap-1.5">
                                        <span className="h-3.5 w-3.5"><LockIcon /></span>
                                        Cancelled
                                      </span>
                                    )
                                  : (
                                      <span className="inline-flex items-center gap-1.5">
                                        <span className="h-3.5 w-3.5"><CheckIcon /></span>
                                        Completed
                                      </span>
                                    )}
                              </span>

                              <span className="text-xs opacity-70">
                                Locked
                              </span>
                            </div>
                          </div>
                        ) : (
                          <select
                            id={`status-${order.id}`}
                            value={
                              order.status ||
                              "pending"
                            }
                            onChange={(
                              event
                            ) =>
                              handleStatusChange(
                                order.id,
                                event.target
                                  .value
                              )
                            }
                            disabled={
                              updatingStatusId ===
                              order.id
                            }
                            className={`w-full rounded-2xl border border-[#ead8d0] px-4 py-3 text-sm font-bold outline-none ${getStatusClasses(
                              order.status
                            )} disabled:cursor-not-allowed disabled:opacity-60`}
                          >
                            {STATUS_OPTIONS.map(
                              (status) => (
                                <option
                                  key={
                                    status
                                  }
                                  value={
                                    status
                                  }
                                >
                                  {formatStatus(
                                    status
                                  )}
                                </option>
                              )
                            )}
                          </select>
                        )}
                      </div>

                      {/* NOTES */}

                      {order.order_notes && (
                        <div className="mt-5 rounded-2xl bg-[#f9ebe2] p-4">
                          <p className="text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                            Order Notes
                          </p>

                          <p className="mt-1 text-sm text-[#806e6e]">
                            {
                              order.order_notes
                            }
                          </p>
                        </div>
                      )}

                      {/* DATE */}

                      <div className="mt-5">
                        <p className="text-xs text-[#a58f8f]">
                          Order Date
                        </p>

                        <p className="mt-1 text-xs font-semibold text-[#806e6e]">
                          {formatDate(
                            order.created_at
                          )}
                        </p>
                      </div>

                      {/* DETAILS */}

                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="mt-6 flex w-full items-center justify-center rounded-2xl bg-[#e8a0ad] px-5 py-3.5 text-sm font-black text-white shadow-[5px_5px_12px_#d8c5c0,-4px_-4px_10px_#ffffff] transition hover:-translate-y-0.5 hover:bg-[#d88a9a]"
                      >
                        <span className="inline-flex items-center gap-2">
                          View Order Details
                          <span className="h-4 w-4"><ArrowRightIcon /></span>
                        </span>
                      </Link>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

/* =========================================================
   DOUGHY ADMIN ORDERS SVG ICONS
========================================================= */
function ArrowLeftIcon(){return <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true"><path d="M19 12H5M10 7L5 12L10 17" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/></svg>;}
function ArrowRightIcon(){return <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true"><path d="M5 12H19M14 7L19 12L14 17" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/></svg>;}
function RefreshIcon(){return <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true"><path d="M19 8A7 7 0 1 0 19.5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M19 4V8H15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;}
function CloseIcon(){return <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true"><path d="M7 7L17 17M17 7L7 17" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/></svg>;}
function OrdersIcon(){return <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true"><path d="M4 7.5L12 3.5L20 7.5V17L12 21L4 17V7.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><path d="M4.5 7.7L12 11.5L19.5 7.7M12 11.5V20.5" stroke="currentColor" strokeWidth="1.7"/></svg>;}
function ClockIcon(){return <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true"><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8"/><path d="M12 7.5V12L15 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;}
function CheckCircleIcon(){return <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true"><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8"/><path d="M8 12.2L10.7 15L16.5 9" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/></svg>;}
function CheckIcon(){return <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true"><path d="M6.5 12.5L10.2 16L17.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;}
function CancelIcon(){return <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true"><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8"/><path d="M9 9L15 15M15 9L9 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;}
function RevenueIcon(){return <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true"><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7"/><path d="M14.8 8.5H10.8C9.7 8.5 9 9.1 9 10C9 10.9 9.7 11.4 10.8 11.6L13.2 12C14.4 12.2 15 12.8 15 13.7C15 14.7 14.2 15.5 13 15.5H9.2M12 6.8V17.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>;}
function LockIcon(){return <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="3" stroke="currentColor" strokeWidth="1.8"/><path d="M8 10V8C8 5.8 9.8 4 12 4C14.2 4 16 5.8 16 8V10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;}

