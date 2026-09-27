import Link from "next/link";
import { categories } from "@/data/products";

const categoryDetails = {
  Donuts: {
    description: "Freshly baked every day",
    accent: "from-[#f8d8de] to-[#f4c8d1]",
    icon: <DonutIcon />,
  },
  Cakes: {
    description: "Perfect for every occasion",
    accent: "from-[#f8ddd4] to-[#f3cfc3]",
    icon: <CakeIcon />,
  },
  Cupcakes: {
    description: "Small bites of happiness",
    accent: "from-[#f5ded8] to-[#efd1cb]",
    icon: <CupcakeIcon />,
  },
};

export default function Categories() {
  const visibleCategories = categories.filter(
    (category) => category !== "All"
  );

  return (
    <section
      id="categories"
      className="relative overflow-hidden bg-[#f9ebe2] px-5 py-20 sm:px-6 lg:px-10 lg:py-28"
    >
      {/* Soft background decorations */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#f3d4d6]/50 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-[#efd6ca]/60 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl">
        {/* Section heading */}
        <div className="mx-auto mb-14 max-w-3xl text-center lg:mb-16">
          <div className="mb-4 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-[#fff7f2]/70 px-4 py-2 shadow-[4px_4px_10px_#dfccc6,-4px_-4px_10px_#ffffff] backdrop-blur-sm">
              <span
                aria-hidden="true"
                className="flex h-4 w-4 items-center justify-center text-[#d17e90]"
              >
                <SparkleIcon />
              </span>

              <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#c27786] sm:text-xs">
                Explore our menu
              </p>
            </div>
          </div>

          <h2 className="text-4xl font-black tracking-[-0.04em] text-[#362929] sm:text-5xl lg:text-6xl">
            Something sweet
            <span className="block text-[#d98798]">
              for everyone.
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-sm font-medium leading-7 text-[#816d6d] sm:text-base">
            From classic donuts to celebration cakes and bite-sized cupcakes,
            there&apos;s always something delicious waiting for you.
          </p>
        </div>

        {/* Category cards */}
        <div className="grid gap-6 md:grid-cols-3 lg:gap-8">
          {visibleCategories.map((category) => {
            const details =
              categoryDetails[
                category as keyof typeof categoryDetails
              ];

            if (!details) {
              return null;
            }

            return (
              <Link
                key={category}
                href={`/shop?category=${encodeURIComponent(category)}`}
                className="group relative overflow-hidden rounded-[34px] border border-white/60 bg-[#fff8f5]/90 p-7 text-center shadow-[11px_11px_24px_#d8c5c0,-9px_-9px_22px_#ffffff] transition-all duration-300 hover:-translate-y-2 hover:shadow-[15px_15px_30px_#d3bfb9,-10px_-10px_26px_#ffffff] sm:p-8"
              >
                {/* Card glow */}
                <div
                  aria-hidden="true"
                  className={`absolute left-1/2 top-10 h-32 w-32 -translate-x-1/2 rounded-full bg-gradient-to-br ${details.accent} opacity-35 blur-3xl transition duration-300 group-hover:scale-125 group-hover:opacity-60`}
                />

                {/* Professional icon container */}
                <div className="relative mx-auto flex h-28 w-28 items-center justify-center rounded-[32px] border border-white/60 bg-[#f9ebe2] shadow-[inset_6px_6px_14px_#dcc9c3,inset_-6px_-6px_14px_#ffffff] transition-all duration-300 group-hover:-rotate-3 group-hover:scale-105 sm:h-32 sm:w-32">
                  <div className="absolute inset-5 rounded-full bg-[#e79aaa]/10 blur-xl" />

                  <div className="relative h-[72px] w-[72px] text-[#332727] sm:h-[80px] sm:w-[80px]">
                    {details.icon}
                  </div>
                </div>

                {/* Content */}
                <div className="relative mt-7">
                  <h3 className="text-2xl font-black tracking-tight text-[#3f3131] sm:text-[1.7rem]">
                    {category}
                  </h3>

                  <p className="mx-auto mt-2 max-w-[220px] text-sm font-medium leading-6 text-[#806e6e]">
                    {details.description}
                  </p>

                  <div className="mt-7 inline-flex items-center gap-2 text-sm font-extrabold text-[#c97888]">
                    View collection

                    <span
                      aria-hidden="true"
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </div>
                </div>

                {/* Small corner decoration */}
                <div
                  aria-hidden="true"
                  className="absolute -bottom-7 -right-7 h-20 w-20 rounded-full bg-[#f2d4d1]/50"
                />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   DOUGHY CUSTOM SVG ICONS
========================================================= */

function DonutIcon() {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
      aria-hidden="true"
    >
      {/* Dough */}
      <circle
        cx="40"
        cy="40"
        r="27"
        fill="#E7B07B"
        stroke="currentColor"
        strokeWidth="3.5"
      />

      {/* Icing */}
      <path
        d="M14.5 36.5C16.1 24 26.6 14 40 14C53.7 14 64.8 24.4 65.7 37.5C60.7 34.5 58.1 39.4 53.5 38C48.7 36.5 47.9 31.8 43.2 33.2C38.7 34.6 38.3 39.9 33.8 39C29.1 38.1 27.9 33.5 23.5 35.4C19.4 37.1 18 39.1 14.5 36.5Z"
        fill="#E78FA3"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />

      {/* Donut hole */}
      <circle
        cx="40"
        cy="40"
        r="9"
        fill="#FFF8F5"
        stroke="currentColor"
        strokeWidth="3.2"
      />

      {/* Sprinkles */}
      <path
        d="M28 25L31 22"
        stroke="#FFF8F5"
        strokeWidth="3"
        strokeLinecap="round"
      />

      <path
        d="M47 22L49 26"
        stroke="#FFD06F"
        strokeWidth="3"
        strokeLinecap="round"
      />

      <path
        d="M55 31L59 29"
        stroke="#FFF8F5"
        strokeWidth="3"
        strokeLinecap="round"
      />

      <path
        d="M23 31L20 29"
        stroke="#D97E92"
        strokeWidth="3"
        strokeLinecap="round"
      />

      <path
        d="M51 44L54 47"
        stroke="#FFD06F"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CakeIcon() {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
      aria-hidden="true"
    >
      {/* Plate */}
      <path
        d="M17 59C19 64 27 67 40 67C53 67 61 64 63 59"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* Cake body */}
      <path
        d="M21 35H59V57H21V35Z"
        fill="#E7B07B"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />

      {/* Cake top */}
      <path
        d="M21 35C24 27 30 23 40 23C50 23 56 27 59 35H21Z"
        fill="#F1C5CF"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />

      {/* Cream drip */}
      <path
        d="M24 35C27 38 29 39 32 36C35 33 38 37 41 35C44 33 47 38 50 36C53 34 56 36 58 35"
        stroke="#FFF8F5"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Candle */}
      <path
        d="M40 15V23"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      />

      {/* Flame */}
      <path
        d="M40 8C36.8 11.7 37.4 15 40 16C42.8 15 43.2 11.9 40 8Z"
        fill="#DF8FA1"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Decoration */}
      <circle cx="30" cy="46" r="2.3" fill="#DF8FA1" />
      <circle cx="40" cy="49" r="2.3" fill="#FFD06F" />
      <circle cx="50" cy="45" r="2.3" fill="#DF8FA1" />
    </svg>
  );
}

function CupcakeIcon() {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
      aria-hidden="true"
    >
      {/* Frosting */}
      <path
        d="M25 34C21 33 19 30 20 27C21 23.5 24 22 28 22C28.5 17.5 32 15 36.5 15C39.7 15 42.1 16.2 44 18.8C46 17.2 48 16.5 50.5 17C54.5 17.8 57 20.9 56 24.5C60 25 62 28 61 31C60.3 33.2 58.3 34.5 55 34.5L25 34Z"
        fill="#F0B8C5"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />

      {/* Frosting layers */}
      <path
        d="M27 27H53"
        stroke="#FFF8F5"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.9"
      />

      {/* Wrapper */}
      <path
        d="M25 35H55L51 61H29L25 35Z"
        fill="#E7B07B"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />

      {/* Wrapper lines */}
      <path
        d="M34 39L35 57"
        stroke="#D28773"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      <path
        d="M40 39V57"
        stroke="#D28773"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      <path
        d="M46 39L45 57"
        stroke="#D28773"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Cherry / accent */}
      <circle
        cx="40"
        cy="13"
        r="3.5"
        fill="#DF8FA1"
        stroke="currentColor"
        strokeWidth="2.3"
      />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
      aria-hidden="true"
    >
      <path
        d="M12 2C12.8 7.1 15.1 9.4 20 10.2C15.1 11 12.8 13.3 12 18.4C11.2 13.3 8.9 11 4 10.2C8.9 9.4 11.2 7.1 12 2Z"
        fill="#DF8FA1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      <path
        d="M19 16C19.4 18.3 20.5 19.4 23 19.8C20.5 20.2 19.4 21.3 19 23.6C18.6 21.3 17.5 20.2 15 19.8C17.5 19.4 18.6 18.3 19 16Z"
        fill="#FFD06F"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}