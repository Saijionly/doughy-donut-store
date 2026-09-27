"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import ProductCard from "@/components/ProductCard";
import type { Product } from "@/data/products";
import { supabase } from "@/lib/supabase";

export default function BestSellers() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      setLoadError(false);

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("featured", true)
        .order("id", {
          ascending: true,
        });

      if (error) {
        console.error(
          "Error loading products:",
          error
        );

        setProducts([]);
        setLoadError(true);
        setLoading(false);
        return;
      }

      setProducts(data || []);
      setLoading(false);
    }

    fetchProducts();
  }, []);

  return (
    <section
      id="products"
      className="relative overflow-hidden bg-[#f7eee9] px-5 py-20 sm:px-6 lg:px-10 lg:py-28"
    >
      {/* Background decorations */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-[#f1d2d4]/40 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-28 top-10 h-72 w-72 rounded-full bg-[#f2d7c9]/50 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl">
        {/* =========================================
            SECTION HEADER
        ========================================= */}

        <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            {/* Eyebrow */}

            <div className="mb-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-[#fff8f4]/70 px-4 py-2 shadow-[4px_4px_10px_#dcc9c3,-4px_-4px_10px_#ffffff] backdrop-blur-sm">
                <span className="h-4 w-4 text-[#c27786]">
                  <HeartIcon />
                </span>

                <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#c27786] sm:text-xs">
                  Customer favorites
                </p>
              </div>
            </div>

            {/* Title */}

            <h2 className="text-4xl font-black tracking-[-0.04em] text-[#362929] sm:text-5xl lg:text-6xl">
              Our sweetest

              <span className="block text-[#d98798]">
                Best Sellers.
              </span>
            </h2>

            <p className="mt-5 max-w-xl text-sm font-medium leading-7 text-[#806d6d] sm:text-base">
              Meet the treats everyone keeps coming
              back for — freshly baked, delightfully
              sweet, and made to brighten your day.
            </p>
          </div>

          {/* View all */}

          <Link
            href="/shop"
            className="group inline-flex w-fit items-center gap-2 rounded-full bg-[#f9ebe2] px-6 py-3.5 text-sm font-extrabold text-[#b96f7d] shadow-[6px_6px_14px_#d8c5c0,-5px_-5px_13px_#ffffff] transition-all duration-300 hover:-translate-y-1 hover:text-[#9f5968] hover:shadow-[8px_8px_17px_#d3c0ba,-6px_-6px_15px_#ffffff] active:translate-y-0"
          >
            View all products

            <span className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1">
              <ArrowRightIcon />
            </span>
          </Link>
        </div>

        {/* =========================================
            LOADING STATE
        ========================================= */}

        {loading && (
          <div className="mt-12 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="overflow-hidden rounded-[32px] border border-white/50 bg-[#fff8f5] p-5 shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff]"
              >
                {/* Image skeleton */}

                <div className="h-64 animate-pulse rounded-[25px] bg-[#f1ddd8]" />

                <div className="px-2 pb-2 pt-6">
                  <div className="h-3 w-20 animate-pulse rounded-full bg-[#ead2cf]" />

                  <div className="mt-4 h-6 w-2/3 animate-pulse rounded-full bg-[#e9d4d0]" />

                  <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-[#f0dfdb]" />

                  <div className="mt-2 h-4 w-4/5 animate-pulse rounded-full bg-[#f0dfdb]" />

                  <div className="mt-6 flex items-center justify-between">
                    <div className="h-6 w-20 animate-pulse rounded-full bg-[#e9d4d0]" />

                    <div className="h-11 w-11 animate-pulse rounded-full bg-[#ead5d1]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* =========================================
            PRODUCTS
        ========================================= */}

        {!loading &&
          !loadError &&
          products.length > 0 && (
            <div className="mt-12 grid gap-7 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </div>
          )}

        {/* =========================================
            ERROR STATE
        ========================================= */}

        {!loading && loadError && (
          <div className="mt-12 rounded-[32px] border border-white/60 bg-[#fff8f5] px-6 py-14 text-center shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff]">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[26px] bg-[#f9ebe2] shadow-[inset_4px_4px_10px_#ddcac4,inset_-4px_-4px_10px_#ffffff]">
              <span className="h-9 w-9 text-[#c97888]">
                <DonutIcon />
              </span>
            </div>

            <h3 className="mt-6 text-xl font-black text-[#493838]">
              Our treats are taking a tiny break.
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-[#806e6e]">
              We couldn&apos;t load our best sellers
              right now. Please try again in a moment.
            </p>
          </div>
        )}

        {/* =========================================
            EMPTY STATE
        ========================================= */}

        {!loading &&
          !loadError &&
          products.length === 0 && (
            <div className="mt-12 rounded-[32px] border border-white/60 bg-[#fff8f5] px-6 py-14 text-center shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff]">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[26px] bg-[#f9ebe2] shadow-[inset_4px_4px_10px_#ddcac4,inset_-4px_-4px_10px_#ffffff]">
                <span className="h-9 w-9 text-[#c97888]">
                  <DonutIcon />
                </span>
              </div>

              <h3 className="mt-6 text-xl font-black text-[#493838]">
                Fresh favorites coming soon.
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-[#806e6e]">
                We&apos;re preparing something sweet.
                Explore the full menu while you wait.
              </p>

              <Link
                href="/shop"
                className="group mt-6 inline-flex items-center gap-2 rounded-full bg-[#e59aa8] px-6 py-3 text-sm font-extrabold text-white shadow-[6px_6px_14px_#d7c3bd,-5px_-5px_13px_#ffffff] transition-all duration-300 hover:-translate-y-1 hover:bg-[#d98797]"
              >
                Browse our menu

                <span className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1">
                  <ArrowRightIcon />
                </span>
              </Link>
            </div>
          )}
      </div>
    </section>
  );
}

/* =========================================================
   DOUGHY BEST SELLERS SVG ICONS
========================================================= */

function HeartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      <path
        d="M12 20S4.5 15.7 4.5 9.7C4.5 6.9 6.4 5 8.9 5C10.4 5 11.5 5.8 12 6.8C12.5 5.8 13.6 5 15.1 5C17.6 5 19.5 6.9 19.5 9.7C19.5 15.7 12 20 12 20Z"
        stroke="currentColor"
        strokeWidth="1.8"
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

function ArrowRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      <path
        d="M5 12H19M14 7L19 12L14 17"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}