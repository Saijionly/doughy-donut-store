"use client";

import Link from "next/link";

import { useStoreSettings } from "@/app/context/StoreSettingsContext";

export default function Footer() {
  const {
    settings,
    loading,
  } = useStoreSettings();

  const storeName =
    settings.store_name || "Doughy";

  const currentYear =
    new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-[#2d2424] px-5 pb-8 pt-16 text-white sm:px-6 lg:px-10 lg:pt-20">
      {/* Background decorations */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-10 h-80 w-80 rounded-full bg-[#e8a0ad]/10 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-28 bottom-0 h-72 w-72 rounded-full bg-[#f2c9bb]/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl">
        {/* =========================================
            MAIN FOOTER CONTENT
        ========================================= */}

        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.35fr_0.8fr_0.8fr] lg:gap-16">
          {/* =========================================
              BRAND
          ========================================= */}

          <div>
            <Link
              href="/"
              className="inline-block"
            >
              <h2 className="text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                {storeName}

                <span className="text-[#e8a0ad]">
                  .
                </span>
              </h2>
            </Link>

            <p className="mt-4 max-w-md text-sm font-medium leading-7 text-white/55">
              Sweet moments, freshly baked and
              delivered one delicious bite at a time.
            </p>

            {/* Store Status */}

            <div className="mt-6">
              {loading ? (
                <div className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2.5 text-xs font-bold text-white/50">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-white/40" />

                  Checking store status...
                </div>
              ) : settings.store_open ? (
                <div className="inline-flex items-center gap-2.5 rounded-full border border-[#6aa67a]/20 bg-[#4f8a61]/15 px-4 py-2.5 text-xs font-black text-[#b5dfbf]">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#6aa67a] opacity-40" />

                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#6aa67a]" />
                  </span>

                  Store Open
                </div>
              ) : (
                <div className="inline-flex items-center gap-2.5 rounded-full border border-[#d46b7e]/20 bg-[#a84f61]/15 px-4 py-2.5 text-xs font-black text-[#f1aab7]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#d46b7e]" />

                  Store Closed
                </div>
              )}
            </div>
          </div>

          {/* =========================================
              QUICK LINKS
          ========================================= */}

          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/35">
              Quick Links
            </p>

            <nav className="mt-5 flex flex-col items-start gap-3.5 text-sm font-semibold text-white/65">
              <Link
                href="/"
                className="group inline-flex items-center gap-2 transition-colors duration-200 hover:text-white"
              >
                <span className="h-1 w-1 rounded-full bg-[#e8a0ad] opacity-0 transition-opacity group-hover:opacity-100" />

                Home
              </Link>

              <Link
                href="/#categories"
                className="group inline-flex items-center gap-2 transition-colors duration-200 hover:text-white"
              >
                <span className="h-1 w-1 rounded-full bg-[#e8a0ad] opacity-0 transition-opacity group-hover:opacity-100" />

                Menu
              </Link>

              <Link
                href="/shop"
                className="group inline-flex items-center gap-2 transition-colors duration-200 hover:text-white"
              >
                <span className="h-1 w-1 rounded-full bg-[#e8a0ad] opacity-0 transition-opacity group-hover:opacity-100" />

                Shop
              </Link>

              <Link
                href="/track-order"
                className="group inline-flex items-center gap-2 transition-colors duration-200 hover:text-white"
              >
                <span className="h-1 w-1 rounded-full bg-[#e8a0ad] opacity-0 transition-opacity group-hover:opacity-100" />

                Track Order
              </Link>

              <Link
                href="/#about"
                className="group inline-flex items-center gap-2 transition-colors duration-200 hover:text-white"
              >
                <span className="h-1 w-1 rounded-full bg-[#e8a0ad] opacity-0 transition-opacity group-hover:opacity-100" />

                About
              </Link>
            </nav>
          </div>

          {/* =========================================
              CONTACT
          ========================================= */}

          {(settings.support_email ||
            settings.phone) && (
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/35">
                Contact
              </p>

              <div className="mt-5 flex flex-col gap-3">
                {settings.support_email && (
                  <a
                    href={`mailto:${settings.support_email}`}
                    className="group flex items-start gap-3 rounded-[18px] border border-white/[0.06] bg-white/[0.035] px-4 py-3.5 text-sm font-semibold text-white/65 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/10 hover:bg-white/[0.06] hover:text-white"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-[#e8a0ad]">
                      <MailIcon />
                    </span>

                    <span className="break-all">
                      {settings.support_email}
                    </span>
                  </a>
                )}

                {settings.phone && (
                  <a
                    href={`tel:${settings.phone}`}
                    className="group flex items-center gap-3 rounded-[18px] border border-white/[0.06] bg-white/[0.035] px-4 py-3.5 text-sm font-semibold text-white/65 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/10 hover:bg-white/[0.06] hover:text-white"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center text-[#e8a0ad]">
                      <PhoneIcon />
                    </span>

                    <span>
                      {settings.phone}
                    </span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* =========================================
            BOTTOM FOOTER
        ========================================= */}

        <div className="mt-14 border-t border-white/[0.08] pt-6">
          <div className="flex flex-col gap-4 text-xs font-medium text-white/35 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {currentYear} {storeName}. All rights
              reserved.
            </p>

            {!loading && (
              <div className="flex items-center gap-2">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    settings.store_open
                      ? "bg-[#6aa67a]"
                      : "bg-[#d46b7e]"
                  }`}
                />

                <p>
                  {settings.store_open
                    ? "Currently accepting orders."
                    : "Ordering is temporarily unavailable."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* =========================================================
   DOUGHY FOOTER SVG ICONS
========================================================= */

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      <rect
        x="3.5"
        y="5.5"
        width="17"
        height="13"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M5 7L12 12.5L19 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      <path
        d="M7.2 4.2L9.5 7.8C9.9 8.4 9.8 9.1 9.3 9.6L7.9 11C8.9 13 11 15.1 13 16.1L14.4 14.7C14.9 14.2 15.6 14.1 16.2 14.5L19.8 16.8C20.4 17.2 20.7 17.9 20.4 18.6C19.8 20 18.4 20.8 16.9 20.6C10.2 19.7 4.3 13.8 3.4 7.1C3.2 5.6 4 4.2 5.4 3.6C6.1 3.3 6.8 3.6 7.2 4.2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}