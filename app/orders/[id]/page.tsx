"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

/* =========================================================
   TYPES
========================================================= */

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

type TrackingStep = {
  status: string;
  title: string;
  description: string;
  icon: "receipt" | "check" | "prepare" | "delivery" | "home";
};

/* =========================================================
   TRACKING STEPS
========================================================= */

const trackingSteps: TrackingStep[] = [
  {
    status: "pending",
    title: "Order Placed",
    description: "We received your order.",
    icon: "receipt",
  },
  {
    status: "confirmed",
    title: "Confirmed",
    description: "Your order has been confirmed.",
    icon: "check",
  },
  {
    status: "preparing",
    title: "Preparing",
    description: "Your treats are being prepared.",
    icon: "prepare",
  },
  {
    status: "out_for_delivery",
    title: "Out for Delivery",
    description: "Your order is on the way.",
    icon: "delivery",
  },
  {
    status: "completed",
    title: "Delivered",
    description: "Your order has been delivered.",
    icon: "home",
  },
];

/* =========================================================
   HELPERS
========================================================= */

function normalizeStatus(status: string) {
  const normalized = (status || "pending")
    .toLowerCase()
    .trim()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");

  if (normalized === "processing" || normalized === "ready") {
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

function formatStatus(status: string) {
  return normalizeStatus(status)
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(Number(value || 0));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

/* =========================================================
   PAGE
========================================================= */

export default function OrderTrackingPage() {
  const params = useParams();

  const orderId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [statusHistory, setStatusHistory] = useState<OrderStatusHistory[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const [realtimeConnected, setRealtimeConnected] = useState(false);

  const [error, setError] = useState("");
  const [cancelMessage, setCancelMessage] = useState("");

  const [now, setNow] = useState(Date.now());

  /* =========================================================
     FETCH ORDER
  ========================================================= */

  const fetchOrder = useCallback(
    async (showRefresh = false) => {
      if (!orderId) {
        return;
      }

      const numericOrderId = Number(orderId);

      if (Number.isNaN(numericOrderId)) {
        setError("Invalid order number.");
        setLoading(false);
        return;
      }

      if (showRefresh) {
        setRefreshing(true);
      }

      try {
        const response = await fetch(
          `/api/orders/track/${numericOrderId}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const result = await response.json().catch(() => null);

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            setOrder(null);
            setItems([]);
            setStatusHistory([]);
            setRealtimeConnected(false);

            setError(
              "Please verify your order number and email before viewing this order."
            );

            return;
          }

          if (response.status === 404) {
            setOrder(null);
            setItems([]);
            setStatusHistory([]);
            setRealtimeConnected(false);
            setError("");
            return;
          }

          throw new Error(
            result?.error || "Unable to load this order."
          );
        }

        setOrder(result.order as Order);

        setItems(
          Array.isArray(result.orderItems)
            ? (result.orderItems as OrderItem[])
            : []
        );

        setStatusHistory(
          Array.isArray(result.statusHistory)
            ? (result.statusHistory as OrderStatusHistory[])
            : []
        );

        setRealtimeConnected(true);
        setError("");
      } catch (fetchError) {
        console.warn(
          "Secure order tracking error:",
          fetchError
        );

        setRealtimeConnected(false);

        setError((currentError) => {
          if (currentError) {
            return currentError;
          }

          return fetchError instanceof Error
            ? fetchError.message
            : "Unable to load this order.";
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [orderId]
  );

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    setLoading(true);
    fetchOrder(false);
  }, [fetchOrder]);

  /* =========================================================
     ETA CLOCK
  ========================================================= */

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 30000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  /* =========================================================
     SECURE POLLING
  ========================================================= */

  useEffect(() => {
    if (!orderId) {
      return;
    }

    const timer = window.setInterval(() => {
      fetchOrder(false);
    }, 10000);

    return () => {
      window.clearInterval(timer);
    };
  }, [orderId, fetchOrder]);

  /* =========================================================
     CURRENT STATUS
  ========================================================= */

  const currentStatus = normalizeStatus(
    order?.status ?? "pending"
  );

  const currentStepIndex = useMemo(() => {
    return trackingSteps.findIndex(
      (step) => step.status === currentStatus
    );
  }, [currentStatus]);

  const canCancel = currentStatus === "pending";
  const cancelled = currentStatus === "cancelled";
  const completed = currentStatus === "completed";

  /* =========================================================
     ETA
  ========================================================= */

  function getRemainingEstimateText() {
    if (!order?.estimated_delivery_at) {
      return "";
    }

    const target = new Date(
      order.estimated_delivery_at
    ).getTime();

    const difference = target - now;

    if (difference <= 0) {
      return "The estimated arrival time has passed. Your order is still being tracked live.";
    }

    const totalMinutes = Math.ceil(difference / 60000);

    if (totalMinutes < 60) {
      return `About ${totalMinutes} minute${
        totalMinutes === 1 ? "" : "s"
      } remaining`;
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (minutes === 0) {
      return `About ${hours} hour${
        hours === 1 ? "" : "s"
      } remaining`;
    }

    return `About ${hours}h ${minutes}m remaining`;
  }

  function getStatusDescription() {
    if (cancelled) {
      return "This order has been cancelled.";
    }

    const step = trackingSteps.find(
      (item) => item.status === currentStatus
    );

    return (
      step?.description ||
      "Your order status has been updated."
    );
  }

  /* =========================================================
     CANCEL ORDER
  ========================================================= */

  async function handleCancelOrder() {
    if (!order) {
      return;
    }

    if (normalizeStatus(order.status) !== "pending") {
      setCancelMessage(
        "This order can no longer be cancelled because it has already been confirmed or preparation has started."
      );
      return;
    }

    const confirmedCancel = window.confirm(
      `Cancel Order #${order.id}?\n\nThis action cannot be undone.`
    );

    if (!confirmedCancel) {
      return;
    }

    setCancelling(true);
    setCancelMessage("");
    setError("");

    try {
      const response = await fetch(
        `/api/orders/track/${order.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "cancel",
          }),
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 409) {
          setCancelMessage(
            result?.error ||
              "This order could not be cancelled because its status has already changed."
          );

          await fetchOrder(true);
          return;
        }

        if (response.status === 401 || response.status === 403) {
          setOrder(null);
          setItems([]);
          setStatusHistory([]);
          setRealtimeConnected(false);

          setError(
            "Your tracking session has expired. Please verify your order again."
          );

          return;
        }

        throw new Error(
          result?.error || "Unable to cancel your order."
        );
      }

      if (result?.order) {
        setOrder(result.order as Order);
      }

      if (Array.isArray(result?.statusHistory)) {
        setStatusHistory(
          result.statusHistory as OrderStatusHistory[]
        );
      } else {
        await fetchOrder(false);
      }

      setCancelMessage(
        "Your order has been cancelled successfully."
      );
    } catch (cancelError) {
      console.warn(
        "Secure cancel order error:",
        cancelError
      );

      setError(
        cancelError instanceof Error
          ? cancelError.message
          : "Unable to cancel your order. Please try again."
      );
    } finally {
      setCancelling(false);
    }
  }

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7eee9] px-6 text-[#2d2424]">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#ead8d0] border-t-[#e8a0ad]" />

          <p className="mt-5 font-bold text-[#806e6e]">
            Loading your order...
          </p>
        </div>
      </main>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */

  if (error && !order) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7eee9] px-6 text-[#2d2424]">
        <BackgroundGlows />

        <div className="relative w-full max-w-lg rounded-[34px] border border-white/70 bg-[#fff8f5] p-8 text-center shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff]">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[26px] bg-[#f9ebe2] shadow-[inset_4px_4px_10px_#ddcac4,inset_-4px_-4px_10px_#ffffff]">
            <div className="h-10 w-10 text-[#b55f70]">
              <AlertCircleIcon />
            </div>
          </div>

          <h1 className="mt-6 text-3xl font-black">
            Something went wrong
          </h1>

          <p className="mt-3 leading-7 text-[#806e6e]">
            {error}
          </p>

          <Link
            href="/track-order"
            className="mt-7 inline-flex rounded-full bg-[#e8a0ad] px-7 py-3 font-black text-white transition hover:-translate-y-0.5 hover:bg-[#d88a9a]"
          >
            Try Again
          </Link>
        </div>
      </main>
    );
  }

  /* =========================================================
     ORDER NOT FOUND
  ========================================================= */

  if (!order) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7eee9] px-6 text-[#2d2424]">
        <BackgroundGlows />

        <div className="relative w-full max-w-lg rounded-[34px] border border-white/70 bg-[#fff8f5] p-8 text-center shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff]">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[26px] bg-[#f9ebe2] shadow-[inset_4px_4px_10px_#ddcac4,inset_-4px_-4px_10px_#ffffff]">
            <div className="h-11 w-11 text-[#362929]">
              <PackageSearchIcon />
            </div>
          </div>

          <h1 className="mt-6 text-3xl font-black">
            Order Not Found
          </h1>

          <p className="mt-3 text-[#806e6e]">
            We couldn&apos;t find that order number.
          </p>

          <Link
            href="/track-order"
            className="mt-7 inline-flex rounded-full bg-[#e8a0ad] px-7 py-3 font-black text-white transition hover:-translate-y-0.5 hover:bg-[#d88a9a]"
          >
            Search Again
          </Link>
        </div>
      </main>
    );
  }

  /* =========================================================
     MAIN PAGE
  ========================================================= */

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7eee9] px-5 py-10 text-[#2d2424] sm:px-6">
      <BackgroundGlows />

      <div className="relative mx-auto max-w-5xl">
        {/* =====================================================
            TOP NAVIGATION
        ===================================================== */}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/shop"
            className="group inline-flex items-center gap-2 text-sm font-black text-[#c97888] transition hover:text-[#a85f70]"
          >
            <span className="transition-transform group-hover:-translate-x-1">
              ←
            </span>

            Continue Shopping
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            {/* LIVE */}

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
                ? "Live Tracking"
                : "Connecting..."}
            </div>

            {/* REFRESH */}

            <button
              type="button"
              onClick={() => fetchOrder(true)}
              disabled={refreshing || cancelling}
              className="group inline-flex items-center gap-2 rounded-full bg-[#fff8f5] px-5 py-2.5 text-sm font-black text-[#5f4d4d] shadow-[4px_4px_10px_#d8c5c0,-3px_-3px_8px_#ffffff] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span
                className={`h-4 w-4 ${
                  refreshing ? "animate-spin" : ""
                }`}
              >
                <RefreshIcon />
              </span>

              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* =====================================================
            HERO / TRACKING
        ===================================================== */}

        <section className="mt-7 rounded-[34px] border border-white/70 bg-[#fff8f5]/95 p-7 shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff] backdrop-blur-sm sm:p-9">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#f9ebe2] px-3.5 py-2">
                <span className="h-4 w-4 text-[#c97888]">
                  <ReceiptIcon />
                </span>

                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#c97888]">
                  Doughy Order
                </span>
              </div>

              <h1 className="mt-4 text-4xl font-black tracking-[-0.04em]">
                Order #{order.id}
              </h1>

              <p className="mt-2 text-sm text-[#806e6e]">
                Placed {formatDate(order.created_at)}
              </p>
            </div>

            {/* STATUS */}

            <div
              className={`inline-flex items-center gap-2 self-start rounded-full px-5 py-2.5 text-sm font-black ${
                cancelled
                  ? "bg-[#fce4e7] text-[#a84f61]"
                  : completed
                    ? "bg-[#e5efe6] text-[#638267]"
                    : currentStatus === "out_for_delivery"
                      ? "bg-[#e6efff] text-[#5071a8]"
                      : currentStatus === "preparing"
                        ? "bg-[#fff0d8] text-[#a56d20]"
                        : currentStatus === "confirmed"
                          ? "bg-[#e7efff] text-[#4c69a8]"
                          : "bg-[#f9ebe2] text-[#c97888]"
              }`}
            >
              <span className="h-4 w-4">
                {cancelled ? (
                  <LockIcon />
                ) : (
                  <StatusMiniIcon status={currentStatus} />
                )}
              </span>

              {formatStatus(currentStatus)}
            </div>
          </div>

          {/* CURRENT UPDATE */}

          {!cancelled && (
            <div className="mt-7 flex items-start gap-4 rounded-[24px] bg-[#f9ebe2] px-5 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#fff8f5] shadow-[3px_3px_8px_#dfccc6,-3px_-3px_8px_#ffffff]">
                <span className="h-5 w-5 text-[#c97888]">
                  <ActivityIcon />
                </span>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#c97888]">
                  Current Update
                </p>

                <p className="mt-1.5 text-sm font-bold leading-6 text-[#5f4d4d]">
                  {getStatusDescription()}
                </p>
              </div>
            </div>
          )}

          {/* =====================================================
              ETA
          ===================================================== */}

          {order.estimated_delivery_at &&
            !cancelled &&
            !completed && (
              <div className="mt-7 overflow-hidden rounded-[26px] border border-[#d4def2] bg-[#eef4ff]">
                <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[#dfe9fb]">
                      <span className="h-7 w-7 text-[#5071a8]">
                        <DeliveryIcon />
                      </span>
                    </div>

                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5071a8]">
                        Estimated Arrival
                      </p>

                      <p className="mt-1 text-xl font-black text-[#3f5f93]">
                        {formatDate(
                          order.estimated_delivery_at
                        )}
                      </p>

                      <p className="mt-2 text-sm font-bold text-[#60769a]">
                        {getRemainingEstimateText()}
                      </p>
                    </div>
                  </div>

                  {order.estimated_minutes && (
                    <div className="self-start rounded-full bg-white/70 px-4 py-2 text-xs font-black text-[#5071a8] sm:self-center">
                      {order.estimated_minutes} min estimate
                    </div>
                  )}
                </div>

                <div className="h-1 bg-[#d8e3f6]">
                  <div className="h-full w-full animate-pulse bg-[#8da8d8]" />
                </div>
              </div>
            )}

          {/* COMPLETED */}

          {completed && (
            <div className="mt-7 rounded-[24px] bg-[#e5efe6] p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-[#638267] text-white">
                  <span className="h-6 w-6">
                    <CheckIcon />
                  </span>
                </div>

                <div>
                  <p className="font-black text-[#638267]">
                    Delivered
                  </p>

                  <p className="mt-1 text-sm leading-6 text-[#806e6e]">
                    This order has been completed. The
                    delivery estimate is no longer active.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* =====================================================
              CANCELLED / TRACKER
          ===================================================== */}

          {cancelled ? (
            <div className="mt-8 rounded-[26px] border border-[#e6c9cc] bg-[#f8e7e8] p-6">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[#a84f61] text-white">
                  <span className="h-6 w-6">
                    <CloseIcon />
                  </span>
                </div>

                <div>
                  <h2 className="font-black text-[#9b5d65]">
                    Order Cancelled
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-[#806e6e]">
                    This order has been cancelled and will no
                    longer be prepared or delivered.
                  </p>

                  <p className="mt-2 text-xs font-bold text-[#a84f61]">
                    No further action is required.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-10">
              {/* =================================================
                  DESKTOP TRACKER
              ================================================= */}

              <div className="hidden sm:grid sm:grid-cols-5">
                {trackingSteps.map((step, index) => {
                  const stepComplete =
                    currentStepIndex >= index;

                  const stepCurrent =
                    currentStepIndex === index;

                  const passedStep =
                    currentStepIndex > index;

                  return (
                    <div
                      key={step.status}
                      className="relative"
                    >
                      {index <
                        trackingSteps.length - 1 && (
                        <div
                          className={`absolute left-[58px] right-0 top-7 h-[3px] ${
                            passedStep
                              ? "bg-[#e8a0ad]"
                              : "bg-[#ead8d0]"
                          }`}
                        />
                      )}

                      <div
                        className={`relative z-10 flex h-14 w-14 items-center justify-center rounded-[18px] transition ${
                          stepComplete
                            ? "bg-[#e8a0ad] text-white shadow-[4px_4px_10px_#d8c5c0,-3px_-3px_8px_#ffffff]"
                            : "bg-[#f3e8e4] text-[#aa9696]"
                        } ${
                          stepCurrent
                            ? "ring-4 ring-[#f5d4db]"
                            : ""
                        }`}
                      >
                        <span className="h-7 w-7">
                          {stepComplete &&
                          index < currentStepIndex ? (
                            <CheckIcon />
                          ) : (
                            <TrackingIcon icon={step.icon} />
                          )}
                        </span>
                      </div>

                      <p
                        className={`mt-3 pr-4 text-sm font-black ${
                          stepCurrent
                            ? "text-[#c97888]"
                            : stepComplete
                              ? "text-[#5f4d4d]"
                              : "text-[#aa9696]"
                        }`}
                      >
                        {step.title}
                      </p>

                      {stepCurrent && (
                        <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-[#c97888]">
                          Current
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* =================================================
                  MOBILE TRACKER
              ================================================= */}

              <div className="space-y-0 sm:hidden">
                {trackingSteps.map((step, index) => {
                  const stepComplete =
                    currentStepIndex >= index;

                  const stepCurrent =
                    currentStepIndex === index;

                  const passedStep =
                    currentStepIndex > index;

                  return (
                    <div
                      key={step.status}
                      className="relative flex gap-4 pb-7 last:pb-0"
                    >
                      {index <
                        trackingSteps.length - 1 && (
                        <div
                          className={`absolute left-[23px] top-12 h-[calc(100%-38px)] w-[3px] ${
                            passedStep
                              ? "bg-[#e8a0ad]"
                              : "bg-[#ead8d0]"
                          }`}
                        />
                      )}

                      <div
                        className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] ${
                          stepComplete
                            ? "bg-[#e8a0ad] text-white"
                            : "bg-[#f3e8e4] text-[#aa9696]"
                        } ${
                          stepCurrent
                            ? "ring-4 ring-[#f5d4db]"
                            : ""
                        }`}
                      >
                        <span className="h-6 w-6">
                          {stepComplete &&
                          index < currentStepIndex ? (
                            <CheckIcon />
                          ) : (
                            <TrackingIcon icon={step.icon} />
                          )}
                        </span>
                      </div>

                      <div className="pt-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p
                            className={`font-black ${
                              stepCurrent
                                ? "text-[#c97888]"
                                : stepComplete
                                  ? "text-[#5f4d4d]"
                                  : "text-[#aa9696]"
                            }`}
                          >
                            {step.title}
                          </p>

                          {stepCurrent && (
                            <span className="rounded-full bg-[#f4d5dc] px-2 py-1 text-[9px] font-black uppercase tracking-wider text-[#c97888]">
                              Current
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-xs leading-5 text-[#806e6e]">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =====================================================
              HISTORY
          ===================================================== */}

          <div className="mt-9 border-t border-[#ead8d0] pt-7">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#f9ebe2]">
                <span className="h-5 w-5 text-[#c97888]">
                  <HistoryIcon />
                </span>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#c97888]">
                  Order History
                </p>

                <h3 className="mt-1 text-xl font-black">
                  Status Updates
                </h3>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {statusHistory.length === 0 ? (
                <p className="text-sm text-[#806e6e]">
                  No status updates recorded yet.
                </p>
              ) : (
                statusHistory.map((entry, index) => (
                  <div
                    key={entry.id}
                    className="flex gap-4"
                  >
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-[12px] ${
                          index ===
                          statusHistory.length - 1
                            ? "bg-[#e8a0ad] text-white"
                            : "bg-[#f4d5dc] text-[#c97888]"
                        }`}
                      >
                        <span className="h-4 w-4">
                          {index ===
                          statusHistory.length - 1 ? (
                            <ActivityIcon />
                          ) : (
                            <CheckIcon />
                          )}
                        </span>
                      </div>

                      {index <
                        statusHistory.length - 1 && (
                        <div className="h-7 w-[2px] bg-[#ead8d0]" />
                      )}
                    </div>

                    <div className="pb-3">
                      <p className="font-black text-[#5f4d4d]">
                        {formatStatus(entry.status)}
                      </p>

                      <p className="mt-1 text-xs text-[#806e6e]">
                        {formatDate(entry.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* =====================================================
              CANCELLATION
          ===================================================== */}

          {!cancelled && (
            <div className="mt-9 border-t border-[#ead8d0] pt-7">
              {canCancel ? (
                <div className="flex flex-col justify-between gap-5 rounded-[24px] bg-[#f9ebe2] p-5 sm:flex-row sm:items-center">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#fff8f5]">
                      <span className="h-5 w-5 text-[#b76676]">
                        <CancelOrderIcon />
                      </span>
                    </div>

                    <div>
                      <h3 className="font-black">
                        Need to cancel your order?
                      </h3>

                      <p className="mt-1 max-w-xl text-sm leading-6 text-[#806e6e]">
                        You can cancel your order while it is
                        still pending. Once the store confirms
                        it, cancellation will no longer be
                        available.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCancelOrder}
                    disabled={cancelling || refreshing}
                    className="shrink-0 rounded-full border border-[#d9919e] px-6 py-3 text-sm font-black text-[#b76676] transition hover:bg-[#e8a0ad] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {cancelling
                      ? "Cancelling..."
                      : "Cancel Order"}
                  </button>
                </div>
              ) : completed ? (
                <div className="rounded-[24px] bg-[#e5efe6] p-5">
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-[#638267] text-white">
                      <span className="h-5 w-5">
                        <CheckIcon />
                      </span>
                    </div>

                    <div>
                      <p className="text-sm font-black text-[#638267]">
                        Order Completed
                      </p>

                      <p className="mt-1 text-sm leading-6 text-[#806e6e]">
                        This order has already been delivered
                        and completed.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-4 rounded-[24px] bg-[#f3e8e4] p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-[#fff8f5]">
                    <span className="h-5 w-5 text-[#806e6e]">
                      <LockIcon />
                    </span>
                  </div>

                  <p className="pt-1 text-sm font-bold leading-6 text-[#806e6e]">
                    Cancellation is no longer available because
                    this order has already been{" "}
                    <span className="font-black text-[#5f4d4d]">
                      {formatStatus(
                        currentStatus
                      ).toLowerCase()}
                    </span>
                    .
                  </p>
                </div>
              )}

              {cancelMessage && (
                <p className="mt-4 rounded-2xl bg-[#fff8f5] px-5 py-4 text-sm font-bold text-[#806e6e]">
                  {cancelMessage}
                </p>
              )}

              {error && (
                <p className="mt-4 rounded-2xl bg-[#f8e7e8] px-5 py-4 text-sm font-bold text-[#b45f6e]">
                  {error}
                </p>
              )}
            </div>
          )}
        </section>

        {/* =====================================================
            LOWER GRID
        ===================================================== */}

        <div className="mt-7 grid gap-7 lg:grid-cols-[1.35fr_0.65fr]">
          {/* ===================================================
              ORDER ITEMS
          =================================================== */}

          <section className="rounded-[30px] border border-white/70 bg-[#fff8f5] p-6 shadow-[8px_8px_18px_#d8c5c0,-6px_-6px_15px_#ffffff]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#f9ebe2]">
                <span className="h-5 w-5 text-[#c97888]">
                  <BagIcon />
                </span>
              </div>

              <h2 className="text-xl font-black">
                Order Items
              </h2>
            </div>

            {items.length === 0 ? (
              <div className="mt-5 rounded-[22px] bg-[#f9ebe2] p-5 text-center">
                <p className="text-sm font-bold text-[#806e6e]">
                  No order items found.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`flex gap-4 rounded-[22px] p-4 ${
                      cancelled
                        ? "bg-[#f5eded]"
                        : "bg-[#f9ebe2]"
                    }`}
                  >
                    {/* IMAGE */}

                    <div
                      className={`h-20 w-20 shrink-0 overflow-hidden rounded-[18px] bg-[#f2ddd6] ${
                        cancelled ? "opacity-60" : ""
                      }`}
                    >
                      {item.product_image ? (
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="h-full w-full object-cover"
                          onError={(event) => {
                            event.currentTarget.style.display =
                              "none";
                          }}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <span className="h-9 w-9 text-[#c97888]">
                            <DonutIcon />
                          </span>
                        </div>
                      )}
                    </div>

                    {/* PRODUCT INFO */}

                    <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 sm:flex-row">
                      <div>
                        <h3 className="font-black">
                          {item.product_name}
                        </h3>

                        <p className="mt-1 text-sm text-[#806e6e]">
                          Qty: {item.quantity}
                        </p>

                        <p className="mt-1 text-sm text-[#806e6e]">
                          {formatCurrency(item.price)} each
                        </p>
                      </div>

                      <p
                        className={`font-black ${
                          cancelled
                            ? "text-[#a58f8f] line-through"
                            : "text-[#c97888]"
                        }`}
                      >
                        {formatCurrency(
                          Number(item.price) *
                            Number(item.quantity)
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ===================================================
              DETAILS
          =================================================== */}

          <div className="space-y-7">
            {/* DELIVERY */}

            <section className="rounded-[30px] border border-white/70 bg-[#fff8f5] p-6 shadow-[8px_8px_18px_#d8c5c0,-6px_-6px_15px_#ffffff]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#f9ebe2]">
                  <span className="h-5 w-5 text-[#c97888]">
                    <LocationIcon />
                  </span>
                </div>

                <h2 className="text-xl font-black">
                  Delivery Details
                </h2>
              </div>

              <div className="mt-5 space-y-4 text-sm">
                <DetailRow
                  label="Customer"
                  value={order.customer_name}
                  icon={<UserIcon />}
                />

                <DetailRow
                  label="Phone"
                  value={order.customer_phone}
                  icon={<PhoneIcon />}
                />

                <DetailRow
                  label="Address"
                  value={`${order.delivery_address}, ${order.delivery_city}`}
                  icon={<LocationIcon />}
                />
              </div>
            </section>

            {/* =================================================
                ORDER SUMMARY
            ================================================= */}

            <section
              className={`rounded-[30px] border p-6 shadow-[8px_8px_18px_#d8c5c0,-6px_-6px_15px_#ffffff] ${
                cancelled
                  ? "border-[#e6c9cc] bg-[#fff7f7]"
                  : "border-white/70 bg-[#fff8f5]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#f9ebe2]">
                  <span className="h-5 w-5 text-[#c97888]">
                    <ReceiptIcon />
                  </span>
                </div>

                <h2 className="text-xl font-black">
                  Order Summary
                </h2>
              </div>

              {cancelled && (
                <div className="mt-4 rounded-2xl bg-[#f8e7e8] px-4 py-3">
                  <p className="text-xs font-black text-[#9b5d65]">
                    This order has been cancelled.
                  </p>
                </div>
              )}

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-[#806e6e]">
                    Subtotal
                  </span>

                  <span
                    className={`font-bold ${
                      cancelled
                        ? "text-[#a58f8f] line-through"
                        : ""
                    }`}
                  >
                    {formatCurrency(order.subtotal)}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-[#806e6e]">
                    Delivery
                  </span>

                  <span
                    className={`font-bold ${
                      cancelled
                        ? "text-[#a58f8f] line-through"
                        : ""
                    }`}
                  >
                    {formatCurrency(order.delivery_fee)}
                  </span>
                </div>

                <div className="border-t border-[#ead8d0] pt-4">
                  <div className="flex justify-between gap-4">
                    <span className="font-black">
                      Total
                    </span>

                    <span
                      className={`text-xl font-black ${
                        cancelled
                          ? "text-[#a58f8f] line-through"
                          : "text-[#c97888]"
                      }`}
                    >
                      {formatCurrency(order.total)}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-4 text-[#c97888]">
                      <WalletIcon />
                    </span>

                    <p className="text-[#806e6e]">
                      Payment Method
                    </p>
                  </div>

                  <p className="mt-1 font-black">
                    {order.payment_method}
                  </p>

                  {cancelled && (
                    <p className="mt-2 text-xs font-bold leading-5 text-[#9b5d65]">
                      No payment should be collected for this
                      cancelled order.
                    </p>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* =====================================================
            NOTES
        ===================================================== */}

        {order.order_notes && (
          <section className="mt-7 rounded-[30px] border border-white/70 bg-[#fff8f5] p-6 shadow-[8px_8px_18px_#d8c5c0,-6px_-6px_15px_#ffffff]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#f9ebe2]">
                <span className="h-5 w-5 text-[#c97888]">
                  <NoteIcon />
                </span>
              </div>

              <h2 className="text-lg font-black">
                Order Notes
              </h2>
            </div>

            <p className="mt-4 leading-7 text-[#806e6e]">
              {order.order_notes}
            </p>
          </section>
        )}

        {/* =====================================================
            BOTTOM ACTIONS
        ===================================================== */}

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/shop"
            className="group inline-flex items-center gap-2 rounded-full bg-[#e8a0ad] px-8 py-4 font-black text-white shadow-[5px_5px_12px_#d8c5c0,-4px_-4px_10px_#ffffff] transition hover:-translate-y-0.5 hover:bg-[#d88a9a]"
          >
            <span className="h-5 w-5">
              <BagIcon />
            </span>

            Continue Shopping

            <span className="transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>

          <Link
            href="/track-order"
            className="inline-flex items-center gap-2 rounded-full bg-[#fff8f5] px-8 py-4 font-black text-[#806e6e] shadow-[5px_5px_12px_#d8c5c0,-4px_-4px_10px_#ffffff] transition hover:-translate-y-0.5"
          >
            <span className="h-5 w-5">
              <PackageSearchIcon />
            </span>

            Track Another Order
          </Link>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   DETAIL ROW
========================================================= */

function DetailRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#f9ebe2]">
        <span className="h-4 w-4 text-[#c97888]">
          {icon}
        </span>
      </div>

      <div>
        <p className="font-bold text-[#806e6e]">
          {label}
        </p>

        <p className="mt-1 font-black leading-6">
          {value}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   BACKGROUND
========================================================= */

function BackgroundGlows() {
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-[#f1d2d4]/35 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 bottom-10 h-96 w-96 rounded-full bg-[#efd8cf]/50 blur-3xl"
      />
    </>
  );
}

/* =========================================================
   TRACKING ICON SELECTOR
========================================================= */

function TrackingIcon({
  icon,
}: {
  icon: TrackingStep["icon"];
}) {
  switch (icon) {
    case "receipt":
      return <ReceiptIcon />;

    case "check":
      return <CheckIcon />;

    case "prepare":
      return <DonutIcon />;

    case "delivery":
      return <DeliveryIcon />;

    case "home":
      return <HomeIcon />;

    default:
      return <ReceiptIcon />;
  }
}

function StatusMiniIcon({
  status,
}: {
  status: string;
}) {
  switch (normalizeStatus(status)) {
    case "confirmed":
      return <CheckIcon />;

    case "preparing":
      return <DonutIcon />;

    case "out_for_delivery":
      return <DeliveryIcon />;

    case "completed":
      return <HomeIcon />;

    default:
      return <ReceiptIcon />;
  }
}

/* =========================================================
   SVG ICONS
========================================================= */

function ReceiptIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      <path
        d="M6 3H18V21L15 19L12 21L9 19L6 21V3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="M9 8H15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M9 12H15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M9 16H13"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      <path
        d="M5 12.5L9.5 17L19 7"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DonutIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="8.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <circle
        cx="12"
        cy="12"
        r="2.6"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M5.2 9.5C7.5 7.7 9.4 8.8 11.2 7.6C13.4 6.2 15.2 8.1 18.7 8.3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      <path
        d="M8 6.7L9 5.9M15 6.2L16 5.5M17 12.5L18 13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DeliveryIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      <path
        d="M3 7H14V17H3V7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="M14 10H18L21 13V17H14V10Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <circle
        cx="7"
        cy="18"
        r="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <circle
        cx="17.5"
        cy="18"
        r="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      <path
        d="M4 10.5L12 4L20 10.5V20H4V10.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="M9 20V14H15V20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      <rect
        x="5"
        y="10"
        width="14"
        height="10"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M8 10V8C8 5.8 9.8 4 12 4C14.2 4 16 5.8 16 8V10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      <path
        d="M7 7L17 17M17 7L7 17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="8"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <circle
        cx="12"
        cy="12"
        r="3"
        fill="currentColor"
      />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      <path
        d="M4 5V10H9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M5.5 9C6.8 5.8 10 4 13.4 4.5C17.5 5.1 20.4 8.8 19.9 12.9C19.4 17 15.7 20 11.6 19.5C8.8 19.2 6.4 17.3 5.3 14.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M12 8V12L15 14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      <path
        d="M20 6V11H15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M18.5 10C17.5 6.9 14.5 5 11.3 5.3C7.7 5.7 5 8.7 5 12.3C5 16.2 8.1 19.3 12 19.3C15 19.3 17.6 17.5 18.7 14.9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AlertCircleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M12 7V13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <circle
        cx="12"
        cy="17"
        r="1"
        fill="currentColor"
      />
    </svg>
  );
}

function PackageSearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      <path
        d="M4 7L11 3.5L18 7L11 10.5L4 7Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M4 7V15L11 18.5V10.5L4 7Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M18 7V12"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <circle
        cx="17"
        cy="17"
        r="3"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M19.2 19.2L21 21"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CancelOrderIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="8.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M8.5 8.5L15.5 15.5M15.5 8.5L8.5 15.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      <path
        d="M5 8H19L18 20H6L5 8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="M9 9V7C9 5.3 10.3 4 12 4C13.7 4 15 5.3 15 7V9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      <path
        d="M12 21C12 21 19 15.8 19 9.5C19 5.6 15.9 3 12 3C8.1 3 5 5.6 5 9.5C5 15.8 12 21 12 21Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <circle
        cx="12"
        cy="9.5"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="8"
        r="4"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M5 20C5.8 16.4 8.4 14.5 12 14.5C15.6 14.5 18.2 16.4 19 20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      <path
        d="M7 4L10 8L8.2 10.2C9.5 13 11 14.5 13.8 15.8L16 14L20 17C20.3 17.3 20.3 17.8 20 18.2C18.8 19.5 17.1 20.2 15.3 19.8C9.2 18.4 5.6 14.8 4.2 8.7C3.8 6.9 4.5 5.2 5.8 4C6.2 3.7 6.7 3.7 7 4Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="6"
        width="18"
        height="14"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M16 10H21V16H16C14.3 16 13 14.7 13 13C13 11.3 14.3 10 16 10Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <circle
        cx="16.5"
        cy="13"
        r="1"
        fill="currentColor"
      />
    </svg>
  );
}

function NoteIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      <path
        d="M5 4H19V20H5V4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="M8 8H16M8 12H16M8 16H13"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}