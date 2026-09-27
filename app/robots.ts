import type { MetadataRoute } from "next";

const BASE_URL =
  "https://doughy-donut-store.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/checkout/",
          "/order-success/",
          "/orders/",
        ],
      },
    ],

    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}