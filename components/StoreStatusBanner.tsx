"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";

type StoreStatus = {
  store_name: string;
  support_email: string | null;
  phone: string | null;
  store_open: boolean;
  checkout_notice: string | null;
};

const DEFAULT_STATUS: StoreStatus = {
  store_name: "Doughy",
  support_email: null,
  phone: null,
  store_open: true,
  checkout_notice: null,
};

export default function StoreStatusBanner() {
  const [settings, setSettings] =
    useState<StoreStatus>(
      DEFAULT_STATUS
    );

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      try {
        const {
          data,
          error,
        } = await supabase
          .from("store_settings")
          .select(
            "store_name, support_email, phone, store_open, checkout_notice"
          )
          .eq("id", 1)
          .maybeSingle();

        if (error) {
          console.warn(
            "Store status loading failed:",
            error
          );
          return;
        }

        if (!active || !data) {
          return;
        }

        setSettings({
          store_name:
            data.store_name ||
            "Doughy",
          support_email:
            data.support_email ||
            null,
          phone:
            data.phone || null,
          store_open:
            data.store_open ??
            true,
          checkout_notice:
            data.checkout_notice ||
            null,
        });
      } catch (error) {
        console.warn(
          "Unable to load store status:",
          error
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSettings();

    const channel = supabase
      .channel(
        "public-store-status"
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "store_settings",
          filter: "id=eq.1",
        },
        (payload) => {
          const data =
            payload.new as Record<
              string,
              unknown
            >;

          setSettings({
            store_name:
              data.store_name
                ? String(
                    data.store_name
                  )
                : "Doughy",
            support_email:
              data.support_email
                ? String(
                    data.support_email
                  )
                : null,
            phone:
              data.phone
                ? String(data.phone)
                : null,
            store_open:
              Boolean(
                data.store_open ??
                true
              ),
            checkout_notice:
              data.checkout_notice
                ? String(
                    data.checkout_notice
                  )
                : null,
          });
        }
      )
      .subscribe();

    return () => {
      active = false;

      supabase.removeChannel(
        channel
      );
    };
  }, []);

  if (loading) {
    return null;
  }

  if (settings.store_open) {
    return (
      <div className="border-b border-[#d5eadb] bg-[#edf8f0] px-4 py-2.5 text-[#477655]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-1 text-center sm:flex-row sm:gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#69a77a] opacity-40" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#5b996d]" />
            </span>

            <p className="text-xs font-black uppercase tracking-[0.12em]">
              {settings.store_name} is
              open
            </p>
          </div>

          <span className="hidden text-[#9bc2a6] sm:inline">
            •
          </span>

          <p className="text-xs font-semibold">
            We&apos;re accepting orders
            now.
          </p>

          <Link
            href="/products"
            className="ml-1 text-xs font-black underline decoration-2 underline-offset-2 transition hover:opacity-70"
          >
            Shop now →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-[#efc2ca] bg-[#fce4e7] px-4 py-3 text-[#9c4f5d]">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-2 text-center sm:flex-row sm:gap-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#a84f61]" />

          <p className="text-xs font-black uppercase tracking-[0.12em]">
            {settings.store_name} is
            currently closed
          </p>
        </div>

        <span className="hidden text-[#d39aa5] sm:inline">
          •
        </span>

        <p className="text-xs font-semibold">
          You can still browse our
          products, but checkout is
          temporarily unavailable.
        </p>

        {(settings.support_email ||
          settings.phone) && (
          <div className="flex items-center gap-2">
            {settings.support_email && (
              <a
                href={`mailto:${settings.support_email}`}
                className="text-xs font-black underline decoration-2 underline-offset-2"
              >
                Contact us
              </a>
            )}

            {settings.support_email &&
              settings.phone && (
                <span>•</span>
              )}

            {settings.phone && (
              <a
                href={`tel:${settings.phone.replace(
                  /\s+/g,
                  ""
                )}`}
                className="text-xs font-black underline decoration-2 underline-offset-2"
              >
                Call store
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
