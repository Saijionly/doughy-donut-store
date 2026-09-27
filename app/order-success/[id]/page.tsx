"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
} from "react";


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

type TrackingIconName =
  | "receipt"
  | "check"
  | "donut"
  | "delivery"
  | "home";

/*
========================================
ORDER TRACKING STEPS
========================================

Pending
↓
Confirmed
↓
Preparing
↓
Out for Delivery
↓
Completed
*/

const trackingSteps: {
  status: string;
  title: string;
  description: string;
  icon: TrackingIconName;
}[] = [
  {
    status: "pending",
    title: "Order Placed",
    description:
      "We received your order.",
    icon: "receipt",
  },
  {
    status: "confirmed",
    title: "Confirmed",
    description:
      "Your order has been confirmed.",
    icon: "check",
  },
  {
    status: "preparing",
    title: "Preparing",
    description:
      "Your donuts are being prepared.",
    icon: "donut",
  },
  {
    status: "out_for_delivery",
    title: "Out for Delivery",
    description:
      "Your order is on the way.",
    icon: "delivery",
  },
  {
    status: "completed",
    title: "Delivered",
    description:
      "Your order has been delivered.",
    icon: "home",
  },
];

/*
========================================
NORMALIZE STATUS
========================================

Supports old database values:

processing -> preparing
ready -> preparing
shipped -> out_for_delivery
delivered -> completed
canceled -> cancelled
*/

function normalizeStatus(
  status: string
) {
  const normalized = (
    status || "pending"
  )
    .toLowerCase()
    .trim()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");

  if (
    normalized === "processing" ||
    normalized === "ready"
  ) {
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
========================================
FORMAT STATUS
========================================
*/

function formatStatus(
  status: string
) {
  return normalizeStatus(status)
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

export default function OrderSuccessPage() {
  const params = useParams();

  const orderId = Array.isArray(
    params.id
  )
    ? params.id[0]
    : params.id;

  /*
  ========================================
  STATES
  ========================================
  */

  const [order, setOrder] =
    useState<Order | null>(null);

  const [items, setItems] =
    useState<OrderItem[]>([]);

  const [statusHistory, setStatusHistory] =
    useState<OrderStatusHistory[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [cancelling, setCancelling] =
    useState(false);

  const [
    realtimeConnected,
    setRealtimeConnected,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [
    cancelMessage,
    setCancelMessage,
  ] = useState("");

  const [now, setNow] =
    useState(Date.now());

  /*
  ========================================
  FETCH ORDER
  ========================================
  */

  async function fetchOrder(
    showRefresh = false
  ) {
    if (!orderId) {
      return;
    }

    const numericOrderId =
      Number(orderId);

    if (
      Number.isNaN(numericOrderId)
    ) {
      setError(
        "Invalid order number."
      );
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

      const result =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        if (
          response.status === 401 ||
          response.status === 403
        ) {
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
          result?.error ||
            "Unable to load this order."
        );
      }

      setOrder(
        result.order as Order
      );

      setItems(
        Array.isArray(result.orderItems)
          ? (result.orderItems as OrderItem[])
          : []
      );

      setStatusHistory(
        Array.isArray(
          result.statusHistory
        )
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

      if (!order) {
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Unable to load this order."
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  /*
  ========================================
  INITIAL LOAD
  ========================================
  */

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  /*
  ========================================
  ETA COUNTDOWN TIMER
  ========================================
  */

  useEffect(() => {
    const timer = window.setInterval(
      () => {
        setNow(Date.now());
      },
      30000
    );

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  /*
  ========================================
  SECURE LIVE TRACKING
  ========================================

  The customer page no longer subscribes
  directly to the public Supabase tables.

  Instead, it refreshes through the secure
  server endpoint every 10 seconds. The
  HttpOnly tracking session is verified
  on every request.
  */

  useEffect(() => {
    if (!orderId) {
      return;
    }

    const timer =
      window.setInterval(
        () => {
          fetchOrder(false);
        },
        10000
      );

    return () => {
      window.clearInterval(timer);
    };
  }, [orderId]);

  /*
  ========================================
  CURRENT STATUS
  ========================================
  */

  const currentStatus =
    normalizeStatus(
      order?.status ?? "pending"
    );

  const currentStepIndex =
    useMemo(() => {
      return trackingSteps.findIndex(
        (step) =>
          step.status ===
          currentStatus
      );
    }, [currentStatus]);

  /*
  Only Pending orders may be cancelled.
  */

  const canCancel =
    currentStatus === "pending";

  const cancelled =
    currentStatus === "cancelled";

  const completed =
    currentStatus === "completed";

  /*
  ========================================
  FORMAT CURRENCY
  ========================================
  */

  function formatCurrency(
    value: number
  ) {
    return new Intl.NumberFormat(
      "en-PH",
      {
        style: "currency",
        currency: "PHP",
      }
    ).format(
      Number(value || 0)
    );
  }

  /*
  ========================================
  FORMAT DATE
  ========================================
  */

  function formatDate(
    value: string
  ) {
    return new Intl.DateTimeFormat(
      "en-PH",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    ).format(
      new Date(value)
    );
  }

  /*
  ========================================
  DELIVERY ETA
  ========================================
  */

  function getRemainingEstimateText() {
    if (
      !order?.estimated_delivery_at
    ) {
      return "";
    }

    const target =
      new Date(
        order.estimated_delivery_at
      ).getTime();

    const difference =
      target - now;

    if (difference <= 0) {
      return "The estimated arrival time has passed. Your order is still being tracked live.";
    }

    const totalMinutes =
      Math.ceil(
        difference / 60000
      );

    if (totalMinutes < 60) {
      return `About ${totalMinutes} minute${
        totalMinutes === 1 ? "" : "s"
      } remaining`;
    }

    const hours =
      Math.floor(
        totalMinutes / 60
      );

    const minutes =
      totalMinutes % 60;

    if (minutes === 0) {
      return `About ${hours} hour${
        hours === 1 ? "" : "s"
      } remaining`;
    }

    return `About ${hours}h ${minutes}m remaining`;
  }

  /*
  ========================================
  STATUS DESCRIPTION
  ========================================
  */

  function getStatusDescription() {
    if (cancelled) {
      return "This order has been cancelled.";
    }

    const step =
      trackingSteps.find(
        (item) =>
          item.status ===
          currentStatus
      );

    return (
      step?.description ||
      "Your order status has been updated."
    );
  }

  /*
  ========================================
  CANCEL ORDER
  ========================================
  */

  async function handleCancelOrder() {
    if (!order) {
      return;
    }

    if (
      normalizeStatus(
        order.status
      ) !== "pending"
    ) {
      setCancelMessage(
        "This order can no longer be cancelled because it has already been confirmed or preparation has started."
      );
      return;
    }

    const confirmedCancel =
      window.confirm(
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
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            action: "cancel",
          }),
        }
      );

      const result =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        if (response.status === 409) {
          setCancelMessage(
            result?.error ||
              "This order could not be cancelled because its status has already changed."
          );

          await fetchOrder(true);
          return;
        }

        if (
          response.status === 401 ||
          response.status === 403
        ) {
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
          result?.error ||
            "Unable to cancel your order."
        );
      }

      if (result?.order) {
        setOrder(
          result.order as Order
        );
      }

      if (
        Array.isArray(
          result?.statusHistory
        )
      ) {
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

  /*
  ========================================
  LOADING
  ========================================
  */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7eee9] px-6 text-[#2d2424]">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#ead8d0] border-t-[#e8a0ad]" />

          <p className="mt-5 font-bold text-[#806e6e]">
            Loading your order confirmation...
          </p>
        </div>
      </main>
    );
  }

  /*
  ========================================
  ERROR
  ========================================
  */

  if (
    error &&
    !order
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7eee9] px-6 text-[#2d2424]">
        <div className="w-full max-w-lg rounded-[32px] bg-[#fff8f5] p-8 text-center shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff]">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] bg-[#f9ebe2] shadow-[inset_4px_4px_10px_#ddcac4,inset_-4px_-4px_10px_#ffffff]">
            <span className="h-10 w-10 text-[#b45f6e]">
              <AlertIcon />
            </span>
          </div>

          <h1 className="mt-5 text-3xl font-black">
            Something went wrong
          </h1>

          <p className="mt-3 text-[#806e6e]">
            {error}
          </p>

          <Link
            href="/track-order"
            className="mt-7 inline-flex rounded-full bg-[#e8a0ad] px-7 py-3 font-black text-white transition hover:bg-[#d88a9a]"
          >
            Try Again
          </Link>
        </div>
      </main>
    );
  }

  /*
  ========================================
  ORDER NOT FOUND
  ========================================
  */

  if (!order) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7eee9] px-6 text-[#2d2424]">
        <div className="w-full max-w-lg rounded-[32px] bg-[#fff8f5] p-8 text-center shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff]">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] bg-[#f9ebe2] shadow-[inset_4px_4px_10px_#ddcac4,inset_-4px_-4px_10px_#ffffff]">
            <span className="h-10 w-10 text-[#c97888]">
              <PackageIcon />
            </span>
          </div>

          <h1 className="mt-5 text-3xl font-black">
            Order Not Found
          </h1>

          <p className="mt-3 text-[#806e6e]">
            We couldn&apos;t find that
            order number.
          </p>

          <Link
            href="/track-order"
            className="mt-7 inline-flex rounded-full bg-[#e8a0ad] px-7 py-3 font-black text-white transition hover:bg-[#d88a9a]"
          >
            Search Again
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7eee9] px-5 py-10 text-[#2d2424] sm:px-6">
      <div className="mx-auto max-w-5xl">
        {/* ========================================
            TOP NAVIGATION
        ======================================== */}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/shop"
            className="text-sm font-black text-[#c97888] transition hover:text-[#a85f70]"
          >
            ← Continue Shopping
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            {/* LIVE INDICATOR */}

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

            {/* MANUAL REFRESH FALLBACK */}

            <button
              type="button"
              onClick={() =>
                fetchOrder(true)
              }
              disabled={
                refreshing ||
                cancelling
              }
              className="rounded-full bg-[#fff8f5] px-5 py-2.5 text-sm font-black text-[#5f4d4d] shadow-[4px_4px_10px_#d8c5c0,-3px_-3px_8px_#ffffff] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="inline-flex items-center gap-2">
                <span className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}>
                  <RefreshIcon />
                </span>
                {refreshing ? "Refreshing..." : "Refresh"}
              </span>
            </button>
          </div>
        </div>

        {/* ========================================
            HERO
        ======================================== */}

        <section className="mt-7 rounded-[34px] bg-[#fff8f5] p-7 shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff] sm:p-9">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[#c97888]">
                Doughy Order
              </p>

              <h1 className="mt-2 text-4xl font-black">
                Order #{order.id}
              </h1>

              <p className="mt-2 text-sm text-[#806e6e]">
                Placed{" "}
                {formatDate(
                  order.created_at
                )}
              </p>
            </div>

            {/* STATUS BADGE */}

            <div
              className={`inline-flex self-start rounded-full px-5 py-2.5 text-sm font-black ${
                cancelled
                  ? "bg-[#fce4e7] text-[#a84f61]"
                  : completed
                    ? "bg-[#e5efe6] text-[#638267]"
                    : currentStatus ===
                        "out_for_delivery"
                      ? "bg-[#e6efff] text-[#5071a8]"
                      : currentStatus ===
                          "preparing"
                        ? "bg-[#fff0d8] text-[#a56d20]"
                        : currentStatus ===
                            "confirmed"
                          ? "bg-[#e7efff] text-[#4c69a8]"
                          : "bg-[#f9ebe2] text-[#c97888]"
              }`}
            >
              {cancelled && (
                <span className="mr-2 h-4 w-4">
                  <LockIcon />
                </span>
              )}

              {formatStatus(
                currentStatus
              )}
            </div>
          </div>

          {/* CURRENT UPDATE */}

          {!cancelled && (
            <div className="mt-7 rounded-[22px] bg-[#f9ebe2] px-5 py-4">
              <p className="text-xs font-black uppercase tracking-wider text-[#c97888]">
                Current Update
              </p>

              <p className="mt-1 text-sm font-bold text-[#5f4d4d]">
                {getStatusDescription()}
              </p>
            </div>
          )}

          {/* ========================================
              ESTIMATED ARRIVAL
          ======================================== */}

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

          {completed && (
            <div className="mt-7 rounded-[24px] bg-[#e5efe6] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#638267] text-white">
                  <span className="h-5 w-5">
                    <CheckIcon />
                  </span>
                </div>

                <div>
                  <p className="font-black text-[#638267]">
                    Delivered
                  </p>

                  <p className="mt-1 text-sm text-[#806e6e]">
                    This order has been completed. The delivery estimate is no longer active.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================
              CANCELLED NOTICE
          ======================================== */}

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
                    This order has been
                    cancelled and will no
                    longer be prepared or
                    delivered.
                  </p>

                  <p className="mt-2 text-xs font-bold text-[#a84f61]">
                    No further action is
                    required.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /*
            ========================================
            TRACKING STEPS
            ========================================
            */

            <div className="mt-10">
              {/* =====================================
                  DESKTOP TRACKER
              ===================================== */}

              <div className="hidden sm:grid sm:grid-cols-5">
                {trackingSteps.map(
                  (
                    step,
                    index
                  ) => {
                    const stepComplete =
                      currentStepIndex >=
                      index;

                    const stepCurrent =
                      currentStepIndex ===
                      index;

                    const passedStep =
                      currentStepIndex >
                      index;

                    return (
                      <div
                        key={
                          step.status
                        }
                        className="relative"
                      >
                        {/* CONNECTION LINE */}

                        {index <
                          trackingSteps.length -
                            1 && (
                          <div
                            className={`absolute left-[58px] right-0 top-7 h-[3px] ${
                              passedStep
                                ? "bg-[#e8a0ad]"
                                : "bg-[#ead8d0]"
                            }`}
                          />
                        )}

                        {/* ICON */}

                        <div
                          className={`relative z-10 flex h-14 w-14 items-center justify-center rounded-full text-xl font-black transition ${
                            stepComplete
                              ? "bg-[#e8a0ad] text-white shadow-[4px_4px_10px_#d8c5c0,-3px_-3px_8px_#ffffff]"
                              : "bg-[#f3e8e4] text-[#aa9696]"
                          } ${
                            stepCurrent
                              ? "ring-4 ring-[#f5d4db]"
                              : ""
                          }`}
                        >
                          <span className="h-6 w-6">
                            {stepComplete && index < currentStepIndex ? (
                              <CheckIcon />
                            ) : (
                              <TrackingStepIcon icon={step.icon} />
                            )}
                          </span>
                        </div>

                        {/* TITLE */}

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

                        {/* CURRENT LABEL */}

                        {stepCurrent && (
                          <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-[#c97888]">
                            Current
                          </p>
                        )}
                      </div>
                    );
                  }
                )}
              </div>

              {/* =====================================
                  MOBILE TRACKER
              ===================================== */}

              <div className="space-y-0 sm:hidden">
                {trackingSteps.map(
                  (
                    step,
                    index
                  ) => {
                    const stepComplete =
                      currentStepIndex >=
                      index;

                    const stepCurrent =
                      currentStepIndex ===
                      index;

                    const passedStep =
                      currentStepIndex >
                      index;

                    return (
                      <div
                        key={
                          step.status
                        }
                        className="relative flex gap-4 pb-7 last:pb-0"
                      >
                        {/* VERTICAL LINE */}

                        {index <
                          trackingSteps.length -
                            1 && (
                          <div
                            className={`absolute left-[23px] top-12 h-[calc(100%-38px)] w-[3px] ${
                              passedStep
                                ? "bg-[#e8a0ad]"
                                : "bg-[#ead8d0]"
                            }`}
                          />
                        )}

                        {/* ICON */}

                        <div
                          className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-black ${
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
                            {stepComplete && index < currentStepIndex ? (
                              <CheckIcon />
                            ) : (
                              <TrackingStepIcon icon={step.icon} />
                            )}
                          </span>
                        </div>

                        {/* TEXT */}

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
                              {
                                step.title
                              }
                            </p>

                            {stepCurrent && (
                              <span className="rounded-full bg-[#f4d5dc] px-2 py-1 text-[9px] font-black uppercase tracking-wider text-[#c97888]">
                                Current
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-xs leading-5 text-[#806e6e]">
                            {
                              step.description
                            }
                          </p>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}

          <div className="mt-9 border-t border-[#ead8d0] pt-7">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#c97888]">Order History</p>
            <h3 className="mt-2 text-xl font-black">Status Updates</h3>
            <div className="mt-5 space-y-4">
              {statusHistory.length === 0 ? (
                <p className="text-sm text-[#806e6e]">No status updates recorded yet.</p>
              ) : (
                statusHistory.map((entry, index) => (
                  <div key={entry.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-black ${index === statusHistory.length - 1 ? "bg-[#e8a0ad] text-white" : "bg-[#f4d5dc] text-[#c97888]"}`}>
                        <span className="h-4 w-4">
                          {index === statusHistory.length - 1 ? (
                            <ActivityIcon />
                          ) : (
                            <CheckIcon />
                          )}
                        </span>
                      </div>
                      {index < statusHistory.length - 1 && <div className="h-7 w-[2px] bg-[#ead8d0]" />}
                    </div>
                    <div className="pb-3">
                      <p className="font-black text-[#5f4d4d]">{formatStatus(entry.status)}</p>
                      <p className="mt-1 text-xs text-[#806e6e]">{formatDate(entry.created_at)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ========================================
              CANCELLATION
          ======================================== */}

          {!cancelled && (
            <div className="mt-9 border-t border-[#ead8d0] pt-7">
              {canCancel ? (
                <div className="flex flex-col justify-between gap-5 rounded-[24px] bg-[#f9ebe2] p-5 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="font-black">
                      Need to cancel your
                      order?
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-[#806e6e]">
                      You can cancel your
                      order while it is
                      still pending. Once
                      the store confirms
                      it, cancellation
                      will no longer be
                      available.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      handleCancelOrder
                    }
                    disabled={
                      cancelling ||
                      refreshing
                    }
                    className="shrink-0 rounded-full border border-[#d9919e] px-6 py-3 text-sm font-black text-[#b76676] transition hover:bg-[#e8a0ad] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {cancelling
                      ? "Cancelling..."
                      : "Cancel Order"}
                  </button>
                </div>
              ) : completed ? (
                <div className="rounded-[24px] bg-[#e5efe6] p-5">
                  <div className="flex gap-3">
                    <span className="mt-0.5 h-5 w-5 shrink-0 text-[#638267]">
                      <CheckIcon />
                    </span>

                    <div>
                      <p className="text-sm font-black text-[#638267]">
                        Order Completed
                      </p>

                      <p className="mt-1 text-sm leading-6 text-[#806e6e]">
                        This order has
                        already been
                        delivered and
                        completed.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-[24px] bg-[#f3e8e4] p-5">
                  <p className="text-sm font-bold leading-6 text-[#806e6e]">
                    Cancellation is no
                    longer available
                    because this order
                    has already been{" "}
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

        {/* ========================================
            LOWER GRID
        ======================================== */}

        <div className="mt-7 grid gap-7 lg:grid-cols-[1.35fr_0.65fr]">
          {/* ========================================
              ORDER ITEMS
          ======================================== */}

          <section className="rounded-[30px] bg-[#fff8f5] p-6 shadow-[8px_8px_18px_#d8c5c0,-6px_-6px_15px_#ffffff]">
            <h2 className="text-xl font-black">
              Order Items
            </h2>

            {items.length === 0 ? (
              <div className="mt-5 rounded-[22px] bg-[#f9ebe2] p-5 text-center">
                <p className="text-sm font-bold text-[#806e6e]">
                  No order items found.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {items.map(
                  (item) => (
                    <div
                      key={item.id}
                      className={`flex gap-4 rounded-[22px] p-4 ${
                        cancelled
                          ? "bg-[#f5eded]"
                          : "bg-[#f9ebe2]"
                      }`}
                    >
                      {/* PRODUCT IMAGE */}

                      <div
                        className={`h-20 w-20 shrink-0 overflow-hidden rounded-[18px] bg-[#f2ddd6] ${
                          cancelled
                            ? "opacity-60"
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
                            {
                              item.product_name
                            }
                          </h3>

                          <p className="mt-1 text-sm text-[#806e6e]">
                            Qty:{" "}
                            {
                              item.quantity
                            }
                          </p>

                          <p className="mt-1 text-sm text-[#806e6e]">
                            {formatCurrency(
                              item.price
                            )}{" "}
                            each
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
                            Number(
                              item.price
                            ) *
                              Number(
                                item.quantity
                              )
                          )}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </section>

          {/* ========================================
              DETAILS
          ======================================== */}

          <div className="space-y-7">
            {/* DELIVERY */}

            <section className="rounded-[30px] bg-[#fff8f5] p-6 shadow-[8px_8px_18px_#d8c5c0,-6px_-6px_15px_#ffffff]">
              <h2 className="text-xl font-black">
                Delivery Details
              </h2>

              <div className="mt-5 space-y-3 text-sm">
                <div>
                  <p className="font-bold text-[#806e6e]">
                    Customer
                  </p>

                  <p className="mt-1 font-black">
                    {
                      order.customer_name
                    }
                  </p>
                </div>

                <div>
                  <p className="font-bold text-[#806e6e]">
                    Phone
                  </p>

                  <p className="mt-1 font-black">
                    {
                      order.customer_phone
                    }
                  </p>
                </div>

                <div>
                  <p className="font-bold text-[#806e6e]">
                    Address
                  </p>

                  <p className="mt-1 font-black leading-6">
                    {
                      order.delivery_address
                    }
                    ,{" "}
                    {
                      order.delivery_city
                    }
                  </p>
                </div>
              </div>
            </section>

            {/* ========================================
                ORDER SUMMARY
            ======================================== */}

            <section
              className={`rounded-[30px] p-6 shadow-[8px_8px_18px_#d8c5c0,-6px_-6px_15px_#ffffff] ${
                cancelled
                  ? "border border-[#e6c9cc] bg-[#fff7f7]"
                  : "bg-[#fff8f5]"
              }`}
            >
              <h2 className="text-xl font-black">
                Order Summary
              </h2>

              {cancelled && (
                <div className="mt-4 rounded-2xl bg-[#f8e7e8] px-4 py-3">
                  <p className="text-xs font-black text-[#9b5d65]">
                    This order has been
                    cancelled.
                  </p>
                </div>
              )}

              <div className="mt-5 space-y-3 text-sm">
                {/* SUBTOTAL */}

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
                    {formatCurrency(
                      order.subtotal
                    )}
                  </span>
                </div>

                {/* DELIVERY */}

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
                    {formatCurrency(
                      order.delivery_fee
                    )}
                  </span>
                </div>

                {/* TOTAL */}

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
                      {formatCurrency(
                        order.total
                      )}
                    </span>
                  </div>
                </div>

                {/* PAYMENT */}

                <div className="pt-2">
                  <p className="text-[#806e6e]">
                    Payment Method
                  </p>

                  <p className="mt-1 font-black">
                    {
                      order.payment_method
                    }
                  </p>

                  {cancelled && (
                    <p className="mt-2 text-xs font-bold leading-5 text-[#9b5d65]">
                      No payment should
                      be collected for
                      this cancelled
                      order.
                    </p>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* ========================================
            ORDER NOTES
        ======================================== */}

        {order.order_notes && (
          <section className="mt-7 rounded-[30px] bg-[#fff8f5] p-6 shadow-[8px_8px_18px_#d8c5c0,-6px_-6px_15px_#ffffff]">
            <h2 className="text-lg font-black">
              Order Notes
            </h2>

            <p className="mt-3 leading-7 text-[#806e6e]">
              {order.order_notes}
            </p>
          </section>
        )}

        {/* ========================================
            BOTTOM ACTIONS
        ======================================== */}

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/shop"
            className="inline-flex rounded-full bg-[#e8a0ad] px-8 py-4 font-black text-white shadow-[5px_5px_12px_#d8c5c0,-4px_-4px_10px_#ffffff] transition hover:-translate-y-0.5 hover:bg-[#d88a9a]"
          >
            <span className="inline-flex items-center gap-2">
              <span className="h-5 w-5">
                <BagIcon />
              </span>
              Continue Shopping
            </span>
          </Link>

          <Link
            href="/track-order"
            className="inline-flex rounded-full bg-[#fff8f5] px-8 py-4 font-black text-[#806e6e] shadow-[5px_5px_12px_#d8c5c0,-4px_-4px_10px_#ffffff] transition hover:-translate-y-0.5"
          >
            Track Another Order
          </Link>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   DOUGHY PROFESSIONAL SVG ICONS
========================================================= */

function TrackingStepIcon({ icon }: { icon: TrackingIconName }) {
  switch (icon) {
    case "receipt":
      return <ReceiptIcon />;
    case "check":
      return <CheckIcon />;
    case "donut":
      return <DonutIcon />;
    case "delivery":
      return <DeliveryIcon />;
    case "home":
      return <HomeIcon />;
    default:
      return <ReceiptIcon />;
  }
}

function ReceiptIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true">
      <path d="M6 3H18V21L15 19L12 21L9 19L6 21V3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 8H15M9 12H15M9 16H13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true">
      <path d="M5 12.5L9.5 17L19 7" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DonutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5.2 9.5C7.5 7.7 9.4 8.8 11.2 7.6C13.4 6.2 15.2 8.1 18.7 8.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8 6.7L9 5.9M15 6.2L16 5.5M17 12.5L18 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function DeliveryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true">
      <path d="M3 7H14V17H3V7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M14 10H18L21 13V17H14V10Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="7" cy="18" r="2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.5" cy="18" r="2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true">
      <path d="M4 10.5L12 4L20 10.5V20H4V10.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 20V14H15V20" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 10V8C8 5.8 9.8 4 12 4C14.2 4 16 5.8 16 8V10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true">
      <path d="M7 7L17 17M17 7L7 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true">
      <path d="M20 6V11H15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.5 10C17.5 6.9 14.5 5 11.3 5.3C7.7 5.7 5 8.7 5 12.3C5 16.2 8.1 19.3 12 19.3C15 19.3 17.6 17.5 18.7 14.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1" fill="currentColor" />
    </svg>
  );
}

function PackageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true">
      <path d="M4 7L12 3L20 7L12 11L4 7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M4 7V16L12 21V11L4 7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M20 7V16L12 21V11L20 7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8 5L16 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true">
      <path d="M5 8H19L18 20H6L5 8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 9V7C9 5.3 10.3 4 12 4C13.7 4 15 5.3 15 7V9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

