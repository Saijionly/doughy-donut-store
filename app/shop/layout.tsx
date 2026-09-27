import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop",

  description:
    "Browse Doughy's collection of freshly made donuts, cakes, cupcakes, and sweet treats. Find your favorite and order online.",

  alternates: {
    canonical: "/shop",
  },

  openGraph: {
    title: "Shop Fresh Donuts & Sweet Treats | Doughy",
    description:
      "Browse freshly made donuts, cakes, cupcakes, and sweet treats from Doughy.",
    url: "/shop",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Shop Fresh Donuts & Sweet Treats | Doughy",
    description:
      "Browse freshly made donuts, cakes, cupcakes, and sweet treats from Doughy.",
  },
};

export default function ShopLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}