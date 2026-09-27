"use client";

export default function WhyChooseUs() {
  const features = [
    {
      number: "01",
      title: "Quality Ingredients",
      description:
        "We use carefully selected ingredients to make every treat fresh, rich, and delicious.",
      icon: <MilkIcon />,
    },
    {
      number: "02",
      title: "Made with Care",
      description:
        "Every Doughy treat is prepared with attention to detail and a whole lot of love.",
      icon: <ChefIcon />,
    },
    {
      number: "03",
      title: "Fast Delivery",
      description:
        "Your favorite desserts are carefully packed and delivered fresh to your doorstep.",
      icon: <DeliveryIcon />,
    },
  ];

  return (
    <section
      id="about"
      className="relative overflow-hidden bg-[#f7eee9] px-5 py-20 sm:px-6 lg:px-10 lg:py-28"
    >
      {/* Background decoration */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-28 top-20 h-72 w-72 rounded-full bg-[#f1d2d4]/35 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-[#f4ddd6]/50 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/70 bg-[#fff8f5]/80 px-5 py-2.5 shadow-[5px_5px_13px_rgba(196,169,163,0.28),-5px_-5px_13px_rgba(255,255,255,0.85)] backdrop-blur-sm">
            <span className="flex h-5 w-5 items-center justify-center text-[#d47d91]">
              <HeartIcon />
            </span>

            <span className="text-[10px] font-black uppercase tracking-[0.24em] text-[#c77789] sm:text-xs">
              Why Choose Doughy
            </span>
          </div>

          <h2 className="mt-7 text-4xl font-black tracking-[-0.04em] text-[#362929] sm:text-5xl lg:text-6xl">
            Sweetness made
            <span className="block text-[#dc8da0]">the Doughy way.</span>
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-sm font-medium leading-7 text-[#806d6d] sm:text-base">
            From quality ingredients to careful preparation and delivery,
            everything we do is made to make every bite a little sweeter.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="mt-14 grid gap-7 md:grid-cols-3 lg:gap-8">
          {features.map((feature) => (
            <div
              key={feature.number}
              className="group relative min-h-[370px] overflow-hidden rounded-[34px] border border-white/65 bg-[#fff8f5]/90 p-8 shadow-[11px_11px_25px_rgba(199,174,168,0.35),-8px_-8px_22px_rgba(255,255,255,0.88)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[15px_15px_30px_rgba(195,168,162,0.38),-10px_-10px_25px_rgba(255,255,255,0.95)] sm:p-9"
            >
              {/* Number */}
              <span className="pointer-events-none absolute right-7 top-7 text-[38px] font-black leading-none text-[#f2d4d7] transition-colors duration-300 group-hover:text-[#edc2c9]">
                {feature.number}
              </span>

              {/* Icon */}
              <div className="relative flex h-[94px] w-[94px] items-center justify-center rounded-[28px] border border-white/60 bg-[#f8efeb] shadow-[7px_7px_16px_rgba(197,174,168,0.33),-6px_-6px_16px_rgba(255,255,255,0.95),inset_1px_1px_3px_rgba(255,255,255,0.6)] transition-all duration-300 group-hover:-translate-y-1 group-hover:rotate-[-2deg]">
                {/* soft pink glow */}
                <div className="absolute inset-4 rounded-full bg-[#e99aac]/12 blur-xl" />

                <div className="relative h-12 w-12 text-[#372929]">
                  {feature.icon}
                </div>
              </div>

              {/* Text */}
              <div className="mt-10">
                <h3 className="text-[25px] font-black tracking-[-0.025em] text-[#362929]">
                  {feature.title}
                </h3>

                <p className="mt-4 text-sm font-medium leading-7 text-[#856f6f]">
                  {feature.description}
                </p>
              </div>

              {/* Accent line */}
              <div className="mt-8 flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-[#df8fa1]" />

                <span className="h-[2px] w-10 rounded-full bg-[#ead0d3] transition-all duration-300 group-hover:w-16 group-hover:bg-[#df8fa1]" />
              </div>

              {/* Bottom decorative corner */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-9 -right-9 h-24 w-24 rounded-full bg-[#f5dcda]/75"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   CUSTOM DOUGHY SVG ICONS
========================================================= */

function MilkIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
      aria-hidden="true"
    >
      <path
        d="M21 13C21 10.8 22.8 9 25 9H39C41.2 9 43 10.8 43 13V18H21V13Z"
        fill="#F5D5D8"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />

      <path
        d="M19 18H45L42 52C41.8 54.2 40 56 37.7 56H26.3C24 56 22.2 54.2 22 52L19 18Z"
        fill="#FFFDFC"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />

      <path
        d="M22 35H42L40.8 50.5C40.7 51.9 39.5 53 38 53H26C24.5 53 23.3 51.9 23.2 50.5L22 35Z"
        fill="#F4C7CF"
      />

      <path
        d="M19 18H45"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      />

      <path
        d="M27 13H37"
        stroke="#DF8FA1"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChefIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
      aria-hidden="true"
    >
      {/* Hat */}
      <path
        d="M20 29C15.8 28.5 13 25.4 13 21.5C13 17.4 16.4 14 20.5 14C21.4 14 22.3 14.2 23.1 14.5C24.8 10.7 28.2 8.5 32 8.5C35.9 8.5 39.3 10.7 40.9 14.5C41.8 14.2 42.7 14 43.5 14C47.7 14 51 17.4 51 21.5C51 25.4 48.2 28.5 44 29V37H20V29Z"
        fill="#FFFDFC"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />

      {/* Face */}
      <path
        d="M22 37H42V43C42 49.1 37.5 54 32 54C26.5 54 22 49.1 22 43V37Z"
        fill="#F7D8C5"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />

      {/* Neck / clothing */}
      <path
        d="M24.5 51C19.8 52.1 16 55.5 15 59H49C48 55.5 44.2 52.1 39.5 51"
        fill="#F4C8CF"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Eyes */}
      <circle cx="27.5" cy="42" r="1.5" fill="currentColor" />
      <circle cx="36.5" cy="42" r="1.5" fill="currentColor" />

      {/* Smile */}
      <path
        d="M28 47C29.1 48.2 30.5 49 32 49C33.5 49 34.9 48.2 36 47"
        stroke="#D77D91"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Pink hat accent */}
      <path
        d="M26 34H38"
        stroke="#DF8FA1"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DeliveryIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
      aria-hidden="true"
    >
      {/* Truck body */}
      <path
        d="M8 20H37V45H8V20Z"
        fill="#F4C7CF"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />

      {/* Truck cabin */}
      <path
        d="M37 29H47L55 37V45H37V29Z"
        fill="#F6D7C4"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />

      {/* Window */}
      <path
        d="M41 32H46L51 37H41V32Z"
        fill="#FFFDFC"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinejoin="round"
      />

      {/* Pink bakery stripe */}
      <path
        d="M12 27H33"
        stroke="#DF8FA1"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Wheels */}
      <circle
        cx="19"
        cy="46"
        r="6"
        fill="#FFFDFC"
        stroke="currentColor"
        strokeWidth="3.2"
      />

      <circle
        cx="46"
        cy="46"
        r="6"
        fill="#FFFDFC"
        stroke="currentColor"
        strokeWidth="3.2"
      />

      <circle cx="19" cy="46" r="2" fill="#DF8FA1" />
      <circle cx="46" cy="46" r="2" fill="#DF8FA1" />

      {/* Motion lines */}
      <path
        d="M5 31H1"
        stroke="#DF8FA1"
        strokeWidth="2.6"
        strokeLinecap="round"
      />

      <path
        d="M5 37H3"
        stroke="#DF8FA1"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
      aria-hidden="true"
    >
      <path
        d="M20.8 4.6C18.8 2.6 15.5 2.6 13.5 4.6L12 6.1L10.5 4.6C8.5 2.6 5.2 2.6 3.2 4.6C1.1 6.7 1.1 10 3.2 12L12 20.7L20.8 12C22.9 10 22.9 6.7 20.8 4.6Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M17.5 5.5C18.5 5.8 19.3 6.6 19.6 7.5"
        stroke="#DF8FA1"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}