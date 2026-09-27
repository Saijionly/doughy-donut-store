"use client";

import Link from "next/link";

export default function PromoSection() {
  return (
    <section className="overflow-hidden bg-[#f7eee9] px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-[38px] border border-white/50 bg-[#df8ea0] shadow-[0_30px_70px_rgba(126,77,87,0.18)]">
          <div className="grid min-h-[560px] lg:grid-cols-2">
            {/* ==================================================
                LEFT CONTENT
            ================================================== */}
            <div className="relative z-20 flex flex-col justify-center px-7 py-12 sm:px-10 lg:px-14 lg:py-16">
              <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />

              <div className="relative">
                <div className="inline-flex rounded-full border border-white/30 bg-white/10 px-5 py-2.5 backdrop-blur-sm">
                  <span className="text-[10px] font-black uppercase tracking-[0.28em] text-white">
                    Something sweet awaits
                  </span>
                </div>

                <h2 className="mt-7 max-w-[560px] text-[46px] font-black leading-[0.98] tracking-[-0.045em] text-white sm:text-[58px] lg:text-[64px]">
                  Sweet deals,
                  <br />
                  made
                  <br />
                  sweeter.
                </h2>

                <p className="mt-7 max-w-md text-sm font-medium leading-7 text-white/90 sm:text-base sm:leading-8">
                  Discover freshly baked favorites, indulgent desserts, and
                  treats worth sharing with every order.
                </p>

                <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <Link
                    href="/shop"
                    className="group inline-flex w-fit items-center justify-center gap-3 rounded-full bg-[#fff9f7] px-7 py-4 text-sm font-black text-[#c76f80] shadow-[0_12px_26px_rgba(116,63,74,0.18)] transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-[0_16px_34px_rgba(116,63,74,0.24)]"
                  >
                    Shop the offer

                    <span className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1">
                      <ArrowRightIcon />
                    </span>
                  </Link>

                  <span className="text-xs font-bold text-white/80">
                    Freshly baked daily
                  </span>
                </div>
              </div>
            </div>

            {/* ==================================================
                RIGHT SIDE
            ================================================== */}
            <div className="relative min-h-[540px] overflow-hidden bg-[#e98fa3] lg:min-h-full">
              {/* ==================================================
                  BACKGROUND GLOW
              ================================================== */}
              <div className="pointer-events-none absolute left-1/2 top-1/2 h-[470px] w-[470px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ffb8c5]/30 blur-[80px]" />

              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

              <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-[#d76f87]/35 blur-3xl" />

              {/* ==================================================
                  BACKGROUND CURVES
              ================================================== */}
              <div className="pointer-events-none absolute -left-[18%] top-[20%] h-[270px] w-[580px] rotate-[8deg] rounded-[50%] border border-white/15" />

              <div className="pointer-events-none absolute -left-[12%] top-[28%] h-[210px] w-[500px] rotate-[-8deg] rounded-[50%] border border-white/10" />

              {/* ==================================================
                  FLOATING STRAWBERRIES
              ================================================== */}
              <div className="pointer-events-none absolute left-[5%] top-[8%] z-10 h-12 w-12 animate-float-slow drop-shadow-xl">
                <StrawberryIcon />
              </div>

              <div className="pointer-events-none absolute right-[5%] top-[7%] z-10 h-14 w-14 animate-float-medium drop-shadow-xl">
                <StrawberryIcon />
              </div>

              <div className="pointer-events-none absolute left-[6%] top-[58%] z-20 h-14 w-14 animate-float-reverse drop-shadow-2xl">
                <StrawberryIcon />
              </div>

              <div className="pointer-events-none absolute -bottom-[4%] right-[2%] z-20 h-16 w-16 animate-float-slow opacity-90 drop-shadow-2xl">
                <StrawberryIcon />
              </div>

              {/* Foreground strawberry */}
              <div className="pointer-events-none absolute -bottom-16 -left-12 z-30 h-28 w-28 animate-float-reverse opacity-70 blur-[3px]">
                <StrawberryIcon />
              </div>

              {/* Blurred top strawberry */}
              <div className="pointer-events-none absolute -right-10 -top-10 z-30 h-24 w-24 animate-float-slow opacity-55 blur-[4px]">
                <StrawberryIcon />
              </div>

              {/* ==================================================
                  CLOUDS
              ================================================== */}
              <div className="pointer-events-none absolute left-[18%] top-[17%] z-10 h-10 w-10 animate-float-medium text-white/90 drop-shadow-md">
                <CloudIcon />
              </div>

              <div className="pointer-events-none absolute bottom-[10%] left-[18%] z-20 h-12 w-12 animate-float-slow text-white/90 drop-shadow-md">
                <CloudIcon />
              </div>

              <div className="pointer-events-none absolute right-[7%] top-[55%] z-10 h-10 w-10 animate-float-reverse text-white/90 drop-shadow-md">
                <CloudIcon />
              </div>

              {/* ==================================================
                  SPARKLES
              ================================================== */}
              <span className="pointer-events-none absolute left-[15%] top-[9%] h-6 w-6 animate-twinkle text-white">
                <SparkleIcon />
              </span>

              <span className="pointer-events-none absolute right-[21%] top-[17%] h-7 w-7 animate-twinkle-delay text-white">
                <SparkleIcon />
              </span>

              <span className="pointer-events-none absolute left-[15%] top-[45%] h-5 w-5 animate-twinkle-delay text-[#fff4d8]">
                <SparkleIcon />
              </span>

              <span className="pointer-events-none absolute bottom-[20%] right-[15%] h-6 w-6 animate-twinkle text-white">
                <SparkleIcon />
              </span>

              <span className="pointer-events-none absolute right-[7%] top-[37%] h-5 w-5 animate-twinkle-delay text-[#fff4d8]">
                <SparkleIcon />
              </span>

              {/* ==================================================
                  SPRINKLES
              ================================================== */}
              <div className="pointer-events-none absolute left-[28%] top-[13%] h-[9px] w-[30px] animate-sprinkle-one rounded-full bg-[#ff7795] shadow-lg" />

              <div className="pointer-events-none absolute right-[28%] top-[9%] h-[9px] w-[27px] animate-sprinkle-two rounded-full bg-[#ffd071] shadow-lg" />

              <div className="pointer-events-none absolute right-[12%] top-[27%] h-[9px] w-[30px] animate-sprinkle-three rounded-full bg-[#ff6d93] shadow-lg" />

              <div className="pointer-events-none absolute left-[14%] top-[42%] h-[9px] w-[28px] animate-sprinkle-two rounded-full bg-[#ff7295] shadow-lg" />

              <div className="pointer-events-none absolute right-[8%] top-[69%] h-[9px] w-[31px] animate-sprinkle-one rounded-full bg-[#ffd066] shadow-lg" />

              <div className="pointer-events-none absolute bottom-[9%] left-[31%] h-[9px] w-[30px] animate-sprinkle-three rounded-full bg-[#ff7599] shadow-lg" />

              {/* ==================================================
                  TINY CRUMBS
              ================================================== */}
              <div className="pointer-events-none absolute left-[29%] top-[28%] h-2 w-2 animate-crumb rounded-full bg-[#ffd79a]" />

              <div className="pointer-events-none absolute left-[22%] top-[67%] h-3 w-3 animate-crumb-delay rounded-full bg-[#f3bd72]" />

              <div className="pointer-events-none absolute right-[15%] top-[72%] h-2 w-2 animate-crumb rounded-full bg-[#ffd79a]" />

              <div className="pointer-events-none absolute right-[28%] top-[22%] h-2 w-2 animate-crumb-delay rounded-full bg-[#ffe1a8]" />

              {/* ==================================================
                  HANDWRITTEN CALLOUT - LEFT
              ================================================== */}
              <div className="pointer-events-none absolute left-[6%] top-[29%] z-20 hidden rotate-[-7deg] text-center text-white/95 sm:block">
                <p className="font-serif text-2xl italic leading-6">
                  Freshly
                  <br />
                  Baked
                </p>

                <div className="mt-2 flex translate-x-6 justify-center">
                  <span className="h-7 w-7">
                    <ArrowDownRightIcon />
                  </span>
                </div>
              </div>

              {/* ==================================================
                  HANDWRITTEN CALLOUT - RIGHT
              ================================================== */}
              <div className="pointer-events-none absolute right-[3%] top-[31%] z-20 hidden rotate-[5deg] text-center text-white/95 sm:block">
                <p className="font-serif text-xl italic leading-5">
                  Made
                  <br />
                  with
                  <br />
                  Love
                </p>

                <div className="mt-2 flex justify-center">
                  <span className="h-5 w-5 text-white/90">
                    <HeartIcon />
                  </span>
                </div>

                <div className="mt-2 flex -translate-x-5 justify-center">
                  <span className="h-6 w-6">
                    <ArrowDownLeftIcon />
                  </span>
                </div>
              </div>

              {/* ==================================================
                  CAKE STAGE
              ================================================== */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="relative flex h-[500px] w-full max-w-[580px] items-center justify-center">
                  {/* ==================================================
                      ORBIT BEHIND CAKE
                  ================================================== */}
                  <div className="absolute left-1/2 top-[47%] z-[5] h-[205px] w-[440px] -translate-x-1/2 -translate-y-1/2 rotate-[-10deg] rounded-[50%] border-[3px] border-white/60 shadow-[0_0_18px_rgba(255,255,255,0.8),0_0_42px_rgba(255,198,213,0.8)]" />

                  {/* SECOND ORBIT */}
                  <div className="absolute left-1/2 top-[48%] z-[5] h-[260px] w-[470px] -translate-x-1/2 -translate-y-1/2 rotate-[12deg] animate-orbit-reverse rounded-[50%] border border-white/20" />

                  {/* ==================================================
                      BACKGROUND PANEL
                  ================================================== */}
                  <div className="absolute left-1/2 top-[48%] z-[6] h-[420px] w-[470px] -translate-x-1/2 -translate-y-1/2 rounded-[38%_38%_30%_30%] border border-white/25 bg-gradient-to-b from-[#f4a6b7]/35 via-[#e98da3]/20 to-[#d97b91]/20 shadow-[inset_0_0_45px_rgba(255,255,255,0.12)]" />

                  {/* ==================================================
                      PEDESTAL
                  ================================================== */}
                  <div className="absolute bottom-[38px] left-1/2 z-[7] h-[105px] w-[400px] -translate-x-1/2 rounded-[50%] bg-gradient-to-b from-[#f3a1b2] to-[#cf7088] shadow-[0_30px_40px_rgba(105,48,62,0.28),inset_0_8px_18px_rgba(255,255,255,0.28)]">
                    <div className="absolute left-1/2 top-0 h-[38px] w-full -translate-x-1/2 rounded-[50%] bg-[#f8b0be]" />
                  </div>

                  {/* ==================================================
                      CAKE SHADOW
                  ================================================== */}
                  <div className="absolute bottom-[120px] left-1/2 z-[8] h-8 w-[280px] -translate-x-1/2 animate-shadow-pulse rounded-[50%] bg-[#823d50]/30 blur-xl" />

                  {/* ==================================================
                      STRAWBERRY SLICED CAKE
                  ================================================== */}
                  <div className="pointer-events-none absolute left-1/2 top-[44%] z-20 h-[330px] w-[390px] -translate-x-1/2 -translate-y-1/2 sm:h-[365px] sm:w-[425px] lg:h-[385px] lg:w-[445px]">
                    <div className="flex h-full w-full animate-cake-float items-center justify-center">
                      <img
                        src="/strawberry-cake.png?v=21"
                        alt="Fresh strawberry sliced cake"
                        draggable={false}
                        className="block h-auto w-[94%] max-h-full max-w-full select-none object-contain drop-shadow-[0_28px_24px_rgba(96,43,55,0.32)]"
                      />
                    </div>
                  </div>

                  {/* ==================================================
                      FRONT ORBIT
                  ================================================== */}
                  <div className="pointer-events-none absolute left-1/2 top-[49%] z-30 h-[205px] w-[440px] -translate-x-1/2 -translate-y-1/2 rotate-[-10deg] overflow-hidden rounded-[50%]">
                    <div className="absolute bottom-[-1px] left-0 h-1/2 w-full rounded-b-[50%] border-b-[3px] border-white/90 shadow-[0_4px_15px_rgba(255,255,255,0.75)]" />
                  </div>

                  {/* ==================================================
                      CROWN
                  ================================================== */}
                  <div className="absolute left-1/2 top-[3%] z-30 h-11 w-11 -translate-x-1/2 animate-crown-bounce text-white/90">
                    <CrownIcon />
                  </div>

                  {/* ==================================================
                      FAVORITE BADGE
                  ================================================== */}
                  <div className="absolute bottom-[7px] left-1/2 z-40 -translate-x-1/2 rounded-[24px] border border-white/50 bg-[#fff7f5]/95 px-7 py-4 shadow-[0_14px_30px_rgba(107,52,66,0.24)] backdrop-blur-xl">
                    <p className="whitespace-nowrap text-center text-[9px] font-black uppercase tracking-[0.19em] text-[#c66f7f]">
                      Doughy Favorite
                    </p>

                    <p className="mt-1 whitespace-nowrap text-center text-lg font-black text-[#453232]">
                      Fresh & fluffy
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================
          ANIMATIONS
      ================================================== */}
      <style jsx>{`
        @keyframes cakeFloat {
          0%,
          100% {
            transform: translateY(0px) rotate(-1deg);
          }

          50% {
            transform: translateY(-17px) rotate(1deg);
          }
        }

        @keyframes shadowPulse {
          0%,
          100% {
            transform: translateX(-50%) scaleX(1);
            opacity: 0.3;
          }

          50% {
            transform: translateX(-50%) scaleX(0.78);
            opacity: 0.15;
          }
        }

        @keyframes floatSlow {
          0%,
          100% {
            transform: translate3d(0, 0, 0) rotate(-5deg);
          }

          25% {
            transform: translate3d(7px, -13px, 0) rotate(3deg);
          }

          50% {
            transform: translate3d(-4px, -23px, 0) rotate(8deg);
          }

          75% {
            transform: translate3d(-10px, -9px, 0) rotate(1deg);
          }
        }

        @keyframes floatMedium {
          0%,
          100% {
            transform: translate3d(0, 0, 0) rotate(4deg);
          }

          50% {
            transform: translate3d(10px, -28px, 0) rotate(-9deg);
          }
        }

        @keyframes floatReverse {
          0%,
          100% {
            transform: translate3d(0, 0, 0) rotate(8deg);
          }

          50% {
            transform: translate3d(-12px, 20px, 0) rotate(-6deg);
          }
        }

        @keyframes twinkle {
          0%,
          100% {
            opacity: 0.25;
            transform: scale(0.7) rotate(0deg);
          }

          50% {
            opacity: 1;
            transform: scale(1.35) rotate(90deg);
          }
        }

        @keyframes crumb {
          0% {
            transform: translateY(-12px) rotate(0deg);
            opacity: 0;
          }

          20% {
            opacity: 1;
          }

          100% {
            transform: translateY(50px) rotate(180deg);
            opacity: 0;
          }
        }

        @keyframes orbitReverse {
          from {
            transform: translate(-50%, -50%) rotate(12deg);
          }

          to {
            transform: translate(-50%, -50%) rotate(372deg);
          }
        }

        @keyframes crownBounce {
          0%,
          100% {
            transform: translateX(-50%) translateY(0px) rotate(-4deg);
          }

          50% {
            transform: translateX(-50%) translateY(-8px) rotate(4deg);
          }
        }

        @keyframes sprinkleOne {
          0%,
          100% {
            transform: translateY(0px) rotate(28deg);
          }

          50% {
            transform: translateY(-18px) rotate(42deg);
          }
        }

        @keyframes sprinkleTwo {
          0%,
          100% {
            transform: translate(0px, 0px) rotate(-35deg);
          }

          50% {
            transform: translate(9px, -15px) rotate(-15deg);
          }
        }

        @keyframes sprinkleThree {
          0%,
          100% {
            transform: translate(0px, 0px) rotate(55deg);
          }

          50% {
            transform: translate(-8px, 18px) rotate(75deg);
          }
        }

        .animate-cake-float {
          animation: cakeFloat 4.6s ease-in-out infinite;
        }

        .animate-shadow-pulse {
          animation: shadowPulse 4.6s ease-in-out infinite;
        }

        .animate-float-slow {
          animation: floatSlow 6.5s ease-in-out infinite;
        }

        .animate-float-medium {
          animation: floatMedium 5s ease-in-out infinite;
        }

        .animate-float-reverse {
          animation: floatReverse 5.8s ease-in-out infinite;
        }

        .animate-twinkle {
          animation: twinkle 2.3s ease-in-out infinite;
        }

        .animate-twinkle-delay {
          animation: twinkle 2.8s ease-in-out 0.8s infinite;
        }

        .animate-crumb {
          animation: crumb 4s linear infinite;
        }

        .animate-crumb-delay {
          animation: crumb 5s linear 1.2s infinite;
        }

        .animate-orbit-reverse {
          animation: orbitReverse 18s linear infinite;
        }

        .animate-crown-bounce {
          animation: crownBounce 3.4s ease-in-out infinite;
        }

        .animate-sprinkle-one {
          animation: sprinkleOne 4.5s ease-in-out infinite;
        }

        .animate-sprinkle-two {
          animation: sprinkleTwo 5.3s ease-in-out infinite;
        }

        .animate-sprinkle-three {
          animation: sprinkleThree 5.8s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-cake-float,
          .animate-shadow-pulse,
          .animate-float-slow,
          .animate-float-medium,
          .animate-float-reverse,
          .animate-twinkle,
          .animate-twinkle-delay,
          .animate-crumb,
          .animate-crumb-delay,
          .animate-orbit-reverse,
          .animate-crown-bounce,
          .animate-sprinkle-one,
          .animate-sprinkle-two,
          .animate-sprinkle-three {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
}

/* =========================================================
   DOUGHY PROMO SECTION SVG ICONS
========================================================= */

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true">
      <path d="M5 12H19M14 7L19 12L14 17" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StrawberryIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="h-full w-full" aria-hidden="true">
      <path d="M32 16C20 12 10 20 12 31C14 43 25 54 32 58C39 54 50 43 52 31C54 20 44 12 32 16Z" fill="#F15F7A" stroke="#7E3F4D" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M32 17C27 11 23 8 18 8C20 13 23 16 27 18" fill="#5E9B63" stroke="#4F7F54" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M32 17C36 10 42 8 47 9C44 14 40 17 36 19" fill="#6DAE71" stroke="#4F7F54" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M32 16C31 10 32 7 34 4" stroke="#4F7F54" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M22 29L23 31M31 25L32 27M41 30L42 32M27 39L28 41M37 40L38 42M32 48L33 50" stroke="#FFE3A7" strokeWidth="2.3" strokeLinecap="round" />
    </svg>
  );
}

function CloudIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-full w-full" aria-hidden="true">
      <path d="M7.5 18C4.5 18 2.5 16.2 2.5 13.7C2.5 11.4 4.2 9.7 6.5 9.4C7.2 6.7 9.4 5 12.2 5C15.5 5 18.1 7.4 18.4 10.6C20.4 10.9 21.8 12.4 21.8 14.3C21.8 16.5 20 18 17.4 18H7.5Z" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true">
      <path d="M12 3C12.7 7.6 14.4 9.3 19 10C14.4 10.7 12.7 12.4 12 17C11.3 12.4 9.6 10.7 5 10C9.6 9.3 11.3 7.6 12 3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M19 15C19.3 17 20 17.7 22 18C20 18.3 19.3 19 19 21C18.7 19 18 18.3 16 18C18 17.7 18.7 17 19 15Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true">
      <path d="M12 20S4.5 15.7 4.5 9.7C4.5 6.9 6.4 5 8.9 5C10.4 5 11.5 5.8 12 6.8C12.5 5.8 13.6 5 15.1 5C17.6 5 19.5 6.9 19.5 9.7C19.5 15.7 12 20 12 20Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowDownRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true">
      <path d="M6 6L18 18M10 18H18V10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowDownLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true">
      <path d="M18 6L6 18M14 18H6V10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CrownIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true">
      <path d="M4 8L8.2 12L12 6L15.8 12L20 8L18.5 18H5.5L4 8Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 21H17" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

