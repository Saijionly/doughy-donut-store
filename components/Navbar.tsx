"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useCart } from "@/app/context/CartContext";
import { useStoreSettings } from "@/app/context/StoreSettingsContext";
import CartDrawer from "@/components/CartDrawer";

type HomeSection =
  | "home"
  | "categories"
  | "about";

export default function Navbar() {
  const pathname = usePathname();

  const [isCartOpen, setIsCartOpen] =
    useState(false);

  const [
    isMobileMenuOpen,
    setIsMobileMenuOpen,
  ] = useState(false);

  const [activeSection, setActiveSection] =
    useState<HomeSection>("home");

  const [isScrolled, setIsScrolled] =
    useState(false);

  const [
    isNavbarVisible,
    setIsNavbarVisible,
  ] = useState(true);

  const { cartCount } = useCart();

  const {
    settings,
    loading: settingsLoading,
  } = useStoreSettings();

  const storeName =
    settings.store_name || "Doughy";

  const storeOpen =
    settings.store_open;

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  /*
  ========================================
  NAVBAR SCROLL
  ========================================
  */

  useEffect(() => {
    let lastScrollY = window.scrollY;

    function handleScroll() {
      const currentScrollY =
        window.scrollY;

      setIsScrolled(
        currentScrollY > 40
      );

      if (currentScrollY < 80) {
        setIsNavbarVisible(true);
        lastScrollY =
          currentScrollY;

        return;
      }

      if (
        isMobileMenuOpen ||
        isCartOpen
      ) {
        setIsNavbarVisible(true);
        lastScrollY =
          currentScrollY;

        return;
      }

      const difference =
        currentScrollY -
        lastScrollY;

      if (
        Math.abs(difference) < 6
      ) {
        return;
      }

      if (difference > 0) {
        setIsNavbarVisible(false);
      } else {
        setIsNavbarVisible(true);
      }

      lastScrollY =
        currentScrollY;
    }

    handleScroll();

    window.addEventListener(
      "scroll",
      handleScroll,
      {
        passive: true,
      }
    );

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll
      );
    };
  }, [
    isMobileMenuOpen,
    isCartOpen,
  ]);

  /*
  ========================================
  HOMEPAGE ACTIVE SECTION
  ========================================
  */

  useEffect(() => {
    if (pathname !== "/") {
      return;
    }

    const sections = [
      document.getElementById(
        "home"
      ),
      document.getElementById(
        "categories"
      ),
      document.getElementById(
        "about"
      ),
    ].filter(
      Boolean
    ) as HTMLElement[];

    if (!sections.length) {
      return;
    }

    const observer =
      new IntersectionObserver(
        (entries) => {
          const visibleEntries =
            entries.filter(
              (entry) =>
                entry.isIntersecting
            );

          if (
            !visibleEntries.length
          ) {
            return;
          }

          const mostVisible =
            visibleEntries.reduce(
              (
                previous,
                current
              ) =>
                current.intersectionRatio >
                previous.intersectionRatio
                  ? current
                  : previous
            );

          const id =
            mostVisible.target.id;

          if (
            id === "home" ||
            id ===
              "categories" ||
            id === "about"
          ) {
            setActiveSection(id);
          }
        },
        {
          root: null,

          rootMargin:
            "-15% 0px -55% 0px",

          threshold: [
            0,
            0.1,
            0.25,
            0.5,
            0.75,
            1,
          ],
        }
      );

    sections.forEach(
      (section) => {
        observer.observe(
          section
        );
      }
    );

    return () => {
      observer.disconnect();
    };
  }, [pathname]);

  /*
  ========================================
  ACTIVE ROUTE
  ========================================
  */

  function isActive(
    path: string
  ) {
    if (path === "/") {
      return (
        pathname === "/" &&
        activeSection === "home"
      );
    }

    if (path === "/shop") {
      return pathname.startsWith(
        "/shop"
      );
    }

    if (
      path === "/track-order"
    ) {
      return (
        pathname ===
          "/track-order" ||
        pathname.startsWith(
          "/orders/"
        )
      );
    }

    return pathname === path;
  }

  function isSectionActive(
    section: HomeSection
  ) {
    return (
      pathname === "/" &&
      activeSection === section
    );
  }

  /*
  ========================================
  DESKTOP LINK
  ========================================
  */

  function desktopLinkClass(
    active: boolean
  ) {
    const base =
      "relative whitespace-nowrap py-2 text-sm font-semibold transition-all duration-300";

    if (active) {
      return `${base}
        text-[#c97888]
        after:absolute
        after:bottom-0
        after:left-1/2
        after:h-[3px]
        after:w-full
        after:-translate-x-1/2
        after:rounded-full
        after:bg-[#e8a0ad]
        after:shadow-[0_2px_8px_rgba(232,160,173,0.55)]
        after:transition-all
        after:duration-300
      `;
    }

    return `${base}
      text-[#5f4d4d]
      hover:text-[#c97888]
      after:absolute
      after:bottom-0
      after:left-1/2
      after:h-[3px]
      after:w-0
      after:-translate-x-1/2
      after:rounded-full
      after:bg-[#e8a0ad]
      after:transition-all
      after:duration-300
      hover:after:w-full
    `;
  }

  /*
  ========================================
  MOBILE LINK
  ========================================
  */

  function mobileLinkClass(
    active: boolean
  ) {
    const base =
      "flex items-center justify-between rounded-2xl px-5 py-3.5 text-sm font-bold transition-all duration-300";

    if (active) {
      return `${base}
        bg-[#f4ded8]
        text-[#c97888]
        shadow-[inset_3px_3px_7px_#ddc8c2,inset_-3px_-3px_7px_#ffffff]
      `;
    }

    return `${base}
      text-[#5f4d4d]
      hover:bg-[#f9ebe2]
      hover:text-[#c97888]
    `;
  }

  return (
    <>
      <div
        className={`
          sticky
          top-0
          z-30
          w-full
          transition-all
          duration-500
          ease-out

          ${
            isScrolled
              ? "px-3 pt-3 sm:px-5 lg:px-8"
              : "px-0 pt-0"
          }

          ${
            isNavbarVisible
              ? "translate-y-0 opacity-100"
              : "-translate-y-[140%] opacity-0"
          }
        `}
      >
        <nav
          className={`
            mx-auto
            transition-all
            duration-500
            ease-out

            ${
              isScrolled
                ? `
                  max-w-6xl
                  rounded-[28px]
                  border
                  border-white/60
                  bg-[#fff8f5]/75
                  px-4
                  py-2.5
                  shadow-[0_12px_40px_rgba(107,73,73,0.16),0_2px_8px_rgba(107,73,73,0.06)]
                  backdrop-blur-2xl
                  sm:px-5
                  lg:px-6
                `
                : `
                  max-w-none
                  rounded-none
                  border-b
                  border-[#ead8d0]/50
                  bg-[#f7eee9]/95
                  px-5
                  py-5
                  shadow-none
                  backdrop-blur-md
                  sm:px-6
                  lg:px-10
                `
            }
          `}
        >
          <div
            className={`
              mx-auto
              flex
              items-center
              justify-between
              transition-all
              duration-500

              ${
                isScrolled
                  ? "max-w-none"
                  : "max-w-7xl"
              }
            `}
          >
            {/* ================= LOGO ================= */}

            <div className="flex shrink-0 items-center gap-3">
              <Link
                href="/#home"
                onClick={
                  closeMobileMenu
                }
                className={`
                  shrink-0
                  font-black
                  tracking-tight
                  text-[#2d2424]
                  transition-all
                  duration-500

                  ${
                    isScrolled
                      ? "text-xl sm:text-[22px]"
                      : "text-2xl sm:text-[26px]"
                  }
                `}
              >
                {storeName}

                <span className="text-[#e8a0ad]">
                  .
                </span>
              </Link>

              {/* Store Status - Desktop */}

              {!settingsLoading && (
                <div
                  title={
                    storeOpen
                      ? `${storeName} is open`
                      : `${storeName} is closed`
                  }
                  className={`
                    hidden
                    items-center
                    gap-1.5
                    rounded-full
                    px-2.5
                    py-1
                    text-[10px]
                    font-black
                    uppercase
                    tracking-wide
                    sm:inline-flex

                    ${
                      storeOpen
                        ? "bg-[#e4f6e9] text-[#4f8a61]"
                        : "bg-[#fce4e7] text-[#a84f61]"
                    }
                  `}
                >
                  <span className="relative flex h-2 w-2">
                    {storeOpen && (
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#6aa67a] opacity-50" />
                    )}

                    <span
                      className={`relative inline-flex h-2 w-2 rounded-full ${
                        storeOpen
                          ? "bg-[#4f8a61]"
                          : "bg-[#a84f61]"
                      }`}
                    />
                  </span>

                  {storeOpen
                    ? "Open"
                    : "Closed"}
                </div>
              )}
            </div>

            {/* ================= DESKTOP NAV ================= */}

            <div
              className={`
                hidden
                items-center
                transition-all
                duration-500
                md:flex

                ${
                  isScrolled
                    ? "gap-5 lg:gap-7"
                    : "gap-6 lg:gap-8"
                }
              `}
            >
              <Link
                href="/#home"
                className={desktopLinkClass(
                  pathname === "/" &&
                    activeSection ===
                      "home"
                )}
              >
                Home
              </Link>

              <Link
                href="/#categories"
                className={desktopLinkClass(
                  isSectionActive(
                    "categories"
                  )
                )}
              >
                Menu
              </Link>

              <Link
                href="/shop"
                className={desktopLinkClass(
                  isActive("/shop")
                )}
              >
                Shop
              </Link>

              <Link
                href="/track-order"
                className={desktopLinkClass(
                  isActive(
                    "/track-order"
                  )
                )}
              >
                Track Order
              </Link>

              <Link
                href="/#about"
                className={desktopLinkClass(
                  isSectionActive(
                    "about"
                  )
                )}
              >
                About
              </Link>
            </div>

            {/* ================= RIGHT SIDE ================= */}

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              {/* Mobile Store Status */}

              {!settingsLoading && (
                <div
                  className={`
                    flex
                    h-9
                    items-center
                    gap-1.5
                    rounded-full
                    px-3
                    text-[10px]
                    font-black
                    sm:hidden

                    ${
                      storeOpen
                        ? "bg-[#e4f6e9] text-[#4f8a61]"
                        : "bg-[#fce4e7] text-[#a84f61]"
                    }
                  `}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      storeOpen
                        ? "bg-[#4f8a61]"
                        : "bg-[#a84f61]"
                    }`}
                  />

                  {storeOpen
                    ? "Open"
                    : "Closed"}
                </div>
              )}

              {/* Mobile Menu */}

              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(
                    (previous) =>
                      !previous
                  );

                  setIsNavbarVisible(
                    true
                  );
                }}
                className={`
                  flex
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-white/50
                  bg-[#fff8f5]/90
                  text-xl
                  shadow-[4px_4px_10px_rgba(184,155,150,0.35),-3px_-3px_8px_rgba(255,255,255,0.8)]
                  transition-all
                  duration-300
                  hover:-translate-y-0.5
                  hover:bg-white
                  md:hidden

                  ${
                    isScrolled
                      ? "h-10 w-10"
                      : "h-11 w-11"
                  }
                `}
                aria-label={
                  isMobileMenuOpen
                    ? "Close navigation menu"
                    : "Open navigation menu"
                }
                aria-expanded={
                  isMobileMenuOpen
                }
              >
                <span className="h-5 w-5 text-[#5f4d4d]">
                  {isMobileMenuOpen ? (
                    <CloseIcon />
                  ) : (
                    <MenuIcon />
                  )}
                </span>
              </button>

              {/* Cart */}

              <button
                type="button"
                data-cart-icon
                onClick={() => {
                  setIsCartOpen(true);

                  setIsMobileMenuOpen(
                    false
                  );

                  setIsNavbarVisible(
                    true
                  );
                }}
                className={`
                  relative
                  flex
                  items-center
                  justify-center
                  rounded-full
                  border
                  text-xl
                  shadow-[4px_4px_10px_rgba(184,155,150,0.35),-3px_-3px_8px_rgba(255,255,255,0.8)]
                  transition-all
                  duration-300
                  hover:-translate-y-0.5

                  ${
                    isScrolled
                      ? "h-10 w-10 sm:h-11 sm:w-11"
                      : "h-11 w-11 sm:h-12 sm:w-12"
                  }

                  ${
                    pathname ===
                      "/cart" ||
                    pathname ===
                      "/checkout"
                      ? "bg-[#f4ded8] ring-2 ring-[#e8a0ad]/40"
                      : "bg-[#fff8f5]/90"
                  }

                  ${
                    storeOpen
                      ? "border-white/50 hover:bg-white"
                      : "border-[#efb9c1] bg-[#fce4e7] hover:bg-[#f9dce1]"
                  }
                `}
                aria-label={
                  storeOpen
                    ? "Open shopping cart"
                    : "Open shopping cart - store currently closed"
                }
                title={
                  storeOpen
                    ? "Shopping Cart"
                    : "Store Closed — you can still view your cart"
                }
              >
                <span className="h-5 w-5 text-[#5f4d4d] sm:h-[22px] sm:w-[22px]">
                  <CartIcon />
                </span>

                {cartCount > 0 && (
                  <span
                    className={`
                      absolute
                      -right-1
                      -top-1
                      flex
                      items-center
                      justify-center
                      rounded-full
                      px-1
                      font-black
                      text-white
                      shadow-[0_3px_8px_rgba(201,120,136,0.35)]
                      transition-all
                      duration-300

                      ${
                        storeOpen
                          ? "bg-[#e8a0ad]"
                          : "bg-[#a84f61]"
                      }

                      ${
                        isScrolled
                          ? "h-5 min-w-5 text-[10px]"
                          : "h-6 min-w-6 text-xs"
                      }
                    `}
                  >
                    {cartCount > 99
                      ? "99+"
                      : cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* ========================================
              MOBILE NAVIGATION
          ======================================== */}

          <div
            className={`
              overflow-hidden
              transition-all
              duration-500
              ease-out
              md:hidden

              ${
                isMobileMenuOpen
                  ? "mt-4 max-h-[650px] opacity-100"
                  : "mt-0 max-h-0 opacity-0"
              }
            `}
          >
            <div
              className={`
                p-3
                transition-all
                duration-500

                ${
                  isScrolled
                    ? `
                      rounded-[22px]
                      border
                      border-white/50
                      bg-[#fff8f5]/70
                      shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]
                      backdrop-blur-xl
                    `
                    : `
                      rounded-[26px]
                      bg-[#fff8f5]
                      shadow-[7px_7px_16px_#d8c5c0,-5px_-5px_13px_#ffffff]
                    `
                }
              `}
            >
              {/* Mobile Store Status Card */}

              {!settingsLoading && (
                <div
                  className={`mb-3 rounded-[20px] px-5 py-4 ${
                    storeOpen
                      ? "bg-[#e4f6e9]"
                      : "bg-[#fce4e7]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p
                        className={`text-sm font-black ${
                          storeOpen
                            ? "text-[#4f8a61]"
                            : "text-[#a84f61]"
                        }`}
                      >
                        {storeOpen
                          ? `${storeName} is Open`
                          : `${storeName} is Closed`}
                      </p>

                      <p className="mt-1 text-[11px] font-semibold text-[#806e6e]">
                        {storeOpen
                          ? "We are currently accepting orders."
                          : "Browsing is available, but ordering is temporarily disabled."}
                      </p>
                    </div>

                    <span
                      className={`relative flex h-3 w-3 shrink-0 rounded-full ${
                        storeOpen
                          ? "bg-[#4f8a61]"
                          : "bg-[#a84f61]"
                      }`}
                    >
                      {storeOpen && (
                        <span className="absolute inset-0 animate-ping rounded-full bg-[#6aa67a] opacity-50" />
                      )}
                    </span>
                  </div>
                </div>
              )}

              {/* Home */}

              <Link
                href="/#home"
                onClick={
                  closeMobileMenu
                }
                className={mobileLinkClass(
                  pathname === "/" &&
                    activeSection ===
                      "home"
                )}
              >
                <span>Home</span>

                {pathname === "/" &&
                  activeSection ===
                    "home" && (
                    <span className="h-2 w-2 rounded-full bg-[#e8a0ad]" />
                  )}
              </Link>

              {/* Menu */}

              <Link
                href="/#categories"
                onClick={
                  closeMobileMenu
                }
                className={mobileLinkClass(
                  isSectionActive(
                    "categories"
                  )
                )}
              >
                <span>Menu</span>

                {isSectionActive(
                  "categories"
                ) && (
                  <span className="h-2 w-2 rounded-full bg-[#e8a0ad]" />
                )}
              </Link>

              {/* Shop */}

              <Link
                href="/shop"
                onClick={
                  closeMobileMenu
                }
                className={mobileLinkClass(
                  isActive("/shop")
                )}
              >
                <span>Shop</span>

                {isActive(
                  "/shop"
                ) && (
                  <span className="h-2 w-2 rounded-full bg-[#e8a0ad]" />
                )}
              </Link>

              {/* Track Order */}

              <Link
                href="/track-order"
                onClick={
                  closeMobileMenu
                }
                className={mobileLinkClass(
                  isActive(
                    "/track-order"
                  )
                )}
              >
                <span>
                  Track Order
                </span>

                <div className="flex items-center gap-2">
                  {isActive(
                    "/track-order"
                  ) && (
                    <span className="h-2 w-2 rounded-full bg-[#e8a0ad]" />
                  )}

                  <span className="h-5 w-5 text-[#c97888]">
                    <PackageIcon />
                  </span>
                </div>
              </Link>

              {/* About */}

              <Link
                href="/#about"
                onClick={
                  closeMobileMenu
                }
                className={mobileLinkClass(
                  isSectionActive(
                    "about"
                  )
                )}
              >
                <span>About</span>

                {isSectionActive(
                  "about"
                ) && (
                  <span className="h-2 w-2 rounded-full bg-[#e8a0ad]" />
                )}
              </Link>
            </div>
          </div>
        </nav>
      </div>

      {/* ========================================
          CART DRAWER
      ======================================== */}

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() =>
          setIsCartOpen(false)
        }
      />
    </>
  );
}

/* =========================================================
   DOUGHY NAVBAR SVG ICONS
========================================================= */

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      <path
        d="M5 7H19M5 12H19M5 17H19"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      <path
        d="M7 7L17 17M17 7L7 17"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CartIcon() {
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
    </svg>
  );
}

function PackageIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      <path
        d="M4 7L12 3L20 7L12 11L4 7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M4 7V16L12 21V11L4 7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M20 7V16L12 21V11L20 7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M8 5L16 9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

