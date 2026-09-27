"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useCart } from "@/app/context/CartContext";
import { supabase } from "@/lib/supabase";


type StoreSettings = {
  delivery_fee: number;
  minimum_order: number;
  default_eta_minutes: number;
  store_open: boolean;
  allow_cod: boolean;
  checkout_notice: string | null;
};

const DEFAULT_STORE_SETTINGS: StoreSettings = {
  delivery_fee: 50,
  minimum_order: 0,
  default_eta_minutes: 45,
  store_open: true,
  allow_cod: true,
  checkout_notice: null,
};

const CHECKOUT_TOKEN_STORAGE_KEY =
  "doughy_checkout_token";

export default function CheckoutPage() {
  const router = useRouter();

  const {
    cartItems,
    cartTotal,
    clearCart,
  } = useCart();

  const [customerName, setCustomerName] =
    useState("");

  const [customerEmail, setCustomerEmail] =
    useState("");

  const [customerPhone, setCustomerPhone] =
    useState("");

  const [deliveryAddress, setDeliveryAddress] =
    useState("");

  const [deliveryCity, setDeliveryCity] =
    useState("");

  const [orderNotes, setOrderNotes] =
    useState("");

  const [paymentMethod, setPaymentMethod] =
    useState("Cash on Delivery");

  const [loading, setLoading] =
    useState(false);

  const [settingsLoading, setSettingsLoading] =
    useState(true);

  const [storeSettings, setStoreSettings] =
    useState<StoreSettings>(
      DEFAULT_STORE_SETTINGS
    );

  const [errorMessage, setErrorMessage] =
    useState("");

  const checkoutTokenRef =
    useRef<string>("");

  function getOrCreateCheckoutToken() {
    if (checkoutTokenRef.current) {
      return checkoutTokenRef.current;
    }

    if (typeof window !== "undefined") {
      const existingToken =
        window.sessionStorage.getItem(
          CHECKOUT_TOKEN_STORAGE_KEY
        );

      if (existingToken) {
        checkoutTokenRef.current =
          existingToken;

        return existingToken;
      }
    }

    const newToken =
      crypto.randomUUID();

    checkoutTokenRef.current =
      newToken;

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(
        CHECKOUT_TOKEN_STORAGE_KEY,
        newToken
      );
    }

    return newToken;
  }

  const deliveryFee = Number(
    storeSettings.delivery_fee || 0
  );

  const minimumOrder = Number(
    storeSettings.minimum_order || 0
  );

  const defaultEtaMinutes = Number(
    storeSettings.default_eta_minutes || 45
  );

  const subtotal = Number(cartTotal || 0);

  const total = subtotal + deliveryFee;

  const minimumOrderReached =
    subtotal >= minimumOrder;

  const checkoutAvailable =
    storeSettings.store_open &&
    storeSettings.allow_cod &&
    minimumOrderReached;

  useEffect(() => {
    getOrCreateCheckoutToken();
  }, []);

  useEffect(() => {
    let active = true;

    async function loadStoreSettings() {
      setSettingsLoading(true);

      try {
        const {
          data,
          error,
        } = await supabase
          .from("store_settings")
          .select(
            "delivery_fee, minimum_order, default_eta_minutes, store_open, allow_cod, checkout_notice"
          )
          .eq("id", 1)
          .maybeSingle();

        if (error) {
          console.warn(
            "Checkout store settings error:",
            error
          );
          return;
        }

        if (!active || !data) {
          return;
        }

        const nextSettings: StoreSettings = {
          delivery_fee: Number(
            data.delivery_fee ?? 50
          ),
          minimum_order: Number(
            data.minimum_order ?? 0
          ),
          default_eta_minutes: Number(
            data.default_eta_minutes ?? 45
          ),
          store_open:
            data.store_open ?? true,
          allow_cod:
            data.allow_cod ?? true,
          checkout_notice:
            data.checkout_notice ?? null,
        };

        setStoreSettings(nextSettings);

        if (!nextSettings.allow_cod) {
          setPaymentMethod("");
        } else {
          setPaymentMethod(
            "Cash on Delivery"
          );
        }
      } catch (error) {
        console.warn(
          "Unable to load checkout settings:",
          error
        );
      } finally {
        if (active) {
          setSettingsLoading(false);
        }
      }
    }

    loadStoreSettings();

    const channel = supabase
      .channel(
        "checkout-store-settings"
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "store_settings",
          filter: "id=eq.1",
        },
        (payload) => {
          const data =
            payload.new as Record<
              string,
              unknown
            >;

          const nextSettings: StoreSettings = {
            delivery_fee: Number(
              data.delivery_fee ?? 50
            ),
            minimum_order: Number(
              data.minimum_order ?? 0
            ),
            default_eta_minutes: Number(
              data.default_eta_minutes ?? 45
            ),
            store_open:
              Boolean(
                data.store_open ?? true
              ),
            allow_cod:
              Boolean(
                data.allow_cod ?? true
              ),
            checkout_notice:
              data.checkout_notice
                ? String(
                    data.checkout_notice
                  )
                : null,
          };

          setStoreSettings(
            nextSettings
          );

          if (!nextSettings.allow_cod) {
            setPaymentMethod("");
          } else {
            setPaymentMethod(
              "Cash on Delivery"
            );
          }
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  function formatCurrency(value: number) {
    return Number(value || 0).toLocaleString(
      "en-PH",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage("");

    if (cartItems.length === 0) {
      setErrorMessage(
        "Your cart is empty."
      );

      return;
    }

    if (settingsLoading) {
      setErrorMessage(
        "Store settings are still loading. Please wait a moment."
      );
      return;
    }

    if (!storeSettings.store_open) {
      setErrorMessage(
        "The store is currently closed and is not accepting new orders."
      );
      return;
    }

    if (!minimumOrderReached) {
      setErrorMessage(
        `Minimum order is ₱${formatCurrency(
          minimumOrder
        )}. Please add more items to your cart.`
      );
      return;
    }

    if (
      !storeSettings.allow_cod ||
      !paymentMethod
    ) {
      setErrorMessage(
        "Cash on Delivery is currently unavailable. Please contact the store before placing an order."
      );
      return;
    }

    if (
      !customerName.trim() ||
      !customerEmail.trim() ||
      !customerPhone.trim() ||
      !deliveryAddress.trim() ||
      !deliveryCity.trim()
    ) {
      setErrorMessage(
        "Please complete all required fields."
      );

      return;
    }

    setLoading(true);

    try {
      /*
       * =========================================
       * SECURE SERVER ORDER CREATION
       * =========================================
       *
       * Important:
       * - The browser does NOT decide product prices.
       * - The browser does NOT decide delivery fee.
       * - The browser does NOT decide subtotal/total.
       * - The server reloads Store Settings.
       * - The server validates products and quantities.
       */

      const createOrderResponse = await fetch(
        "/api/orders/create",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            customerName:
              customerName.trim(),

            customerEmail:
              customerEmail.trim(),

            customerPhone:
              customerPhone.trim(),

            deliveryAddress:
              deliveryAddress.trim(),

            deliveryCity:
              deliveryCity.trim(),

            orderNotes:
              orderNotes.trim() || null,

            paymentMethod,

            checkoutToken:
              getOrCreateCheckoutToken(),

            items: cartItems.map(
              (item) => ({
                productId: item.id,
                quantity: item.quantity,
              })
            ),
          }),
        }
      );

      const createOrderResult =
        await createOrderResponse
          .json()
          .catch(() => null);

      if (!createOrderResponse.ok) {
        throw new Error(
          createOrderResult?.error ||
            "Unable to create order."
        );
      }

      const orderData =
        createOrderResult?.order;

      const orderItems =
        Array.isArray(
          createOrderResult?.orderItems
        )
          ? createOrderResult.orderItems
          : [];

      if (!orderData?.id) {
        throw new Error(
          "Order was not created."
        );
      }

      /*
       * Confirmation email is sent server-side
       * by /api/orders/create after the order is
       * successfully created. The browser does
       * not send it separately.
       */

      checkoutTokenRef.current = "";

      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(
          CHECKOUT_TOKEN_STORAGE_KEY
        );
      }

      /*
       * =========================================
       * CLEAR CART
       * =========================================
       */

      clearCart();

      /*
       * =========================================
       * GO TO ORDER CONFIRMATION
       * =========================================
       */

      router.push(
        `/order-success/${orderData.id}`
      );
    } catch (error) {
      console.warn(
        "Checkout failed:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to place order."
      );
    } finally {
      setLoading(false);
    }
  }


  /*
   * =========================================
   * EMPTY CART
   * =========================================
   */

  if (cartItems.length === 0) {
    return (
      <main className="min-h-screen bg-[#f7eee9] px-6 py-10 text-[#2d2424]">

        <div className="mx-auto max-w-4xl">

          <div className="rounded-[30px] bg-[#fff8f5] p-10 text-center shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff] sm:p-16">

            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[28px] bg-[#f9ebe2] shadow-[inset_5px_5px_12px_#ddcac4,inset_-5px_-5px_12px_#ffffff]">
              <span className="h-11 w-11 text-[#c97888]">
                <CartIcon />
              </span>
            </div>

            <h1 className="mt-6 text-3xl font-black">
              Your Cart Is Empty
            </h1>

            <p className="mx-auto mt-3 max-w-lg text-[#806e6e]">
              Add some delicious donuts to
              your cart before checking out.
            </p>

            <Link
              href="/shop"
              className="mt-8 inline-flex rounded-full bg-[#e8a0ad] px-8 py-4 text-sm font-bold text-white shadow-[5px_5px_12px_#d8c5c0,-4px_-4px_10px_#ffffff] transition hover:-translate-y-0.5 hover:bg-[#d88a9a]"
            >
              <span className="inline-flex items-center gap-2">
                <span className="h-5 w-5"><DonutIcon /></span>
                Browse Products
              </span>
            </Link>

          </div>

        </div>

      </main>
    );
  }

  /*
   * =========================================
   * CHECKOUT PAGE
   * =========================================
   */

  return (
    <main className="min-h-screen bg-[#f7eee9] px-6 py-10 text-[#2d2424]">

      <div className="mx-auto max-w-6xl">

        {/* HEADER */}

        <div>

          <Link
            href="/cart"
            className="text-sm font-bold text-[#c97888] transition hover:text-[#a85f70]"
          >
            ← Back to Cart
          </Link>

          <p className="mt-8 text-sm font-bold uppercase tracking-[0.25em] text-[#c97888]">
            Doughy
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            Checkout
          </h1>

          <p className="mt-3 text-[#806e6e]">
            Complete your information to
            place your order.
          </p>

        </div>

        {/* ERROR */}

        {errorMessage && (
          <div className="mt-8 rounded-2xl border border-[#e7aeb8] bg-[#fce4e7] p-5 text-sm font-bold text-[#a84f61]">
            {errorMessage}
          </div>
        )}

        {settingsLoading && (
          <div className="mt-8 rounded-2xl bg-[#fff8f5] p-5 text-sm font-bold text-[#806e6e] shadow-[5px_5px_12px_#d8c5c0,-4px_-4px_10px_#ffffff]">
            Loading store settings...
          </div>
        )}

        {!settingsLoading &&
          !storeSettings.store_open && (
            <div className="mt-8 rounded-[22px] border border-[#efb9c1] bg-[#fce4e7] p-5">
              <p className="font-black text-[#a84f61]">
                <span className="inline-flex items-center gap-2">
                  <span className="h-5 w-5"><LockIcon /></span>
                  Store Currently Closed
                </span>
              </p>

              <p className="mt-2 text-sm leading-6 text-[#9b6670]">
                You can review your cart,
                but new orders cannot be
                submitted until the store
                reopens.
              </p>
            </div>
          )}

        {!settingsLoading &&
          storeSettings.checkout_notice && (
            <div className="mt-8 rounded-[22px] border border-[#f0d1c8] bg-[#fff8f5] p-5 shadow-[5px_5px_12px_#d8c5c0,-4px_-4px_10px_#ffffff]">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#c97888]">
                Store Notice
              </p>

              <p className="mt-2 text-sm leading-6 text-[#806e6e]">
                {storeSettings.checkout_notice}
              </p>
            </div>
          )}

        <form
          onSubmit={handleSubmit}
          className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_0.8fr]"
        >

          {/* LEFT */}

          <div className="space-y-8">

            {/* CUSTOMER INFORMATION */}

            <section className="rounded-[30px] bg-[#fff8f5] p-6 shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff] sm:p-8">

              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#f9ebe2]">
                  <span className="h-5 w-5 text-[#c97888]"><UserIcon /></span>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#c97888]">Customer</p>
                  <h2 className="mt-1 text-2xl font-black">Customer Information</h2>
                </div>
              </div>

              <div className="mt-7 grid gap-5 sm:grid-cols-2">

                {/* NAME */}

                <div className="sm:col-span-2">

                  <label className="text-sm font-bold">
                    Full Name
                  </label>

                  <input
                    type="text"
                    value={customerName}
                    onChange={(event) =>
                      setCustomerName(
                        event.target.value
                      )
                    }
                    placeholder="Juan Dela Cruz"
                    required
                    className="mt-2 w-full rounded-2xl border-none bg-[#f9ebe2] px-5 py-4 text-sm font-semibold outline-none ring-0 placeholder:text-[#b7a3a0] focus:ring-2 focus:ring-[#e8a0ad]"
                  />

                </div>

                {/* EMAIL */}

                <div>

                  <label className="text-sm font-bold">
                    Email
                  </label>

                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(event) =>
                      setCustomerEmail(
                        event.target.value
                      )
                    }
                    placeholder="you@example.com"
                    required
                    className="mt-2 w-full rounded-2xl border-none bg-[#f9ebe2] px-5 py-4 text-sm font-semibold outline-none placeholder:text-[#b7a3a0] focus:ring-2 focus:ring-[#e8a0ad]"
                  />

                </div>

                {/* PHONE */}

                <div>

                  <label className="text-sm font-bold">
                    Phone Number
                  </label>

                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(event) =>
                      setCustomerPhone(
                        event.target.value
                      )
                    }
                    placeholder="09XXXXXXXXX"
                    required
                    className="mt-2 w-full rounded-2xl border-none bg-[#f9ebe2] px-5 py-4 text-sm font-semibold outline-none placeholder:text-[#b7a3a0] focus:ring-2 focus:ring-[#e8a0ad]"
                  />

                </div>

              </div>

            </section>

            {/* DELIVERY INFORMATION */}

            <section className="rounded-[30px] bg-[#fff8f5] p-6 shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff] sm:p-8">

              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#f9ebe2]">
                  <span className="h-5 w-5 text-[#c97888]"><LocationIcon /></span>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#c97888]">Delivery</p>
                  <h2 className="mt-1 text-2xl font-black">Delivery Information</h2>
                </div>
              </div>

              <div className="mt-7 space-y-5">

                {/* ADDRESS */}

                <div>

                  <label className="text-sm font-bold">
                    Delivery Address
                  </label>

                  <textarea
                    value={deliveryAddress}
                    onChange={(event) =>
                      setDeliveryAddress(
                        event.target.value
                      )
                    }
                    placeholder="House number, street, barangay..."
                    rows={3}
                    required
                    className="mt-2 w-full resize-none rounded-2xl border-none bg-[#f9ebe2] px-5 py-4 text-sm font-semibold outline-none placeholder:text-[#b7a3a0] focus:ring-2 focus:ring-[#e8a0ad]"
                  />

                </div>

                {/* CITY */}

                <div>

                  <label className="text-sm font-bold">
                    City / Municipality
                  </label>

                  <input
                    type="text"
                    value={deliveryCity}
                    onChange={(event) =>
                      setDeliveryCity(
                        event.target.value
                      )
                    }
                    placeholder="Rodriguez, Rizal"
                    required
                    className="mt-2 w-full rounded-2xl border-none bg-[#f9ebe2] px-5 py-4 text-sm font-semibold outline-none placeholder:text-[#b7a3a0] focus:ring-2 focus:ring-[#e8a0ad]"
                  />

                </div>

                {/* NOTES */}

                <div>

                  <label className="text-sm font-bold">
                    Order Notes{" "}
                    <span className="font-normal text-[#a58f8f]">
                      (Optional)
                    </span>
                  </label>

                  <textarea
                    value={orderNotes}
                    onChange={(event) =>
                      setOrderNotes(
                        event.target.value
                      )
                    }
                    placeholder="Any special instructions?"
                    rows={3}
                    className="mt-2 w-full resize-none rounded-2xl border-none bg-[#f9ebe2] px-5 py-4 text-sm font-semibold outline-none placeholder:text-[#b7a3a0] focus:ring-2 focus:ring-[#e8a0ad]"
                  />

                </div>

              </div>

            </section>

            {/* PAYMENT */}

            <section className="rounded-[30px] bg-[#fff8f5] p-6 shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff] sm:p-8">

              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#f9ebe2]">
                  <span className="h-5 w-5 text-[#c97888]"><WalletIcon /></span>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#c97888]">Payment</p>
                  <h2 className="mt-1 text-2xl font-black">Payment Method</h2>
                </div>
              </div>

              <div className="mt-7">

                {storeSettings.allow_cod ? (
                  <label className="flex cursor-pointer items-center gap-4 rounded-2xl bg-[#f9ebe2] p-5">
                    <input
                      type="radio"
                      name="payment"
                      value="Cash on Delivery"
                      checked={
                        paymentMethod ===
                        "Cash on Delivery"
                      }
                      onChange={(event) =>
                        setPaymentMethod(
                          event.target.value
                        )
                      }
                      className="h-5 w-5 accent-[#e8a0ad]"
                    />

                    <div>
                      <p className="font-black">
                        <span className="inline-flex items-center gap-2">
                          <span className="h-5 w-5 text-[#c97888]"><CashIcon /></span>
                          Cash on Delivery
                        </span>
                      </p>

                      <p className="mt-1 text-sm text-[#806e6e]">
                        Pay when your order
                        arrives.
                      </p>
                    </div>
                  </label>
                ) : (
                  <div className="rounded-2xl border border-[#efb9c1] bg-[#fce4e7] p-5">
                    <p className="font-black text-[#a84f61]">
                      Cash on Delivery is
                      currently disabled.
                    </p>

                    <p className="mt-2 text-sm leading-6 text-[#9b6670]">
                      No checkout payment
                      method is currently
                      available.
                    </p>
                  </div>
                )}

              </div>

            </section>

          </div>

          {/* RIGHT */}

          <aside className="h-fit space-y-8">

            {/* ORDER SUMMARY */}

            <section className="rounded-[30px] bg-[#fff8f5] p-6 shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff] sm:p-8">

              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#f9ebe2]">
                  <span className="h-5 w-5 text-[#c97888]"><ReceiptIcon /></span>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#c97888]">Summary</p>
                  <h2 className="mt-1 text-2xl font-black">Your Order</h2>
                </div>
              </div>

              {/* ITEMS */}

              <div className="mt-7 space-y-4">

                {cartItems.map(
                  (item) => (
                    <div
                      key={item.id}
                      className="flex gap-4"
                    >

                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[#f9ebe2]">

                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover"
                          onError={(
                            event
                          ) => {
                            event.currentTarget.src =
                              "/placeholder.png";
                          }}
                        />

                      </div>

                      <div className="min-w-0 flex-1">

                        <p className="font-black">
                          {item.name}
                        </p>

                        <p className="mt-1 text-sm text-[#806e6e]">
                          ₱
                          {formatCurrency(
                            Number(
                              item.price
                            )
                          )}{" "}
                          ×{" "}
                          {item.quantity}
                        </p>

                      </div>

                      <p className="font-black text-[#c97888]">
                        ₱
                        {formatCurrency(
                          Number(
                            item.price
                          ) *
                            item.quantity
                        )}
                      </p>

                    </div>
                  )
                )}

              </div>

              {/* TOTALS */}

              <div className="mt-7 space-y-4 border-t border-[#ead8d0] pt-6">

                <div className="flex items-center justify-between text-sm">

                  <span className="text-[#806e6e]">
                    Subtotal
                  </span>

                  <span className="font-bold">
                    ₱
                    {formatCurrency(
                      subtotal
                    )}
                  </span>

                </div>

                <div className="flex items-center justify-between text-sm">

                  <span className="text-[#806e6e]">
                    Delivery Fee
                  </span>

                  <span className="font-bold">
                    ₱
                    {formatCurrency(
                      deliveryFee
                    )}
                  </span>

                </div>

                {minimumOrder > 0 && (
                  <div className="rounded-2xl bg-[#f9ebe2] px-4 py-3 text-xs">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-bold text-[#806e6e]">
                        Minimum Order
                      </span>

                      <span
                        className={`font-black ${
                          minimumOrderReached
                            ? "text-[#4f8a61]"
                            : "text-[#a84f61]"
                        }`}
                      >
                        {minimumOrderReached
                          ? "Reached"
                          : `₱${formatCurrency(
                              minimumOrder
                            )}`}
                      </span>
                    </div>

                    {!minimumOrderReached && (
                      <p className="mt-2 leading-5 text-[#9b6670]">
                        Add ₱
                        {formatCurrency(
                          Math.max(
                            0,
                            minimumOrder -
                              subtotal
                          )
                        )}{" "}
                        more to place your
                        order.
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#806e6e]">
                    Estimated Delivery
                  </span>

                  <span className="font-bold">
                    ~{defaultEtaMinutes} min
                  </span>
                </div>

                <div className="h-px bg-[#ead8d0]" />

                <div className="flex items-center justify-between">

                  <span className="font-black">
                    Total
                  </span>

                  <span className="text-2xl font-black text-[#c97888]">
                    ₱
                    {formatCurrency(total)}
                  </span>

                </div>

              </div>

              {/* PLACE ORDER */}

              <button
                type="submit"
                disabled={
                  loading ||
                  settingsLoading ||
                  !checkoutAvailable
                }
                className="mt-7 w-full rounded-full bg-[#e8a0ad] px-7 py-4 text-sm font-black text-white shadow-[5px_5px_12px_#d8c5c0,-4px_-4px_10px_#ffffff] transition hover:-translate-y-0.5 hover:bg-[#d88a9a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  {!loading &&
                    !settingsLoading &&
                    checkoutAvailable && (
                      <span className="h-5 w-5"><BagCheckIcon /></span>
                    )}
                  {loading
                    ? "Placing Order..."
                    : settingsLoading
                      ? "Loading Store..."
                      : !storeSettings.store_open
                        ? "Store Closed"
                        : !minimumOrderReached
                          ? "Minimum Order Not Reached"
                          : !storeSettings.allow_cod
                            ? "Payment Unavailable"
                            : "Place Order"}
                </span>
              </button>

              <p className="mt-4 text-center text-xs leading-5 text-[#a58f8f]">
                By placing your order, you
                confirm that your information
                is correct.
              </p>

            </section>

          </aside>

        </form>

      </div>

    </main>
  );
}

/* =========================================================
   DOUGHY PROFESSIONAL SVG ICONS
========================================================= */

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

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 10V8C8 5.8 9.8 4 12 4C14.2 4 16 5.8 16 8V10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 20C5.8 16.4 8.4 14.5 12 14.5C15.6 14.5 18.2 16.4 19 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true">
      <path d="M12 21C12 21 19 15.8 19 9.5C19 5.6 15.9 3 12 3C8.1 3 5 5.6 5 9.5C5 15.8 12 21 12 21Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="12" cy="9.5" r="2.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true">
      <rect x="3" y="6" width="18" height="14" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 10H21V16H16C14.3 16 13 14.7 13 13C13 11.3 14.3 10 16 10Z" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="16.5" cy="13" r="1" fill="currentColor" />
    </svg>
  );
}

function CashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true">
      <rect x="3" y="6" width="18" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M6 9C7.2 9 8 8.2 8 7M18 9C16.8 9 16 8.2 16 7M6 15C7.2 15 8 15.8 8 17M18 15C16.8 15 16 15.8 16 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ReceiptIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true">
      <path d="M6 3H18V21L15 19L12 21L9 19L6 21V3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 8H15M9 12H15M9 16H13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function BagCheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true">
      <path d="M5 8H19L18 20H6L5 8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 9V7C9 5.3 10.3 4 12 4C13.7 4 15 5.3 15 7V9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9 14L11 16L15.5 11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

