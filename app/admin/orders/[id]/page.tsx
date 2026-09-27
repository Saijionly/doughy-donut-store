"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { supabase } from "@/lib/supabase";

type Order = {
  id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  delivery_city: string;
  order_notes: string | null;
  payment_method: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: string;
  created_at: string;
  estimated_minutes: number | null;
  estimated_delivery_at: string | null;
};

type OrderItem = {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  product_image: string;
  price: number;
  quantity: number;
  created_at: string;
};

type OrderStatusHistory = {
  id: number;
  order_id: number;
  status: string;
  created_at: string;
};

type OrderEmailLog = {
  id: number;
  order_id: number;
  email_type: string;
  recipient: string;
  subject: string;
  status: "sent" | "failed";
  provider_email_id: string | null;
  error_message: string | null;
  created_at: string;
};

const STATUS_OPTIONS = [
  {
    value: "pending",
    label: "Pending",
  },
  {
    value: "confirmed",
    label: "Confirmed",
  },
  {
    value: "preparing",
    label: "Preparing",
  },
  {
    value: "out_for_delivery",
    label: "Out for Delivery",
  },
  {
    value: "completed",
    label: "Completed",
  },
  {
    value: "cancelled",
    label: "Cancelled",
  },
];

export default function OrderDetailsPage() {
  const params = useParams();

  const orderId = Number(
    Array.isArray(params.id)
      ? params.id[0]
      : params.id
  );

  const [order, setOrder] =
    useState<Order | null>(null);

  const [orderItems, setOrderItems] =
    useState<OrderItem[]>([]);

  const [statusHistory, setStatusHistory] =
    useState<OrderStatusHistory[]>([]);

  const [emailLogs, setEmailLogs] =
    useState<OrderEmailLog[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [updatingStatus, setUpdatingStatus] =
    useState(false);

  const [selectedStatus, setSelectedStatus] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [
    realtimeConnected,
    setRealtimeConnected,
  ] = useState(false);

  const [estimateMinutes, setEstimateMinutes] =
    useState("");

  const [savingEstimate, setSavingEstimate] =
    useState(false);

  const [
    resendingConfirmation,
    setResendingConfirmation,
  ] = useState(false);

  /*
  =========================================
  NORMALIZE STATUS
  =========================================

  Supports older status values too:
  processing -> preparing
  shipped -> out_for_delivery
  delivered -> completed
  canceled -> cancelled
  */

  function normalizeStatus(
    status: string | null | undefined
  ) {
    if (!status) {
      return "pending";
    }

    const normalized = status
      .toLowerCase()
      .trim()
      .replaceAll("-", "_")
      .replaceAll(" ", "_");

    if (normalized === "processing") {
      return "preparing";
    }

    if (normalized === "shipped") {
      return "out_for_delivery";
    }

    if (normalized === "delivered") {
      return "completed";
    }

    if (normalized === "canceled") {
      return "cancelled";
    }

    return normalized;
  }

  /*
  =========================================
  FORMAT STATUS
  =========================================
  */

  function formatStatus(status: string) {
    return normalizeStatus(status)
      .split("_")
      .map(
        (word) =>
          word.charAt(0).toUpperCase() +
          word.slice(1)
      )
      .join(" ");
  }

  /*
  =========================================
  LOAD EMAIL LOGS
  =========================================
  */

  async function loadEmailLogs() {
    if (
      !orderId ||
      Number.isNaN(orderId)
    ) {
      return;
    }

    const {
      data,
      error,
    } = await supabase
      .from("order_email_logs")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.warn(
        "Email logs loading error:",
        error
      );
      return;
    }

    setEmailLogs(
      (data || []) as OrderEmailLog[]
    );
  }

  /*
  =========================================
  LOAD ORDER
  =========================================
  */

  async function loadOrder(
    showLoading = true
  ) {
    if (showLoading) {
      setLoading(true);
    }

    setErrorMessage("");

    try {
      if (
        !orderId ||
        Number.isNaN(orderId)
      ) {
        throw new Error(
          "Invalid order ID."
        );
      }

      /*
      -----------------------------
      GET ORDER
      -----------------------------
      */

      const {
        data: orderData,
        error: orderError,
      } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .maybeSingle();

      if (orderError) {
        console.error(
          "Order loading error:",
          orderError
        );

        throw new Error(
          orderError.message ||
            "Unable to load order."
        );
      }

      if (!orderData) {
        throw new Error(
          "Order not found."
        );
      }

      /*
      -----------------------------
      GET ORDER ITEMS
      -----------------------------
      */

      const {
        data: itemsData,
        error: itemsError,
      } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId)
        .order("id", {
          ascending: true,
        });

      if (itemsError) {
        console.error(
          "Order items loading error:",
          itemsError
        );

        throw new Error(
          itemsError.message ||
            "Unable to load order items."
        );
      }

      const loadedOrder =
        orderData as Order;

      setOrder(loadedOrder);

      setSelectedStatus(
        normalizeStatus(
          loadedOrder.status
        )
      );

      setEstimateMinutes(
        loadedOrder.estimated_minutes
          ? String(loadedOrder.estimated_minutes)
          : ""
      );

      setOrderItems(
        (itemsData || []) as OrderItem[]
      );

      const { data: historyData, error: historyError } =
        await supabase
          .from("order_status_history")
          .select("*")
          .eq("order_id", orderId)
          .order("created_at", { ascending: true });

      if (historyError) {
        console.error("Status history loading error:", historyError);
      } else {
        setStatusHistory((historyData || []) as OrderStatusHistory[]);
      }

      await loadEmailLogs();
    } catch (error) {
      console.error(
        "Order details loading failed:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load order."
      );
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  /*
  =========================================
  SUPABASE REALTIME
  =========================================

  Listens for changes to this specific
  order so the admin detail page updates
  automatically when:

  - customer cancels the order
  - another admin changes the status
  - this order is updated elsewhere
  */

  useEffect(() => {
    if (!orderId || Number.isNaN(orderId)) {
      return;
    }

    const channel = supabase
      .channel(`admin-order-detail-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          console.log(
            "Admin order detail realtime update:",
            payload
          );

          const updatedOrder =
            payload.new as Order;

          setOrder(updatedOrder);

          setSelectedStatus(
            normalizeStatus(
              updatedOrder.status
            )
          );

          setEstimateMinutes(
            updatedOrder.estimated_minutes
              ? String(updatedOrder.estimated_minutes)
              : ""
          );

          setErrorMessage("");

          /*
          If the order becomes terminal,
          clear any old success message so
          the latest realtime state is clear.
          */
          const latestStatus =
            normalizeStatus(
              updatedOrder.status
            );

          if (
            latestStatus === "cancelled" ||
            latestStatus === "completed"
          ) {
            setSuccessMessage("");
          }
        }
      )
      .subscribe((status) => {
        console.log(
          "Admin order detail realtime:",
          status
        );

        if (status === "SUBSCRIBED") {
          setRealtimeConnected(true);
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
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  useEffect(() => {
    if (!orderId || Number.isNaN(orderId)) return;

    const historyChannel = supabase
      .channel(`admin-order-history-${orderId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "order_status_history", filter: `order_id=eq.${orderId}` },
        (payload) => {
          const entry = payload.new as OrderStatusHistory;
          setStatusHistory((current) =>
            current.some((item) => item.id === entry.id)
              ? current
              : [...current, entry].sort((a, b) =>
                  new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(historyChannel);
    };
  }, [orderId]);

  /*
  =========================================
  EMAIL LOGS REALTIME
  =========================================
  */

  useEffect(() => {
    if (
      !orderId ||
      Number.isNaN(orderId)
    ) {
      return;
    }

    const emailChannel = supabase
      .channel(
        `admin-order-email-logs-${orderId}`
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "order_email_logs",
          filter:
            `order_id=eq.${orderId}`,
        },
        (payload) => {
          const entry =
            payload.new as OrderEmailLog;

          setEmailLogs((current) => {
            if (
              current.some(
                (item) =>
                  item.id === entry.id
              )
            ) {
              return current;
            }

            return [
              entry,
              ...current,
            ].sort(
              (a, b) =>
                new Date(
                  b.created_at
                ).getTime() -
                new Date(
                  a.created_at
                ).getTime()
            );
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(
        emailChannel
      );
    };
  }, [orderId]);

  /*
  =========================================
  DELIVERY ESTIMATE
  =========================================
  */

  function getEstimatePreview() {
    const minutes = Number(estimateMinutes);

    if (
      !Number.isFinite(minutes) ||
      minutes <= 0
    ) {
      return null;
    }

    return new Date(
      Date.now() + minutes * 60 * 1000
    );
  }

  async function saveDeliveryEstimate() {
    if (!order) {
      return;
    }

    const currentStatus =
      normalizeStatus(order.status);

    if (
      currentStatus === "cancelled" ||
      currentStatus === "completed"
    ) {
      setErrorMessage(
        "Delivery estimate cannot be changed for a completed or cancelled order."
      );
      return;
    }

    const minutes =
      Number(estimateMinutes);

    if (
      !Number.isInteger(minutes) ||
      minutes < 1 ||
      minutes > 1440
    ) {
      setErrorMessage(
        "Enter a whole number from 1 to 1440 minutes."
      );
      return;
    }

    const estimatedDeliveryAt =
      new Date(
        Date.now() +
          minutes * 60 * 1000
      ).toISOString();

    setSavingEstimate(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const {
        data,
        error,
      } = await supabase
        .from("orders")
        .update({
          estimated_minutes: minutes,
          estimated_delivery_at:
            estimatedDeliveryAt,
        })
        .eq("id", order.id)
        .select("*")
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error(
          "Order was not found."
        );
      }

      const updatedOrder =
        data as Order;

      setOrder(updatedOrder);

      setEstimateMinutes(
        updatedOrder.estimated_minutes
          ? String(
              updatedOrder.estimated_minutes
            )
          : ""
      );

      setSuccessMessage(
        `Delivery estimate saved for ${minutes} minute${
          minutes === 1 ? "" : "s"
        }.`
      );

      setTimeout(() => {
        setSuccessMessage("");
      }, 4000);
    } catch (error) {
      console.error(
        "Delivery estimate update failed:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to save delivery estimate."
      );
    } finally {
      setSavingEstimate(false);
    }
  }

  async function clearDeliveryEstimate() {
    if (!order) {
      return;
    }

    const confirmed =
      window.confirm(
        `Remove the delivery estimate for Order #${order.id}?`
      );

    if (!confirmed) {
      return;
    }

    setSavingEstimate(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const {
        data,
        error,
      } = await supabase
        .from("orders")
        .update({
          estimated_minutes: null,
          estimated_delivery_at: null,
        })
        .eq("id", order.id)
        .select("*")
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error(
          "Order was not found."
        );
      }

      setOrder(data as Order);
      setEstimateMinutes("");

      setSuccessMessage(
        "Delivery estimate removed."
      );

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error(
        "Remove estimate failed:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to remove delivery estimate."
      );
    } finally {
      setSavingEstimate(false);
    }
  }

  /*
  =========================================
  RESEND ORDER CONFIRMATION EMAIL
  =========================================
  */

  async function resendConfirmationEmail() {
    if (!order) {
      return;
    }

    if (!order.customer_email) {
      setErrorMessage(
        "This order does not have a customer email address."
      );
      return;
    }

    setResendingConfirmation(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        "/api/orders/send-confirmation",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            orderId: order.id,
            forceResend: true,
          }),
        }
      );

      const result =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Unable to resend confirmation email."
        );
      }

      await loadEmailLogs();

      setSuccessMessage(
        `Confirmation email sent to ${order.customer_email}.`
      );

      setTimeout(() => {
        setSuccessMessage("");
      }, 5000);
    } catch (error) {
      console.warn(
        "Confirmation email resend failed:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to resend confirmation email."
      );
    } finally {
      setResendingConfirmation(false);
    }
  }

  /*
  =========================================
  SEND STATUS UPDATE EMAIL
  =========================================
  */

  async function sendStatusUpdateEmail(
    updatedOrder: Order
  ) {
    try {
      const response = await fetch(
        "/api/orders/send-status-update",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            orderId: updatedOrder.id,
          }),
        }
      );

      if (!response.ok) {
        const emailError =
          await response
            .json()
            .catch(() => null);

        console.warn(
          "Status email could not be sent:",
          emailError
        );
      }
    } catch (error) {
      /*
       * A successfully updated order should
       * stay updated even if email sending
       * temporarily fails.
       */
      console.warn(
        "Status email request failed:",
        error
      );
    }
  }

  /*
  =========================================
  UPDATE STATUS
  =========================================
  */

  async function updateOrderStatus() {
    if (!order) {
      return;
    }

    if (!selectedStatus) {
      return;
    }

    const currentNormalizedStatus =
      normalizeStatus(order.status);

    /*
    =========================================
    TERMINAL STATUS PROTECTION
    =========================================
    */

    if (
      currentNormalizedStatus ===
      "cancelled"
    ) {
      setErrorMessage(
        `Order #${order.id} has been cancelled and can no longer be returned to the delivery workflow.`
      );

      return;
    }

    if (
      currentNormalizedStatus ===
      "completed"
    ) {
      setErrorMessage(
        `Order #${order.id} has already been completed and its status is permanently locked.`
      );

      return;
    }

    if (
      selectedStatus ===
      currentNormalizedStatus
    ) {
      setSuccessMessage(
        "Order status is already up to date."
      );

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);

      return;
    }

    /*
    =========================================
    ADMIN CANCELLATION CONFIRMATION
    =========================================
    */

    if (
      selectedStatus === "cancelled"
    ) {
      const confirmed =
        window.confirm(
          `Cancel Order #${order.id}?\n\nOnce cancelled, this order will be permanently locked and cannot be returned to Pending, Preparing, Out for Delivery, or Completed.`
        );

      if (!confirmed) {
        setSelectedStatus(
          currentNormalizedStatus
        );

        return;
      }
    }

    setUpdatingStatus(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      /*
      =========================================
      CONCURRENCY PROTECTION
      =========================================

      We check BOTH:
      - Order ID
      - Existing database status

      Example:

      Admin sees Pending.
      Customer cancels.
      Admin then clicks Preparing.

      Because database is already Cancelled,
      this update will return no row instead
      of overwriting the cancellation.
      */

      const {
        data,
        error,
      } = await supabase
        .from("orders")
        .update({
          status: selectedStatus,
        })
        .eq("id", order.id)
        .eq("status", order.status)
        .select("*")
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
      No returned row means something
      changed in the database before
      our update completed.
      */

      if (!data) {
        await loadOrder(false);

        setErrorMessage(
          `Order #${order.id} was not updated because its status changed before your update was processed. The latest status has been loaded.`
        );

        return;
      }

      const updatedOrder =
        data as Order;

      setOrder(updatedOrder);

      setSelectedStatus(
        normalizeStatus(
          updatedOrder.status
        )
      );

      await sendStatusUpdateEmail(
        updatedOrder
      );

      await loadEmailLogs();

      if (
        normalizeStatus(
          updatedOrder.status
        ) === "cancelled"
      ) {
        setSuccessMessage(
          `Order #${order.id} has been cancelled and permanently locked.`
        );
      } else {
        setSuccessMessage(
          `Order #${order.id} updated to ${formatStatus(
            updatedOrder.status
          )}.`
        );
      }

      setTimeout(() => {
        setSuccessMessage("");
      }, 4000);
    } catch (error) {
      console.error(
        "Status update failed:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update order status."
      );
    } finally {
      setUpdatingStatus(false);
    }
  }

  /*
  =========================================
  FORMAT EMAIL TYPE
  =========================================
  */

  function formatEmailType(
    value: string
  ) {
    const labels:
      Record<string, string> = {
        confirmation:
          "Order Confirmation",
        confirmation_resend:
          "Confirmation Resent",
        status_pending:
          "Pending Update",
        status_confirmed:
          "Confirmed Update",
        status_preparing:
          "Preparing Update",
        status_out_for_delivery:
          "Out for Delivery Update",
        status_completed:
          "Delivered Update",
        status_cancelled:
          "Cancelled Update",
      };

    return (
      labels[value] ||
      value
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) =>
          letter.toUpperCase()
        )
    );
  }

  /*
  =========================================
  FORMAT CURRENCY
  =========================================
  */

  function formatCurrency(
    value: number
  ) {
    return Number(value || 0).toLocaleString(
      "en-PH",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
  }

  /*
  =========================================
  FORMAT DATE
  =========================================
  */

  function formatDate(
    value: string
  ) {
    if (!value) {
      return "—";
    }

    return new Date(
      value
    ).toLocaleString(
      "en-PH",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  }

  /*
  =========================================
  STATUS STYLE
  =========================================
  */

  function getStatusStyle(
    status: string
  ) {
    const normalized =
      normalizeStatus(status);

    if (
      normalized === "completed"
    ) {
      return {
        container:
          "bg-[#e4f6e9] text-[#3d7c51]",
        icon: "check",
      };
    }

    if (
      normalized === "cancelled"
    ) {
      return {
        container:
          "bg-[#fce4e7] text-[#a84f61]",
        icon: "cancel",
      };
    }

    if (
      normalized ===
      "out_for_delivery"
    ) {
      return {
        container:
          "bg-[#e6efff] text-[#5071a8]",
        icon: "delivery",
      };
    }

    if (
      normalized === "preparing"
    ) {
      return {
        container:
          "bg-[#fff0d8] text-[#a56d20]",
        icon: "prepare",
      };
    }

    if (
      normalized === "confirmed"
    ) {
      return {
        container:
          "bg-[#e7efff] text-[#4c69a8]",
        icon: "check",
      };
    }

    return {
      container:
        "bg-[#f4d5dc] text-[#c97888]",
      icon: "pending",
    };
  }

  /*
  =========================================
  LOADING
  =========================================
  */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7eee9] px-6 py-10 text-[#2d2424]">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-[30px] bg-[#fff8f5] p-16 text-center shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff]">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#f1d8d1] border-t-[#e8a0ad]" />

            <p className="mt-5 text-sm font-bold text-[#806e6e]">
              Loading order...
            </p>
          </div>
        </div>
      </main>
    );
  }

  /*
  =========================================
  ORDER NOT FOUND
  =========================================
  */

  if (!order) {
    return (
      <main className="min-h-screen bg-[#f7eee9] px-6 py-10 text-[#2d2424]">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-[30px] bg-[#fff8f5] p-10 text-center shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff] sm:p-16">
            <div className="text-6xl">
              <span className="block h-12 w-12"><DonutIcon /></span>
            </div>

            <h1 className="mt-6 text-3xl font-black">
              Order Not Found
            </h1>

            <p className="mx-auto mt-3 max-w-lg text-[#806e6e]">
              {errorMessage ||
                "The order you are looking for does not exist."}
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/admin/orders"
                className="rounded-full bg-[#e8a0ad] px-7 py-4 text-center text-sm font-bold text-white shadow-[5px_5px_12px_#d8c5c0,-4px_-4px_10px_#ffffff] transition hover:-translate-y-0.5 hover:bg-[#d88a9a]"
              >
                <span className="inline-flex items-center gap-2"><span className="h-4 w-4"><ArrowLeftIcon /></span>Back to Orders</span>
              </Link>

              <Link
                href="/admin"
                className="rounded-full bg-[#f9ebe2] px-7 py-4 text-center text-sm font-bold text-[#806e6e] shadow-[5px_5px_12px_#d8c5c0,-4px_-4px_10px_#ffffff] transition hover:-translate-y-0.5"
              >
                Admin Dashboard
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const statusStyle =
    getStatusStyle(order.status);

  const normalizedStatus =
    normalizeStatus(order.status);

  const isCancelled =
    normalizedStatus === "cancelled";

  const isCompleted =
    normalizedStatus === "completed";

  const isTerminalStatus =
    isCancelled || isCompleted;

  return (
    <main className="min-h-screen bg-[#f7eee9] px-6 py-10 text-[#2d2424]">
      <div className="mx-auto max-w-6xl">
        {/* ========================================
            HEADER
        ======================================== */}

        <div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/admin/orders"
              className="text-sm font-bold text-[#c97888] transition hover:text-[#a85f70]"
            >
              <span className="inline-flex items-center gap-2"><span className="h-4 w-4"><ArrowLeftIcon /></span>Back to Orders</span>
            </Link>

            <div
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black ${
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
                ? "Live Order"
                : "Connecting..."}
            </div>
          </div>

          <p className="mt-8 text-sm font-bold uppercase tracking-[0.25em] text-[#c97888]">
            Doughy Admin
          </p>

          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                Order #{order.id}
              </h1>

              <p className="mt-3 text-[#806e6e]">
                Placed on{" "}
                {formatDate(
                  order.created_at
                )}
              </p>
            </div>

            <div
              className={`inline-flex w-fit items-center gap-2 rounded-full px-5 py-3 text-sm font-black ${statusStyle.container}`}
            >
              <span>
                {isCancelled ? (
                  <span className="block h-4 w-4"><LockIcon /></span>
                ) : (
                  <StatusIcon type={statusStyle.icon} />
                )}
              </span>

              <span>
                {formatStatus(
                  order.status
                )}
              </span>
            </div>
          </div>
        </div>

        {/* ========================================
            CANCELLED HERO NOTICE
        ======================================== */}

        {isCancelled && (
          <div className="mt-8 rounded-[28px] border border-[#efb9c1] bg-[#fce4e7] p-6 sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#a84f61] text-2xl text-white">
                <span className="h-6 w-6"><CancelIcon /></span>
              </div>

              <div className="flex-1">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#a84f61]">
                  Terminal Status
                </p>

                <h2 className="mt-1 text-xl font-black text-[#8f4352]">
                  This order has been cancelled
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-[#806e6e]">
                  The order is permanently locked.
                  It cannot be returned to Pending,
                  Confirmed, Preparing, Out for
                  Delivery, or Completed.
                </p>
              </div>

              <div className="rounded-full bg-white/60 px-4 py-2 text-xs font-black text-[#a84f61]">
                <span className="inline-flex items-center gap-1.5"><span className="h-3.5 w-3.5"><LockIcon /></span>Locked</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================
            COMPLETED NOTICE
        ======================================== */}

        {isCompleted && (
          <div className="mt-8 rounded-[28px] border border-[#b9dfc4] bg-[#e4f6e9] p-6 sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#4f8a61] text-2xl text-white">
                <span className="h-6 w-6"><CheckIcon /></span>
              </div>

              <div className="flex-1">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#4f8a61]">
                  Terminal Status
                </p>

                <h2 className="mt-1 text-xl font-black text-[#3d7c51]">
                  This order has been completed
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#607766]">
                  Completed orders are locked so
                  they cannot accidentally be
                  moved backwards in the delivery
                  workflow.
                </p>
              </div>

              <div className="rounded-full bg-white/60 px-4 py-2 text-xs font-black text-[#4f8a61]">
                <span className="inline-flex items-center gap-1.5"><span className="h-3.5 w-3.5"><LockIcon /></span>Locked</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================
            SUCCESS
        ======================================== */}

        {successMessage && (
          <div className="mt-6 rounded-2xl border border-[#b9dfc4] bg-[#e4f6e9] px-5 py-4 text-sm font-bold text-[#3d7c51]">
            <div className="flex items-start justify-between gap-4">
              <p className="flex items-start gap-2">
                <span className="mt-0.5 h-4 w-4 shrink-0"><CheckCircleIcon /></span>
                <span>{successMessage}</span>
              </p>

              <button
                type="button"
                onClick={() =>
                  setSuccessMessage("")
                }
                className="shrink-0 font-black"
              >
                <span className="block h-4 w-4"><CloseIcon /></span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================
            ERROR
        ======================================== */}

        {errorMessage && (
          <div className="mt-6 rounded-2xl border border-[#efb9c1] bg-[#fce4e7] px-5 py-4 text-sm font-bold text-[#a84f61]">
            <div className="flex items-start justify-between gap-4">
              <p className="flex items-start gap-2">
                <span className="mt-0.5 h-4 w-4 shrink-0"><AlertIcon /></span>
                <span>{errorMessage}</span>
              </p>

              <button
                type="button"
                onClick={() =>
                  setErrorMessage("")
                }
                className="shrink-0 font-black"
              >
                <span className="block h-4 w-4"><CloseIcon /></span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================
            STATUS MANAGEMENT
        ======================================== */}

        <section className="mt-8 rounded-[30px] bg-[#fff8f5] p-6 shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff] sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-[#c97888]">
                Order Management
              </p>

              <h2 className="mt-2 text-2xl font-black">
                {isTerminalStatus
                  ? "Order Status Locked"
                  : "Update Order Status"}
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#806e6e]">
                {isCancelled
                  ? "Cancelled orders cannot be reactivated or returned to the delivery workflow."
                  : isCompleted
                    ? "This order has already been completed. Its final status is locked."
                    : "Change the order status and save it directly to Supabase."}
              </p>
            </div>

            {isTerminalStatus ? (
              <div
                className={`flex min-w-[220px] items-center justify-between rounded-full px-5 py-4 text-sm font-black ${statusStyle.container}`}
              >
                <span>
                  {isCancelled ? (
                    <span className="inline-flex items-center gap-1.5"><span className="h-4 w-4"><LockIcon /></span>Cancelled</span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5"><span className="h-4 w-4"><CheckIcon /></span>Completed</span>
                  )}
                </span>

                <span className="text-xs opacity-70">
                  Locked
                </span>
              </div>
            ) : (
              <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
                <select
                  value={selectedStatus}
                  onChange={(event) => {
                    setSelectedStatus(
                      event.target.value
                    );

                    setSuccessMessage("");
                    setErrorMessage("");
                  }}
                  disabled={
                    updatingStatus
                  }
                  className="min-w-[220px] rounded-full border-none bg-[#f9ebe2] px-5 py-4 text-sm font-bold text-[#2d2424] outline-none ring-0 focus:ring-2 focus:ring-[#e8a0ad] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {STATUS_OPTIONS.map(
                    (status) => (
                      <option
                        key={status.value}
                        value={
                          status.value
                        }
                      >
                        {status.label}
                      </option>
                    )
                  )}
                </select>

                <button
                  type="button"
                  onClick={
                    updateOrderStatus
                  }
                  disabled={
                    updatingStatus ||
                    selectedStatus ===
                      normalizedStatus
                  }
                  className="rounded-full bg-[#e8a0ad] px-7 py-4 text-sm font-bold text-white shadow-[5px_5px_12px_#d8c5c0,-4px_-4px_10px_#ffffff] transition hover:-translate-y-0.5 hover:bg-[#d88a9a] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {updatingStatus
                    ? "Updating..."
                    : selectedStatus ===
                        "cancelled"
                      ? "Cancel Order"
                      : "Update Status"}
                </button>
              </div>
            )}
          </div>

          {!isTerminalStatus && (
            <div className="mt-6 rounded-2xl bg-[#f9ebe2] px-5 py-4">
              <p className="text-xs font-semibold leading-5 text-[#806e6e]">
                <span className="font-black">
                  Note:
                </span>{" "}
                Selecting Cancelled requires
                confirmation and permanently
                locks the order.
              </p>
            </div>
          )}
        </section>

        {/* ========================================
            DELIVERY ESTIMATE
        ======================================== */}

        <section className="mt-8 rounded-[30px] bg-[#fff8f5] p-6 shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff] sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-[#c97888]">
                Delivery Estimate
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Set Customer ETA
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#806e6e]">
                Set an estimated arrival time for the customer. This is an estimate only and does not automatically change the order status.
              </p>
            </div>

            {order.estimated_delivery_at && !isTerminalStatus && (
              <div className="rounded-[22px] bg-[#e6efff] px-5 py-4 text-right">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#5071a8]">
                  Saved ETA
                </p>

                <p className="mt-1 font-black text-[#3f5f93]">
                  {formatDate(
                    order.estimated_delivery_at
                  )}
                </p>

                {order.estimated_minutes && (
                  <p className="mt-1 text-xs font-bold text-[#6b7f9f]">
                    {order.estimated_minutes} minute
                    {order.estimated_minutes === 1
                      ? ""
                      : "s"}{" "}
                    from when it was set
                  </p>
                )}
              </div>
            )}
          </div>

          {isTerminalStatus ? (
            <div
              className={`mt-7 rounded-[24px] p-5 ${
                isCancelled
                  ? "bg-[#fce4e7] text-[#a84f61]"
                  : "bg-[#e4f6e9] text-[#3d7c51]"
              }`}
            >
              <p className="font-black">
                {isCancelled
                  ? <span className="inline-flex items-center gap-2"><span className="h-4 w-4"><CancelIcon /></span>Delivery estimate no longer applies.</span>
                  : <span className="inline-flex items-center gap-2"><span className="h-4 w-4"><CheckIcon /></span>Order delivered — ETA is no longer editable.</span>}
              </p>
            </div>
          ) : (
            <>
              <div className="mt-7">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#a58f8f]">
                  Quick Select
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {[15, 30, 45, 60].map(
                    (minutes) => (
                      <button
                        key={minutes}
                        type="button"
                        onClick={() =>
                          setEstimateMinutes(
                            String(minutes)
                          )
                        }
                        disabled={savingEstimate}
                        className={`rounded-full px-5 py-2.5 text-sm font-black transition ${
                          estimateMinutes ===
                          String(minutes)
                            ? "bg-[#e8a0ad] text-white"
                            : "bg-[#f9ebe2] text-[#806e6e] hover:bg-[#f4d5dc] hover:text-[#c97888]"
                        } disabled:cursor-not-allowed disabled:opacity-60`}
                      >
                        {minutes} min
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_1fr]">
                <div>
                  <label
                    htmlFor="estimateMinutes"
                    className="text-xs font-black uppercase tracking-[0.16em] text-[#a58f8f]"
                  >
                    Custom Estimate
                  </label>

                  <div className="mt-3 flex items-center rounded-[22px] bg-[#f9ebe2] px-5">
                    <input
                      id="estimateMinutes"
                      type="number"
                      min="1"
                      max="1440"
                      step="1"
                      value={estimateMinutes}
                      onChange={(event) =>
                        setEstimateMinutes(
                          event.target.value
                        )
                      }
                      disabled={savingEstimate}
                      placeholder="30"
                      className="min-w-0 flex-1 bg-transparent py-4 text-lg font-black outline-none placeholder:text-[#bca8a8]"
                    />

                    <span className="ml-3 text-sm font-bold text-[#806e6e]">
                      minutes
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#a58f8f]">
                    Preview
                  </p>

                  <div className="mt-3 rounded-[22px] bg-[#f9ebe2] px-5 py-4">
                    {getEstimatePreview() ? (
                      <>
                        <p className="text-xs font-bold text-[#806e6e]">
                          Estimated Arrival
                        </p>

                        <p className="mt-1 text-lg font-black text-[#c97888]">
                          {formatDate(
                            getEstimatePreview()!.toISOString()
                          )}
                        </p>
                      </>
                    ) : (
                      <p className="py-1 text-sm font-bold text-[#a58f8f]">
                        Select or enter minutes to preview the ETA.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={saveDeliveryEstimate}
                  disabled={
                    savingEstimate ||
                    !estimateMinutes
                  }
                  className="rounded-full bg-[#e8a0ad] px-7 py-4 text-sm font-black text-white shadow-[5px_5px_12px_#d8c5c0,-4px_-4px_10px_#ffffff] transition hover:-translate-y-0.5 hover:bg-[#d88a9a] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {savingEstimate
                    ? "Saving..."
                    : "Save Estimate"}
                </button>

                {order.estimated_delivery_at && (
                  <button
                    type="button"
                    onClick={clearDeliveryEstimate}
                    disabled={savingEstimate}
                    className="rounded-full bg-[#f9ebe2] px-7 py-4 text-sm font-black text-[#806e6e] transition hover:bg-[#f4d5dc] hover:text-[#c97888] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Remove Estimate
                  </button>
                )}
              </div>
            </>
          )}
        </section>

        {/* ========================================
            ORDER STATUS TIMELINE
        ======================================== */}

        <section className="mt-8 rounded-[30px] bg-[#fff8f5] p-6 shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff] sm:p-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-[#c97888]">
              Order Progress
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Current Status
            </h2>
          </div>

          {isCancelled ? (
            <div className="mt-7 rounded-[24px] border border-[#efb9c1] bg-[#fce4e7] p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#a84f61] font-black text-white">
                  ✕
                </div>

                <div>
                  <p className="font-black text-[#a84f61]">
                    Order Cancelled
                  </p>

                  <p className="mt-1 text-sm leading-6 text-[#806e6e]">
                    Delivery progress has stopped.
                    No further fulfillment action
                    should be taken for this order.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-7 grid gap-3 sm:grid-cols-5">
              {/* PENDING */}

              <div
                className={`rounded-2xl p-4 ${
                  normalizedStatus ===
                  "pending"
                    ? "bg-[#f4d5dc]"
                    : "bg-[#f9ebe2]"
                }`}
              >
                <p className="text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                  1
                </p>

                <p className="mt-2 text-sm font-black">
                  Pending
                </p>
              </div>

              {/* CONFIRMED */}

              <div
                className={`rounded-2xl p-4 ${
                  normalizedStatus ===
                  "confirmed"
                    ? "bg-[#e7efff]"
                    : "bg-[#f9ebe2]"
                }`}
              >
                <p className="text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                  2
                </p>

                <p className="mt-2 text-sm font-black">
                  Confirmed
                </p>
              </div>

              {/* PREPARING */}

              <div
                className={`rounded-2xl p-4 ${
                  normalizedStatus ===
                  "preparing"
                    ? "bg-[#fff0d8]"
                    : "bg-[#f9ebe2]"
                }`}
              >
                <p className="text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                  3
                </p>

                <p className="mt-2 text-sm font-black">
                  Preparing
                </p>
              </div>

              {/* OUT FOR DELIVERY */}

              <div
                className={`rounded-2xl p-4 ${
                  normalizedStatus ===
                  "out_for_delivery"
                    ? "bg-[#e6efff]"
                    : "bg-[#f9ebe2]"
                }`}
              >
                <p className="text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                  4
                </p>

                <p className="mt-2 text-sm font-black">
                  Out for Delivery
                </p>
              </div>

              {/* COMPLETED */}

              <div
                className={`rounded-2xl p-4 ${
                  normalizedStatus ===
                  "completed"
                    ? "bg-[#e4f6e9]"
                    : "bg-[#f9ebe2]"
                }`}
              >
                <p className="text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                  5
                </p>

                <p className="mt-2 text-sm font-black">
                  Completed
                </p>
              </div>
            </div>
          )}
        </section>

        <section className="mt-8 rounded-[30px] bg-[#fff8f5] p-6 shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff] sm:p-8">
          <p className="text-sm font-bold uppercase tracking-wider text-[#c97888]">Status History</p>
          <h2 className="mt-2 text-2xl font-black">Order Activity</h2>
          <div className="mt-7 space-y-4">
            {statusHistory.length === 0 ? (
              <p className="text-sm text-[#806e6e]">No status history recorded yet.</p>
            ) : (
              statusHistory.map((entry, index) => (
                <div key={entry.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f4d5dc] font-black text-[#c97888]">
                      <span className="h-4 w-4">
                        {index === statusHistory.length - 1 ? <ActivityIcon /> : <CheckIcon />}
                      </span>
                    </div>
                    {index < statusHistory.length - 1 && <div className="h-8 w-[2px] bg-[#ead8d0]" />}
                  </div>
                  <div className="pb-4">
                    <p className="font-black">{formatStatus(entry.status)}</p>
                    <p className="mt-1 text-sm text-[#806e6e]">{formatDate(entry.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* ========================================
            EMAIL NOTIFICATION HISTORY
        ======================================== */}

        <section className="mt-8 rounded-[30px] bg-[#fff8f5] p-6 shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff] sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-[#c97888]">
                Email Notifications
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Email History
              </h2>

              <p className="mt-2 text-sm text-[#806e6e]">
                Sent and failed customer emails for this order.
              </p>
            </div>

            <button
              type="button"
              onClick={loadEmailLogs}
              className="rounded-full bg-[#f9ebe2] px-5 py-3 text-xs font-black text-[#806e6e] transition hover:bg-[#f4d5dc] hover:text-[#c97888]"
            >
              Refresh Emails
            </button>
          </div>

          {emailLogs.length === 0 ? (
            <div className="mt-7 rounded-[22px] bg-[#f9ebe2] p-6 text-center">
              <p className="text-sm font-semibold text-[#806e6e]">
                No email activity recorded yet.
              </p>
            </div>
          ) : (
            <div className="mt-7 space-y-3">
              {emailLogs.map((email) => (
                <div
                  key={email.id}
                  className="rounded-[22px] bg-[#f9ebe2] p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-black">
                          {formatEmailType(
                            email.email_type
                          )}
                        </p>

                        <span
                          className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                            email.status === "sent"
                              ? "bg-[#e4f6e9] text-[#3d7c51]"
                              : "bg-[#fce4e7] text-[#a84f61]"
                          }`}
                        >
                          {email.status === "sent" ? (
                            <span className="inline-flex items-center gap-1"><span className="h-3 w-3"><CheckIcon /></span>Sent</span>
                          ) : (
                            <span className="inline-flex items-center gap-1"><span className="h-3 w-3"><CancelIcon /></span>Failed</span>
                          )}
                        </span>
                      </div>

                      <p className="mt-2 break-words text-sm font-semibold text-[#806e6e]">
                        {email.recipient}
                      </p>

                      <p className="mt-1 break-words text-xs text-[#a58f8f]">
                        {email.subject}
                      </p>

                      {email.error_message && (
                        <div className="mt-3 rounded-xl bg-[#fce4e7] px-4 py-3 text-xs font-semibold leading-5 text-[#a84f61]">
                          {email.error_message}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 text-left sm:text-right">
                      <p className="text-xs font-bold text-[#806e6e]">
                        {formatDate(
                          email.created_at
                        )}
                      </p>

                      {email.provider_email_id && (
                        <p className="mt-1 max-w-[220px] break-all text-[10px] text-[#a58f8f]">
                          {email.provider_email_id}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ========================================
            MAIN GRID
        ======================================== */}

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
          {/* ========================================
              LEFT
          ======================================== */}

          <div className="space-y-8">
            {/* ORDER ITEMS */}

            <section className="rounded-[30px] bg-[#fff8f5] p-6 shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff] sm:p-8">
              <p className="text-sm font-bold uppercase tracking-wider text-[#c97888]">
                Order
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Order Items
              </h2>

              {orderItems.length === 0 ? (
                <div className="mt-7 rounded-2xl bg-[#f9ebe2] p-6 text-center">
                  <p className="text-sm font-semibold text-[#806e6e]">
                    No order items found.
                  </p>
                </div>
              ) : (
                <div className="mt-7 space-y-4">
                  {orderItems.map(
                    (item) => (
                      <div
                        key={item.id}
                        className={`flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center ${
                          isCancelled
                            ? "bg-[#f7eeee]"
                            : "bg-[#f9ebe2]"
                        }`}
                      >
                        <div
                          className={`h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-white ${
                            isCancelled
                              ? "opacity-60 grayscale-[30%]"
                              : ""
                          }`}
                        >
                          {item.product_image ? (
                            <img
                              src={
                                item.product_image
                              }
                              alt={
                                item.product_name
                              }
                              className="h-full w-full object-cover"
                              onError={(
                                event
                              ) => {
                                event.currentTarget.style.display =
                                  "none";
                              }}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-3xl">
                              <span className="block h-12 w-12"><DonutIcon /></span>
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg font-black">
                            {
                              item.product_name
                            }
                          </h3>

                          <p className="mt-1 text-sm text-[#806e6e]">
                            ₱
                            {formatCurrency(
                              item.price
                            )}{" "}
                            × {item.quantity}
                          </p>
                        </div>

                        <div className="text-left sm:text-right">
                          <p className="text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                            Item Total
                          </p>

                          <p
                            className={`mt-1 text-lg font-black ${
                              isCancelled
                                ? "text-[#a58f8f] line-through"
                                : "text-[#c97888]"
                            }`}
                          >
                            ₱
                            {formatCurrency(
                              Number(
                                item.price
                              ) *
                                item.quantity
                            )}
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </section>

            {/* CUSTOMER */}

            <section className="rounded-[30px] bg-[#fff8f5] p-6 shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff] sm:p-8">
              <p className="text-sm font-bold uppercase tracking-wider text-[#c97888]">
                Customer
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Customer Information
              </h2>

              <div className="mt-7 grid gap-5 sm:grid-cols-2">
                <div className="rounded-2xl bg-[#f9ebe2] p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                    Full Name
                  </p>

                  <p className="mt-2 font-black">
                    {order.customer_name ||
                      "Customer"}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#f9ebe2] p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                    Phone
                  </p>

                  <p className="mt-2 break-words font-black">
                    {order.customer_phone ||
                      "No phone"}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#f9ebe2] p-5 sm:col-span-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                    Email
                  </p>

                  <p className="mt-2 break-words font-black">
                    {order.customer_email ||
                      "No email"}
                  </p>
                </div>
              </div>
            </section>

            {/* DELIVERY */}

            <section className="rounded-[30px] bg-[#fff8f5] p-6 shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff] sm:p-8">
              <p className="text-sm font-bold uppercase tracking-wider text-[#c97888]">
                Delivery
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Delivery Information
              </h2>

              <div className="mt-7 space-y-5">
                <div className="rounded-2xl bg-[#f9ebe2] p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                    Delivery Address
                  </p>

                  <p className="mt-2 font-black">
                    {order.delivery_address ||
                      "No address"}
                  </p>

                  <p className="mt-1 text-sm text-[#806e6e]">
                    {order.delivery_city ||
                      "No city"}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#f9ebe2] p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                    Order Notes
                  </p>

                  <p className="mt-2 text-sm font-semibold leading-6 text-[#806e6e]">
                    {order.order_notes ||
                      "No additional notes."}
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* ========================================
              RIGHT
          ======================================== */}

          <aside className="space-y-8">
            {/* EMAIL CONFIRMATION */}

            <section className="rounded-[30px] bg-[#fff8f5] p-6 shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff] sm:p-8">
              <p className="text-sm font-bold uppercase tracking-wider text-[#c97888]">
                Email Confirmation
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Customer Email
              </h2>

              <div className="mt-6 rounded-2xl bg-[#f9ebe2] p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                  Send To
                </p>

                <p className="mt-2 break-words font-black">
                  {order.customer_email ||
                    "No email address"}
                </p>
              </div>

              <button
                type="button"
                onClick={resendConfirmationEmail}
                disabled={
                  resendingConfirmation ||
                  !order.customer_email
                }
                className="mt-5 w-full rounded-full bg-[#e8a0ad] px-6 py-4 text-sm font-black text-white shadow-[5px_5px_12px_#d8c5c0,-4px_-4px_10px_#ffffff] transition hover:-translate-y-0.5 hover:bg-[#d88a9a] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {resendingConfirmation
                  ? "Sending..."
                  : <span className="inline-flex items-center gap-2"><span className="h-4 w-4"><MailIcon /></span>Resend Confirmation Email</span>}
              </button>

              <p className="mt-4 text-xs font-semibold leading-5 text-[#806e6e]">
                This only resends the existing order
                confirmation. It does not create a new
                order or change the order status.
              </p>
            </section>

            {/* PAYMENT */}

            <section className="rounded-[30px] bg-[#fff8f5] p-6 shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff] sm:p-8">
              <p className="text-sm font-bold uppercase tracking-wider text-[#c97888]">
                Payment
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Payment Method
              </h2>

              <div className="mt-6 rounded-2xl bg-[#f9ebe2] p-5">
                <p className="font-black">
                  💵{" "}
                  {order.payment_method ||
                    "Cash on Delivery"}
                </p>

                <p className="mt-2 text-sm text-[#806e6e]">
                  {isCancelled
                    ? "No payment should be collected for this cancelled order."
                    : "Payment will be collected upon delivery."}
                </p>
              </div>
            </section>

            {/* SUMMARY */}

            <section
              className={`rounded-[30px] p-6 shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff] sm:p-8 ${
                isCancelled
                  ? "border border-[#efb9c1] bg-[#fff7f7]"
                  : "bg-[#fff8f5]"
              }`}
            >
              <p className="text-sm font-bold uppercase tracking-wider text-[#c97888]">
                Summary
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Order Total
              </h2>

              {isCancelled && (
                <div className="mt-5 rounded-2xl bg-[#fce4e7] px-4 py-3">
                  <p className="text-xs font-black text-[#a84f61]">
                    Cancelled — excluded from active revenue
                  </p>
                </div>
              )}

              <div className="mt-7 space-y-4">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-[#806e6e]">
                    Subtotal
                  </span>

                  <span
                    className={`font-bold ${
                      isCancelled
                        ? "text-[#a58f8f] line-through"
                        : ""
                    }`}
                  >
                    ₱
                    {formatCurrency(
                      order.subtotal
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-[#806e6e]">
                    Delivery Fee
                  </span>

                  <span
                    className={`font-bold ${
                      isCancelled
                        ? "text-[#a58f8f] line-through"
                        : ""
                    }`}
                  >
                    ₱
                    {formatCurrency(
                      order.delivery_fee
                    )}
                  </span>
                </div>

                <div className="h-px bg-[#ead8d0]" />

                <div className="flex items-center justify-between gap-4">
                  <span className="font-black">
                    Total
                  </span>

                  <span
                    className={`text-2xl font-black ${
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
                </div>
              </div>
            </section>

            {/* ORDER INFO */}

            <section className="rounded-[30px] bg-[#fff8f5] p-6 shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff]">
              <p className="text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                Order Information
              </p>

              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-[#806e6e]">
                    Order ID
                  </span>

                  <span className="font-black">
                    #{order.id}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-[#806e6e]">
                    Status
                  </span>

                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-black ${statusStyle.container}`}
                  >
                    {formatStatus(
                      order.status
                    )}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <span className="text-sm text-[#806e6e]">
                    Created
                  </span>

                  <span className="max-w-[180px] text-right text-xs font-bold">
                    {formatDate(
                      order.created_at
                    )}
                  </span>
                </div>
              </div>
            </section>

            {/* ACTIONS */}

            <div className="flex flex-col gap-3">
              <Link
                href="/admin/orders"
                className="rounded-full bg-[#e8a0ad] px-7 py-4 text-center text-sm font-bold text-white shadow-[5px_5px_12px_#d8c5c0,-4px_-4px_10px_#ffffff] transition hover:-translate-y-0.5 hover:bg-[#d88a9a]"
              >
                <span className="inline-flex items-center gap-2"><span className="h-4 w-4"><ArrowLeftIcon /></span>Back to Orders</span>
              </Link>

              <button
                type="button"
                onClick={() =>
                  loadOrder(false)
                }
                disabled={
                  updatingStatus ||
                  savingEstimate
                }
                className="rounded-full bg-[#fff8f5] px-7 py-4 text-center text-sm font-bold text-[#806e6e] shadow-[5px_5px_12px_#d8c5c0,-4px_-4px_10px_#ffffff] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="inline-flex items-center gap-2"><span className="h-4 w-4"><RefreshIcon /></span>Refresh Order</span>
              </button>

              <Link
                href="/admin"
                className="rounded-full bg-[#f9ebe2] px-7 py-4 text-center text-sm font-bold text-[#806e6e] shadow-[5px_5px_12px_#d8c5c0,-4px_-4px_10px_#ffffff] transition hover:-translate-y-0.5"
              >
                Admin Dashboard
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}


function StatusIcon({type}:{type:string}) {
  if (type === "check") return <span className="block h-4 w-4"><CheckIcon /></span>;
  if (type === "cancel") return <span className="block h-4 w-4"><CancelIcon /></span>;
  if (type === "delivery") return <span className="block h-4 w-4"><DeliveryIcon /></span>;
  if (type === "prepare") return <span className="block h-4 w-4"><PrepareIcon /></span>;
  return <span className="block h-3.5 w-3.5"><ActivityIcon /></span>;
}
function ArrowLeftIcon(){return <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true"><path d="M19 12H5M10 7L5 12L10 17" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/></svg>;}
function RefreshIcon(){return <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true"><path d="M19 8A7 7 0 1 0 19.5 15M19 4V8H15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;}
function CloseIcon(){return <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true"><path d="M7 7L17 17M17 7L7 17" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/></svg>;}
function CheckIcon(){return <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true"><path d="M6.5 12.5L10.2 16L17.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;}
function CheckCircleIcon(){return <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true"><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8"/><path d="M8 12.2L10.7 15L16.5 9" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/></svg>;}
function CancelIcon(){return <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true"><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8"/><path d="M9 9L15 15M15 9L9 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;}
function AlertIcon(){return <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true"><path d="M12 4L21 20H3L12 4Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><path d="M12 9V14M12 17.2V17.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;}
function LockIcon(){return <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="3" stroke="currentColor" strokeWidth="1.8"/><path d="M8 10V8C8 5.8 9.8 4 12 4C14.2 4 16 5.8 16 8V10" stroke="currentColor" strokeWidth="1.8"/></svg>;}
function DeliveryIcon(){return <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true"><path d="M3 6H14V17H3V6ZM14 10H18L21 13V17H14V10Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><circle cx="7" cy="18" r="2" stroke="currentColor" strokeWidth="1.7"/><circle cx="18" cy="18" r="2" stroke="currentColor" strokeWidth="1.7"/></svg>;}
function PrepareIcon(){return <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true"><circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.7"/><path d="M12 5V3M12 21V19M5 12H3M21 12H19" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>;}
function ActivityIcon(){return <svg viewBox="0 0 24 24" fill="currentColor" className="h-full w-full" aria-hidden="true"><circle cx="12" cy="12" r="5"/></svg>;}
function MailIcon(){return <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="13" rx="3" stroke="currentColor" strokeWidth="1.7"/><path d="M5 7L12 12.5L19 7" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>;}
function WalletIcon(){return <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true"><path d="M4 6.5C4 5.7 4.7 5 5.5 5H18V19H5.5C4.7 19 4 18.3 4 17.5V6.5Z" stroke="currentColor" strokeWidth="1.7"/><path d="M15 10H20V15H15C13.6 15 13 14 13 12.5C13 11 13.6 10 15 10Z" stroke="currentColor" strokeWidth="1.7"/></svg>;}
function DonutIcon(){return <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true"><path d="M20 12C20 16.4 16.4 20 12 20C7.6 20 4 16.4 4 12C4 7.6 7.6 4 12 4C16.4 4 20 7.6 20 12Z" stroke="currentColor" strokeWidth="1.7"/><circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.7"/><path d="M6.5 8.5C8.3 7 10.3 7.5 12 6.8C13.8 6 15.5 6.6 17.3 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;}

