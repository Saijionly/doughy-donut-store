"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useParams } from "next/navigation";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StoreStatusBanner from "@/components/StoreStatusBanner";
import { useCart } from "@/app/context/CartContext";
import { useStoreSettings } from "@/app/context/StoreSettingsContext";
import { supabase } from "@/lib/supabase";

type Product = {
  id: number;
  name: string;
  slug: string | null;
  category: string | null;
  description: string | null;
  price: number;
  image: string;
  featured?: boolean | null;
  badge?: string | null;
};

export default function PublicProductPage() {
  const params = useParams();

  const routeValue =
    String(params.id || "");

  const { addToCart } =
    useCart();

  const {
    settings,
    loading: settingsLoading,
  } = useStoreSettings();

  const [product, setProduct] =
    useState<Product | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [quantity, setQuantity] =
    useState(1);

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      setErrorMessage("");

      try {
        const numericId =
          Number(routeValue);

        let query = supabase
          .from("products")
          .select(
            "id, name, slug, category, description, price, image, featured, badge"
          );

        if (
          Number.isInteger(numericId) &&
          numericId > 0 &&
          String(numericId) ===
            routeValue
        ) {
          query =
            query.eq(
              "id",
              numericId
            );
        } else {
          query =
            query.eq(
              "slug",
              routeValue
            );
        }

        const {
          data,
          error,
        } = await query
          .maybeSingle();

        if (error) {
          throw error;
        }

        setProduct(
          data as Product | null
        );
      } catch (error) {
        console.warn(
          "Public product loading failed:",
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

    if (routeValue) {
      loadProduct();
    }
  }, [routeValue]);

  const storeClosed =
    !settingsLoading &&
    !settings.store_open;

  const canAddToCart =
    Boolean(product) &&
    !loading &&
    !settingsLoading &&
    settings.store_open;

  const totalPrice =
    useMemo(
      () =>
        Number(
          product?.price || 0
        ) * quantity,
      [product, quantity]
    );

  function handleAddToCart() {
    if (
      !product ||
      !canAddToCart
    ) {
      return;
    }

    for (
      let index = 0;
      index < quantity;
      index += 1
    ) {
      addToCart(
        product as never
      );
    }
  }

  function formatCurrency(
    value: number
  ) {
    return Number(
      value || 0
    ).toLocaleString(
      "en-PH",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7eee9] text-[#2d2424]">
        <Navbar />
        <StoreStatusBanner />

        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="rounded-[36px] bg-[#fff8f5] p-16 text-center shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff]">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#ead8d0] border-t-[#e8a0ad]" />

            <p className="mt-5 font-bold text-[#806e6e]">
              Loading product...
            </p>
          </div>
        </div>

        <Footer />
      </main>
    );
  }

  if (
    !product ||
    errorMessage
  ) {
    return (
      <main className="min-h-screen bg-[#f7eee9] text-[#2d2424]">
        <Navbar />
        <StoreStatusBanner />

        <section className="flex min-h-[65vh] items-center justify-center px-6">
          <div className="text-center">
            <div className="text-7xl">
              🍩
            </div>

            <h1 className="mt-6 text-3xl font-black">
              Product not found
            </h1>

            <p className="mt-3 text-[#806e6e]">
              {errorMessage ||
                "Sorry, we couldn't find that sweet treat."}
            </p>

            <Link
              href="/products"
              className="mt-7 inline-flex rounded-full bg-[#e8a0ad] px-7 py-3 text-sm font-black text-white transition hover:bg-[#d88a9a]"
            >
              ← Back to Products
            </Link>
          </div>
        </section>

        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7eee9] text-[#2d2424]">
      <Navbar />
      <StoreStatusBanner />

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-10 lg:py-20">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-sm font-black text-[#c97888] transition hover:text-[#a85f70]"
        >
          ← Back to Products
        </Link>

        <div className="mt-10 grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="relative overflow-hidden rounded-[42px] bg-[#fff8f5] p-5 shadow-[12px_12px_25px_#d8c5c0,-10px_-10px_22px_#ffffff]">
            {product.badge && (
              <div className="absolute left-9 top-9 z-10 rounded-full bg-[#e8a0ad] px-5 py-2.5 text-sm font-bold text-white shadow-md">
                {product.badge}
              </div>
            )}

            {storeClosed && (
              <div className="absolute right-9 top-9 z-10 rounded-full bg-[#a84f61] px-5 py-2.5 text-sm font-black text-white shadow-md">
                Store Closed
              </div>
            )}

            <div className="relative aspect-square overflow-hidden rounded-[34px] bg-[#f9ebe2]">
              <Image
                src={product.image}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>

          <div>
            {product.category && (
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#c97888]">
                {product.category}
              </p>
            )}

            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
              {product.name}
            </h1>

            <p className="mt-5 text-3xl font-black text-[#c97888]">
              ₱
              {formatCurrency(
                Number(product.price)
              )}
            </p>

            {product.description && (
              <p className="mt-6 max-w-xl text-base leading-8 text-[#806e6e]">
                {product.description}
              </p>
            )}

            {storeClosed && (
              <div className="mt-7 rounded-[22px] border border-[#efb9c1] bg-[#fce4e7] p-5">
                <p className="font-black text-[#a84f61]">
                  🔒 Ordering is
                  temporarily unavailable
                </p>

                <p className="mt-2 text-sm leading-6 text-[#9b6670]">
                  The store is currently
                  closed. You can continue
                  browsing and come back
                  when ordering reopens.
                </p>
              </div>
            )}

            <div className="mt-8">
              <p className="text-sm font-black">
                Quantity
              </p>

              <div className="mt-3 flex w-fit items-center overflow-hidden rounded-full bg-[#fff8f5] shadow-[5px_5px_12px_#d8c5c0,-4px_-4px_10px_#ffffff]">
                <button
                  type="button"
                  onClick={() =>
                    setQuantity(
                      (current) =>
                        Math.max(
                          1,
                          current - 1
                        )
                    )
                  }
                  disabled={
                    storeClosed
                  }
                  className="h-12 w-12 text-lg font-black disabled:cursor-not-allowed disabled:opacity-40"
                >
                  −
                </button>

                <span className="min-w-12 text-center font-black">
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setQuantity(
                      (current) =>
                        Math.min(
                          99,
                          current + 1
                        )
                    )
                  }
                  disabled={
                    storeClosed
                  }
                  className="h-12 w-12 text-lg font-black disabled:cursor-not-allowed disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={
                !canAddToCart
              }
              className={`mt-8 w-full max-w-md rounded-full px-8 py-4 text-sm font-black shadow-[5px_5px_12px_#d8c5c0,-4px_-4px_10px_#ffffff] transition ${
                canAddToCart
                  ? "bg-[#e8a0ad] text-white hover:-translate-y-0.5 hover:bg-[#d88a9a]"
                  : "cursor-not-allowed bg-[#d8c5c0] text-[#806e6e] opacity-80"
              }`}
            >
              {settingsLoading
                ? "Checking Store..."
                : storeClosed
                  ? "Store Closed"
                  : `Add ${quantity} to Cart · ₱${formatCurrency(
                      totalPrice
                    )}`}
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
