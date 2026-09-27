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

export default function EditProductPage() {
  const params = useParams();

  const productId = Number(params.id);

  const [product, setProduct] =
    useState<Product | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    category: "",
    description: "",
    price: "",
    image: "",
    badge: "",
    featured: false,
  });

  /*
   * =========================================
   * LOAD PRODUCT
   * =========================================
   */

  async function loadProduct() {
    setLoading(true);
    setErrorMessage("");

    try {
      if (!productId || Number.isNaN(productId)) {
        throw new Error("Invalid product ID.");
      }

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
          badge,
          created_at,
          updated_at
        `)
        .eq("id", productId)
        .single();

      if (error) {
        console.error(
          "Error loading product:",
          error
        );

        throw new Error(
          error.message ||
            "Unable to load product."
        );
      }

      if (!data) {
        throw new Error(
          "Product not found."
        );
      }

      const productData =
        data as Product;

      setProduct(productData);

      setFormData({
        name: productData.name || "",
        slug: productData.slug || "",
        category:
          productData.category || "",
        description:
          productData.description || "",
        price:
          String(productData.price ?? ""),
        image: productData.image || "",
        badge: productData.badge || "",
        featured:
          productData.featured || false,
      });
    } catch (error) {
      console.error(
        "Product loading failed:",
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

  useEffect(() => {
    loadProduct();
  }, [productId]);

  /*
   * =========================================
   * HANDLE INPUT
   * =========================================
   */

  function handleChange(
    event: React.ChangeEvent<
      HTMLInputElement |
        HTMLTextAreaElement |
        HTMLSelectElement
    >
  ) {
    const { name, value } =
      event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setErrorMessage("");
  }

  /*
   * =========================================
   * FEATURED
   * =========================================
   */

  function handleFeaturedChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    setFormData((current) => ({
      ...current,
      featured: event.target.checked,
    }));

    setErrorMessage("");
  }

  /*
   * =========================================
   * SUBMIT
   * =========================================
   */

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setErrorMessage("");

    const name =
      formData.name.trim();

    const slug =
      formData.slug.trim();

    const category =
      formData.category.trim();

    const description =
      formData.description.trim();

    const image =
      formData.image.trim();

    const badge =
      formData.badge.trim();

    const price =
      Number(formData.price);

    /*
     * VALIDATION
     */

    if (!name) {
      setErrorMessage(
        "Please enter a product name."
      );
      return;
    }

    if (!slug) {
      setErrorMessage(
        "Please enter a product slug."
      );
      return;
    }

    if (!category) {
      setErrorMessage(
        "Please enter a product category."
      );
      return;
    }

    if (!description) {
      setErrorMessage(
        "Please enter a product description."
      );
      return;
    }

    if (!formData.price) {
      setErrorMessage(
        "Please enter a product price."
      );
      return;
    }

    if (
      Number.isNaN(price) ||
      price < 0
    ) {
      setErrorMessage(
        "Please enter a valid product price."
      );
      return;
    }

    if (!image) {
      setErrorMessage(
        "Please enter a product image URL."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } =
        await supabase
          .from("products")
          .update({
            name,
            slug,
            category,
            description,
            price,
            image,
            featured:
              formData.featured,
            badge: badge || null,
            updated_at:
              new Date().toISOString(),
          })
          .eq("id", productId)
          .select()
          .single();

      if (error) {
        console.error(
          "Product update error:",
          error
        );

        throw new Error(
          [
            error.message,
            error.details,
            error.hint,
            error.code
              ? `Code: ${error.code}`
              : "",
          ]
            .filter(Boolean)
            .join(" | ") ||
            "Unable to update product."
        );
      }

      setProduct(data as Product);

      window.location.href =
        "/admin/products";
    } catch (error) {
      console.error(
        "Product update failed:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update product. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  /*
   * =========================================
   * LOADING
   * =========================================
   */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7eee9] px-6 py-10 text-[#2d2424]">
        <div className="mx-auto max-w-4xl">

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
   * PAGE
   * =========================================
   */

  return (
    <main className="min-h-screen bg-[#f7eee9] px-6 py-10 text-[#2d2424]">

      <div className="mx-auto max-w-4xl">

        {/* HEADER */}

        <div>
          <Link
            href="/admin/products"
            className="text-sm font-bold text-[#c97888] transition hover:text-[#a85f70]"
          >
            ← Back to Products
          </Link>

          <p className="mt-8 text-sm font-bold uppercase tracking-[0.25em] text-[#c97888]">
            Doughy Admin
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            Edit Product
          </h1>

          <p className="mt-3 text-[#806e6e]">
            Update your Doughy product
            information.
          </p>
        </div>

        {/* ERROR */}

        {errorMessage && (
          <div className="mt-8 rounded-[20px] border border-[#efb9c1] bg-[#fce4e7] px-5 py-4 text-sm font-semibold text-[#a84f61]">

            <p className="font-black">
              Something went wrong
            </p>

            <p className="mt-1 break-words font-medium">
              {errorMessage}
            </p>

          </div>
        )}

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-7"
        >

          {/* BASIC INFORMATION */}

          <section className="rounded-[30px] bg-[#fff8f5] p-6 shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff] sm:p-8">

            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-[#c97888]">
                Product Information
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Basic Details
              </h2>
            </div>

            <div className="mt-7 space-y-5">

              {/* NAME */}

              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-bold"
                >
                  Product Name
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full rounded-2xl border border-[#ead8d0] bg-[#f9ebe2] px-4 py-3 outline-none transition placeholder:text-[#b9a3a3] focus:border-[#e8a0ad] focus:ring-2 focus:ring-[#e8a0ad]/20 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              {/* SLUG */}

              <div>
                <label
                  htmlFor="slug"
                  className="mb-2 block text-sm font-bold"
                >
                  Slug
                </label>

                <input
                  id="slug"
                  name="slug"
                  type="text"
                  required
                  value={formData.slug}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full rounded-2xl border border-[#ead8d0] bg-[#f9ebe2] px-4 py-3 outline-none transition placeholder:text-[#b9a3a3] focus:border-[#e8a0ad] focus:ring-2 focus:ring-[#e8a0ad]/20 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <p className="mt-2 text-xs text-[#a58f8f]">
                  Example:
                  chocolate-glazed-donut
                </p>
              </div>

              {/* CATEGORY */}

              <div>
                <label
                  htmlFor="category"
                  className="mb-2 block text-sm font-bold"
                >
                  Category
                </label>

                <input
                  id="category"
                  name="category"
                  type="text"
                  required
                  value={formData.category}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full rounded-2xl border border-[#ead8d0] bg-[#f9ebe2] px-4 py-3 outline-none transition placeholder:text-[#b9a3a3] focus:border-[#e8a0ad] focus:ring-2 focus:ring-[#e8a0ad]/20 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              {/* DESCRIPTION */}

              <div>
                <label
                  htmlFor="description"
                  className="mb-2 block text-sm font-bold"
                >
                  Description
                </label>

                <textarea
                  id="description"
                  name="description"
                  required
                  rows={5}
                  value={
                    formData.description
                  }
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full resize-none rounded-2xl border border-[#ead8d0] bg-[#f9ebe2] px-4 py-3 outline-none transition placeholder:text-[#b9a3a3] focus:border-[#e8a0ad] focus:ring-2 focus:ring-[#e8a0ad]/20 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

            </div>
          </section>

          {/* PRICE & IMAGE */}

          <section className="rounded-[30px] bg-[#fff8f5] p-6 shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff] sm:p-8">

            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-[#c97888]">
                Product Details
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Pricing & Image
              </h2>
            </div>

            <div className="mt-7 space-y-5">

              {/* PRICE */}

              <div>
                <label
                  htmlFor="price"
                  className="mb-2 block text-sm font-bold"
                >
                  Price
                </label>

                <div className="relative">

                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[#806e6e]">
                    ₱
                  </span>

                  <input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className="w-full rounded-2xl border border-[#ead8d0] bg-[#f9ebe2] px-4 py-3 pl-10 outline-none transition placeholder:text-[#b9a3a3] focus:border-[#e8a0ad] focus:ring-2 focus:ring-[#e8a0ad]/20 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                </div>
              </div>

              {/* IMAGE */}

              <div>
                <label
                  htmlFor="image"
                  className="mb-2 block text-sm font-bold"
                >
                  Product Image URL
                </label>

                <input
                  id="image"
                  name="image"
                  type="url"
                  required
                  value={formData.image}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full rounded-2xl border border-[#ead8d0] bg-[#f9ebe2] px-4 py-3 outline-none transition placeholder:text-[#b9a3a3] focus:border-[#e8a0ad] focus:ring-2 focus:ring-[#e8a0ad]/20 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <p className="mt-2 text-xs text-[#a58f8f]">
                  Paste a publicly accessible
                  image URL.
                </p>
              </div>

              {/* IMAGE PREVIEW */}

              {formData.image && (
                <div className="overflow-hidden rounded-[24px] bg-[#f9ebe2] p-4">

                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                    Image Preview
                  </p>

                  <div className="flex justify-center">

                    <img
                      src={formData.image}
                      alt={
                        formData.name ||
                        "Product preview"
                      }
                      className="h-56 w-full max-w-md rounded-2xl object-cover"
                      onError={(
                        event
                      ) => {
                        event.currentTarget.style.display =
                          "none";
                      }}
                    />

                  </div>

                </div>
              )}

            </div>
          </section>

          {/* STOREFRONT */}

          <section className="rounded-[30px] bg-[#fff8f5] p-6 shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff] sm:p-8">

            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-[#c97888]">
                Storefront
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Visibility
              </h2>
            </div>

            <div className="mt-7 space-y-6">

              {/* BADGE */}

              <div>
                <label
                  htmlFor="badge"
                  className="mb-2 block text-sm font-bold"
                >
                  Badge
                  <span className="ml-2 font-normal text-[#b9a3a3]">
                    Optional
                  </span>
                </label>

                <input
                  id="badge"
                  name="badge"
                  type="text"
                  value={formData.badge}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  placeholder="e.g. Best Seller, New, Popular"
                  className="w-full rounded-2xl border border-[#ead8d0] bg-[#f9ebe2] px-4 py-3 outline-none transition placeholder:text-[#b9a3a3] focus:border-[#e8a0ad] focus:ring-2 focus:ring-[#e8a0ad]/20 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              {/* FEATURED */}

              <label className="flex cursor-pointer items-start gap-4 rounded-2xl bg-[#f9ebe2] p-5">

                <input
                  type="checkbox"
                  checked={
                    formData.featured
                  }
                  onChange={
                    handleFeaturedChange
                  }
                  disabled={isSubmitting}
                  className="mt-1 h-5 w-5 accent-[#e8a0ad]"
                />

                <div>

                  <p className="font-black">
                    Featured Product
                  </p>

                  <p className="mt-1 text-sm leading-6 text-[#806e6e]">
                    Show this product in
                    the featured products
                    section of your store.
                  </p>

                </div>

              </label>

            </div>
          </section>

          {/* ACTIONS */}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

            <Link
              href="/admin/products"
              className="rounded-full bg-[#f9ebe2] px-7 py-4 text-center text-sm font-bold text-[#806e6e] shadow-[5px_5px_12px_#d8c5c0,-4px_-4px_10px_#ffffff] transition hover:-translate-y-0.5"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-[#e8a0ad] px-8 py-4 text-sm font-bold text-white shadow-[5px_5px_12px_#d8c5c0,-4px_-4px_10px_#ffffff] transition hover:-translate-y-0.5 hover:bg-[#d88a9a] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? "Updating Product..."
                : "Update Product 🍩"}
            </button>

          </div>

        </form>

      </div>
    </main>
  );
}