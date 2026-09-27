"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";

import { supabase } from "@/lib/supabase";
import type { Product } from "@/data/products";

export default function ShopPage() {
  return (
    <Suspense fallback={<ShopPageLoading />}>
      <ShopPageContent />
    </Suspense>
  );
}

function ShopPageContent() {
  const searchParams = useSearchParams();

  const [products, setProducts] =
    useState<Product[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [category, setCategory] =
    useState("All");

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        setLoadError(false);

        const { data, error } =
          await supabase
            .from("products")
            .select("*")
            .order("created_at", {
              ascending: false,
            });

        if (error) {
          console.error(
            "Products loading error:",
            error
          );

          setLoadError(true);
          return;
        }

        setProducts(
          (data || []) as Product[]
        );
      } catch (error) {
        console.error(
          "Unable to load products:",
          error
        );

        setLoadError(true);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  /*
  ========================================
  READ CATEGORY FROM URL

  Example:
  /shop?category=Donuts
  ========================================
  */

  useEffect(() => {
    const categoryFromUrl =
      searchParams.get("category");

    if (categoryFromUrl) {
      setCategory(categoryFromUrl);
    }
  }, [searchParams]);

  /*
  ========================================
  CATEGORIES
  ========================================
  */

  const categories = useMemo(() => {
    const uniqueCategories =
      Array.from(
        new Set(
          products
            .map(
              (product) =>
                product.category
            )
            .filter(Boolean)
        )
      );

    return [
      "All",
      ...uniqueCategories,
    ];
  }, [products]);

  /*
  ========================================
  FILTER PRODUCTS
  ========================================
  */

  const filteredProducts =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      return products.filter(
        (product) => {
          const name =
            product.name
              ?.toLowerCase() || "";

          const description =
            product.description
              ?.toLowerCase() || "";

          const matchesSearch =
            !normalizedSearch ||
            name.includes(
              normalizedSearch
            ) ||
            description.includes(
              normalizedSearch
            );

          const matchesCategory =
            category === "All" ||
            product.category ===
              category;

          return (
            matchesSearch &&
            matchesCategory
          );
        }
      );
    }, [
      products,
      search,
      category,
    ]);

  function clearFilters() {
    setSearch("");
    setCategory("All");
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7eee9] text-[#2d2424]">
      <Navbar />

      {/* =========================================
          SHOP HERO
      ========================================= */}

      <section className="relative overflow-hidden px-5 pb-12 pt-14 sm:px-6 sm:pt-16 lg:px-10 lg:pb-16 lg:pt-20">
        {/* Background glow */}

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-28 top-0 h-72 w-72 rounded-full bg-[#f0cfd2]/50 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-28 top-20 h-72 w-72 rounded-full bg-[#f1d8cc]/60 blur-3xl"
        />

        <div className="relative mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-[#fff8f4]/70 px-4 py-2 shadow-[4px_4px_10px_#dfccc6,-4px_-4px_10px_#ffffff] backdrop-blur-sm">
                <span className="h-4 w-4 text-[#c27786]">
                  <DonutIcon />
                </span>

                <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#c27786] sm:text-xs">
                  Doughy Collection
                </p>
              </div>
            </div>

            <h1 className="text-4xl font-black tracking-[-0.045em] text-[#362929] sm:text-5xl lg:text-6xl">
              Find your next
              <span className="block text-[#d98798]">
                favorite treat.
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-sm font-medium leading-7 text-[#806d6d] sm:text-base">
              Browse our freshly prepared
              donuts, cakes, cupcakes, and
              sweet favorites made for every
              craving.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================
          SHOP CONTENT
      ========================================= */}

      <section className="relative px-5 pb-24 sm:px-6 lg:px-10 lg:pb-28">
        <div className="mx-auto max-w-7xl">
          {/* =========================================
              SEARCH + FILTERS
          ========================================= */}

          <div className="rounded-[30px] border border-white/60 bg-[#fff8f5]/90 p-5 shadow-[10px_10px_24px_#d8c5c0,-8px_-8px_20px_#ffffff] sm:p-6">
            <div className="grid gap-5 md:grid-cols-[1fr_230px]">
              {/* Search */}

              <div>
                <label
                  htmlFor="product-search"
                  className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-[#6e5959]"
                >
                  Search Products
                </label>

                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#ba7a86]">
                    <SearchIcon />
                  </span>

                  <input
                    id="product-search"
                    type="search"
                    placeholder="Search donuts, cakes, cupcakes..."
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value
                      )
                    }
                    className="w-full rounded-[18px] border border-[#ead7d0] bg-[#f9ebe5] py-4 pl-11 pr-4 text-sm font-medium text-[#352929] outline-none transition-all duration-200 placeholder:text-[#a88e8e] focus:border-[#df98a6] focus:bg-[#fff8f5] focus:ring-4 focus:ring-[#e8a0ad]/10"
                  />
                </div>
              </div>

              {/* Category */}

              <div>
                <label
                  htmlFor="product-category"
                  className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-[#6e5959]"
                >
                  Category
                </label>

                <select
                  id="product-category"
                  value={category}
                  onChange={(event) =>
                    setCategory(
                      event.target.value
                    )
                  }
                  className="w-full cursor-pointer rounded-[18px] border border-[#ead7d0] bg-[#f9ebe5] px-4 py-4 text-sm font-bold text-[#4e3d3d] outline-none transition-all duration-200 focus:border-[#df98a6] focus:bg-[#fff8f5] focus:ring-4 focus:ring-[#e8a0ad]/10"
                >
                  {categories.map(
                    (item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item === "All"
                          ? "All Categories"
                          : item}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            {/* Results row */}

            {!loading && (
              <div className="mt-5 flex flex-col gap-3 border-t border-[#eadbd5] pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-medium text-[#806d6d]">
                  Showing{" "}
                  <span className="font-black text-[#392d2d]">
                    {
                      filteredProducts.length
                    }
                  </span>{" "}
                  of{" "}
                  <span className="font-black text-[#392d2d]">
                    {products.length}
                  </span>{" "}
                  products
                </p>

                {(search ||
                  category !== "All") && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="w-fit text-xs font-extrabold text-[#c97888] transition-colors hover:text-[#a85f70]"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      Clear filters

                      <span className="h-3.5 w-3.5">
                        <CloseIcon />
                      </span>
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* =========================================
              CATEGORY CHIPS
          ========================================= */}

          {!loading &&
            categories.length > 1 && (
              <div className="mt-7 flex gap-3 overflow-x-auto pb-2">
                {categories.map(
                  (item) => {
                    const active =
                      category === item;

                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() =>
                          setCategory(item)
                        }
                        className={`shrink-0 rounded-full px-5 py-2.5 text-xs font-extrabold transition-all duration-200 ${
                          active
                            ? "bg-[#df91a0] text-white shadow-[5px_5px_12px_#d3c0ba,-4px_-4px_10px_#ffffff]"
                            : "bg-[#fff8f5] text-[#7d6666] shadow-[4px_4px_10px_#d8c5c0,-4px_-4px_10px_#ffffff] hover:-translate-y-0.5 hover:text-[#c97888]"
                        }`}
                      >
                        {item}
                      </button>
                    );
                  }
                )}
              </div>
            )}

          {/* =========================================
              LOADING
          ========================================= */}

          {loading && (
            <div className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({
                length: 8,
              }).map((_, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-[32px] border border-white/50 bg-[#fff8f5] p-4 shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff]"
                >
                  <div className="aspect-[4/3] animate-pulse rounded-[26px] bg-[#f0ddd8]" />

                  <div className="px-2 pb-2 pt-6">
                    <div className="h-3 w-20 animate-pulse rounded-full bg-[#ead2cf]" />

                    <div className="mt-4 h-6 w-2/3 animate-pulse rounded-full bg-[#e8d4d0]" />

                    <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-[#f0dfdb]" />

                    <div className="mt-2 h-4 w-4/5 animate-pulse rounded-full bg-[#f0dfdb]" />

                    <div className="mt-6 h-12 animate-pulse rounded-full bg-[#ead5d1]" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* =========================================
              ERROR
          ========================================= */}

          {!loading &&
            loadError && (
              <div className="mt-10 rounded-[32px] border border-white/60 bg-[#fff8f5] px-6 py-16 text-center shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff]">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[26px] bg-[#f9ebe2] shadow-[inset_4px_4px_10px_#ddcac4,inset_-4px_-4px_10px_#ffffff]">
                  <span className="h-9 w-9 text-[#c97888]">
                    <DonutIcon />
                  </span>
                </div>

                <h2 className="mt-6 text-2xl font-black text-[#493838]">
                  Something went wrong.
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-[#806e6e]">
                  We couldn&apos;t load the
                  products right now. Please
                  refresh the page and try
                  again.
                </p>
              </div>
            )}

          {/* =========================================
              EMPTY
          ========================================= */}

          {!loading &&
            !loadError &&
            filteredProducts.length ===
              0 && (
              <div className="mt-10 rounded-[32px] border border-white/60 bg-[#fff8f5] px-6 py-16 text-center shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff]">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[26px] bg-[#f9ebe2] shadow-[inset_4px_4px_10px_#ddcac4,inset_-4px_-4px_10px_#ffffff]">
                  <span className="h-9 w-9 text-[#c97888]">
                    <DonutIcon />
                  </span>
                </div>

                <h2 className="mt-6 text-2xl font-black text-[#493838]">
                  No treats found.
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-[#806e6e]">
                  Try another search or
                  category and we&apos;ll help
                  you find something sweet.
                </p>

                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-6 rounded-full bg-[#e59aa8] px-6 py-3 text-sm font-extrabold text-white shadow-[6px_6px_14px_#d7c3bd,-5px_-5px_13px_#ffffff] transition-all hover:-translate-y-0.5 hover:bg-[#d98797]"
                >
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4">
                      <ResetIcon />
                    </span>

                    Clear filters
                  </span>
                </button>
              </div>
            )}

          {/* =========================================
              PRODUCTS GRID
          ========================================= */}

          {!loading &&
            !loadError &&
            filteredProducts.length >
              0 && (
              <div className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredProducts.map(
                  (product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                    />
                  )
                )}
              </div>
            )}
        </div>
      </section>

      <Footer />
    </main>
  );
}

/* =========================================================
   SUSPENSE FALLBACK
========================================================= */

function ShopPageLoading() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7eee9] text-[#2d2424]">
      <Navbar />

      <section className="px-5 pb-24 pt-20 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto h-9 w-44 animate-pulse rounded-full bg-[#ead2cf]" />

            <div className="mx-auto mt-7 h-14 max-w-xl animate-pulse rounded-[20px] bg-[#eadbd5]" />

            <div className="mx-auto mt-5 h-5 max-w-md animate-pulse rounded-full bg-[#eee0dc]" />
          </div>

          <div className="mt-16 rounded-[30px] border border-white/60 bg-[#fff8f5]/90 p-5 shadow-[10px_10px_24px_#d8c5c0,-8px_-8px_20px_#ffffff] sm:p-6">
            <div className="grid gap-5 md:grid-cols-[1fr_230px]">
              <div>
                <div className="mb-2 h-3 w-28 animate-pulse rounded-full bg-[#ead2cf]" />

                <div className="h-14 animate-pulse rounded-[18px] bg-[#f0ddd8]" />
              </div>

              <div>
                <div className="mb-2 h-3 w-20 animate-pulse rounded-full bg-[#ead2cf]" />

                <div className="h-14 animate-pulse rounded-[18px] bg-[#f0ddd8]" />
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({
              length: 8,
            }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-[32px] border border-white/50 bg-[#fff8f5] p-4 shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff]"
              >
                <div className="aspect-[4/3] animate-pulse rounded-[26px] bg-[#f0ddd8]" />

                <div className="px-2 pb-2 pt-6">
                  <div className="h-3 w-20 animate-pulse rounded-full bg-[#ead2cf]" />

                  <div className="mt-4 h-6 w-2/3 animate-pulse rounded-full bg-[#e8d4d0]" />

                  <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-[#f0dfdb]" />

                  <div className="mt-2 h-4 w-4/5 animate-pulse rounded-full bg-[#f0dfdb]" />

                  <div className="mt-6 h-12 animate-pulse rounded-full bg-[#ead5d1]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

/* =========================================================
   DOUGHY SHOP SVG ICONS
========================================================= */

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

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      <circle
        cx="10.8"
        cy="10.8"
        r="6.3"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M15.5 15.5L20 20"
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
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      <path
        d="M5.5 8.5A7 7 0 1 1 5 14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M5.5 4.5V8.5H9.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}