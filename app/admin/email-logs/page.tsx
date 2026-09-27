"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";

type OrderEmailLog = {
  id: number;
  order_id: number;
  email_type: string;
  recipient: string;
  subject: string;
  status: "sent" | "failed";
  provider_email_id: string | null;
  error_message: string | null;
  created_at: string;
};

const EMAIL_TYPE_OPTIONS = [
  {
    value: "All",
    label: "All Email Types",
  },
  {
    value: "confirmation",
    label: "Order Confirmation",
  },
  {
    value: "confirmation_resend",
    label: "Confirmation Resent",
  },
  {
    value: "status_confirmed",
    label: "Confirmed Update",
  },
  {
    value: "status_preparing",
    label: "Preparing Update",
  },
  {
    value: "status_out_for_delivery",
    label: "Out for Delivery",
  },
  {
    value: "status_completed",
    label: "Delivered Update",
  },
  {
    value: "status_cancelled",
    label: "Cancelled Update",
  },
];

export default function AdminEmailLogsPage() {
  const [logs, setLogs] =
    useState<OrderEmailLog[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [typeFilter, setTypeFilter] =
    useState("All");

  const [
    realtimeConnected,
    setRealtimeConnected,
  ] = useState(false);

  /*
  ========================================
  LOAD EMAIL LOGS
  ========================================
  */

  async function loadLogs(
    showLoading = true
  ) {
    if (showLoading) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    setErrorMessage("");

    try {
      const {
        data,
        error,
      } = await supabase
        .from("order_email_logs")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      setLogs(
        (data || []) as OrderEmailLog[]
      );
    } catch (error) {
      console.warn(
        "Email logs loading failed:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load email logs."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  /*
  ========================================
  INITIAL LOAD + REALTIME
  ========================================
  */

  useEffect(() => {
    loadLogs();

    const channel = supabase
      .channel(
        "admin-email-logs-realtime"
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "order_email_logs",
        },
        (payload) => {
          const newLog =
            payload.new as OrderEmailLog;

          setLogs((current) => {
            if (
              current.some(
                (item) =>
                  item.id === newLog.id
              )
            ) {
              return current;
            }

            return [
              newLog,
              ...current,
            ].sort(
              (a, b) =>
                new Date(
                  b.created_at
                ).getTime() -
                new Date(
                  a.created_at
                ).getTime()
            );
          });
        }
      )
      .subscribe((status) => {
        setRealtimeConnected(
          status === "SUBSCRIBED"
        );
      });

    return () => {
      setRealtimeConnected(false);
      supabase.removeChannel(channel);
    };
  }, []);

  /*
  ========================================
  HELPERS
  ========================================
  */

  function formatDate(
    value: string
  ) {
    return new Date(
      value
    ).toLocaleString(
      "en-PH",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  }

  function formatEmailType(
    value: string
  ) {
    const labels:
      Record<string, string> = {
        confirmation:
          "Order Confirmation",
        confirmation_resend:
          "Confirmation Resent",
        status_pending:
          "Pending Update",
        status_confirmed:
          "Confirmed Update",
        status_preparing:
          "Preparing Update",
        status_out_for_delivery:
          "Out for Delivery Update",
        status_completed:
          "Delivered Update",
        status_cancelled:
          "Cancelled Update",
      };

    return (
      labels[value] ||
      value
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) =>
          letter.toUpperCase()
        )
    );
  }

  /*
  ========================================
  FILTERS
  ========================================
  */

  const filteredLogs =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return logs.filter((log) => {
        const matchesSearch =
          !query ||
          String(log.order_id)
            .includes(query) ||
          (log.recipient || "")
            .toLowerCase()
            .includes(query) ||
          (log.subject || "")
            .toLowerCase()
            .includes(query) ||
          formatEmailType(
            log.email_type
          )
            .toLowerCase()
            .includes(query);

        const matchesStatus =
          statusFilter === "All" ||
          log.status ===
            statusFilter;

        const matchesType =
          typeFilter === "All" ||
          log.email_type ===
            typeFilter;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesType
        );
      });
    }, [
      logs,
      search,
      statusFilter,
      typeFilter,
    ]);

  /*
  ========================================
  STATISTICS
  ========================================
  */

  const totalEmails =
    logs.length;

  const sentEmails =
    logs.filter(
      (log) => log.status === "sent"
    ).length;

  const failedEmails =
    logs.filter(
      (log) =>
        log.status === "failed"
    ).length;

  const successRate =
    totalEmails > 0
      ? Math.round(
          (sentEmails /
            totalEmails) *
            100
        )
      : 0;

  /*
  ========================================
  LOADING
  ========================================
  */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7eee9] px-6 py-10 text-[#2d2424]">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[30px] bg-[#fff8f5] p-16 text-center shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff]">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#f1d8d1] border-t-[#e8a0ad]" />

            <p className="mt-5 text-sm font-bold text-[#806e6e]">
              Loading email activity...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7eee9] px-6 py-10 text-[#2d2424]">
      <div className="mx-auto max-w-7xl">
        {/* ========================================
            HEADER
        ======================================== */}

        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              href="/admin"
              className="text-sm font-bold text-[#c97888] transition hover:text-[#a85f70]"
            >
              ← Back to Dashboard
            </Link>

            <p className="mt-8 text-sm font-bold uppercase tracking-[0.25em] text-[#c97888]">
              Doughy Admin
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
              Email Logs
            </h1>

            <p className="mt-3 max-w-2xl text-[#806e6e]">
              Monitor customer email
              confirmations and order-status
              notifications.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-black ${
                realtimeConnected
                  ? "bg-[#e4f6e9] text-[#4f8a61]"
                  : "bg-[#f3e8e4] text-[#806e6e]"
              }`}
            >
              <span className="relative flex h-2.5 w-2.5">
                {realtimeConnected && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#6aa67a] opacity-50" />
                )}

                <span
                  className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                    realtimeConnected
                      ? "bg-[#4f8a61]"
                      : "bg-[#a58f8f]"
                  }`}
                />
              </span>

              {realtimeConnected
                ? "Live Email Logs"
                : "Connecting..."}
            </div>

            <button
              type="button"
              onClick={() =>
                loadLogs(false)
              }
              disabled={refreshing}
              className="rounded-full bg-[#fff8f5] px-5 py-3 text-xs font-black text-[#806e6e] shadow-[5px_5px_12px_#d8c5c0,-4px_-4px_10px_#ffffff] transition hover:-translate-y-0.5 hover:text-[#c97888] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {refreshing
                ? "Refreshing..."
                : "↻ Refresh"}
            </button>
          </div>
        </div>

        {/* ========================================
            ERROR
        ======================================== */}

        {errorMessage && (
          <div className="mt-7 rounded-2xl border border-[#efb9c1] bg-[#fce4e7] px-5 py-4 text-sm font-bold text-[#a84f61]">
            ✕ {errorMessage}
          </div>
        )}

        {/* ========================================
            STATS
        ======================================== */}

        <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[28px] bg-[#fff8f5] p-6 shadow-[8px_8px_18px_#d8c5c0,-7px_-7px_16px_#ffffff]">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#a58f8f]">
              Total Emails
            </p>

            <p className="mt-3 text-3xl font-black">
              {totalEmails}
            </p>

            <p className="mt-2 text-sm text-[#806e6e]">
              All logged attempts
            </p>
          </div>

          <div className="rounded-[28px] bg-[#fff8f5] p-6 shadow-[8px_8px_18px_#d8c5c0,-7px_-7px_16px_#ffffff]">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#4f8a61]">
              Sent
            </p>

            <p className="mt-3 text-3xl font-black text-[#4f8a61]">
              {sentEmails}
            </p>

            <p className="mt-2 text-sm text-[#806e6e]">
              Successfully accepted
            </p>
          </div>

          <div className="rounded-[28px] bg-[#fff8f5] p-6 shadow-[8px_8px_18px_#d8c5c0,-7px_-7px_16px_#ffffff]">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#a84f61]">
              Failed
            </p>

            <p className="mt-3 text-3xl font-black text-[#a84f61]">
              {failedEmails}
            </p>

            <p className="mt-2 text-sm text-[#806e6e]">
              Needs attention
            </p>
          </div>

          <div className="rounded-[28px] bg-[#fff8f5] p-6 shadow-[8px_8px_18px_#d8c5c0,-7px_-7px_16px_#ffffff]">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#5071a8]">
              Success Rate
            </p>

            <p className="mt-3 text-3xl font-black text-[#5071a8]">
              {successRate}%
            </p>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e6e0dc]">
              <div
                className="h-full rounded-full bg-[#8da8d8] transition-all duration-500"
                style={{
                  width:
                    `${successRate}%`,
                }}
              />
            </div>
          </div>
        </section>

        {/* ========================================
            SEARCH + FILTERS
        ======================================== */}

        <section className="mt-8 rounded-[30px] bg-[#fff8f5] p-5 shadow-[8px_8px_18px_#d8c5c0,-7px_-7px_16px_#ffffff] sm:p-6">
          <div className="grid gap-4 lg:grid-cols-[1fr_220px_260px]">
            <div>
              <label
                htmlFor="emailLogSearch"
                className="text-xs font-black uppercase tracking-[0.16em] text-[#a58f8f]"
              >
                Search
              </label>

              <input
                id="emailLogSearch"
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Order #, email, subject..."
                className="mt-2 w-full rounded-full border-none bg-[#f9ebe2] px-5 py-4 text-sm font-semibold outline-none placeholder:text-[#b7a3a0] focus:ring-2 focus:ring-[#e8a0ad]"
              />
            </div>

            <div>
              <label
                htmlFor="emailStatusFilter"
                className="text-xs font-black uppercase tracking-[0.16em] text-[#a58f8f]"
              >
                Status
              </label>

              <select
                id="emailStatusFilter"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-full border-none bg-[#f9ebe2] px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#e8a0ad]"
              >
                <option value="All">
                  All Statuses
                </option>
                <option value="sent">
                  Sent
                </option>
                <option value="failed">
                  Failed
                </option>
              </select>
            </div>

            <div>
              <label
                htmlFor="emailTypeFilter"
                className="text-xs font-black uppercase tracking-[0.16em] text-[#a58f8f]"
              >
                Email Type
              </label>

              <select
                id="emailTypeFilter"
                value={typeFilter}
                onChange={(event) =>
                  setTypeFilter(
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-full border-none bg-[#f9ebe2] px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#e8a0ad]"
              >
                {EMAIL_TYPE_OPTIONS.map(
                  (option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          {(search ||
            statusFilter !== "All" ||
            typeFilter !== "All") && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-bold text-[#806e6e]">
                Showing{" "}
                {filteredLogs.length} of{" "}
                {logs.length} email
                {logs.length === 1
                  ? ""
                  : "s"}
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("All");
                  setTypeFilter("All");
                }}
                className="text-xs font-black text-[#c97888] hover:text-[#a85f70]"
              >
                Clear Filters
              </button>
            </div>
          )}
        </section>

        {/* ========================================
            DESKTOP TABLE
        ======================================== */}

        <section className="mt-8 hidden overflow-hidden rounded-[30px] bg-[#fff8f5] shadow-[10px_10px_22px_#d8c5c0,-8px_-8px_18px_#ffffff] lg:block">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[#ead8d0]">
                  <th className="px-6 py-5 text-xs font-black uppercase tracking-wider text-[#a58f8f]">
                    Order
                  </th>
                  <th className="px-6 py-5 text-xs font-black uppercase tracking-wider text-[#a58f8f]">
                    Type
                  </th>
                  <th className="px-6 py-5 text-xs font-black uppercase tracking-wider text-[#a58f8f]">
                    Recipient
                  </th>
                  <th className="px-6 py-5 text-xs font-black uppercase tracking-wider text-[#a58f8f]">
                    Status
                  </th>
                  <th className="px-6 py-5 text-xs font-black uppercase tracking-wider text-[#a58f8f]">
                    Sent At
                  </th>
                  <th className="px-6 py-5 text-right text-xs font-black uppercase tracking-wider text-[#a58f8f]">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredLogs.map(
                  (log) => (
                    <tr
                      key={log.id}
                      className="border-b border-[#f1e3dd] last:border-b-0"
                    >
                      <td className="px-6 py-5">
                        <Link
                          href={`/admin/orders/${log.order_id}`}
                          className="font-black text-[#c97888] transition hover:text-[#a85f70]"
                        >
                          #{log.order_id}
                        </Link>
                      </td>

                      <td className="px-6 py-5">
                        <p className="font-black">
                          {formatEmailType(
                            log.email_type
                          )}
                        </p>

                        <p className="mt-1 max-w-[280px] truncate text-xs text-[#a58f8f]">
                          {log.subject}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <p className="max-w-[230px] truncate text-sm font-semibold text-[#806e6e]">
                          {log.recipient}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${
                            log.status ===
                            "sent"
                              ? "bg-[#e4f6e9] text-[#3d7c51]"
                              : "bg-[#fce4e7] text-[#a84f61]"
                          }`}
                        >
                          {log.status ===
                          "sent"
                            ? "✓ Sent"
                            : "✕ Failed"}
                        </span>

                        {log.error_message && (
                          <p
                            title={
                              log.error_message
                            }
                            className="mt-2 max-w-[230px] truncate text-xs font-semibold text-[#a84f61]"
                          >
                            {
                              log.error_message
                            }
                          </p>
                        )}
                      </td>

                      <td className="px-6 py-5">
                        <p className="whitespace-nowrap text-sm font-semibold text-[#806e6e]">
                          {formatDate(
                            log.created_at
                          )}
                        </p>
                      </td>

                      <td className="px-6 py-5 text-right">
                        <Link
                          href={`/admin/orders/${log.order_id}`}
                          className="inline-flex rounded-full bg-[#f9ebe2] px-4 py-2.5 text-xs font-black text-[#806e6e] transition hover:bg-[#f4d5dc] hover:text-[#c97888]"
                        >
                          View Order →
                        </Link>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          {filteredLogs.length === 0 && (
            <div className="p-12 text-center">
              <div className="text-5xl">
                ✉️
              </div>

              <h3 className="mt-4 text-xl font-black">
                No Email Logs Found
              </h3>

              <p className="mt-2 text-sm text-[#806e6e]">
                Try changing your search
                or filters.
              </p>
            </div>
          )}
        </section>

        {/* ========================================
            MOBILE CARDS
        ======================================== */}

        <section className="mt-8 space-y-4 lg:hidden">
          {filteredLogs.map((log) => (
            <article
              key={log.id}
              className="rounded-[28px] bg-[#fff8f5] p-5 shadow-[8px_8px_18px_#d8c5c0,-7px_-7px_16px_#ffffff]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Link
                    href={`/admin/orders/${log.order_id}`}
                    className="text-lg font-black text-[#c97888]"
                  >
                    Order #{log.order_id}
                  </Link>

                  <p className="mt-1 text-sm font-black">
                    {formatEmailType(
                      log.email_type
                    )}
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${
                    log.status === "sent"
                      ? "bg-[#e4f6e9] text-[#3d7c51]"
                      : "bg-[#fce4e7] text-[#a84f61]"
                  }`}
                >
                  {log.status === "sent"
                    ? "✓ Sent"
                    : "✕ Failed"}
                </span>
              </div>

              <div className="mt-5 space-y-3 rounded-[20px] bg-[#f9ebe2] p-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-[#a58f8f]">
                    Recipient
                  </p>

                  <p className="mt-1 break-words text-sm font-bold">
                    {log.recipient}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-[#a58f8f]">
                    Subject
                  </p>

                  <p className="mt-1 text-sm font-semibold text-[#806e6e]">
                    {log.subject}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-[#a58f8f]">
                    Time
                  </p>

                  <p className="mt-1 text-sm font-semibold text-[#806e6e]">
                    {formatDate(
                      log.created_at
                    )}
                  </p>
                </div>

                {log.error_message && (
                  <div className="rounded-xl bg-[#fce4e7] p-3">
                    <p className="text-[10px] font-black uppercase tracking-wider text-[#a84f61]">
                      Error
                    </p>

                    <p className="mt-1 break-words text-xs font-semibold leading-5 text-[#a84f61]">
                      {
                        log.error_message
                      }
                    </p>
                  </div>
                )}
              </div>

              <Link
                href={`/admin/orders/${log.order_id}`}
                className="mt-4 inline-flex w-full justify-center rounded-full bg-[#e8a0ad] px-5 py-3 text-xs font-black text-white transition hover:bg-[#d88a9a]"
              >
                View Order →
              </Link>
            </article>
          ))}

          {filteredLogs.length === 0 && (
            <div className="rounded-[28px] bg-[#fff8f5] p-10 text-center shadow-[8px_8px_18px_#d8c5c0,-7px_-7px_16px_#ffffff]">
              <div className="text-5xl">
                ✉️
              </div>

              <h3 className="mt-4 text-xl font-black">
                No Email Logs Found
              </h3>

              <p className="mt-2 text-sm text-[#806e6e]">
                Try changing your search
                or filters.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
