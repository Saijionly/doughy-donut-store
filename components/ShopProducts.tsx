"use client";

import { useEffect, useMemo, useState } from "react";

import ProductCard from "@/components/ProductCard";
import type { Product } from "@/data/products";
import { supabase } from "@/lib/supabase";

export default function ShopProducts() {
  const [products, setProducts] = useState<Product[]>([]);

  const [selectedCategory, setSelectedCategory] =
    useState("All");

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("id", {
          ascending: true,
        });

      if (error) {
        console.error(
          "Error loading products:",
          error
        );

        setLoading(false);
        return;
      }

      setProducts(data || []);
      setLoading(false);
    }

    fetchProducts();
  }, []);

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(
        products.map(
          (product) => product.category
        )
      )
    );

    return ["All", ...uniqueCategories];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === "All" ||
        product.category === selectedCategory;

      const searchTerm = search
        .toLowerCase()
        .trim();

      const matchesSearch =
        product.name
          .toLowerCase()
          .includes(searchTerm) ||
        product.description
          .toLowerCase()
          .includes(searchTerm);

      return (
        matchesCategory &&
        matchesSearch
      );
    });
  }, [
    products,
    selectedCategory,
    search,
  ]);

  return (
    <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-10">

      {/* Controls */}
      <div className="rounded-[32px] bg-[#fff8f5] p-5 shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_20px_#ffffff]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          {/* Search */}
          <div className="relative w-full lg:max-w-md">
            <input
              type="text"
              placeholder="Search donuts, cakes..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              className="w-full rounded-full bg-[#f9ebe2] px-5 py-3.5 pr-12 text-sm outline-none shadow-[inset_4px_4px_10px_#d8c5c0,inset_-4px_-4px_10px_#ffffff] placeholder:text-[#a58f8f] focus:ring-2 focus:ring-[#e8a0ad]"
            />

            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-lg">
              🔎
            </span>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const isActive =
                selectedCategory === category;

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() =>
                    setSelectedCategory(category)
                  }
                  className={`rounded-full px-5 py-2.5 text-sm font-bold transition ${
                    isActive
                      ? "bg-[#e8a0ad] text-white shadow-md"
                      : "bg-[#f9ebe2] text-[#806e6e] hover:bg-[#f2ded7]"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="mt-10 rounded-[36px] bg-[#fff8f5] px-6 py-20 text-center shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_20px_#ffffff]">
          <div className="text-6xl">
            🍩
          </div>

          <p className="mt-5 font-bold text-[#806e6e]">
            Loading products...
          </p>
        </div>
      )}

      {/* Results */}
      {!loading && (
        <>
          <div className="mt-10">
            <p className="text-sm font-semibold text-[#806e6e]">
              Showing{" "}
              <span className="font-black text-[#2d2424]">
                {filteredProducts.length}
              </span>{" "}
              products
            </p>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map(
                (product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                  />
                )
              )}
            </div>
          ) : (
            <div className="mt-6 rounded-[36px] bg-[#fff8f5] px-6 py-20 text-center shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_20px_#ffffff]">
              <div className="text-6xl">
                🍩
              </div>

              <h2 className="mt-5 text-2xl font-black">
                No treats found
              </h2>

              <p className="mt-2 text-sm text-[#806e6e]">
                Try searching for another
                dessert or category.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("All");
                }}
                className="mt-6 rounded-full bg-[#e8a0ad] px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#d88a9a]"
              >
                Reset Filters
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}