import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";

type ProductLayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    slug: string;
  }>;
};

function getSupabase() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function generateMetadata({
  params,
}: ProductLayoutProps): Promise<Metadata> {
  const { slug } = await params;

  const supabase = getSupabase();

  /*
  ========================================
  FALLBACK METADATA
  ========================================
  */

  const fallbackTitle = slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );

  if (!supabase) {
    return {
      title: fallbackTitle,

      description:
        "Discover this delicious treat from Doughy.",

      robots: {
        index: false,
        follow: true,
      },
    };
  }

  /*
  ========================================
  FIND PRODUCT BY SLUG
  ========================================
  */

  let product = null;

  const {
    data: slugProduct,
    error: slugError,
  } = await supabase
    .from("products")
    .select(
      "id, name, slug, description, image, category, price"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!slugError && slugProduct) {
    product = slugProduct;
  }

  /*
  ========================================
  FALLBACK: FIND BY ID
  ========================================
  */

  if (!product) {
    const numericId = Number(slug);

    if (Number.isFinite(numericId)) {
      const {
        data: idProduct,
      } = await supabase
        .from("products")
        .select(
          "id, name, slug, description, image, category, price"
        )
        .eq("id", numericId)
        .maybeSingle();

      if (idProduct) {
        product = idProduct;
      }
    }
  }

  /*
  ========================================
  PRODUCT NOT FOUND
  ========================================
  */

  if (!product) {
    return {
      title: "Product Not Found",

      description:
        "The requested Doughy product could not be found.",

      robots: {
        index: false,
        follow: true,
      },
    };
  }

  /*
  ========================================
  PRODUCT METADATA
  ========================================
  */

  const description =
    product.description?.trim() ||
    `Discover ${product.name}, a freshly prepared sweet treat from Doughy.`;

  const canonicalSlug =
    product.slug || product.id;

  return {
    title: product.name,

    description,

    alternates: {
      canonical: `/shop/${canonicalSlug}`,
    },

    openGraph: {
      title: `${product.name} | Doughy`,
      description,
      url: `/shop/${canonicalSlug}`,
      type: "website",

      images: product.image
        ? [
            {
              url: product.image,
              alt: product.name,
            },
          ]
        : undefined,
    },

    twitter: {
      card: "summary_large_image",
      title: `${product.name} | Doughy`,
      description,

      images: product.image
        ? [product.image]
        : undefined,
    },
  };
}

export default function ProductLayout({
  children,
}: ProductLayoutProps) {
  return children;
}