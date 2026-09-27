"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import { useCart } from "@/app/context/CartContext";
import { useStoreSettings } from "@/app/context/StoreSettingsContext";

import { supabase } from "@/lib/supabase";
import type { Product } from "@/data/products";

export default function ProductDetailsPage() {
  const params = useParams();

  const { addToCart } = useCart();

  const {
    settings,
    loading: settingsLoading,
  } = useStoreSettings();

  const [product, setProduct] =
    useState<Product | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState(false);

  const [quantity, setQuantity] =
    useState(1);

  const [added, setAdded] =
    useState(false);

  const slug = params.slug as string;

  const storeClosed =
    !settingsLoading &&
    !settings.store_open;

  useEffect(() => {
    async function loadProduct() {
      if (!slug) {
        return;
      }

      try {
        setLoading(true);
        setLoadError(false);

        /*
        ========================================
        TRY PRODUCT BY SLUG
        ========================================
        */

        const {
          data: slugProduct,
          error: slugError,
        } = await supabase
          .from("products")
          .select("*")
          .eq("slug", slug)
          .maybeSingle();

        if (slugError) {
          console.error(
            "Product slug lookup error:",
            slugError
          );
        }

        if (slugProduct) {
          setProduct(
            slugProduct as Product
          );

          return;
        }

        /*
        ========================================
        FALLBACK: TRY PRODUCT BY ID
        ========================================
        */

        const numericId =
          Number(slug);

        if (
          Number.isFinite(numericId)
        ) {
          const {
            data: idProduct,
            error: idError,
          } = await supabase
            .from("products")
            .select("*")
            .eq("id", numericId)
            .maybeSingle();

          if (idError) {
            console.error(
              "Product ID lookup error:",
              idError
            );
          }

          if (idProduct) {
            setProduct(
              idProduct as Product
            );

            return;
          }
        }

        setProduct(null);
      } catch (error) {
        console.error(
          "Unable to load product:",
          error
        );

        setLoadError(true);
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [slug]);

  function handleAddToCart() {
    if (
      !product ||
      settingsLoading ||
      !settings.store_open
    ) {
      return;
    }

    for (
      let index = 0;
      index < quantity;
      index++
    ) {
      addToCart(product);
    }

    setAdded(true);

    window.setTimeout(() => {
      setAdded(false);
    }, 1200);
  }

  const formattedPrice =
    product
      ? Number(
          product.price || 0
        ).toLocaleString(
          "en-PH",
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }
        )
      : "0.00";

  const formattedTotal =
    product
      ? (
          Number(
            product.price || 0
          ) * quantity
        ).toLocaleString(
          "en-PH",
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }
        )
      : "0.00";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7eee9] text-[#2d2424]">
      <Navbar />

      {/* =========================================
          LOADING
      ========================================= */}
      {loading && (
        <section className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-10 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-2">
            <div className="aspect-square animate-pulse rounded-[40px] bg-[#eadbd5] shadow-[12px_12px_25px_#d8c5c0,-10px_-10px_22px_#ffffff]" />

            <div className="flex flex-col justify-center">
              <div className="h-3 w-24 animate-pulse rounded-full bg-[#e5d0cc]" />

              <div className="mt-5 h-12 w-3/4 animate-pulse rounded-full bg-[#e5d0cc]" />

              <div className="mt-5 h-8 w-28 animate-pulse rounded-full bg-[#e5d0cc]" />

              <div className="mt-8 h-4 w-full animate-pulse rounded-full bg-[#eadbd5]" />

              <div className="mt-3 h-4 w-5/6 animate-pulse rounded-full bg-[#eadbd5]" />

              <div className="mt-10 h-14 w-full animate-pulse rounded-full bg-[#e5d0cc]" />
            </div>
          </div>
        </section>
      )}

      {/* =========================================
          ERROR
      ========================================= */}
      {!loading &&
        loadError && (
          <section className="flex min-h-[65vh] items-center justify-center px-6">
            <div className="text-center">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[30px] bg-[#f9ebe2] shadow-[inset_5px_5px_12px_#ddcac4,inset_-5px_-5px_12px_#ffffff]">
                <span className="h-11 w-11 text-[#c97888]">
                  <DonutIcon />
                </span>
              </div>

              <h1 className="mt-6 text-3xl font-black">
                Something went wrong
              </h1>

              <p className="mt-3 text-[#806e6e]">
                We couldn&apos;t load this
                product right now.
              </p>

              <Link
                href="/shop"
                className="mt-7 inline-flex rounded-full bg-[#e59aa8] px-7 py-3.5 text-sm font-extrabold text-white shadow-[6px_6px_14px_#d7c3bd,-5px_-5px_13px_#ffffff] transition hover:-translate-y-0.5 hover:bg-[#d98797]"
              >
                <span className="mr-2 inline-flex h-4 w-4 align-middle">
                  <ArrowLeftIcon />
                </span>
                Back to Shop
              </Link>
            </div>
          </section>
        )}

      {/* =========================================
          NOT FOUND
      ========================================= */}
      {!loading &&
        !loadError &&
        !product && (
          <section className="flex min-h-[65vh] items-center justify-center px-6">
            <div className="text-center">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[30px] bg-[#f9ebe2] shadow-[inset_5px_5px_12px_#ddcac4,inset_-5px_-5px_12px_#ffffff]">
                <span className="h-11 w-11 text-[#c97888]">
                  <DonutIcon />
                </span>
              </div>

              <h1 className="mt-6 text-3xl font-black">
                Product not found
              </h1>

              <p className="mt-3 text-[#806e6e]">
                Sorry, we couldn&apos;t find
                that sweet treat.
              </p>

              <Link
                href="/shop"
                className="mt-7 inline-flex rounded-full bg-[#e59aa8] px-7 py-3.5 text-sm font-extrabold text-white shadow-[6px_6px_14px_#d7c3bd,-5px_-5px_13px_#ffffff] transition hover:-translate-y-0.5 hover:bg-[#d98797]"
              >
                <span className="mr-2 inline-flex h-4 w-4 align-middle">
                  <ArrowLeftIcon />
                </span>
                Back to Shop
              </Link>
            </div>
          </section>
        )}

      {/* =========================================
          PRODUCT
      ========================================= */}
      {!loading &&
        !loadError &&
        product && (
          <section className="relative px-5 pb-24 pt-10 sm:px-6 lg:px-10 lg:pb-28 lg:pt-14">
            {/* Background decorations */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -left-28 top-10 h-72 w-72 rounded-full bg-[#f2d2d5]/45 blur-3xl"
            />

            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-28 bottom-0 h-72 w-72 rounded-full bg-[#efd6ca]/55 blur-3xl"
            />

            <div className="relative mx-auto max-w-7xl">
              {/* Back */}
              <Link
                href="/shop"
                className="group inline-flex items-center gap-2 text-sm font-extrabold text-[#c97888] transition-colors hover:text-[#a85f70]"
              >
                <span className="h-4 w-4 transition-transform group-hover:-translate-x-1">
                  <ArrowLeftIcon />
                </span>

                Back to Shop
              </Link>

              <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
                {/* =========================================
                    IMAGE
                ========================================= */}
                <div className="relative">
                  <div className="relative overflow-hidden rounded-[40px] border border-white/60 bg-[#fff8f5] p-4 shadow-[14px_14px_30px_#d8c5c0,-10px_-10px_25px_#ffffff] sm:p-5">
                    {product.badge && (
                      <div className="absolute left-8 top-8 z-10 rounded-full border border-white/30 bg-[#df8f9e]/95 px-4 py-2 text-xs font-black uppercase tracking-[0.08em] text-white shadow-lg backdrop-blur-sm">
                        {product.badge}
                      </div>
                    )}

                    {storeClosed && (
                      <div className="absolute right-8 top-8 z-10 rounded-full bg-[#9e5361]/95 px-4 py-2 text-xs font-black uppercase tracking-[0.08em] text-white shadow-lg">
                        Store Closed
                      </div>
                    )}

                    <div className="relative aspect-square overflow-hidden rounded-[32px] bg-[#f9ebe2]">
                      {product.image ? (
                        <Image
                          src={
                            product.image
                          }
                          alt={
                            product.name
                          }
                          fill
                          priority
                          sizes="(max-width: 1024px) 100vw, 50vw"
                          className="object-cover transition-transform duration-700 hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <span className="h-20 w-20 text-[#c97888]">
                            <DonutIcon />
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* =========================================
                    PRODUCT INFO
                ========================================= */}
                <div>
                  {product.category && (
                    <div className="inline-flex rounded-full border border-white/50 bg-[#fff8f4]/70 px-4 py-2 shadow-[4px_4px_10px_#dfccc6,-4px_-4px_10px_#ffffff]">
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#c27786]">
                        {
                          product.category
                        }
                      </p>
                    </div>
                  )}

                  <h1 className="mt-5 text-4xl font-black tracking-[-0.045em] text-[#382b2b] sm:text-5xl lg:text-6xl">
                    {product.name}
                  </h1>

                  <p className="mt-5 text-3xl font-black tracking-tight text-[#c97888]">
                    ₱{formattedPrice}
                  </p>

                  <div className="my-7 h-px bg-[#e5d4ce]" />

                  <p className="max-w-xl text-sm font-medium leading-7 text-[#806e6e] sm:text-base sm:leading-8">
                    {product.description ||
                      "Freshly prepared and made with care."}
                  </p>

                  {/* =========================================
                      QUANTITY
                  ========================================= */}
                  <div className="mt-9">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-[#645050]">
                      Quantity
                    </p>

                    <div className="mt-3 inline-flex items-center gap-5 rounded-full border border-white/60 bg-[#fff8f5] p-2 shadow-[5px_5px_12px_#d8c5c0,-4px_-4px_10px_#ffffff]">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() =>
                          setQuantity(
                            (
                              current
                            ) =>
                              Math.max(
                                1,
                                current -
                                  1
                              )
                          )
                        }
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f9ebe2] text-xl font-black text-[#765e5e] transition-all hover:-translate-y-0.5 hover:bg-[#f2ded7]"
                      >
                        <span className="h-4 w-4">
                          <MinusIcon />
                        </span>
                      </button>

                      <span className="min-w-8 text-center text-lg font-black">
                        {quantity}
                      </span>

                      <button
                        type="button"
                        aria-label="Increase quantity"
                        onClick={() =>
                          setQuantity(
                            (
                              current
                            ) =>
                              current +
                              1
                          )
                        }
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f9ebe2] text-xl font-black text-[#765e5e] transition-all hover:-translate-y-0.5 hover:bg-[#f2ded7]"
                      >
                        <span className="h-4 w-4">
                          <PlusIcon />
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* =========================================
                      TOTAL
                  ========================================= */}
                  <div className="mt-8 flex items-center justify-between rounded-[24px] border border-white/60 bg-[#fff8f5] px-5 py-4 shadow-[5px_5px_12px_#d8c5c0,-4px_-4px_10px_#ffffff] sm:px-6">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#9a8383]">
                        Order total
                      </p>

                      <p className="mt-1 text-xs font-semibold text-[#9a8383]">
                        {quantity}{" "}
                        {quantity === 1
                          ? "item"
                          : "items"}
                      </p>
                    </div>

                    <span className="text-2xl font-black text-[#3b2e2e] sm:text-3xl">
                      ₱
                      {
                        formattedTotal
                      }
                    </span>
                  </div>

                  {/* =========================================
                      ADD TO CART
                  ========================================= */}
                  <button
                    type="button"
                    onClick={
                      handleAddToCart
                    }
                    disabled={
                      settingsLoading ||
                      storeClosed
                    }
                    className={`mt-6 flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-sm font-extrabold shadow-[7px_7px_16px_#d8c5c0,-6px_-6px_14px_#ffffff] transition-all duration-300 sm:text-base ${
                      storeClosed
                        ? "cursor-not-allowed bg-[#dfcfca] text-[#8b7777] opacity-80"
                        : settingsLoading
                          ? "cursor-wait bg-[#eadbd5] text-[#8b7777]"
                          : added
                            ? "bg-[#c98793] text-white"
                            : "bg-[#e59aa8] text-white hover:-translate-y-1 hover:bg-[#d98797]"
                    }`}
                  >
                    {settingsLoading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#a98d8d] border-t-transparent" />
                        Checking Store...
                      </>
                    ) : storeClosed ? (
                      <>
                        <span className="h-4 w-4">
                          <LockIcon />
                        </span>
                        Store Closed
                      </>
                    ) : added ? (
                      <>
                        <span className="h-4 w-4">
                          <CheckIcon />
                        </span>
                        Added!
                      </>
                    ) : (
                      <>
                        <span className="h-5 w-5">
                          <CartPlusIcon />
                        </span>
                        Add {quantity} {quantity === 1 ? "item" : "items"} to Cart
                      </>
                    )}
                  </button>

                  {storeClosed && (
                    <p className="mt-3 text-center text-xs font-semibold leading-5 text-[#a45e6b]">
                      You can still browse
                      products, but ordering
                      is temporarily disabled.
                    </p>
                  )}

                  {/* =========================================
                      INFO ROW
                  ========================================= */}
                  <div className="mt-8 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[18px] bg-[#f6e7e1] px-4 py-3 text-center">
                      <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-[#fff8f5] text-[#c97888] shadow-[3px_3px_7px_#dfccc6,-3px_-3px_7px_#ffffff]">
                        <span className="h-4 w-4">
                          <HeartIcon />
                        </span>
                      </div>

                      <p className="mt-1 text-[11px] font-extrabold text-[#806e6e]">
                        Made with care
                      </p>
                    </div>

                    <div className="rounded-[18px] bg-[#f6e7e1] px-4 py-3 text-center">
                      <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-[#fff8f5] text-[#c97888] shadow-[3px_3px_7px_#dfccc6,-3px_-3px_7px_#ffffff]">
                        <span className="h-4 w-4">
                          <SparkleIcon />
                        </span>
                      </div>

                      <p className="mt-1 text-[11px] font-extrabold text-[#806e6e]">
                        Freshly prepared
                      </p>
                    </div>

                    <div className="rounded-[18px] bg-[#f6e7e1] px-4 py-3 text-center">
                      <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-[#fff8f5] text-[#c97888] shadow-[3px_3px_7px_#dfccc6,-3px_-3px_7px_#ffffff]">
                        <span className="h-4 w-4">
                          <DeliveryIcon />
                        </span>
                      </div>

                      <p className="mt-1 text-[11px] font-extrabold text-[#806e6e]">
                        Delivery available
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

      <Footer />
    </main>
  );
}

/* =========================================================
   DOUGHY PRODUCT DETAILS SVG ICONS
========================================================= */

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

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true">
      <path d="M19 12H5M10 7L5 12L10 17" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
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

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 10V8C8 5.8 9.8 4 12 4C14.2 4 16 5.8 16 8V10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true">
      <path d="M6.5 12.5L10.2 16L17.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CartPlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true">
      <path d="M3.5 5H5.5L7.2 15.2H18.2L20 8H6.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="19" r="1.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17" cy="19" r="1.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M14.5 4V8M12.5 6H16.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true">
      <path d="M12 20S4.5 15.7 4.5 9.7C4.5 6.9 6.4 5 8.9 5C10.4 5 11.5 5.8 12 6.8C12.5 5.8 13.6 5 15.1 5C17.6 5 19.5 6.9 19.5 9.7C19.5 15.7 12 20 12 20Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true">
      <path d="M12 3C12.7 7.6 14.4 9.3 19 10C14.4 10.7 12.7 12.4 12 17C11.3 12.4 9.6 10.7 5 10C9.6 9.3 11.3 7.6 12 3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M19 15C19.3 17 20 17.7 22 18C20 18.3 19.3 19 19 21C18.7 19 18 18.3 16 18C18 17.7 18.7 17 19 15Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function DeliveryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true">
      <path d="M3.5 6H14.5V17H3.5V6Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M14.5 10H18L20.5 13V17H14.5V10Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <circle cx="7" cy="18" r="2" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="17.5" cy="18" r="2" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

