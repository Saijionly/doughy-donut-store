"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useRef,
  useState,
} from "react";

import { useCart } from "@/app/context/CartContext";
import { useStoreSettings } from "@/app/context/StoreSettingsContext";

type ProductCardProduct = {
  id: number | string;
  name: string;
  slug?: string | null;
  category?: string | null;
  description?: string | null;
  price: number;
  image: string;
  badge?: string | null;
  [key: string]: unknown;
};

type ProductCardProps = {
  product: ProductCardProduct;
};

export default function ProductCard({
  product,
}: ProductCardProps) {
  const { addToCart } = useCart();

  const {
    settings,
    loading: settingsLoading,
  } = useStoreSettings();

  const imageContainerRef =
    useRef<HTMLDivElement | null>(null);

  const [added, setAdded] =
    useState(false);

  const [animating, setAnimating] =
    useState(false);

  const storeClosed =
    !settingsLoading &&
    !settings.store_open;

  const productHref = `/shop/${
    product.slug || product.id
  }`;

  const formattedPrice = Number(
    product.price || 0
  ).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  /*
  ============================================
  MAGICAL PRODUCT TO CART ANIMATION
  ============================================
  */

  function animateProductToCart() {
    const imageContainer =
      imageContainerRef.current;

    const cartIcon =
      document.querySelector<HTMLElement>(
        "[data-cart-icon]"
      );

    if (
      !imageContainer ||
      !cartIcon
    ) {
      return Promise.resolve();
    }

    const imageRect =
      imageContainer.getBoundingClientRect();

    const cartRect =
      cartIcon.getBoundingClientRect();

    /*
    ============================================
    CREATE FLYING PRODUCT IMAGE
    ============================================
    */

    const flyingImage =
      document.createElement("img");

    flyingImage.src = product.image;
    flyingImage.alt = "";

    flyingImage.style.position =
      "fixed";

    flyingImage.style.left =
      `${imageRect.left}px`;

    flyingImage.style.top =
      `${imageRect.top}px`;

    flyingImage.style.width =
      `${imageRect.width}px`;

    flyingImage.style.height =
      `${imageRect.height}px`;

    flyingImage.style.objectFit =
      "cover";

    flyingImage.style.borderRadius =
      "28px";

    flyingImage.style.zIndex =
      "9999";

    flyingImage.style.pointerEvents =
      "none";

    flyingImage.style.boxShadow =
      "0 20px 50px rgba(201, 120, 136, 0.35)";

    flyingImage.style.willChange =
      "transform, opacity";

    document.body.appendChild(
      flyingImage
    );

    /*
    ============================================
    CALCULATE CART POSITION
    ============================================
    */

    const startCenterX =
      imageRect.left +
      imageRect.width / 2;

    const startCenterY =
      imageRect.top +
      imageRect.height / 2;

    const endCenterX =
      cartRect.left +
      cartRect.width / 2;

    const endCenterY =
      cartRect.top +
      cartRect.height / 2;

    const deltaX =
      endCenterX -
      startCenterX;

    const deltaY =
      endCenterY -
      startCenterY;

    /*
    ============================================
    SPARKLE TRAIL
    ============================================
    */

    const sparkleElements:
      HTMLDivElement[] = [];

    const sparkleTimer =
      window.setInterval(() => {
        const sparkle =
          document.createElement(
            "div"
          );

        const currentRect =
          flyingImage.getBoundingClientRect();

        const size =
          Math.random() * 7 + 4;

        sparkle.style.position =
          "fixed";

        sparkle.style.left = `${
          currentRect.left +
          currentRect.width / 2 +
          (Math.random() - 0.5) *
            38
        }px`;

        sparkle.style.top = `${
          currentRect.top +
          currentRect.height / 2 +
          (Math.random() - 0.5) *
            30
        }px`;

        sparkle.style.width =
          `${size}px`;

        sparkle.style.height =
          `${size}px`;

        sparkle.style.borderRadius =
          "9999px";

        /*
        Random white / pink sparkles
        */

        const sparkleColors = [
          "#ffffff",
          "#f8d6dd",
          "#f3b7c2",
          "#e8a0ad",
        ];

        sparkle.style.background =
          sparkleColors[
            Math.floor(
              Math.random() *
                sparkleColors.length
            )
          ];

        sparkle.style.boxShadow =
          "0 0 12px rgba(232,160,173,0.8)";

        sparkle.style.zIndex =
          "9998";

        sparkle.style.pointerEvents =
          "none";

        document.body.appendChild(
          sparkle
        );

        sparkleElements.push(
          sparkle
        );

        /*
        Sparkle floating animation
        */

        const sparkleAnimation =
          sparkle.animate(
            [
              {
                transform:
                  "translate(0px, 0px) scale(0.4)",
                opacity: 0,
              },

              {
                transform:
                  "translate(0px, -5px) scale(1)",
                opacity: 1,
                offset: 0.25,
              },

              {
                transform: `translate(${
                  (Math.random() -
                    0.5) *
                  24
                }px, -25px) scale(0.15)`,
                opacity: 0,
              },
            ],
            {
              duration: 600,
              easing: "ease-out",
              fill: "forwards",
            }
          );

        sparkleAnimation.onfinish =
          () => {
            sparkle.remove();
          };
      }, 75);

    /*
    ============================================
    FLYING PRODUCT ANIMATION
    ============================================
    */

    return new Promise<void>(
      (resolve) => {
        const animation =
          flyingImage.animate(
            [
              /*
              Start
              */
              {
                transform:
                  "translate(0px, 0px) scale(1) rotate(0deg)",
                opacity: 1,
                offset: 0,
              },

              /*
              Small lift
              */
              {
                transform: `translate(${
                  deltaX * 0.12
                }px, ${
                  deltaY * 0.06 -
                  45
                }px) scale(0.92) rotate(-3deg)`,

                opacity: 1,
                offset: 0.18,
              },

              /*
              High point of arc
              */
              {
                transform: `translate(${
                  deltaX * 0.42
                }px, ${
                  deltaY * 0.27 -
                  105
                }px) scale(0.72) rotate(5deg)`,

                opacity: 0.98,
                offset: 0.46,
              },

              /*
              Moving toward cart
              */
              {
                transform: `translate(${
                  deltaX * 0.7
                }px, ${
                  deltaY * 0.6 -
                  75
                }px) scale(0.48) rotate(-4deg)`,

                opacity: 0.9,
                offset: 0.7,
              },

              /*
              Almost inside cart
              */
              {
                transform: `translate(${
                  deltaX * 0.9
                }px, ${
                  deltaY * 0.88 -
                  20
                }px) scale(0.24) rotate(6deg)`,

                opacity: 0.65,
                offset: 0.9,
              },

              /*
              Cart destination
              */
              {
                transform: `translate(${deltaX}px, ${deltaY}px) scale(0.08) rotate(10deg)`,

                opacity: 0,
                offset: 1,
              },
            ],
            {
              /*
              Change this to 1600
              if you want even slower.
              */

              duration: 1350,

              easing:
                "cubic-bezier(0.22, 0.9, 0.28, 1)",

              fill: "forwards",
            }
          );

        /*
        ============================================
        WHEN PRODUCT REACHES CART
        ============================================
        */

        animation.onfinish = () => {
          window.clearInterval(
            sparkleTimer
          );

          sparkleElements.forEach(
            (sparkle) => {
              if (
                sparkle.isConnected
              ) {
                sparkle.remove();
              }
            }
          );

          flyingImage.remove();

          /*
          ============================================
          CART BOUNCE
          ============================================
          */

          cartIcon.animate(
            [
              {
                transform:
                  "scale(1) rotate(0deg)",
              },

              {
                transform:
                  "scale(1.22) rotate(-5deg)",
                offset: 0.3,
              },

              {
                transform:
                  "scale(0.94) rotate(4deg)",
                offset: 0.55,
              },

              {
                transform:
                  "scale(1.09) rotate(-2deg)",
                offset: 0.75,
              },

              {
                transform:
                  "scale(1) rotate(0deg)",
              },
            ],
            {
              duration: 520,

              easing:
                "cubic-bezier(0.34, 1.56, 0.64, 1)",
            }
          );

          resolve();
        };
      }
    );
  }

  /*
  ============================================
  ADD TO CART
  ============================================
  */

  async function handleAddToCart() {
    if (
      settingsLoading ||
      !settings.store_open ||
      animating
    ) {
      return;
    }

    setAnimating(true);

    /*
    Run animation first
    */

    await animateProductToCart();

    /*
    Then update actual cart
    */

    addToCart(
      product as never
    );

    setAdded(true);
    setAnimating(false);

    window.setTimeout(() => {
      setAdded(false);
    }, 1200);
  }

  return (
    <article className="group relative flex h-full flex-col rounded-[34px] border border-white/60 bg-[#fff8f5]/95 p-4 shadow-[11px_11px_24px_#d8c5c0,-9px_-9px_22px_#ffffff] transition-all duration-300 hover:-translate-y-2 hover:shadow-[15px_15px_30px_#d3bfb9,-10px_-10px_25px_#ffffff] sm:p-5">

      {/* =========================================
          PRODUCT IMAGE
      ========================================= */}

      <Link
        href={productHref}
        aria-label={`View ${product.name}`}
        className="relative block overflow-hidden rounded-[28px]"
      >
        <div
          ref={imageContainerRef}
          className="relative aspect-[4/3] overflow-hidden rounded-[28px] bg-[#f9ebe2] shadow-[inset_5px_5px_13px_#dcc9c3,inset_-5px_-5px_13px_#ffffff]"
        >
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
          />

          {/* Soft image overlay */}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#3c2929]/10 via-transparent to-white/5" />

          {/* Product badge */}

          {product.badge && (
            <div className="absolute left-4 top-4 z-10 rounded-full border border-white/30 bg-[#df8f9e]/95 px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.1em] text-white shadow-lg backdrop-blur-sm">
              {product.badge}
            </div>
          )}

          {/* Store closed badge */}

          {storeClosed && (
            <div className="absolute right-4 top-4 z-10 rounded-full bg-[#9e5361]/95 px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.08em] text-white shadow-lg backdrop-blur-sm">
              Store Closed
            </div>
          )}

          {/* Hover action */}

          <div className="absolute bottom-4 right-4 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/50 bg-[#fff8f4]/90 text-[#b76d7c] shadow-lg backdrop-blur-md">
              <span className="h-5 w-5">
                <ArrowRightIcon />
              </span>
            </div>
          </div>
        </div>
      </Link>

      {/* =========================================
          PRODUCT INFORMATION
      ========================================= */}

      <div className="flex flex-1 flex-col px-2 pb-2 pt-6">

        {/* Category */}

        {product.category && (
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#c47a88]">
            {product.category}
          </p>
        )}

        {/* Name + Price */}

        <div className="mt-2 flex items-start justify-between gap-4">
          <Link
            href={productHref}
            className="min-w-0 transition-colors duration-200 hover:text-[#c97888]"
          >
            <h3 className="line-clamp-2 text-xl font-black leading-tight tracking-[-0.02em] text-[#413232] transition-colors duration-200 group-hover:text-[#b96f7d]">
              {product.name}
            </h3>
          </Link>

          <div className="shrink-0 rounded-full bg-[#f9ebe2] px-3 py-1.5 shadow-[inset_2px_2px_5px_#ddcac4,inset_-2px_-2px_5px_#ffffff]">
            <span className="whitespace-nowrap text-sm font-black text-[#c16f7f] sm:text-base">
              ₱{formattedPrice}
            </span>
          </div>
        </div>

        {/* Description */}

        {product.description && (
          <p className="mt-3 line-clamp-2 text-sm font-medium leading-6 text-[#826f6f]">
            {product.description}
          </p>
        )}

        {/* Actions */}

        <div className="mt-auto pt-6">
          <button
            type="button"
            onClick={
              handleAddToCart
            }
            disabled={
              settingsLoading ||
              storeClosed ||
              animating
            }
            aria-disabled={
              settingsLoading ||
              storeClosed ||
              animating
            }
            className={`group/button flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-extrabold shadow-[6px_6px_14px_#d8c5c0,-5px_-5px_12px_#ffffff] transition-all duration-300 ${
              storeClosed
                ? "cursor-not-allowed bg-[#dfcfca] text-[#8b7777] opacity-80"
                : settingsLoading
                  ? "cursor-wait bg-[#eadbd5] text-[#8b7777]"
                  : added
                    ? "bg-[#c98793] text-white"
                    : animating
                      ? "cursor-wait bg-[#dc8c9b] text-white"
                      : "bg-[#e59aa8] text-white hover:-translate-y-0.5 hover:bg-[#d98797] hover:shadow-[8px_8px_17px_#d3bfb9,-6px_-6px_15px_#ffffff] active:translate-y-0 active:scale-[0.99]"
            }`}
          >
            {settingsLoading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#a98d8d] border-t-transparent" />

                Checking Store...
              </>
            ) : storeClosed ? (
              <>
                <span className="h-4 w-4">
                  <LockIcon />
                </span>

                Store Closed
              </>
            ) : animating ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />

                Adding...
              </>
            ) : added ? (
              <>
                <span className="h-4 w-4">
                  <CheckIcon />
                </span>

                Added!
              </>
            ) : (
              <>
                <span className="h-4 w-4">
                  <CartPlusIcon />
                </span>

                Add to Cart
              </>
            )}
          </button>

          {/* Closed store message */}

          {storeClosed && (
            <p className="mx-auto mt-3 max-w-[260px] text-center text-[11px] font-semibold leading-5 text-[#a45e6b]">
              Browsing is still
              available, but ordering is
              temporarily disabled.
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   DOUGHY PRODUCT CARD SVG ICONS
========================================================= */

function ArrowRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      <path
        d="M5 12H19M14 7L19 12L14 17"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      <rect
        x="5"
        y="10"
        width="14"
        height="10"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8 10V8C8 5.8 9.8 4 12 4C14.2 4 16 5.8 16 8V10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      <path
        d="M6.5 12.5L10.2 16L17.5 8.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CartPlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      <path
        d="M3.5 5H5.5L7.2 15.2H18.2L20 8H6.1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="9"
        cy="19"
        r="1.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle
        cx="17"
        cy="19"
        r="1.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M14.5 4V8M12.5 6H16.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

