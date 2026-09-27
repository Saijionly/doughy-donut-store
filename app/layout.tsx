import type { Metadata } from "next";
import "./globals.css";

import Providers from "./providers";
import { StoreSettingsProvider } from "@/app/context/StoreSettingsContext";

const BASE_URL =
  "https://doughy-donut-store.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    default: "Doughy | Fresh Donuts & Sweet Treats",
    template: "%s | Doughy",
  },

  description:
    "Discover freshly made donuts, cakes, cupcakes, and sweet treats from Doughy. Browse our menu, place your order, and enjoy delicious desserts made with care.",

  keywords: [
    "Doughy",
    "donuts",
    "donut shop",
    "cakes",
    "cupcakes",
    "desserts",
    "sweet treats",
    "pastries",
    "online donut shop",
    "Philippines",
  ],

  authors: [
    {
      name: "Doughy",
    },
  ],

  creator: "Doughy",
  publisher: "Doughy",

  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  openGraph: {
    title: "Doughy | Fresh Donuts & Sweet Treats",
    description:
      "Discover freshly made donuts, cakes, cupcakes, and sweet treats from Doughy.",
    url: BASE_URL,
    siteName: "Doughy",
    locale: "en_PH",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Doughy | Fresh Donuts & Sweet Treats",
    description:
      "Freshly made donuts, cakes, cupcakes, and sweet treats from Doughy.",
  },

  robots: {
    index: true,
    follow: true,

    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  icons: {
  icon: [
    {
      url: "/doughy-icon.png",
      type: "image/png",
    },
  ],
  shortcut: "/doughy-icon.png",
  apple: "/doughy-icon.png",
},
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <StoreSettingsProvider>
          <Providers>
            {children}
          </Providers>
        </StoreSettingsProvider>
      </body>
    </html>
  );
}