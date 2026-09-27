"use client";

import Link from "next/link";
import { useEffect } from "react";

import { useCart } from "@/app/context/CartContext";
import { useStoreSettings } from "@/app/context/StoreSettingsContext";

type CartDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function CartDrawer({
  isOpen,
  onClose,
}: CartDrawerProps) {
  const {
    cartItems,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    cartCount,
    cartTotal,
  } = useCart();

  const {
    settings,
    loading: settingsLoading,
  } = useStoreSettings();

  const storeName =
    settings.store_name || "Doughy";

  const storeOpen =
    settings.store_open;

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

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    function handleKeyDown(
      event: KeyboardEvent
    ) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Overlay */}

      <button
        type="button"
        onClick={onClose}
        className="fixed inset-0 z-40 cursor-default bg-[#2d2424]/35 backdrop-blur-[2px]"
        aria-label="Close cart"
      />

      {/* Drawer */}

      <aside className="fixed right-0 top-0 z-50 flex h-dvh w-full max-w-[440px] flex-col bg-[#f7eee9] text-[#2d2424] shadow-[-15px_0_40px_rgba(82,55,55,0.18)]">
        {/* Header */}

        <header className="border-b border-[#e5d4ce] px-5 py-5 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-[#c97888]">
                  {storeName}
                </p>

                {!settingsLoading && (
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wide ${
                      storeOpen
                        ? "bg-[#e4f6e9] text-[#4f8a61]"
                        : "bg-[#fce4e7] text-[#a84f61]"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        storeOpen
                          ? "bg-[#4f8a61]"
                          : "bg-[#a84f61]"
                      }`}
                    />

                    {storeOpen
                      ? "Open"
                      : "Closed"}
                  </span>
                )}
              </div>

              <div className="mt-1 flex items-center gap-3">
                <h2 className="text-2xl font-black">
                  Your Cart
                </h2>

                {cartCount > 0 && (
                  <span className="flex min-w-7 items-center justify-center rounded-full bg-[#e8a0ad] px-2 py-1 text-xs font-black text-white">
                    {cartCount}
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fff8f5] text-2xl font-bold shadow-[5px_5px_12px_#d8c5c0,-4px_-4px_10px_#ffffff] transition hover:-translate-y-0.5 hover:bg-[#f5e3dc]"
              aria-label="Close cart"
            >
              <span className="h-5 w-5 text-[#5f4d4d]">
                <CloseIcon />
              </span>
            </button>
          </div>
        </header>

        {/* Store Closed Warning */}

        {!settingsLoading &&
          !storeOpen && (
            <div className="px-5 pt-5 sm:px-6">
              <div className="rounded-[22px] border border-[#efc0c8] bg-[#fce4e7] px-4 py-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#fff5f6] shadow-sm">
                    <span className="h-5 w-5 text-[#a84f61]">
                      <LockIcon />
                    </span>
                  </div>

                  <div>
                    <p className="text-sm font-black text-[#a84f61]">
                      Store is currently
                      closed
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[#8c656c]">
                      You can still view
                      and manage your cart,
                      but checkout is
                      temporarily
                      unavailable.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Content */}

        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-6">
          {cartItems.length === 0 ? (
            <div className="flex min-h-full flex-col items-center justify-center py-12 text-center">
              <div className="flex h-28 w-28 items-center justify-center rounded-[32px] bg-[#fff8f5] shadow-[8px_8px_18px_#d8c5c0,-6px_-6px_14px_#ffffff]">
                <span className="h-12 w-12 text-[#c97888]">
                  <CartIcon />
                </span>
              </div>

              <h3 className="mt-7 text-2xl font-black">
                Your cart is empty
              </h3>

              <p className="mt-3 max-w-xs text-sm leading-6 text-[#806e6e]">
                Your next favorite{" "}
                {storeName} treat is
                waiting for you.
              </p>

              <Link
                href="/shop"
                onClick={onClose}
                className="mt-7 rounded-full bg-[#e8a0ad] px-8 py-3.5 text-sm font-black text-white shadow-[5px_5px_12px_#d8c5c0,-4px_-4px_10px_#ffffff] transition hover:-translate-y-0.5 hover:bg-[#d88a9a]"
              >
                <span className="inline-flex items-center gap-2">
                  <span className="h-5 w-5">
                    <DonutIcon />
                  </span>
                  Browse Products
                </span>
              </Link>

              {!settingsLoading &&
                !storeOpen && (
                  <p className="mt-4 max-w-xs text-xs leading-5 text-[#a58f8f]">
                    Feel free to browse
                    while we&apos;re
                    closed. Ordering will
                    become available once
                    the store reopens.
                  </p>
                )}
            </div>
          ) : (
            <div className="space-y-5">
              {cartItems.map(
                (item) => {
                  const itemTotal =
                    Number(
                      item.price || 0
                    ) *
                    item.quantity;

                  return (
                    <article
                      key={item.id}
                      className="rounded-[26px] bg-[#fff8f5] p-4 shadow-[7px_7px_16px_#d8c5c0,-5px_-5px_13px_#ffffff]"
                    >
                      <div className="flex gap-4">
                        {/* Image */}

                        <Link
                          href={`/shop/${
                            item.slug ||
                            item.id
                          }`}
                          onClick={
                            onClose
                          }
                          className="block shrink-0"
                        >
                          <div className="h-24 w-24 overflow-hidden rounded-2xl bg-[#f9ebe2]">
                            {item.image ? (
                              <img
                                src={
                                  item.image
                                }
                                alt={
                                  item.name
                                }
                                className="h-full w-full object-cover transition duration-300 hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <span className="h-9 w-9 text-[#c97888]">
                                  <DonutIcon />
                                </span>
                              </div>
                            )}
                          </div>
                        </Link>

                        {/* Info */}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#c97888]">
                                {
                                  item.category
                                }
                              </p>

                              <Link
                                href={`/shop/${
                                  item.slug ||
                                  item.id
                                }`}
                                onClick={
                                  onClose
                                }
                                className="mt-1 block truncate text-base font-black transition hover:text-[#c97888]"
                              >
                                {
                                  item.name
                                }
                              </Link>

                              <p className="mt-1 text-sm font-bold text-[#9b7d80]">
                                ₱
                                {formatCurrency(
                                  Number(
                                    item.price
                                  )
                                )}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                removeFromCart(
                                  item.id
                                )
                              }
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg text-[#a98e91] transition hover:bg-[#f8e6e0] hover:text-[#c97888]"
                              aria-label={`Remove ${item.name}`}
                              title="Remove item"
                            >
                              <span className="h-4 w-4">
                                <TrashIcon />
                              </span>
                            </button>
                          </div>

                          {/* Quantity + Total */}

                          <div className="mt-4 flex items-center justify-between gap-3">
                            <div className="flex items-center overflow-hidden rounded-full bg-[#f9ebe2]">
                              <button
                                type="button"
                                onClick={() =>
                                  decreaseQuantity(
                                    item.id
                                  )
                                }
                                className="flex h-8 w-8 items-center justify-center font-black transition hover:bg-white"
                                aria-label={`Decrease ${item.name} quantity`}
                              >
                                <span className="h-4 w-4">
                                  <MinusIcon />
                                </span>
                              </button>

                              <span className="flex h-8 min-w-8 items-center justify-center text-sm font-black">
                                {
                                  item.quantity
                                }
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  increaseQuantity(
                                    item.id
                                  )
                                }
                                className="flex h-8 w-8 items-center justify-center font-black transition hover:bg-white"
                                aria-label={`Increase ${item.name} quantity`}
                              >
                                <span className="h-4 w-4">
                                  <PlusIcon />
                                </span>
                              </button>
                            </div>

                            <p className="font-black text-[#c97888]">
                              ₱
                              {formatCurrency(
                                itemTotal
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </div>

        {/* Footer */}

        {cartItems.length > 0 && (
          <footer className="border-t border-[#e5d4ce] bg-[#f7eee9] px-5 py-5 sm:px-6">
            <div className="rounded-[24px] bg-[#fff8f5] p-5 shadow-[6px_6px_14px_#d8c5c0,-4px_-4px_10px_#ffffff]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                    Subtotal
                  </p>

                  <p className="mt-1 text-xs text-[#806e6e]">
                    {cartCount}{" "}
                    {cartCount === 1
                      ? "item"
                      : "items"}
                  </p>
                </div>

                <span className="text-2xl font-black text-[#c97888]">
                  ₱
                  {formatCurrency(
                    cartTotal
                  )}
                </span>
              </div>

              <p className="mt-4 border-t border-[#ead8d1] pt-4 text-xs leading-5 text-[#806e6e]">
                Delivery fee will be
                added during checkout.
              </p>
            </div>

            {/* Checkout */}

            {settingsLoading ? (
              <div className="mt-5 flex w-full cursor-wait items-center justify-center gap-2 rounded-full bg-[#ead8d0] px-6 py-4 text-sm font-black text-[#9b8585]">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#9b8585]/30 border-t-[#9b8585]" />

                Checking Store...
              </div>
            ) : storeOpen ? (
              <Link
                href="/checkout"
                onClick={onClose}
                className="mt-5 flex w-full items-center justify-center rounded-full bg-[#e8a0ad] px-6 py-4 text-sm font-black text-white shadow-[6px_6px_14px_#d8c5c0,-5px_-5px_12px_#ffffff] transition hover:-translate-y-0.5 hover:bg-[#d88a9a]"
              >
                <span className="mr-2 h-5 w-5">
                  <CheckoutIcon />
                </span>
                Proceed to Checkout
                <span className="ml-2 h-4 w-4">
                  <ArrowRightIcon />
                </span>
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="mt-5 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-full bg-[#e3d4d1] px-6 py-4 text-sm font-black text-[#9b8585] shadow-[inset_3px_3px_7px_#d1c2bf,inset_-3px_-3px_7px_#f5e6e3]"
              >
                <span className="h-4 w-4">
                  <LockIcon />
                </span>
                Store Closed
              </button>
            )}

            {!settingsLoading &&
              !storeOpen && (
                <p className="mt-3 text-center text-xs leading-5 text-[#a58f8f]">
                  Checkout will
                  automatically become
                  available when{" "}
                  {storeName} reopens.
                </p>
              )}

            <Link
              href="/cart"
              onClick={onClose}
              className="mt-3 flex w-full items-center justify-center rounded-full bg-[#f9ebe2] px-6 py-3.5 text-sm font-bold text-[#806e6e] transition hover:bg-[#f3ddd5]"
            >
              <span className="mr-2 h-4 w-4 text-[#c97888]">
                <CartIcon />
              </span>
              View Full Cart
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full text-center text-sm font-bold text-[#c97888] transition hover:text-[#a85f70]"
            >
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4">
                  <ArrowLeftIcon />
                </span>
                Continue Shopping
              </span>
            </button>
          </footer>
        )}
      </aside>
    </>
  );
}

/* =========================================================
   DOUGHY CART DRAWER SVG ICONS
========================================================= */

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true">
      <path d="M7 7L17 17M17 7L7 17" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
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

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true">
      <path d="M3.5 5H5.5L7.2 15.2H18.2L20 8H6.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="19" r="1.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17" cy="19" r="1.5" stroke="currentColor" strokeWidth="1.8" />
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

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true">
      <path d="M5 7H19M9 7V5H15V7M7 7L8 20H16L17 7M10 11V16M14 11V16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true">
      <path d="M6 12H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true">
      <path d="M12 6V18M6 12H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CheckoutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true">
      <path d="M5 8H19L18 20H6L5 8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 9V7C9 5.3 10.3 4 12 4C13.7 4 15 5.3 15 7V9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10 14L11.8 15.8L15.5 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true">
      <path d="M19 12H5M10 7L5 12L10 17" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

