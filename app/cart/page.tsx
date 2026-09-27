"use client";

import Link from "next/link";

import { useCart } from "@/app/context/CartContext";
import { useStoreSettings } from "@/app/context/StoreSettingsContext";

export default function CartPage() {
  const {
    cartItems,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    clearCart,
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

  const allowCod =
    settings.allow_cod;

  const minimumOrder =
    Number(settings.minimum_order || 0);

  const deliveryFee =
    cartItems.length > 0
      ? Number(settings.delivery_fee || 0)
      : 0;

  const defaultEtaMinutes =
    Number(
      settings.default_eta_minutes || 45
    );

  const grandTotal =
    cartTotal + deliveryFee;

  const minimumOrderReached =
    cartTotal >= minimumOrder;

  const minimumOrderRemaining =
    Math.max(
      minimumOrder - cartTotal,
      0
    );

  const canCheckout =
    !settingsLoading &&
    storeOpen &&
    minimumOrderReached &&
    allowCod;

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

  /*
   * =========================================
   * EMPTY CART
   * =========================================
   */

  if (cartItems.length === 0) {
    return (
      <main className="min-h-screen bg-[#f7eee9] px-5 py-10 text-[#2d2424] sm:px-6">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/products"
            className="inline-flex text-sm font-bold text-[#c97888] transition hover:text-[#a85f70]"
          >
            ← Continue Shopping
          </Link>

          <section className="mt-8 flex min-h-[520px] flex-col items-center justify-center rounded-[32px] bg-[#fff8f5] p-8 text-center shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff] sm:p-16">
            <div className="flex h-32 w-32 items-center justify-center rounded-full bg-[#f9ebe2] text-7xl shadow-[7px_7px_16px_#d8c5c0,-5px_-5px_12px_#ffffff]">
              🛒
            </div>

            <p className="mt-8 text-xs font-black uppercase tracking-[0.28em] text-[#c97888]">
              {storeName} Cart
            </p>

            <h1 className="mt-3 text-3xl font-black sm:text-5xl">
              Your Cart is Empty
            </h1>

            <p className="mx-auto mt-4 max-w-lg leading-7 text-[#806e6e]">
              Looks like you haven&apos;t
              added any delicious treats
              yet. Browse our products and
              find your next favorite.
            </p>

            {!settingsLoading &&
              !storeOpen && (
                <div className="mt-6 rounded-[20px] border border-[#efc0c8] bg-[#fce4e7] px-5 py-4">
                  <p className="text-sm font-black text-[#a84f61]">
                    🔒 Store Currently
                    Closed
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#8c656c]">
                    You can still browse
                    our products while the
                    store is closed.
                  </p>
                </div>
              )}

            <Link
              href="/products"
              className="mt-8 inline-flex rounded-full bg-[#e8a0ad] px-9 py-4 text-sm font-black text-white shadow-[5px_5px_12px_#d8c5c0,-4px_-4px_10px_#ffffff] transition hover:-translate-y-0.5 hover:bg-[#d88a9a]"
            >
              Browse Products 🍩
            </Link>
          </section>
        </div>
      </main>
    );
  }

  /*
   * =========================================
   * CART
   * =========================================
   */

  return (
    <main className="min-h-screen bg-[#f7eee9] px-5 py-10 text-[#2d2424] sm:px-6">
      <div className="mx-auto max-w-6xl">
        {/* Top */}

        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href="/products"
              className="inline-flex text-sm font-bold text-[#c97888] transition hover:text-[#a85f70]"
            >
              ← Continue Shopping
            </Link>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#c97888]">
                {storeName}
              </p>

              {!settingsLoading && (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wide ${
                    storeOpen
                      ? "bg-[#e4f6e9] text-[#4f8a61]"
                      : "bg-[#fce4e7] text-[#a84f61]"
                  }`}
                >
                  <span
                    className={`relative flex h-2 w-2 rounded-full ${
                      storeOpen
                        ? "bg-[#4f8a61]"
                        : "bg-[#a84f61]"
                    }`}
                  >
                    {storeOpen && (
                      <span className="absolute inset-0 animate-ping rounded-full bg-[#6aa67a] opacity-50" />
                    )}
                  </span>

                  {storeOpen
                    ? "Store Open"
                    : "Store Closed"}
                </span>
              )}
            </div>

            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
              Your Cart 🛒
            </h1>

            <p className="mt-3 text-[#806e6e]">
              You have{" "}
              <span className="font-black text-[#2d2424]">
                {cartCount}
              </span>{" "}
              {cartCount === 1
                ? "item"
                : "items"}{" "}
              in your cart.
            </p>
          </div>

          <button
            type="button"
            onClick={clearCart}
            className="w-fit rounded-full bg-[#f9ebe2] px-6 py-3 text-sm font-bold text-[#a84f61] shadow-[5px_5px_12px_#d8c5c0,-4px_-4px_10px_#ffffff] transition hover:-translate-y-0.5 hover:bg-[#f5ddd7]"
          >
            🗑️ Clear Cart
          </button>
        </div>

        {/* Store Closed */}

        {!settingsLoading &&
          !storeOpen && (
            <div className="mt-8 rounded-[26px] border border-[#efc0c8] bg-[#fce4e7] p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#fff5f6] text-xl">
                  🔒
                </div>

                <div>
                  <h2 className="font-black text-[#a84f61]">
                    {storeName} is
                    currently closed
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-[#8c656c]">
                    You can continue
                    browsing and manage
                    the items in your
                    cart, but checkout is
                    temporarily
                    unavailable.
                  </p>
                </div>
              </div>
            </div>
          )}

        {/* Checkout Notice */}

        {settings.checkout_notice && (
          <div className="mt-5 rounded-[22px] bg-[#fff8f5] px-5 py-4 shadow-[5px_5px_12px_#d8c5c0,-4px_-4px_10px_#ffffff]">
            <div className="flex gap-3">
              <span>📢</span>

              <p className="text-sm leading-6 text-[#806e6e]">
                {
                  settings.checkout_notice
                }
              </p>
            </div>
          </div>
        )}

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* Cart Items */}

          <section className="rounded-[30px] bg-[#fff8f5] p-5 shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff] sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#c97888]">
                  Shopping Cart
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  Your Items
                </h2>
              </div>

              <span className="rounded-full bg-[#f9ebe2] px-4 py-2 text-xs font-black text-[#806e6e]">
                {cartCount}{" "}
                {cartCount === 1
                  ? "item"
                  : "items"}
              </span>
            </div>

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
                      className="rounded-[26px] bg-[#f9ebe2] p-4 transition hover:-translate-y-0.5 sm:p-5"
                    >
                      <div className="flex flex-col gap-5 sm:flex-row">
                        {/* Image */}

                        <Link
                          href={`/products/${
                            item.slug ||
                            item.id
                          }`}
                          className="shrink-0"
                        >
                          <div className="h-52 w-full overflow-hidden rounded-[22px] bg-[#fff8f5] sm:h-32 sm:w-32">
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
                              <div className="flex h-full w-full items-center justify-center text-5xl">
                                🍩
                              </div>
                            )}
                          </div>
                        </Link>

                        {/* Information */}

                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="text-xs font-black uppercase tracking-wider text-[#c97888]">
                                {
                                  item.category
                                }
                              </p>

                              <Link
                                href={`/products/${
                                  item.slug ||
                                  item.id
                                }`}
                                className="mt-1 block text-xl font-black transition hover:text-[#c97888]"
                              >
                                {
                                  item.name
                                }
                              </Link>

                              {item.badge && (
                                <span className="mt-2 inline-flex rounded-full bg-[#fff8f5] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#c97888]">
                                  {
                                    item.badge
                                  }
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                removeFromCart(
                                  item.id
                                )
                              }
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fff8f5] text-base transition hover:bg-[#f3d9d5]"
                              aria-label={`Remove ${item.name}`}
                              title="Remove item"
                            >
                              🗑️
                            </button>
                          </div>

                          <div className="mt-auto flex flex-col gap-5 pt-5 sm:flex-row sm:items-end sm:justify-between">
                            {/* Quantity */}

                            <div>
                              <p className="text-[10px] font-black uppercase tracking-wider text-[#a58f8f]">
                                Quantity
                              </p>

                              <div className="mt-2 flex w-fit items-center overflow-hidden rounded-full bg-[#fff8f5] shadow-[3px_3px_8px_#d8c5c0,-2px_-2px_6px_#ffffff]">
                                <button
                                  type="button"
                                  onClick={() =>
                                    decreaseQuantity(
                                      item.id
                                    )
                                  }
                                  className="flex h-11 w-11 items-center justify-center text-lg font-black text-[#806e6e] transition hover:bg-[#f1ddd5]"
                                  aria-label={`Decrease ${item.name} quantity`}
                                >
                                  −
                                </button>

                                <span className="flex h-11 min-w-11 items-center justify-center font-black">
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
                                  className="flex h-11 w-11 items-center justify-center text-lg font-black text-[#806e6e] transition hover:bg-[#f1ddd5]"
                                  aria-label={`Increase ${item.name} quantity`}
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            {/* Price */}

                            <div className="sm:text-right">
                              <p className="text-xs text-[#a58f8f]">
                                ₱
                                {formatCurrency(
                                  Number(
                                    item.price
                                  )
                                )}{" "}
                                each
                              </p>

                              <p className="mt-1 text-xl font-black text-[#c97888]">
                                ₱
                                {formatCurrency(
                                  itemTotal
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          </section>

          {/* Order Summary */}

          <aside className="h-fit rounded-[30px] bg-[#fff8f5] p-6 shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff] sm:p-8 lg:sticky lg:top-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#c97888]">
                Checkout
              </p>

              {!settingsLoading && (
                <span
                  className={`rounded-full px-3 py-1 text-[9px] font-black uppercase ${
                    storeOpen
                      ? "bg-[#e4f6e9] text-[#4f8a61]"
                      : "bg-[#fce4e7] text-[#a84f61]"
                  }`}
                >
                  {storeOpen
                    ? "Open"
                    : "Closed"}
                </span>
              )}
            </div>

            <h2 className="mt-2 text-2xl font-black">
              Order Summary
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#806e6e]">
              Review your order before
              proceeding to checkout.
            </p>

            <div className="mt-7 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#806e6e]">
                  Items
                </span>

                <span className="font-black">
                  {cartCount}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-[#806e6e]">
                  Subtotal
                </span>

                <span className="font-black">
                  ₱
                  {formatCurrency(
                    cartTotal
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-[#806e6e]">
                  Delivery Fee
                </span>

                <span className="font-black">
                  ₱
                  {formatCurrency(
                    deliveryFee
                  )}
                </span>
              </div>

              <div className="border-t border-[#ead8d1] pt-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                      Total
                    </p>

                    <span className="text-sm text-[#806e6e]">
                      Including delivery
                    </span>
                  </div>

                  <span className="text-3xl font-black text-[#c97888]">
                    ₱
                    {formatCurrency(
                      grandTotal
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Minimum Order */}

            {!settingsLoading &&
              minimumOrder > 0 && (
                <div
                  className={`mt-6 rounded-[22px] p-4 ${
                    minimumOrderReached
                      ? "bg-[#e4f6e9]"
                      : "bg-[#fff0dc]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p
                        className={`text-xs font-black uppercase tracking-wider ${
                          minimumOrderReached
                            ? "text-[#4f8a61]"
                            : "text-[#a66f35]"
                        }`}
                      >
                        Minimum Order
                      </p>

                      <p className="mt-1 text-xs leading-5 text-[#806e6e]">
                        {minimumOrderReached
                          ? "Minimum order reached."
                          : `Add ₱${formatCurrency(
                              minimumOrderRemaining
                            )} more to checkout.`}
                      </p>
                    </div>

                    <span className="text-lg">
                      {minimumOrderReached
                        ? "✓"
                        : "🛒"}
                    </span>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/60">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        minimumOrderReached
                          ? "bg-[#6aa67a]"
                          : "bg-[#e8a0ad]"
                      }`}
                      style={{
                        width: `${Math.min(
                          (cartTotal /
                            minimumOrder) *
                            100,
                          100
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="mt-2 flex justify-between text-[10px] font-bold text-[#9b8585]">
                    <span>
                      ₱
                      {formatCurrency(
                        cartTotal
                      )}
                    </span>

                    <span>
                      ₱
                      {formatCurrency(
                        minimumOrder
                      )}
                    </span>
                  </div>
                </div>
              )}

            {/* Checkout Button */}

            {settingsLoading ? (
              <div className="mt-7 flex w-full cursor-wait items-center justify-center gap-2 rounded-full bg-[#ead8d0] px-7 py-4 text-sm font-black text-[#9b8585]">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#9b8585]/30 border-t-[#9b8585]" />

                Checking Store...
              </div>
            ) : canCheckout ? (
              <Link
                href="/checkout"
                className="mt-7 flex w-full items-center justify-center rounded-full bg-[#e8a0ad] px-7 py-4 text-sm font-black text-white shadow-[5px_5px_12px_#d8c5c0,-4px_-4px_10px_#ffffff] transition hover:-translate-y-0.5 hover:bg-[#d88a9a]"
              >
                Proceed to Checkout →
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="mt-7 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-full bg-[#e3d4d1] px-7 py-4 text-sm font-black text-[#9b8585] shadow-[inset_3px_3px_7px_#d1c2bf,inset_-3px_-3px_7px_#f5e6e3]"
              >
                {!storeOpen
                  ? "🔒 Store Closed"
                  : !minimumOrderReached
                    ? "Minimum Order Not Reached"
                    : !allowCod
                      ? "Payment Unavailable"
                      : "Checkout Unavailable"}
              </button>
            )}

            {!settingsLoading &&
              !storeOpen && (
                <p className="mt-3 text-center text-xs leading-5 text-[#a58f8f]">
                  Checkout will become
                  available when{" "}
                  {storeName} reopens.
                </p>
              )}

            <Link
              href="/products"
              className="mt-3 flex w-full items-center justify-center rounded-full bg-[#f9ebe2] px-7 py-4 text-sm font-bold text-[#806e6e] shadow-[5px_5px_12px_#d8c5c0,-4px_-4px_10px_#ffffff] transition hover:-translate-y-0.5 hover:bg-[#f3ddd5]"
            >
              Continue Shopping
            </Link>

            {/* Delivery Info */}

            <div className="mt-6 rounded-[22px] bg-[#f9ebe2] p-5">
              <div className="flex gap-3">
                <div className="text-2xl">
                  🛵
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-[#a58f8f]">
                    Delivery
                  </p>

                  <p className="mt-1 text-sm leading-6 text-[#806e6e]">
                    Standard delivery fee
                    is{" "}
                    <strong className="text-[#2d2424]">
                      ₱
                      {formatCurrency(
                        deliveryFee
                      )}
                    </strong>
                    . Estimated delivery
                    is approximately{" "}
                    <strong className="text-[#2d2424]">
                      {
                        defaultEtaMinutes
                      }{" "}
                      minutes
                    </strong>
                    .
                  </p>
                </div>
              </div>
            </div>

            {/* Payment */}

            <div className="mt-4 rounded-[22px] bg-[#f9ebe2] p-5">
              <div className="flex gap-3">
                <div className="text-2xl">
                  💵
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-[#a58f8f]">
                    Payment
                  </p>

                  <p className="mt-1 text-sm leading-6 text-[#806e6e]">
                    {allowCod
                      ? "Cash on Delivery is currently available."
                      : "Cash on Delivery is currently unavailable."}
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Bottom Continue Shopping */}

        <div className="mt-10 text-center">
          <Link
            href="/products"
            className="font-bold text-[#c97888] transition hover:text-[#a85f70]"
          >
            ← Add more delicious treats
          </Link>
        </div>
      </div>
    </main>
  );
}