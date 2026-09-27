"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

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
  created_at: string;
  updated_at: string;
};

export default function ProductDetailsPage() {
  const params = useParams();

  const productValue = String(params.id || "");

  const [product, setProduct] =
    useState<Product | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      setErrorMessage("");

      try {
        if (!productValue) {
          throw new Error(
            "Product ID or slug is missing."
          );
        }

        let data: Product | null = null;
        let error = null;

        /*
         * =========================================
         * IF VALUE IS A NUMBER
         * Example:
         * /products/1
         * =========================================
         */

        if (/^\d+$/.test(productValue)) {
          const result = await supabase
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
              badge,
              created_at,
              updated_at
            `)
            .eq(
              "id",
              Number(productValue)
            )
            .maybeSingle();

          data = result.data as Product | null;
          error = result.error;
        }

        /*
         * =========================================
         * IF VALUE IS A SLUG
         * Example:
         * /products/boston-kreme
         * =========================================
         */

        else {
          const result = await supabase
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
              badge,
              created_at,
              updated_at
            `)
            .eq(
              "slug",
              productValue
            )
            .maybeSingle();

          data = result.data as Product | null;
          error = result.error;
        }

        /*
         * =========================================
         * SUPABASE ERROR
         * =========================================
         */

        if (error) {
          console.error(
            "Product loading error:",
            error
          );

          throw new Error(
            error.message ||
              "Unable to load product."
          );
        }

        /*
         * =========================================
         * PRODUCT NOT FOUND
         * =========================================
         */

        if (!data) {
          throw new Error(
            "Product not found."
          );
        }

        setProduct(data);
      } catch (error) {
        console.error(
          "Product details loading failed:",
          error
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load product."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [productValue]);

  /*
   * =========================================
   * FORMAT PRICE
   * =========================================
   */

  function formatCurrency(
    value: number
  ) {
    return Number(value || 0).toLocaleString(
      "en-PH",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
  }

  /*
   * =========================================
   * LOADING
   * =========================================
   */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7eee9] px-6 py-10 text-[#2d2424]">

        <div className="mx-auto max-w-5xl">

          <div className="rounded-[30px] bg-[#fff8f5] p-16 text-center shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff]">

            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#f1d8d1] border-t-[#e8a0ad]" />

            <p className="mt-5 text-sm font-bold text-[#806e6e]">
              Loading product...
            </p>

          </div>

        </div>

      </main>
    );
  }

  /*
   * =========================================
   * ERROR
   * =========================================
   */

  if (!product) {
    return (
      <main className="min-h-screen bg-[#f7eee9] px-6 py-10 text-[#2d2424]">

        <div className="mx-auto max-w-4xl">

          <div className="rounded-[30px] bg-[#fff8f5] p-10 text-center shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff] sm:p-16">

            <div className="text-6xl">
              🍩
            </div>

            <h1 className="mt-6 text-3xl font-black">
              Product Not Found
            </h1>

            <p className="mx-auto mt-3 max-w-lg text-[#806e6e]">
              {errorMessage ||
                "The product you are looking for does not exist."}
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">

              <Link
                href="/products"
                className="rounded-full bg-[#e8a0ad] px-7 py-4 text-center text-sm font-bold text-white shadow-[5px_5px_12px_#d8c5c0,-4px_-4px_10px_#ffffff] transition hover:-translate-y-0.5 hover:bg-[#d88a9a]"
              >
                ← Back to Products
              </Link>

              <Link
                href="/"
                className="rounded-full bg-[#f9ebe2] px-7 py-4 text-center text-sm font-bold text-[#806e6e] shadow-[5px_5px_12px_#d8c5c0,-4px_-4px_10px_#ffffff] transition hover:-translate-y-0.5"
              >
                Back to Home
              </Link>

            </div>

          </div>

        </div>

      </main>
    );
  }

  /*
   * =========================================
   * PRODUCT PAGE
   * =========================================
   */

  return (
    <main className="min-h-screen bg-[#f7eee9] px-6 py-10 text-[#2d2424]">

      <div className="mx-auto max-w-5xl">

        {/* BACK BUTTON */}

        <Link
          href="/products"
          className="inline-flex text-sm font-bold text-[#c97888] transition hover:text-[#a85f70]"
        >
          ← Back to Products
        </Link>

        {/* PRODUCT CARD */}

        <section className="mt-8 overflow-hidden rounded-[30px] bg-[#fff8f5] shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff]">

          <div className="grid lg:grid-cols-2">

            {/* IMAGE */}

            <div className="bg-[#f9ebe2] p-6 sm:p-10">

              <div className="overflow-hidden rounded-[28px] bg-white shadow-[6px_6px_14px_#d8c5c0,-4px_-4px_10px_#ffffff]">

                <img
                  src={product.image}
                  alt={product.name}
                  className="aspect-square w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.src =
                      "/placeholder.png";
                  }}
                />

              </div>

            </div>

            {/* DETAILS */}

            <div className="flex flex-col p-6 sm:p-10">

              {/* BADGE */}

              {product.badge && (
                <div>
                  <span className="inline-flex rounded-full bg-[#f4d5dc] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#c97888]">
                    {product.badge}
                  </span>
                </div>
              )}

              {/* CATEGORY */}

              <p className="mt-5 text-sm font-bold uppercase tracking-[0.2em] text-[#c97888]">
                {product.category}
              </p>

              {/* NAME */}

              <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
                {product.name}
              </h1>

              {/* PRICE */}

              <p className="mt-6 text-3xl font-black text-[#c97888]">
                ₱{formatCurrency(product.price)}
              </p>

              {/* DESCRIPTION */}

              <div className="mt-8">

                <p className="text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                  Description
                </p>

                <p className="mt-3 text-base leading-7 text-[#806e6e]">
                  {product.description}
                </p>

              </div>

              {/* FEATURED */}

              {product.featured && (
                <div className="mt-6 rounded-2xl bg-[#f9ebe2] px-5 py-4">

                  <p className="text-sm font-black text-[#806e6e]">
                    ⭐ Featured Product
                  </p>

                  <p className="mt-1 text-xs text-[#a58f8f]">
                    This product is currently
                    featured in our store.
                  </p>

                </div>
              )}

              {/* ACTIONS */}

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">

                <Link
                  href="/products"
                  className="flex-1 rounded-full bg-[#e8a0ad] px-7 py-4 text-center text-sm font-bold text-white shadow-[5px_5px_12px_#d8c5c0,-4px_-4px_10px_#ffffff] transition hover:-translate-y-0.5 hover:bg-[#d88a9a]"
                >
                  Continue Shopping
                </Link>

                <Link
                  href="/cart"
                  className="flex-1 rounded-full bg-[#f9ebe2] px-7 py-4 text-center text-sm font-bold text-[#806e6e] shadow-[5px_5px_12px_#d8c5c0,-4px_-4px_10px_#ffffff] transition hover:-translate-y-0.5"
                >
                  View Cart 🛒
                </Link>

              </div>

            </div>

          </div>

        </section>

      </div>

    </main>
  );
}