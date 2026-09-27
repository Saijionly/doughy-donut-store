"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function TrackOrderPage() {
  const router = useRouter();

  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanOrderNumber = orderNumber.replace("#", "").trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanOrderNumber) {
      setError("Please enter your order number.");
      return;
    }

    if (!/^\d+$/.test(cleanOrderNumber)) {
      setError("Please enter a valid order number.");
      return;
    }

    if (!cleanEmail) {
      setError("Please enter the email used for your order.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/orders/track/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: Number(cleanOrderNumber),
          email: cleanEmail,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error || "Unable to verify this order."
        );
      }

      router.push(`/orders/${cleanOrderNumber}`);
    } catch (verifyError) {
      console.warn("Order verification failed:", verifyError);

      setError(
        verifyError instanceof Error
          ? verifyError.message
          : "Unable to verify this order."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7eee9] px-5 py-12 text-[#2d2424] sm:px-6">
      {/* Background decoration */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-[#f1d2d4]/40 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 bottom-10 h-96 w-96 rounded-full bg-[#efd8cf]/55 blur-3xl"
      />

      <div className="relative w-full max-w-xl">
        {/* Back button */}
        <Link
          href="/shop"
          className="group inline-flex items-center gap-2 text-sm font-black text-[#c97888] transition-colors duration-300 hover:text-[#a85f70]"
        >
          <span
            aria-hidden="true"
            className="transition-transform duration-300 group-hover:-translate-x-1"
          >
            ←
          </span>

          Back to Shop
        </Link>

        {/* Main Card */}
        <section className="mt-7 overflow-hidden rounded-[36px] border border-white/70 bg-[#fff8f5]/95 p-7 shadow-[12px_12px_28px_rgba(198,174,168,0.38),-10px_-10px_24px_rgba(255,255,255,0.9)] backdrop-blur-sm sm:p-10">
          {/* Header */}
          <div className="text-center">
            {/* Package icon */}
            <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-[30px] border border-white/70 bg-[#f9ebe2] shadow-[6px_6px_14px_#d8c5c0,-5px_-5px_13px_#ffffff]">
              <div className="absolute inset-4 rounded-full bg-[#e89aaa]/10 blur-xl" />

              <div className="relative h-12 w-12 text-[#342828]">
                <PackageIcon />
              </div>
            </div>

            {/* Brand label */}
            <div className="mt-7 flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#f0d7d9] bg-[#fdf2ef] px-4 py-2">
                <span className="h-3.5 w-3.5 text-[#d78294]">
                  <SparkleIcon />
                </span>

                <span className="text-[10px] font-black uppercase tracking-[0.26em] text-[#c97888]">
                  Doughy Order Tracking
                </span>
              </div>
            </div>

            <h1 className="mt-5 text-4xl font-black tracking-[-0.04em] text-[#332828] sm:text-5xl">
              Track Your Order
            </h1>

            <p className="mx-auto mt-4 max-w-md text-sm font-medium leading-7 text-[#806e6e] sm:text-base">
              Enter your order number and the email used at checkout to
              securely view your latest order status.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-9 space-y-5">
            {/* Order number */}
            <div>
              <label
                htmlFor="orderNumber"
                className="text-sm font-black text-[#2d2424]"
              >
                Order Number
              </label>

              <div className="mt-2 flex items-center rounded-[22px] border border-transparent bg-[#f9ebe2] px-5 shadow-inner transition focus-within:border-[#e8a0ad]/50 focus-within:ring-2 focus-within:ring-[#e8a0ad]/25">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center text-[#c97888]">
                  <ReceiptIcon />
                </span>

                <span className="ml-3 font-black text-[#c97888]">
                  #
                </span>

                <input
                  id="orderNumber"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={orderNumber}
                  onChange={(event) => {
                    setOrderNumber(event.target.value);
                    setError("");
                  }}
                  placeholder="Example: 7"
                  disabled={loading}
                  className="w-full bg-transparent px-2 py-4 font-bold text-[#2d2424] outline-none placeholder:text-[#b7a1a1] disabled:opacity-60"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="trackingEmail"
                className="text-sm font-black text-[#2d2424]"
              >
                Order Email
              </label>

              <div className="mt-2 flex items-center rounded-[22px] border border-transparent bg-[#f9ebe2] px-5 shadow-inner transition focus-within:border-[#e8a0ad]/50 focus-within:ring-2 focus-within:ring-[#e8a0ad]/25">
                <span className="h-5 w-5 shrink-0 text-[#c97888]">
                  <MailIcon />
                </span>

                <input
                  id="trackingEmail"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError("");
                  }}
                  placeholder="you@example.com"
                  disabled={loading}
                  className="w-full bg-transparent px-3 py-4 font-bold text-[#2d2424] outline-none placeholder:text-[#b7a1a1] disabled:opacity-60"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 rounded-[18px] border border-[#f1cdd3] bg-[#fce4e7] px-4 py-3.5">
                <span className="mt-0.5 h-5 w-5 shrink-0 text-[#c45f70]">
                  <AlertIcon />
                </span>

                <p className="text-sm font-bold leading-5 text-[#b95768]">
                  {error}
                </p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2.5 rounded-full bg-[#e8a0ad] px-7 py-4 text-sm font-black text-white shadow-[5px_5px_12px_#d8c5c0,-4px_-4px_10px_#ffffff] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#d88a9a] hover:shadow-[7px_7px_15px_#d5c0bb,-5px_-5px_12px_#ffffff] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Verifying Order...
                </>
              ) : (
                <>
                  Track Order

                  <span className="transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-[#ead8d4]" />

            <div className="h-1.5 w-1.5 rounded-full bg-[#dea0aa]" />

            <div className="h-px flex-1 bg-[#ead8d4]" />
          </div>

          {/* Security Information */}
          <div className="rounded-[24px] border border-white/60 bg-[#f9ebe2] p-5 shadow-[inset_3px_3px_8px_rgba(216,197,192,0.4),inset_-3px_-3px_8px_rgba(255,255,255,0.8)]">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] border border-white/70 bg-[#fff8f5] shadow-[3px_3px_8px_rgba(210,188,183,0.35),-3px_-3px_8px_rgba(255,255,255,0.85)]">
                <span className="h-5 w-5 text-[#3a2c2c]">
                  <ShieldLockIcon />
                </span>
              </div>

              <div>
                <p className="text-sm font-black text-[#342929]">
                  Secure order tracking
                </p>

                <p className="mt-1.5 text-sm font-medium leading-6 text-[#806e6e]">
                  For privacy, your order number and checkout email must match
                  before delivery details are shown.
                </p>
              </div>
            </div>
          </div>

          {/* Order number information */}
          <div className="mt-4 rounded-[24px] border border-white/60 bg-[#f9ebe2] p-5 shadow-[inset_3px_3px_8px_rgba(216,197,192,0.4),inset_-3px_-3px_8px_rgba(255,255,255,0.8)]">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] border border-white/70 bg-[#fff8f5] shadow-[3px_3px_8px_rgba(210,188,183,0.35),-3px_-3px_8px_rgba(255,255,255,0.85)]">
                <span className="h-5 w-5 text-[#3a2c2c]">
                  <OrderHelpIcon />
                </span>
              </div>

              <div>
                <p className="text-sm font-black text-[#342929]">
                  Where can I find my order number?
                </p>

                <p className="mt-1.5 text-sm font-medium leading-6 text-[#806e6e]">
                  Your order number appears after checkout and in your
                  confirmation email. For example: Order #7.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <div className="mt-7 flex justify-center">
          <Link
            href="/shop"
            className="group inline-flex items-center gap-2.5 text-sm font-bold text-[#806e6e] transition"
          >
            Want something sweet?

            <span className="inline-flex items-center gap-1.5 font-black text-[#c97888] transition-colors group-hover:text-[#a85f70]">
              Browse our treats

              <span className="transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </span>
          </Link>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   CUSTOM DOUGHY SVG ICONS
========================================================= */

function PackageIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
      aria-hidden="true"
    >
      <path
        d="M10 20L32 9L54 20L32 31L10 20Z"
        fill="#F4C8D0"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />

      <path
        d="M10 20V45L32 56V31L10 20Z"
        fill="#F7DDD5"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />

      <path
        d="M54 20V45L32 56V31L54 20Z"
        fill="#EAB0BB"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />

      <path
        d="M21 14.5L43 25.5"
        stroke="#FFF9F6"
        strokeWidth="3"
        strokeLinecap="round"
      />

      <path
        d="M32 31V56"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      />

      <path
        d="M43 15L21 26"
        stroke="#D98092"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ReceiptIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
      aria-hidden="true"
    >
      <path
        d="M6 3H18V21L15 19L12 21L9 19L6 21V3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
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
        stroke="#D77E91"
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

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M5 7L12 13L19 7"
        stroke="#D77E91"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShieldLockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
      aria-hidden="true"
    >
      <path
        d="M12 3L19 6V11C19 15.5 16.2 19.3 12 21C7.8 19.3 5 15.5 5 11V6L12 3Z"
        fill="#F4D0D5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <rect
        x="9"
        y="10.5"
        width="6"
        height="5"
        rx="1.5"
        fill="#FFF8F5"
        stroke="currentColor"
        strokeWidth="1.5"
      />

      <path
        d="M10.5 10.5V9.5C10.5 8.7 11.2 8 12 8C12.8 8 13.5 8.7 13.5 9.5V10.5"
        stroke="#D77E91"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function OrderHelpIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
      aria-hidden="true"
    >
      <path
        d="M7 3H17C18.1 3 19 3.9 19 5V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V5C5 3.9 5.9 3 7 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M9 7H15"
        stroke="#D77E91"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M9 11H13"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <circle
        cx="15.5"
        cy="15.5"
        r="2.5"
        fill="#F3CBD2"
        stroke="currentColor"
        strokeWidth="1.5"
      />

      <path
        d="M17.3 17.3L19.5 19.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
      aria-hidden="true"
    >
      <path
        d="M12 2C12.8 7.1 15.1 9.4 20 10.2C15.1 11 12.8 13.3 12 18.4C11.2 13.3 8.9 11 4 10.2C8.9 9.4 11.2 7.1 12 2Z"
        fill="#DF8FA1"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />

      <path
        d="M19 16C19.4 18.3 20.5 19.4 23 19.8C20.5 20.2 19.4 21.3 19 23.6C18.6 21.3 17.5 20.2 15 19.8C17.5 19.4 18.6 18.3 19 16Z"
        fill="#F2C86C"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
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

      <circle cx="12" cy="17" r="1" fill="currentColor" />
    </svg>
  );
}