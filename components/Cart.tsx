"use client";

import Image from "next/image";
import Link from "next/link";

import { useCart } from "@/app/context/CartContext";

export default function Cart() {
  const {
    cartItems,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
  } = useCart();

  const subtotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const deliveryFee = cartItems.length > 0 ? 50 : 0;
  const total = subtotal + deliveryFee;

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  }

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#f7eee9] px-5 py-10 text-[#2d2424] sm:px-6 sm:py-12">
      {/* Background decoration */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-[#f1d2d4]/40 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 bottom-10 h-96 w-96 rounded-full bg-[#efd8cf]/50 blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl">
        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#fff8f5] px-4 py-2 shadow-[4px_4px_10px_#d8c5c0,-3px_-3px_8px_#ffffff]">
            <span className="h-4 w-4 text-[#c97888]">
              <SparkleIcon />
            </span>

            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#c97888]">
              Your Sweet Selection
            </p>
          </div>

          <h1 className="mt-5 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
            Shopping Cart
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-[#806e6e] sm:text-base">
            Review your treats, adjust quantities, and continue
            when everything looks perfect.
          </p>
        </div>

        {/* =====================================================
            EMPTY CART
        ===================================================== */}

        {cartItems.length === 0 ? (
          <div className="rounded-[36px] border border-white/70 bg-[#fff8f5] px-6 py-16 text-center shadow-[12px_12px_25px_#d8c5c0,-10px_-10px_22px_#ffffff] sm:py-20">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[28px] bg-[#f9ebe2] shadow-[inset_5px_5px_12px_#ddcac4,inset_-5px_-5px_12px_#ffffff]">
              <span className="h-11 w-11 text-[#c97888]">
                <CartIcon />
              </span>
            </div>

            <h2 className="mt-7 text-2xl font-black sm:text-3xl">
              Your cart is empty
            </h2>

            <p className="mx-auto mt-3 max-w-md leading-7 text-[#806e6e]">
              Looks like you haven&apos;t added any sweet treats
              yet. Explore our freshly made collection and find
              your favorite.
            </p>

            <Link
              href="/shop"
              className="group mt-8 inline-flex items-center gap-2 rounded-full bg-[#e8a0ad] px-8 py-4 font-black text-white shadow-[5px_5px_12px_#d8c5c0,-4px_-4px_10px_#ffffff] transition hover:-translate-y-1 hover:bg-[#d88a9a]"
            >
              <span className="h-5 w-5">
                <DonutIcon />
              </span>

              Browse Donuts

              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            {/* =================================================
                CART ITEMS
            ================================================= */}

            <div className="space-y-5">
              <div className="mb-1 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="h-5 w-5 text-[#c97888]">
                    <BagIcon />
                  </span>

                  <h2 className="font-black">
                    Cart Items
                  </h2>
                </div>

                <span className="rounded-full bg-[#f4d5dc] px-3 py-1 text-xs font-black text-[#c97888]">
                  {cartItems.reduce(
                    (totalItems, item) =>
                      totalItems + item.quantity,
                    0
                  )}{" "}
                  {cartItems.reduce(
                    (totalItems, item) =>
                      totalItems + item.quantity,
                    0
                  ) === 1
                    ? "item"
                    : "items"}
                </span>
              </div>

              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="group rounded-[30px] border border-white/70 bg-[#fff8f5] p-5 shadow-[8px_8px_20px_#d8c5c0,-7px_-7px_16px_#ffffff] transition duration-300 hover:-translate-y-0.5"
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                    {/* IMAGE */}

                    <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-[24px] bg-[#f9ebe2] sm:h-28 sm:w-28">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="(max-width: 640px) 100vw, 112px"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />

                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#2d2424]/5 to-transparent" />
                    </div>

                    {/* PRODUCT INFO */}

                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#c97888]">
                        {item.category}
                      </p>

                      <h2 className="mt-1.5 truncate text-xl font-black">
                        {item.name}
                      </h2>

                      <p className="mt-1 font-black text-[#c97888]">
                        ₱{formatCurrency(item.price)}
                      </p>

                      {/* QUANTITY */}

                      <div className="mt-4 inline-flex items-center rounded-full bg-[#f9ebe2] p-1 shadow-[inset_2px_2px_5px_#dfccc6,inset_-2px_-2px_5px_#ffffff]">
                        <button
                          type="button"
                          onClick={() =>
                            decreaseQuantity(item.id)
                          }
                          aria-label={`Decrease ${item.name} quantity`}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fff8f5] text-[#806e6e] shadow-[2px_2px_5px_#ddcbc5,-2px_-2px_5px_#ffffff] transition hover:bg-[#f4d5dc] hover:text-[#c97888] active:scale-95"
                        >
                          <span className="h-4 w-4">
                            <MinusIcon />
                          </span>
                        </button>

                        <span className="w-11 text-center text-sm font-black">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            increaseQuantity(item.id)
                          }
                          aria-label={`Increase ${item.name} quantity`}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fff8f5] text-[#806e6e] shadow-[2px_2px_5px_#ddcbc5,-2px_-2px_5px_#ffffff] transition hover:bg-[#f4d5dc] hover:text-[#c97888] active:scale-95"
                        >
                          <span className="h-4 w-4">
                            <PlusIcon />
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* TOTAL + REMOVE */}

                    <div className="flex items-center justify-between gap-5 border-t border-[#ead8d0] pt-4 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
                      <div className="sm:text-right">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#a58f8f]">
                          Item Total
                        </p>

                        <p className="mt-1 text-lg font-black">
                          ₱
                          {formatCurrency(
                            item.price * item.quantity
                          )}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          removeFromCart(item.id)
                        }
                        aria-label={`Remove ${item.name} from cart`}
                        className="group/remove inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-black text-[#b76676] transition hover:bg-[#f8e7e8] hover:text-[#a84f61]"
                      >
                        <span className="h-4 w-4 transition group-hover/remove:scale-110">
                          <TrashIcon />
                        </span>

                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* CONTINUE SHOPPING */}

              <div className="pt-2">
                <Link
                  href="/shop"
                  className="group inline-flex items-center gap-2 text-sm font-black text-[#c97888] transition hover:text-[#a85f70]"
                >
                  <span className="transition-transform group-hover:-translate-x-1">
                    ←
                  </span>

                  Continue Shopping
                </Link>
              </div>
            </div>

            {/* =================================================
                ORDER SUMMARY
            ================================================= */}

            <aside className="h-fit rounded-[32px] border border-white/70 bg-[#fff8f5] p-7 shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff] lg:sticky lg:top-6">
              {/* HEADER */}

              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#f9ebe2]">
                  <span className="h-5 w-5 text-[#c97888]">
                    <ReceiptIcon />
                  </span>
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#c97888]">
                    Summary
                  </p>

                  <h2 className="mt-0.5 text-2xl font-black">
                    Order Summary
                  </h2>
                </div>
              </div>

              <div className="my-6 h-px bg-[#e5d4ce]" />

              {/* PRICES */}

              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#806e6e]">
                    Subtotal
                  </span>

                  <span className="font-black">
                    ₱{formatCurrency(subtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-[#806e6e]">
                    <span className="h-4 w-4 text-[#c97888]">
                      <DeliveryIcon />
                    </span>

                    Delivery
                  </div>

                  <span className="font-black">
                    ₱{formatCurrency(deliveryFee)}
                  </span>
                </div>
              </div>

              <div className="my-6 h-px bg-[#e5d4ce]" />

              {/* TOTAL */}

              <div className="flex items-end justify-between gap-4">
                <div>
                  <span className="font-black">
                    Total
                  </span>

                  <p className="mt-1 text-xs text-[#a58f8f]">
                    Including delivery
                  </p>
                </div>

                <span className="text-2xl font-black text-[#c97888]">
                  ₱{formatCurrency(total)}
                </span>
              </div>

              {/* CHECKOUT */}

              <Link
                href="/checkout"
                className="group mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-[#e8a0ad] px-6 py-4 text-center font-black text-white shadow-[6px_6px_14px_#d8c5c0,-5px_-5px_12px_#ffffff] transition hover:-translate-y-1 hover:bg-[#d88a9a]"
              >
                <span className="h-5 w-5">
                  <CheckoutIcon />
                </span>

                Proceed to Checkout

                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>

              {/* SECURITY */}

              <div className="mt-5 flex items-start gap-3 rounded-[20px] bg-[#f9ebe2] p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[#fff8f5]">
                  <span className="h-4 w-4 text-[#c97888]">
                    <ShieldIcon />
                  </span>
                </div>

                <div>
                  <p className="text-xs font-black">
                    Secure Checkout
                  </p>

                  <p className="mt-1 text-[11px] leading-5 text-[#806e6e]">
                    Your order information will be reviewed
                    before your order is placed.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}

/* =========================================================
   PROFESSIONAL SVG ICONS
========================================================= */

function SparkleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      <path
        d="M12 3C12.7 7.6 14.4 9.3 19 10C14.4 10.7 12.7 12.4 12 17C11.3 12.4 9.6 10.7 5 10C9.6 9.3 11.3 7.6 12 3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M19 15C19.3 17 20 17.7 22 18C20 18.3 19.3 19 19 21C18.7 19 18 18.3 16 18C18 17.7 18.7 17 19 15Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      <path
        d="M3.5 5H5.5L7.2 15.2H18.2L20 8H6.1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle
        cx="9"
        cy="19"
        r="1.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <circle
        cx="17"
        cy="19"
        r="1.5"
        stroke="currentColor"
        strokeWidth="1.8"
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

function MinusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      <path
        d="M6 12H18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      <path
        d="M12 6V18M6 12H18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      <path
        d="M5 7H19"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M9 7V5H15V7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="M7 7L8 20H16L17 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="M10 11V16M14 11V16"
        stroke="currentColor"
        strokeWidth="1.7"
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
        d="M9 8H15M9 12H15M9 16H13"
        stroke="currentColor"
        strokeWidth="1.8"
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

function CheckoutIcon() {
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

      <path
        d="M10 14L11.8 15.8L15.5 12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      <path
        d="M12 3L19 6V11C19 15.5 16.2 19.1 12 21C7.8 19.1 5 15.5 5 11V6L12 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="M9 12L11 14L15.5 9.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}