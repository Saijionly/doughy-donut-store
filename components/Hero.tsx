"use client";

import Link from "next/link";

const sprinkles = [
  {
    left: "10%",
    top: "12%",
    rotate: "28deg",
    color: "#ef86a0",
    delay: "0s",
    duration: "5.8s",
  },
  {
    left: "25%",
    top: "7%",
    rotate: "-18deg",
    color: "#35bdd2",
    delay: "0.5s",
    duration: "6.4s",
  },
  {
    left: "78%",
    top: "11%",
    rotate: "38deg",
    color: "#ed83a0",
    delay: "1.1s",
    duration: "5.5s",
  },
  {
    left: "91%",
    top: "30%",
    rotate: "-18deg",
    color: "#38bfd4",
    delay: "0.8s",
    duration: "6.2s",
  },
  {
    left: "7%",
    top: "59%",
    rotate: "45deg",
    color: "#824735",
    delay: "1.5s",
    duration: "5.6s",
  },
  {
    left: "87%",
    top: "64%",
    rotate: "20deg",
    color: "#ed88a3",
    delay: "0.4s",
    duration: "6s",
  },
  {
    left: "17%",
    top: "81%",
    rotate: "-28deg",
    color: "#36b9cf",
    delay: "1.9s",
    duration: "6.6s",
  },
  {
    left: "89%",
    top: "82%",
    rotate: "38deg",
    color: "#814736",
    delay: "1.2s",
    duration: "5.5s",
  },
  {
    left: "14%",
    top: "34%",
    rotate: "18deg",
    color: "#ec819e",
    delay: "0.9s",
    duration: "5.9s",
  },
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#f7eee9] px-5 pb-14 pt-12 sm:px-6 lg:px-10 lg:pb-20 lg:pt-16">
      {/* Background glow */}
      <div className="pointer-events-none absolute -left-24 top-20 h-80 w-80 rounded-full bg-[#f7cbd4]/25 blur-[100px]" />

      <div className="pointer-events-none absolute -right-20 top-10 h-[430px] w-[430px] rounded-full bg-[#f0b9c5]/30 blur-[120px]" />

      <div className="relative mx-auto grid min-h-[640px] max-w-7xl items-center gap-12 lg:grid-cols-[1.03fr_0.97fr] lg:gap-5">
        {/* =====================================================
            LEFT CONTENT
        ===================================================== */}

        <div className="relative z-20">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/70 bg-[#fff8f5]/90 px-5 py-3 shadow-[7px_7px_18px_rgba(184,155,150,0.25),-5px_-5px_15px_rgba(255,255,255,0.9)] backdrop-blur-xl">
            <span className="h-5 w-5 animate-star-bounce text-[#c97888]">
              <SparkleIcon />
            </span>

            <span className="text-[10px] font-black uppercase tracking-[0.24em] text-[#c87587] sm:text-xs">
              Freshly baked happiness
            </span>
          </div>

          <h1 className="mt-9 max-w-3xl font-black leading-[0.9] tracking-[-0.055em]">
            <span className="block text-[58px] text-[#302323] sm:text-[76px] lg:text-[88px] xl:text-[96px]">
              Bite into
            </span>

            <span className="relative mt-3 block text-[58px] text-[#dc8da0] sm:text-[76px] lg:text-[88px] xl:text-[96px]">
              Happiness.

              <span className="absolute -bottom-3 left-[16%] h-[6px] w-[54%] -rotate-1 rounded-full bg-[#e7a9b5]/60" />
            </span>
          </h1>

          <p className="mt-12 max-w-xl text-base font-medium leading-8 text-[#725d5d] sm:text-lg">
            Delicious donuts, cakes, and desserts handmade with love and baked
            fresh just for you.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              href="/shop"
              className="group inline-flex items-center gap-3 rounded-full bg-[#e796a6] px-8 py-4 text-sm font-black text-white shadow-[7px_9px_20px_rgba(187,112,127,0.28)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#dc8799]"
            >
              Shop Now

              <span className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5">
                <ArrowRightIcon />
              </span>
            </Link>

            <Link
              href="/#categories"
              className="inline-flex items-center rounded-full bg-[#fff3ec] px-8 py-4 text-sm font-black text-[#674c47] shadow-[7px_8px_18px_rgba(184,155,150,0.22),-5px_-5px_14px_rgba(255,255,255,0.85)] transition-all duration-300 hover:-translate-y-1 hover:bg-white"
            >
              Explore Menu
            </Link>
          </div>

          <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f7d9d5] text-[#a6616f]">
                <span className="h-4 w-4">
                  <CheckIcon />
                </span>
              </div>

              <span className="text-xs font-bold text-[#806969]">
                Fresh Daily
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f7d9d5] text-[#a6616f]">
                <span className="h-4 w-4">
                  <HeartIcon />
                </span>
              </div>

              <span className="text-xs font-bold text-[#806969]">
                Made with Love
              </span>
            </div>
          </div>
        </div>

        {/* =====================================================
            RIGHT VISUAL
        ===================================================== */}

        <div className="relative z-10 mx-auto min-h-[590px] w-full max-w-[720px] lg:min-h-[650px]">
          {/* BIGGER PINK PANEL */}

          <div className="absolute left-[52%] top-[52%] z-[1] h-[500px] w-[86%] -translate-x-1/2 -translate-y-1/2 rounded-[115px] border border-white/70 bg-gradient-to-br from-[#fde6e2] via-[#fbd9d9] to-[#f6cdd3] shadow-[inset_0_0_60px_rgba(255,255,255,0.48),0_32px_70px_rgba(150,90,102,0.15)] sm:h-[540px]">
            <div className="absolute inset-7 rounded-[95px] border-[2px] border-white/55" />

            <div className="absolute left-1/2 top-1/2 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f4a9ba]/25 blur-[80px]" />
          </div>

          {/* FLOATING SPRINKLES */}

          {sprinkles.map((sprinkle, index) => (
            <span
              key={index}
              className="pointer-events-none absolute z-[12] h-3 w-9 rounded-full shadow-sm animate-sprinkle-float"
              style={{
                left: sprinkle.left,
                top: sprinkle.top,
                background: sprinkle.color,
                transform: `rotate(${sprinkle.rotate})`,
                animationDelay: sprinkle.delay,
                animationDuration: sprinkle.duration,
              }}
            />
          ))}

          {/* Blurred foreground sprinkles */}

          <span className="pointer-events-none absolute -top-1 left-[17%] z-[40] h-6 w-24 rotate-[35deg] rounded-full bg-[#ef88a2]/80 blur-[4px] animate-foreground-one" />

          <span className="pointer-events-none absolute right-[-1%] top-[10%] z-[40] h-6 w-24 -rotate-[28deg] rounded-full bg-[#38bdd0]/80 blur-[5px] animate-foreground-two" />

          <span className="pointer-events-none absolute bottom-[1%] left-[13%] z-[40] h-7 w-28 -rotate-[30deg] rounded-full bg-[#ef88a3]/70 blur-[5px] animate-foreground-one" />

          {/* ORBIT BACK */}

          <svg
            viewBox="0 0 650 400"
            className="pointer-events-none absolute left-[52%] top-[52%] z-[15] h-[390px] w-[620px] -translate-x-1/2 -translate-y-1/2 overflow-visible"
            aria-hidden="true"
          >
            <defs>
              <filter
                id="orbitBackGlow"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feGaussianBlur stdDeviation="5" result="blur" />

                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <path
              d="M 55 225 C 120 65, 500 45, 598 205"
              fill="none"
              stroke="rgba(255,255,255,0.88)"
              strokeWidth="4"
              strokeLinecap="round"
              filter="url(#orbitBackGlow)"
              className="animate-orbit-back"
            />
          </svg>

          {/* BIG DONUT */}

          <div className="pointer-events-none absolute left-[52%] top-[52%] z-[30] h-[390px] w-[500px] -translate-x-1/2 -translate-y-1/2 sm:h-[445px] sm:w-[560px]">
            <div className="absolute bottom-[12px] left-1/2 h-12 w-[320px] -translate-x-1/2 rounded-[50%] bg-[#743f3f]/20 blur-xl animate-donut-shadow" />

            <div className="absolute inset-0 flex items-center justify-center">
              <img
                src="/chocolate-donut.png?v=12"
                alt="Chocolate sprinkle donut"
                className="h-auto w-[92%] max-w-[520px] select-none object-contain drop-shadow-[0_40px_32px_rgba(75,36,35,0.32)] animate-donut-float"
                draggable={false}
              />
            </div>
          </div>

          {/* ORBIT FRONT */}

          <svg
            viewBox="0 0 650 400"
            className="pointer-events-none absolute left-[52%] top-[52%] z-[35] h-[390px] w-[620px] -translate-x-1/2 -translate-y-1/2 overflow-visible"
            aria-hidden="true"
          >
            <defs>
              <filter
                id="orbitFrontGlow"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feGaussianBlur stdDeviation="5" result="blur" />

                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <path
              d="M 598 205 C 535 350, 135 360, 55 225"
              fill="none"
              stroke="rgba(255,255,255,0.98)"
              strokeWidth="5"
              strokeLinecap="round"
              filter="url(#orbitFrontGlow)"
              className="animate-orbit-front"
            />
          </svg>

          {/* SPARKLES / HEARTS */}

          <span className="pointer-events-none absolute left-[14%] top-[29%] z-[22] h-7 w-7 animate-sparkle text-white">
            <SparkleIcon />
          </span>

          <span className="pointer-events-none absolute right-[13%] top-[24%] z-[38] h-9 w-9 animate-sparkle-delay text-white">
            <SparkleIcon />
          </span>

          <span className="pointer-events-none absolute bottom-[18%] right-[8%] z-[22] h-7 w-7 animate-sparkle text-white">
            <SparkleIcon />
          </span>

          <span className="pointer-events-none absolute bottom-[21%] left-[13%] z-[22] h-6 w-6 animate-heart text-[#f093aa]">
            <HeartFilledIcon />
          </span>

          <span className="pointer-events-none absolute right-[14%] top-[44%] z-[22] h-5 w-5 animate-heart-delay text-[#eb7996]">
            <HeartFilledIcon />
          </span>

          {/* =====================================================
              FAVORITE CARD - TEXT ONLY
          ===================================================== */}

          <div className="absolute right-[1%] top-[7%] z-50 animate-card-one rounded-[26px] border border-white/80 bg-[#fff9f6]/95 px-6 py-4 shadow-[0_16px_34px_rgba(117,74,77,0.18)] backdrop-blur-xl">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#aa9191]">
              Our Favorite
            </p>

            <p className="mt-1 whitespace-nowrap text-sm font-black text-[#4f3737]">
              Chocolate Sprinkle
            </p>
          </div>

          {/* =====================================================
              FRESH DAILY CARD - TEXT ONLY
          ===================================================== */}

          <div className="absolute bottom-[5%] left-[5%] z-50 animate-card-two rounded-[26px] border border-white/80 bg-[#fff9f6]/95 px-6 py-4 shadow-[0_16px_34px_rgba(117,74,77,0.18)] backdrop-blur-xl">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#aa9191]">
              Baked
            </p>

            <p className="mt-1 whitespace-nowrap text-sm font-black text-[#4f3737]">
              Fresh Daily
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
          LIVE ANIMATIONS
      ===================================================== */}

      <style jsx>{`
        @keyframes donutFloat {
          0%,
          100% {
            transform: translateY(0px) rotate(-2deg) scale(1);
          }

          50% {
            transform: translateY(-17px) rotate(2deg) scale(1.02);
          }
        }

        @keyframes donutShadow {
          0%,
          100% {
            transform: translateX(-50%) scaleX(1);
            opacity: 0.22;
          }

          50% {
            transform: translateX(-50%) scaleX(0.72);
            opacity: 0.1;
          }
        }

        @keyframes orbitBack {
          0%,
          100% {
            transform: translateY(0);
            opacity: 0.82;
          }

          50% {
            transform: translateY(-4px);
            opacity: 1;
          }
        }

        @keyframes orbitFront {
          0%,
          100% {
            transform: translateY(0);
            opacity: 0.9;
          }

          50% {
            transform: translateY(-4px);
            opacity: 1;
          }
        }

        @keyframes sprinkleFloat {
          0%,
          100% {
            translate: 0 0;
          }

          25% {
            translate: 7px -13px;
          }

          50% {
            translate: -5px -24px;
          }

          75% {
            translate: -8px -9px;
          }
        }

        @keyframes sparkle {
          0%,
          100% {
            opacity: 0.25;
            transform: scale(0.65) rotate(0deg);
          }

          50% {
            opacity: 1;
            transform: scale(1.45) rotate(90deg);
          }
        }

        @keyframes heartFloat {
          0%,
          100% {
            transform: translateY(0px) scale(0.85);
            opacity: 0.55;
          }

          50% {
            transform: translateY(-18px) scale(1.15);
            opacity: 1;
          }
        }

        @keyframes foregroundOne {
          0%,
          100% {
            transform: translateY(0) rotate(28deg);
          }

          50% {
            transform: translateY(-28px) rotate(40deg);
          }
        }

        @keyframes foregroundTwo {
          0%,
          100% {
            transform: translateY(0) rotate(-20deg);
          }

          50% {
            transform: translateY(28px) rotate(-32deg);
          }
        }

        @keyframes cardFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-9px);
          }
        }

        @keyframes starBounce {
          0%,
          100% {
            transform: rotate(-8deg) scale(1);
          }

          50% {
            transform: rotate(10deg) scale(1.2);
          }
        }

        .animate-donut-float {
          animation: donutFloat 4.6s ease-in-out infinite;
        }

        .animate-donut-shadow {
          animation: donutShadow 4.6s ease-in-out infinite;
        }

        .animate-orbit-back {
          animation: orbitBack 4.6s ease-in-out infinite;
        }

        .animate-orbit-front {
          animation: orbitFront 4.6s ease-in-out infinite;
        }

        .animate-sprinkle-float {
          animation-name: sprinkleFloat;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }

        .animate-sparkle {
          animation: sparkle 2.4s ease-in-out infinite;
        }

        .animate-sparkle-delay {
          animation: sparkle 3s ease-in-out 0.8s infinite;
        }

        .animate-heart {
          animation: heartFloat 3.8s ease-in-out infinite;
        }

        .animate-heart-delay {
          animation: heartFloat 4.2s ease-in-out 1s infinite;
        }

        .animate-foreground-one {
          animation: foregroundOne 6s ease-in-out infinite;
        }

        .animate-foreground-two {
          animation: foregroundTwo 7s ease-in-out infinite;
        }

        .animate-card-one {
          animation: cardFloat 4.5s ease-in-out infinite;
        }

        .animate-card-two {
          animation: cardFloat 5.2s ease-in-out 0.8s infinite;
        }

        .animate-star-bounce {
          animation: starBounce 3s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-donut-float,
          .animate-donut-shadow,
          .animate-orbit-back,
          .animate-orbit-front,
          .animate-sprinkle-float,
          .animate-sparkle,
          .animate-sparkle-delay,
          .animate-heart,
          .animate-heart-delay,
          .animate-foreground-one,
          .animate-foreground-two,
          .animate-card-one,
          .animate-card-two,
          .animate-star-bounce {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
}

/* =========================================================
   DOUGHY HERO SVG ICONS
========================================================= */

function SparkleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      <path
        d="M12 3C12.7 7.6 14.4 9.3 19 10C14.4 10.7 12.7 12.4 12 17C11.3 12.4 9.6 10.7 5 10C9.6 9.3 11.3 7.6 12 3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M19 15C19.3 17 20 17.7 22 18C20 18.3 19.3 19 19 21C18.7 19 18 18.3 16 18C18 17.7 18.7 17 19 15Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      <path
        d="M12 20S4.5 15.7 4.5 9.7C4.5 6.9 6.4 5 8.9 5C10.4 5 11.5 5.8 12 6.8C12.5 5.8 13.6 5 15.1 5C17.6 5 19.5 6.9 19.5 9.7C19.5 15.7 12 20 12 20Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HeartFilledIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-full w-full"
      aria-hidden="true"
    >
      <path d="M12 20S4.5 15.7 4.5 9.7C4.5 6.9 6.4 5 8.9 5C10.4 5 11.5 5.8 12 6.8C12.5 5.8 13.6 5 15.1 5C17.6 5 19.5 6.9 19.5 9.7C19.5 15.7 12 20 12 20Z" />
    </svg>
  );
}