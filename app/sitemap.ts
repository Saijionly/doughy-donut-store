import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

type ProductRow = {
  id: number;
  slug: string | null;
  updated_at?: string | null;
  created_at?: string | null;
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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    "https://your-domain.com";

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },

    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },

    {
      url: `${baseUrl}/track-order`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  const supabase = getSupabase();

  if (!supabase) {
    return staticPages;
  }

  try {
    const { data, error } =
      await supabase
        .from("products")
        .select(
          "id, slug, created_at"
        )
        .order("created_at", {
          ascending: false,
        });

    if (error) {
      console.error(
        "Sitemap products error:",
        error
      );

      return staticPages;
    }

    const products =
      (data || []) as ProductRow[];

    const productPages: MetadataRoute.Sitemap =
      products.map((product) => {
        const identifier =
          product.slug || product.id;

        return {
          url: `${baseUrl}/shop/${identifier}`,

          lastModified:
            product.updated_at ||
            product.created_at ||
            new Date(),

          changeFrequency:
            "weekly",

          priority: 0.8,
        };
      });

    return [
      ...staticPages,
      ...productPages,
    ];
  } catch (error) {
    console.error(
      "Unable to generate sitemap:",
      error
    );

    return staticPages;
  }
}