"use client";

import Link from "next/link";
import { useState } from "react";

import { supabase } from "@/lib/supabase";

export default function NewProductPage() {
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    category: "",
    description: "",
    price: "",
    badge: "",
    featured: false,
  });

  const [imageFile, setImageFile] =
    useState<File | null>(null);

  const [imagePreview, setImagePreview] =
    useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  function handleNameChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const name = event.target.value;

    setFormData((current) => ({
      ...current,
      name,
      slug: generateSlug(name),
    }));

    setErrorMessage("");
  }

  function handleChange(
    event: React.ChangeEvent<
      HTMLInputElement |
        HTMLTextAreaElement |
        HTMLSelectElement
    >
  ) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setErrorMessage("");
  }

  function handleFeaturedChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    setFormData((current) => ({
      ...current,
      featured: event.target.checked,
    }));

    setErrorMessage("");
  }

  function handleImageChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0] || null;

    setErrorMessage("");

    if (!file) {
      setImageFile(null);
      setImagePreview("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrorMessage(
        "Please select a valid image file."
      );

      event.target.value = "";
      setImageFile(null);
      setImagePreview("");

      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage(
        "Image size must be 5MB or less."
      );

      event.target.value = "";
      setImageFile(null);
      setImagePreview("");

      return;
    }

    setImageFile(file);

    const previewUrl =
      URL.createObjectURL(file);

    setImagePreview(previewUrl);
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setErrorMessage("");

    const name = formData.name.trim();
    const slug = formData.slug.trim();
    const category =
      formData.category.trim();
    const description =
      formData.description.trim();
    const badge = formData.badge.trim();
    const price = Number(formData.price);

    /*
     * ==============================
     * VALIDATION
     * ==============================
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

    if (!imageFile) {
      setErrorMessage(
        "Please select a product image."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      /*
       * ==============================
       * CREATE UNIQUE FILE NAME
       * ==============================
       */

      const fileExtension =
        imageFile.name
          .split(".")
          .pop()
          ?.toLowerCase() || "jpg";

      const safeSlug =
        slug ||
        generateSlug(name);

      const fileName = `${safeSlug}-${Date.now()}.${fileExtension}`;

      const filePath = `products/${fileName}`;

      /*
       * ==============================
       * UPLOAD IMAGE
       * ==============================
       */

      const {
        error: uploadError,
      } = await supabase.storage
        .from("product-images")
        .upload(filePath, imageFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: imageFile.type,
        });

      if (uploadError) {
        console.error(
          "Product image upload error:",
          uploadError
        );

        throw new Error(
          uploadError.message ||
            "Unable to upload product image."
        );
      }

      /*
       * ==============================
       * GET PUBLIC IMAGE URL
       * ==============================
       */

      const {
        data: publicUrlData,
      } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      const imageUrl =
        publicUrlData.publicUrl;

      if (!imageUrl) {
        throw new Error(
          "Unable to generate product image URL."
        );
      }

      /*
       * ==============================
       * SAVE PRODUCT
       * ==============================
       */

      const {
        error: productError,
      } = await supabase
        .from("products")
        .insert({
          name,
          slug,
          category,
          description,
          price,
          image: imageUrl,
          featured: formData.featured,
          badge: badge || null,
        });

      if (productError) {
        console.error(
          "Product creation error:",
          productError
        );

        /*
         * ==============================
         * DELETE UPLOADED IMAGE
         * IF PRODUCT INSERT FAILS
         * ==============================
         */

        await supabase.storage
          .from("product-images")
          .remove([filePath]);

        throw new Error(
          [
            productError.message,
            productError.details,
            productError.hint,
            productError.code
              ? `Code: ${productError.code}`
              : "",
          ]
            .filter(Boolean)
            .join(" | ") ||
            "Unable to create product."
        );
      }

      /*
       * ==============================
       * SUCCESS
       * ==============================
       */

      window.location.href =
        "/admin/products";
    } catch (error) {
      console.error(
        "Product creation failed:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to create product. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

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
            Add Product
          </h1>

          <p className="mt-3 text-[#806e6e]">
            Add a new delicious product to your
            Doughy store.
          </p>
        </div>

        {/* ERROR */}

        {errorMessage && (
          <div className="mt-8 rounded-[20px] border border-[#efb9c1] bg-[#fce4e7] px-5 py-4 text-sm font-semibold text-[#a84f61]">
            <p className="font-black">
              Unable to add product
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
                  onChange={handleNameChange}
                  placeholder="e.g. Chocolate Glazed Donut"
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
                  placeholder="chocolate-glazed-donut"
                  disabled={isSubmitting}
                  className="w-full rounded-2xl border border-[#ead8d0] bg-[#f9ebe2] px-4 py-3 outline-none transition placeholder:text-[#b9a3a3] focus:border-[#e8a0ad] focus:ring-2 focus:ring-[#e8a0ad]/20 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <p className="mt-2 text-xs text-[#a58f8f]">
                  This is automatically generated
                  from the product name.
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
                  placeholder="e.g. Classic, Premium, Filled"
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
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your delicious product..."
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
                    placeholder="0.00"
                    disabled={isSubmitting}
                    className="w-full rounded-2xl border border-[#ead8d0] bg-[#f9ebe2] px-4 py-3 pl-10 outline-none transition placeholder:text-[#b9a3a3] focus:border-[#e8a0ad] focus:ring-2 focus:ring-[#e8a0ad]/20 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              </div>

              {/* IMAGE UPLOAD */}

              <div>
                <label
                  htmlFor="image"
                  className="mb-2 block text-sm font-bold"
                >
                  Product Image
                </label>

                <input
                  id="image"
                  name="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={isSubmitting}
                  className="w-full cursor-pointer rounded-2xl border border-[#ead8d0] bg-[#f9ebe2] px-4 py-3 text-sm outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-[#e8a0ad] file:px-5 file:py-2.5 file:font-bold file:text-white hover:file:bg-[#d88a9a] disabled:cursor-not-allowed disabled:opacity-60"
                />

                <p className="mt-2 text-xs text-[#a58f8f]">
                  Upload JPG, PNG, WEBP, or another
                  image format. Maximum size: 5MB.
                </p>
              </div>

              {/* IMAGE PREVIEW */}

              {imagePreview && (
                <div className="overflow-hidden rounded-[24px] bg-[#f9ebe2] p-4">

                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#a58f8f]">
                      Image Preview
                    </p>

                    {imageFile && (
                      <p className="truncate text-xs font-semibold text-[#806e6e]">
                        {imageFile.name}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-center">
                    <img
                      src={imagePreview}
                      alt="Product preview"
                      className="h-64 w-full max-w-md rounded-2xl object-cover shadow-sm"
                    />
                  </div>

                </div>
              )}

            </div>
          </section>

          {/* MARKETING */}

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
                  placeholder="e.g. Best Seller, New, Popular"
                  disabled={isSubmitting}
                  className="w-full rounded-2xl border border-[#ead8d0] bg-[#f9ebe2] px-4 py-3 outline-none transition placeholder:text-[#b9a3a3] focus:border-[#e8a0ad] focus:ring-2 focus:ring-[#e8a0ad]/20 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              {/* FEATURED */}

              <label className="flex cursor-pointer items-start gap-4 rounded-2xl bg-[#f9ebe2] p-5">

                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={handleFeaturedChange}
                  disabled={isSubmitting}
                  className="mt-1 h-5 w-5 accent-[#e8a0ad]"
                />

                <div>
                  <p className="font-black">
                    Featured Product
                  </p>

                  <p className="mt-1 text-sm leading-6 text-[#806e6e]">
                    Show this product in the
                    featured products section
                    of your store.
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
                ? "Uploading & Saving..."
                : "Save Product 🍩"}
            </button>

          </div>

        </form>
      </div>
    </main>
  );
}