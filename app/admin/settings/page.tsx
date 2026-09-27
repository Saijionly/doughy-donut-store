"use client";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";

type FormState = {
  store_name: string;
  support_email: string;
  phone: string;
  delivery_fee: string;
  minimum_order: string;
  default_eta_minutes: string;
  store_open: boolean;
  allow_cod: boolean;
  checkout_notice: string;
};

const defaultForm: FormState = {
  store_name: "Doughy",
  support_email: "",
  phone: "",
  delivery_fee: "50",
  minimum_order: "0",
  default_eta_minutes: "45",
  store_open: true,
  allow_cod: true,
  checkout_notice:
    "Freshly made with love. Delivery times may vary depending on order volume.",
};

export default function AdminSettingsPage() {
  const [form, setForm] =
    useState<FormState>(defaultForm);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [lastUpdated, setLastUpdated] =
    useState<string | null>(null);

  function applyData(
    data: Record<string, unknown>
  ) {
    setForm({
      store_name:
        String(
          data.store_name ?? "Doughy"
        ),
      support_email:
        data.support_email
          ? String(data.support_email)
          : "",
      phone:
        data.phone
          ? String(data.phone)
          : "",
      delivery_fee:
        String(
          Number(
            data.delivery_fee ?? 0
          )
        ),
      minimum_order:
        String(
          Number(
            data.minimum_order ?? 0
          )
        ),
      default_eta_minutes:
        String(
          Number(
            data.default_eta_minutes ??
              45
          )
        ),
      store_open:
        Boolean(
          data.store_open ?? true
        ),
      allow_cod:
        Boolean(
          data.allow_cod ?? true
        ),
      checkout_notice:
        data.checkout_notice
          ? String(
              data.checkout_notice
            )
          : "",
    });

    setLastUpdated(
      data.updated_at
        ? String(data.updated_at)
        : null
    );
  }

  async function loadSettings() {
    setLoading(true);
    setErrorMessage("");

    try {
      const {
        data,
        error,
      } = await supabase
        .from("store_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();

      if (error) {
        console.warn(
          "Store settings query error:",
          error
        );

        setErrorMessage(
          `Supabase error: ${error.message}`
        );

        return;
      }

      if (!data) {
        setErrorMessage(
          "No store_settings row with id = 1 was returned."
        );

        return;
      }

      applyData(
        data as Record<
          string,
          unknown
        >
      );
    } catch (error) {
      console.warn(
        "Store settings unexpected error:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load store settings."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  function updateField<
    K extends keyof FormState,
  >(
    key: K,
    value: FormState[K]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));

    setMessage("");
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    const storeName =
      form.store_name.trim();

    const deliveryFee =
      Number(form.delivery_fee);

    const minimumOrder =
      Number(form.minimum_order);

    const eta =
      Number(
        form.default_eta_minutes
      );

    if (!storeName) {
      setErrorMessage(
        "Store name is required."
      );
      setSaving(false);
      return;
    }

    if (
      !Number.isFinite(deliveryFee) ||
      deliveryFee < 0
    ) {
      setErrorMessage(
        "Delivery fee must be 0 or higher."
      );
      setSaving(false);
      return;
    }

    if (
      !Number.isFinite(minimumOrder) ||
      minimumOrder < 0
    ) {
      setErrorMessage(
        "Minimum order must be 0 or higher."
      );
      setSaving(false);
      return;
    }

    if (
      !Number.isInteger(eta) ||
      eta < 1 ||
      eta > 1440
    ) {
      setErrorMessage(
        "Default ETA must be between 1 and 1440 minutes."
      );
      setSaving(false);
      return;
    }

    try {
      const updatedAt =
        new Date().toISOString();

      const {
        data,
        error,
      } = await supabase
        .from("store_settings")
        .update({
          store_name: storeName,
          support_email:
            form.support_email.trim() ||
            null,
          phone:
            form.phone.trim() ||
            null,
          delivery_fee:
            deliveryFee,
          minimum_order:
            minimumOrder,
          default_eta_minutes:
            eta,
          store_open:
            form.store_open,
          allow_cod:
            form.allow_cod,
          checkout_notice:
            form.checkout_notice.trim() ||
            null,
          updated_at:
            updatedAt,
        })
        .eq("id", 1)
        .select("*")
        .maybeSingle();

      if (error) {
        console.warn(
          "Store settings update error:",
          error
        );

        setErrorMessage(
          `Save failed: ${error.message}`
        );

        return;
      }

      if (data) {
        applyData(
          data as Record<
            string,
            unknown
          >
        );
      }

      setMessage(
        "Store settings saved successfully."
      );
    } catch (error) {
      console.warn(
        "Store settings save error:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to save settings."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f7eee9] px-5 py-8 text-[#2d2424] sm:px-7 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href="/admin"
              className="text-sm font-black text-[#c97888]"
            >
              ← Dashboard
            </Link>

            <p className="mt-7 text-xs font-black uppercase tracking-[0.22em] text-[#c97888]">
              Doughy Admin
            </p>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              Store Settings
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-[#806e6e]">
              Manage store information,
              delivery defaults, and
              checkout availability.
            </p>
          </div>

          <button
            type="button"
            onClick={loadSettings}
            disabled={loading}
            className="w-fit rounded-full bg-[#fff8f5] px-5 py-3 text-xs font-black text-[#806e6e] shadow-[5px_5px_12px_#d8c5c0,-4px_-4px_10px_#ffffff] disabled:opacity-60"
          >
            {loading
              ? "Loading..."
              : "↻ Refresh"}
          </button>
        </div>

        {loading && (
          <div className="mt-7 rounded-[22px] bg-[#fff8f5] px-5 py-4 text-sm font-bold text-[#806e6e] shadow-[5px_5px_12px_#d8c5c0,-4px_-4px_10px_#ffffff]">
            Loading store settings...
          </div>
        )}

        {message && (
          <div className="mt-7 rounded-[22px] border border-[#bfe0c8] bg-[#e4f6e9] px-5 py-4 text-sm font-black text-[#4f8a61]">
            ✓ {message}
          </div>
        )}

        {errorMessage && (
          <div className="mt-7 rounded-[22px] border border-[#efb9c1] bg-[#fce4e7] px-5 py-4 text-sm font-bold leading-6 text-[#a84f61]">
            <p>
              ✕ {errorMessage}
            </p>

            <p className="mt-2 text-xs font-semibold">
              The form stays visible so
              you can immediately see if
              this is a Supabase/RLS
              problem instead of getting
              a blank page.
            </p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-7 space-y-7"
        >
          <section className="rounded-[28px] bg-[#fff8f5] p-6 shadow-[8px_8px_18px_#d8c5c0,-7px_-7px_16px_#ffffff]">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#c97888]">
              Store Information
            </p>

            <h2 className="mt-2 text-xl font-black">
              Business Details
            </h2>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label>
                <span className="text-xs font-black text-[#806e6e]">
                  STORE NAME
                </span>

                <input
                  value={
                    form.store_name
                  }
                  onChange={(e) =>
                    updateField(
                      "store_name",
                      e.target.value
                    )
                  }
                  className="mt-2 w-full rounded-[18px] bg-[#f9ebe2] px-5 py-4 font-bold outline-none ring-[#e8a0ad] focus:ring-2"
                />
              </label>

              <label>
                <span className="text-xs font-black text-[#806e6e]">
                  SUPPORT EMAIL
                </span>

                <input
                  type="email"
                  value={
                    form.support_email
                  }
                  onChange={(e) =>
                    updateField(
                      "support_email",
                      e.target.value
                    )
                  }
                  placeholder="support@example.com"
                  className="mt-2 w-full rounded-[18px] bg-[#f9ebe2] px-5 py-4 font-bold outline-none ring-[#e8a0ad] focus:ring-2"
                />
              </label>

              <label className="md:col-span-2">
                <span className="text-xs font-black text-[#806e6e]">
                  CONTACT NUMBER
                </span>

                <input
                  value={form.phone}
                  onChange={(e) =>
                    updateField(
                      "phone",
                      e.target.value
                    )
                  }
                  placeholder="+63..."
                  className="mt-2 w-full rounded-[18px] bg-[#f9ebe2] px-5 py-4 font-bold outline-none ring-[#e8a0ad] focus:ring-2"
                />
              </label>
            </div>
          </section>

          <section className="rounded-[28px] bg-[#fff8f5] p-6 shadow-[8px_8px_18px_#d8c5c0,-7px_-7px_16px_#ffffff]">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#c97888]">
              Orders & Delivery
            </p>

            <h2 className="mt-2 text-xl font-black">
              Checkout Defaults
            </h2>

            <div className="mt-6 grid gap-5 md:grid-cols-3">
              <label>
                <span className="text-xs font-black text-[#806e6e]">
                  DELIVERY FEE
                </span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    form.delivery_fee
                  }
                  onChange={(e) =>
                    updateField(
                      "delivery_fee",
                      e.target.value
                    )
                  }
                  className="mt-2 w-full rounded-[18px] bg-[#f9ebe2] px-5 py-4 font-bold outline-none ring-[#e8a0ad] focus:ring-2"
                />
              </label>

              <label>
                <span className="text-xs font-black text-[#806e6e]">
                  MINIMUM ORDER
                </span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    form.minimum_order
                  }
                  onChange={(e) =>
                    updateField(
                      "minimum_order",
                      e.target.value
                    )
                  }
                  className="mt-2 w-full rounded-[18px] bg-[#f9ebe2] px-5 py-4 font-bold outline-none ring-[#e8a0ad] focus:ring-2"
                />
              </label>

              <label>
                <span className="text-xs font-black text-[#806e6e]">
                  DEFAULT ETA (MIN)
                </span>

                <input
                  type="number"
                  min="1"
                  max="1440"
                  value={
                    form.default_eta_minutes
                  }
                  onChange={(e) =>
                    updateField(
                      "default_eta_minutes",
                      e.target.value
                    )
                  }
                  className="mt-2 w-full rounded-[18px] bg-[#f9ebe2] px-5 py-4 font-bold outline-none ring-[#e8a0ad] focus:ring-2"
                />
              </label>
            </div>
          </section>

          <section className="grid gap-5 md:grid-cols-2">
            <button
              type="button"
              onClick={() =>
                updateField(
                  "store_open",
                  !form.store_open
                )
              }
              className={`rounded-[28px] border-2 p-6 text-left ${
                form.store_open
                  ? "border-[#bfe0c8] bg-[#e4f6e9]"
                  : "border-[#efb9c1] bg-[#fce4e7]"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-black">
                    Store Status
                  </p>

                  <p className="mt-2 text-xs font-semibold text-[#806e6e]">
                    Accept or stop new
                    customer orders.
                  </p>
                </div>

                <span className={`rounded-full px-4 py-2 text-xs font-black text-white ${form.store_open ? "bg-[#4f8a61]" : "bg-[#a84f61]"}`}>
                  {form.store_open
                    ? "OPEN"
                    : "CLOSED"}
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                updateField(
                  "allow_cod",
                  !form.allow_cod
                )
              }
              className={`rounded-[28px] border-2 p-6 text-left ${
                form.allow_cod
                  ? "border-[#bfe0c8] bg-[#e4f6e9]"
                  : "border-[#ead8d0] bg-[#f9ebe2]"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-black">
                    Cash on Delivery
                  </p>

                  <p className="mt-2 text-xs font-semibold text-[#806e6e]">
                    Enable or disable COD.
                  </p>
                </div>

                <span className={`rounded-full px-4 py-2 text-xs font-black text-white ${form.allow_cod ? "bg-[#4f8a61]" : "bg-[#806e6e]"}`}>
                  {form.allow_cod
                    ? "ENABLED"
                    : "DISABLED"}
                </span>
              </div>
            </button>
          </section>

          <section className="rounded-[28px] bg-[#fff8f5] p-6 shadow-[8px_8px_18px_#d8c5c0,-7px_-7px_16px_#ffffff]">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#c97888]">
              Customer Message
            </p>

            <h2 className="mt-2 text-xl font-black">
              Checkout Notice
            </h2>

            <textarea
              rows={5}
              maxLength={500}
              value={
                form.checkout_notice
              }
              onChange={(e) =>
                updateField(
                  "checkout_notice",
                  e.target.value
                )
              }
              className="mt-5 w-full resize-none rounded-[20px] bg-[#f9ebe2] px-5 py-4 font-semibold leading-7 outline-none ring-[#e8a0ad] focus:ring-2"
            />
          </section>

          <div className="flex flex-col gap-4 rounded-[28px] bg-[#fff8f5] p-5 shadow-[8px_8px_18px_#d8c5c0,-7px_-7px_16px_#ffffff] sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#a58f8f]">
                Last Updated
              </p>

              <p className="mt-1 text-sm font-bold text-[#806e6e]">
                {lastUpdated
                  ? new Date(
                      lastUpdated
                    ).toLocaleString(
                      "en-PH"
                    )
                  : "Not available"}
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-[#e8a0ad] px-7 py-3.5 text-sm font-black text-white transition hover:bg-[#d88a9a] disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
