"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";

export type StoreSettings = {
  id: number;
  store_name: string;
  support_email: string | null;
  phone: string | null;
  delivery_fee: number;
  minimum_order: number;
  default_eta_minutes: number;
  store_open: boolean;
  allow_cod: boolean;
  checkout_notice: string | null;
};

type StoreSettingsContextValue = {
  settings: StoreSettings;
  loading: boolean;
  error: string;
  refreshSettings: () => Promise<void>;
};

const DEFAULT_SETTINGS: StoreSettings = {
  id: 1,
  store_name: "Doughy",
  support_email: null,
  phone: null,
  delivery_fee: 50,
  minimum_order: 0,
  default_eta_minutes: 45,
  store_open: true,
  allow_cod: true,
  checkout_notice: null,
};

const StoreSettingsContext =
  createContext<StoreSettingsContextValue | null>(
    null
  );

function normalizeSettings(
  data: Record<string, unknown>
): StoreSettings {
  return {
    id: Number(data.id ?? 1),
    store_name:
      data.store_name
        ? String(data.store_name)
        : "Doughy",
    support_email:
      data.support_email
        ? String(data.support_email)
        : null,
    phone:
      data.phone
        ? String(data.phone)
        : null,
    delivery_fee: Number(
      data.delivery_fee ?? 50
    ),
    minimum_order: Number(
      data.minimum_order ?? 0
    ),
    default_eta_minutes: Number(
      data.default_eta_minutes ?? 45
    ),
    store_open:
      data.store_open ?? true
        ? true
        : false,
    allow_cod:
      data.allow_cod ?? true
        ? true
        : false,
    checkout_notice:
      data.checkout_notice
        ? String(data.checkout_notice)
        : null,
  };
}

export function StoreSettingsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [settings, setSettings] =
    useState<StoreSettings>(
      DEFAULT_SETTINGS
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function refreshSettings() {
    setError("");

    try {
      const {
        data,
        error: queryError,
      } = await supabase
        .from("store_settings")
        .select(
          "id, store_name, support_email, phone, delivery_fee, minimum_order, default_eta_minutes, store_open, allow_cod, checkout_notice"
        )
        .eq("id", 1)
        .maybeSingle();

      if (queryError) {
        console.warn(
          "Store settings context query failed:",
          queryError
        );

        setError(
          queryError.message
        );
        return;
      }

      if (data) {
        setSettings(
          normalizeSettings(
            data as Record<
              string,
              unknown
            >
          )
        );
      }
    } catch (error) {
      console.warn(
        "Store settings context failed:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load store settings."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshSettings();

    const channel = supabase
      .channel(
        "global-store-settings-context"
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
          setSettings(
            normalizeSettings(
              payload.new as Record<
                string,
                unknown
              >
            )
          );

          setLoading(false);
          setError("");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(
        channel
      );
    };
  }, []);

  const value = useMemo(
    () => ({
      settings,
      loading,
      error,
      refreshSettings,
    }),
    [settings, loading, error]
  );

  return (
    <StoreSettingsContext.Provider
      value={value}
    >
      {children}
    </StoreSettingsContext.Provider>
  );
}

export function useStoreSettings() {
  const context =
    useContext(
      StoreSettingsContext
    );

  if (!context) {
    throw new Error(
      "useStoreSettings must be used inside StoreSettingsProvider."
    );
  }

  return context;
}
