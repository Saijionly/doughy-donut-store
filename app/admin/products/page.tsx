"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabase";

type Product = {
  id: number;
  name: string;
  slug: string;
  category: string;
  description: string;
  price: number;
  image: string;
  featured: boolean;
  badge: string | null;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] =
    useState("All");

  async function loadProducts() {
    setLoading(true);
    setErrorMessage("");

    try {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          slug,
          category,
          description,
          price,
          image,
          featured,
          badge
        `)
        .order("featured", {
          ascending: false,
        })
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(
          "Products loading error:",
          error
        );

        throw new Error(
          error.message ||
            "Unable to load products."
        );
      }

      setProducts((data as Product[]) || []);
    } catch (error) {
      console.error(
        "Products loading failed:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load products."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
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

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(
        products
          .map((product) =>
            product.category?.trim()
          )
          .filter(Boolean)
      )
    );

    return ["All", ...uniqueCategories];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !searchValue ||
        product.name
          .toLowerCase()
          .includes(searchValue) ||
        product.description
          .toLowerCase()
          .includes(searchValue) ||
        product.category
          .toLowerCase()
          .includes(searchValue);

      const matchesCategory =
        categoryFilter === "All" ||
        product.category === categoryFilter;

      return (
        matchesSearch &&
        matchesCategory
      );
    });
  }, [
    products,
    search,
    categoryFilter,
  ]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7eee9] px-6 py-12 text-[#2d2424]">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[30px] bg-[#fff8f5] p-16 text-center shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff]">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#f1d8d1] border-t-[#e8a0ad]" />

            <p className="mt-5 text-sm font-bold text-[#806e6e]">
              Loading delicious products...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7eee9] px-6 py-10 text-[#2d2424]">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <header className="text-center">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#c97888]">
            Doughy
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            Our Delicious Donuts 🍩
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-[#806e6e]">
            Freshly made treats with delicious
            flavors for every craving.
          </p>
        </header>

        {/* SEARCH + FILTER */}

        <section className="mt-10 rounded-[30px] bg-[#fff8f5] p-6 shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff]">

          <div className="grid gap-5 lg:grid-cols-[1fr_auto]">

            <div>
              <label
                htmlFor="product-search"
                className="mb-2 block text-sm font-bold"
              >
                Search Products
              </label>

              <input
                id="product-search"
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search donuts..."
                className="w-full rounded-2xl border border-[#ead8d0] bg-[#f9ebe2] px-4 py-3 outline-none transition placeholder:text-[#b9a3a3] focus:border-[#e8a0ad] focus:ring-2 focus:ring-[#e8a0ad]/20"
              />
            </div>

            <div className="lg:min-w-[220px]">
              <label
                htmlFor="category-filter"
                className="mb-2 block text-sm font-bold"
              >
                Category
              </label>

              <select
                id="category-filter"
                value={categoryFilter}
                onChange={(event) =>
                  setCategoryFilter(
                    event.target.value
                  )
                }
                className="w-full rounded-2xl border border-[#ead8d0] bg-[#f9ebe2] px-4 py-3 outline-none transition focus:border-[#e8a0ad] focus:ring-2 focus:ring-[#e8a0ad]/20"
              >
                {categories.map(
                  (category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category === "All"
                        ? "All Categories"
                        : category}
                    </option>
                  )
                )}
              </select>
            </div>

          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <p className="text-sm text-[#806e6e]">
              Showing{" "}
              <span className="font-black text-[#2d2424]">
                {filteredProducts.length}
              </span>{" "}
              of{" "}
              <span className="font-black text-[#2d2424]">
                {products.length}
              </span>{" "}
              products
            </p>

            {(search ||
              categoryFilter !== "All") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategoryFilter(
                    "All"
                  );
                }}
                className="text-sm font-bold text-[#c97888] transition hover:text-[#a85f70]"
              >
                Clear Filters
              </button>
            )}

          </div>

        </section>

        {/* ERROR */}

        {errorMessage && (
          <div className="mt-8 rounded-[24px] border border-[#efb9c1] bg-[#fce4e7] px-5 py-4 text-sm text-[#a84f61]">
            <p className="font-black">
              Something went wrong
            </p>

            <p className="mt-1">
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={loadProducts}
              className="mt-4 rounded-full bg-[#e8a0ad] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#d88a9a]"
            >
              Try Again
            </button>
          </div>
        )}

        {/* PRODUCTS */}

        {filteredProducts.length === 0 ? (
          <section className="mt-8 rounded-[30px] bg-[#fff8f5] p-16 text-center shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff]">

            <div className="text-6xl">
              🍩
            </div>

            <h2 className="mt-5 text-2xl font-black">
              No products found
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-[#806e6e]">
              We couldn't find any products
              matching your search.
            </p>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCategoryFilter(
                  "All"
                );
              }}
              className="mt-6 rounded-full bg-[#e8a0ad] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#d88a9a]"
            >
              View All Products
            </button>

          </section>
        ) : (
          <section className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

            {filteredProducts.map(
              (product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="group overflow-hidden rounded-[30px] bg-[#fff8f5] shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff] transition duration-300 hover:-translate-y-1"
                >

                  {/* IMAGE */}

                  <div className="relative overflow-hidden bg-[#f9ebe2]">

                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-64 w-full object-cover transition duration-500 group-hover:scale-105"
                      onError={(event) => {
                        event.currentTarget.src =
                          "https://placehold.co/600x600/f9ebe2/806e6e?text=Doughy";
                      }}
                    />

                    {product.badge && (
                      <span className="absolute left-4 top-4 rounded-full bg-[#e8a0ad] px-3 py-2 text-xs font-black text-white shadow-md">
                        {product.badge}
                      </span>
                    )}

                    {product.featured &&
                      !product.badge && (
                        <span className="absolute left-4 top-4 rounded-full bg-[#fff8f5] px-3 py-2 text-xs font-black text-[#c97888] shadow-md">
                          Featured
                        </span>
                      )}

                  </div>

                  {/* CONTENT */}

                  <div className="p-6">

                    <div className="flex items-start justify-between gap-3">

                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#c97888]">
                          {product.category}
                        </p>

                        <h2 className="mt-2 text-xl font-black transition group-hover:text-[#c97888]">
                          {product.name}
                        </h2>
                      </div>

                    </div>

                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#806e6e]">
                      {product.description}
                    </p>

                    <div className="mt-6 flex items-center justify-between">

                      <p className="text-xl font-black text-[#c97888]">
                        ₱
                        {formatCurrency(
                          product.price
                        )}
                      </p>

                      <span className="rounded-full bg-[#f9ebe2] px-4 py-2 text-xs font-black text-[#806e6e] transition group-hover:bg-[#e8a0ad] group-hover:text-white">
                        View Product
                      </span>

                    </div>

                  </div>

                </Link>
              )
            )}

          </section>
        )}

        {/* FOOTER */}

        <div className="mt-12 text-center">
          <Link
            href="/"
            className="text-sm font-bold text-[#c97888] transition hover:text-[#a85f70]"
          >
            ← Back to Home
          </Link>
        </div>

      </div>
    </main>
  );
}