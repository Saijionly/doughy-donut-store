"use client";

import {
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import AdminHeader from "./components/AdminHeader";
import AdminSidebar from "./components/AdminSidebar";
import { supabase } from "@/lib/supabase";


type EmailLogForBadge = {
  id: number;
  order_id: number;
  email_type: string;
  status: "sent" | "failed";
  created_at: string;
};

type NewOrderNotification = {
  id: number;
  customer_name: string;
  total: number;
  status: string | null;
};

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [authChecking, setAuthChecking] =
    useState(true);

  const [isAuthorizedAdmin, setIsAuthorizedAdmin] =
    useState(false);

  const [newOrder, setNewOrder] =
    useState<NewOrderNotification | null>(
      null
    );

  const [pendingOrders, setPendingOrders] =
    useState(0);

  const [
    failedEmailCount,
    setFailedEmailCount,
  ] = useState(0);

  const [
    emailRealtimeConnected,
    setEmailRealtimeConnected,
  ] = useState(false);

  const [
    realtimeConnected,
    setRealtimeConnected,
  ] = useState(false);

  const hideToastTimerRef =
    useRef<number | null>(null);

  const isLoginPage =
    pathname === "/admin/login";

  /*
  ========================================
  ADMIN AUTHORIZATION GUARD
  ========================================
  */

  useEffect(() => {
    if (isLoginPage) {
      setAuthChecking(false);
      setIsAuthorizedAdmin(false);
      return;
    }

    let mounted = true;

    async function verifyAdmin() {
      try {
        setAuthChecking(true);

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.warn(
            "Admin session check failed:",
            sessionError
          );
        }

        if (!session?.user) {
          if (!mounted) return;

          setIsAuthorizedAdmin(false);
          router.replace("/admin/login");
          return;
        }

        const {
          data: adminRow,
          error: adminError,
        } = await supabase
          .from("admin_users")
          .select("user_id")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (adminError) {
          console.warn(
            "Admin authorization check failed:",
            adminError
          );
        }

        if (!adminRow) {
          await supabase.auth.signOut();

          if (!mounted) return;

          setIsAuthorizedAdmin(false);
          router.replace("/admin/login");
          return;
        }

        if (!mounted) return;

        setIsAuthorizedAdmin(true);
      } catch (error) {
        console.warn(
          "Unable to verify admin authorization:",
          error
        );

        if (!mounted) return;

        setIsAuthorizedAdmin(false);
        router.replace("/admin/login");
      } finally {
        if (mounted) {
          setAuthChecking(false);
        }
      }
    }

    verifyAdmin();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (isLoginPage) return;

        if (!session?.user) {
          setIsAuthorizedAdmin(false);
          router.replace("/admin/login");
          return;
        }

        const {
          data: adminRow,
          error: adminError,
        } = await supabase
          .from("admin_users")
          .select("user_id")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (adminError || !adminRow) {
          if (adminError) {
            console.warn(
              "Admin auth-state authorization failed:",
              adminError
            );
          }

          await supabase.auth.signOut();
          setIsAuthorizedAdmin(false);
          router.replace("/admin/login");
          return;
        }

        setIsAuthorizedAdmin(true);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isLoginPage, router]);

  /*
  ========================================
  PENDING ORDERS COUNT
  ========================================
  */

  async function loadPendingOrders() {
    try {
      /*
       * Primary:
       * Ask Supabase only for the exact count.
       */
      const {
        count,
        error,
      } = await supabase
        .from("orders")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("status", "pending");

      if (!error) {
        setPendingOrders(count ?? 0);
        return;
      }

      /*
       * Fallback:
       * If the count request temporarily fails,
       * fetch only IDs and count them locally.
       */
      console.warn(
        "Pending order count request failed. Using fallback.",
        error
      );

      const {
        data,
        error: fallbackError,
      } = await supabase
        .from("orders")
        .select("id")
        .eq("status", "pending");

      if (fallbackError) {
        console.warn(
          "Pending orders fallback failed:",
          fallbackError
        );

        return;
      }

      setPendingOrders(
        data?.length ?? 0
      );
    } catch (error) {
      console.warn(
        "Unable to load pending orders:",
        error
      );
    }
  }

  /*
  ========================================
  UNRESOLVED FAILED EMAIL COUNT
  ========================================
  */

  function getEmailFailureGroup(
    emailType: string
  ) {
    /*
     * A manual confirmation resend resolves
     * a failed original confirmation attempt.
     */
    if (
      emailType === "confirmation" ||
      emailType === "confirmation_resend"
    ) {
      return "confirmation";
    }

    return emailType;
  }

  async function loadFailedEmailCount() {
    try {
      const {
        data,
        error,
      } = await supabase
        .from("order_email_logs")
        .select(
          "id, order_id, email_type, status, created_at"
        )
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.warn(
          "Failed email count request failed:",
          error
        );
        return;
      }

      const logs =
        (data || []) as EmailLogForBadge[];

      /*
       * Because logs are newest-first, the
       * first item for each order + email group
       * is the latest attempt.
       *
       * Only groups whose latest attempt is
       * failed are counted as unresolved.
       */
      const latestByGroup =
        new Map<string, EmailLogForBadge>();

      for (const log of logs) {
        const group =
          getEmailFailureGroup(
            log.email_type
          );

        const key =
          `${log.order_id}:${group}`;

        if (!latestByGroup.has(key)) {
          latestByGroup.set(
            key,
            log
          );
        }
      }

      let unresolved = 0;

      for (
        const log
        of latestByGroup.values()
      ) {
        if (log.status === "failed") {
          unresolved += 1;
        }
      }

      setFailedEmailCount(
        unresolved
      );
    } catch (error) {
      console.warn(
        "Unable to load failed email count:",
        error
      );
    }
  }

  /*
  ========================================
  NOTIFICATION SOUND
  ========================================
  */

  function playNotificationSound() {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (
          window as typeof window & {
            webkitAudioContext?: typeof AudioContext;
          }
        ).webkitAudioContext;

      if (!AudioContextClass) {
        return;
      }

      const audioContext =
        new AudioContextClass();

      const gain =
        audioContext.createGain();

      gain.connect(
        audioContext.destination
      );

      const now =
        audioContext.currentTime;

      gain.gain.setValueAtTime(
        0.0001,
        now
      );

      gain.gain.exponentialRampToValueAtTime(
        0.12,
        now + 0.02
      );

      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + 0.45
      );

      const firstOscillator =
        audioContext.createOscillator();

      firstOscillator.type = "sine";
      firstOscillator.frequency.setValueAtTime(
        660,
        now
      );

      firstOscillator.connect(gain);
      firstOscillator.start(now);
      firstOscillator.stop(
        now + 0.18
      );

      const secondOscillator =
        audioContext.createOscillator();

      secondOscillator.type = "sine";
      secondOscillator.frequency.setValueAtTime(
        880,
        now + 0.16
      );

      secondOscillator.connect(gain);
      secondOscillator.start(
        now + 0.16
      );

      secondOscillator.stop(
        now + 0.42
      );

      window.setTimeout(() => {
        audioContext
          .close()
          .catch(() => {});
      }, 700);
    } catch (error) {
      /*
       * Browsers can block Web Audio until
       * the user interacts with the page.
       * This should never break the admin UI.
       */
      console.warn(
        "Notification sound unavailable:",
        error
      );
    }
  }

  /*
  ========================================
  AUTO-HIDE NEW ORDER TOAST
  ========================================
  */

  function scheduleToastHide() {
    if (
      hideToastTimerRef.current !== null
    ) {
      window.clearTimeout(
        hideToastTimerRef.current
      );
    }

    hideToastTimerRef.current =
      window.setTimeout(() => {
        setNewOrder(null);
        hideToastTimerRef.current =
          null;
      }, 8000);
  }

  /*
  ========================================
  GLOBAL ORDERS REALTIME
  ========================================
  */

  useEffect(() => {
    if (isLoginPage || !isAuthorizedAdmin) {
      setRealtimeConnected(false);
      return;
    }

    loadPendingOrders();

    const channel = supabase
      .channel("admin-global-orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        async (payload) => {
          /*
           * New order:
           * show toast + notification sound.
           */
          if (
            payload.eventType === "INSERT"
          ) {
            const insertedOrder =
              payload.new as NewOrderNotification;

            setNewOrder({
              id: insertedOrder.id,
              customer_name:
                insertedOrder.customer_name ||
                "Customer",
              total: Number(
                insertedOrder.total || 0
              ),
              status:
                insertedOrder.status ||
                "pending",
            });

            playNotificationSound();
            scheduleToastHide();
          }

          /*
           * Recalculate after any INSERT,
           * UPDATE, or DELETE.
           *
           * This is more reliable than trying
           * to calculate from payload.old,
           * because old row data may be limited
           * depending on Supabase replica identity.
           */
          await loadPendingOrders();
        }
      )
      .subscribe((status) => {
        setRealtimeConnected(
          status === "SUBSCRIBED"
        );
      });

    return () => {
      if (
        hideToastTimerRef.current !== null
      ) {
        window.clearTimeout(
          hideToastTimerRef.current
        );

        hideToastTimerRef.current =
          null;
      }

      supabase.removeChannel(channel);
    };
  }, [isLoginPage, isAuthorizedAdmin]);

  /*
  ========================================
  GLOBAL EMAIL LOGS REALTIME
  ========================================
  */

  useEffect(() => {
    if (isLoginPage || !isAuthorizedAdmin) {
      setEmailRealtimeConnected(false);
      return;
    }

    loadFailedEmailCount();

    const emailChannel = supabase
      .channel(
        "admin-global-email-logs"
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "order_email_logs",
        },
        async () => {
          /*
           * Recalculate after every new email
           * attempt so a successful resend can
           * immediately clear a previous failure.
           */
          await loadFailedEmailCount();
        }
      )
      .subscribe((status) => {
        setEmailRealtimeConnected(
          status === "SUBSCRIBED"
        );
      });

    return () => {
      setEmailRealtimeConnected(false);

      supabase.removeChannel(
        emailChannel
      );
    };
  }, [isLoginPage, isAuthorizedAdmin]);

  /*
  ========================================
  LOGIN PAGE
  ========================================
  */

  if (isLoginPage) {
    return <>{children}</>;
  }

  /*
  ========================================
  ADMIN AUTH CHECKING / DENIED STATE
  ========================================
  */

  if (authChecking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7eee9] px-6 text-[#2d2424]">
        <div className="text-center">
          <div className="animate-bounce text-6xl">
            🍩
          </div>

          <p className="mt-5 font-black text-[#806e6e]">
            Verifying admin access...
          </p>
        </div>
      </main>
    );
  }

  if (!isAuthorizedAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7eee9] px-6 text-[#2d2424]">
        <div className="text-center">
          <p className="font-black text-[#806e6e]">
            Redirecting to admin login...
          </p>
        </div>
      </main>
    );
  }

  /*
  ========================================
  ADMIN LAYOUT
  ========================================
  */

  return (
    <div className="min-h-screen bg-[#f7eee9] text-[#2d2424]">
      <AdminSidebar
        pendingOrders={pendingOrders}
        failedEmailCount={failedEmailCount}
      />

      <div className="min-h-screen lg:pl-72">
        <AdminHeader />

        {failedEmailCount > 0 && (
          <div className="px-6 pt-6">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 rounded-[24px] border border-[#f0c1c9] bg-[#fce4e7] px-5 py-4 shadow-[6px_6px_14px_rgba(90,60,60,0.08),-4px_-4px_10px_rgba(255,255,255,0.7)] sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="text-xl">
                  ⚠
                </span>

                <div>
                  <p className="text-sm font-black text-[#a84f61]">
                    {failedEmailCount} Unresolved Failed Email
                    {failedEmailCount === 1
                      ? ""
                      : "s"}
                  </p>

                  <p className="mt-1 text-xs font-semibold text-[#9b6670]">
                    Review failed email attempts or resend a confirmation.
                  </p>
                </div>
              </div>

              <Link
                href="/admin/email-logs?status=failed"
                className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#a84f61] px-5 py-2.5 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-[#934354]"
              >
                Review Email Logs →
              </Link>
            </div>
          </div>
        )}

        <main>
          {children}
        </main>
      </div>

      {/* ========================================
          NEW ORDER TOAST
      ======================================== */}

      {newOrder && (
        <div className="fixed bottom-5 right-5 z-[100] w-[calc(100%-2.5rem)] max-w-sm animate-[adminToastIn_0.35s_ease-out] overflow-hidden rounded-[28px] border border-white/70 bg-[#fff8f5] shadow-[12px_12px_28px_rgba(90,60,60,0.18),-8px_-8px_20px_rgba(255,255,255,0.85)] sm:bottom-7 sm:right-7">
          <div className="relative p-5 sm:p-6">
            <button
              type="button"
              onClick={() => {
                setNewOrder(null);

                if (
                  hideToastTimerRef.current !==
                  null
                ) {
                  window.clearTimeout(
                    hideToastTimerRef.current
                  );

                  hideToastTimerRef.current =
                    null;
                }
              }}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#f9ebe2] text-sm font-black text-[#806e6e] transition hover:bg-[#f4d5dc] hover:text-[#c97888]"
              aria-label="Close notification"
            >
              ×
            </button>

            <div className="flex items-start gap-4 pr-8">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f9ebe2] text-2xl shadow-[inset_2px_2px_5px_#ead8d0,inset_-2px_-2px_5px_#ffffff]">
                🍩
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#c97888]">
                  New Order
                </p>

                <h3 className="mt-1 text-lg font-black">
                  New Order Received
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#806e6e]">
                  Order #
                  {newOrder.id} from{" "}
                  <span className="font-black text-[#2d2424]">
                    {newOrder.customer_name}
                  </span>
                </p>

                <div className="mt-3 flex items-center justify-between gap-4 rounded-[18px] bg-[#f9ebe2] px-4 py-3">
                  <span className="text-xs font-bold text-[#806e6e]">
                    Order Total
                  </span>

                  <span className="font-black text-[#c97888]">
                    ₱
                    {Number(
                      newOrder.total || 0
                    ).toLocaleString(
                      "en-PH",
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}
                  </span>
                </div>

                <Link
                  href={`/admin/orders/${newOrder.id}`}
                  onClick={() =>
                    setNewOrder(null)
                  }
                  className="mt-4 inline-flex rounded-full bg-[#e8a0ad] px-5 py-3 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-[#d88a9a]"
                >
                  View Order →
                </Link>
              </div>
            </div>
          </div>

          <div className="h-1 bg-[#f3ded8]">
            <div className="h-full origin-left animate-[adminToastTimer_8s_linear_forwards] bg-[#e8a0ad]" />
          </div>
        </div>
      )}

      {/* ========================================
          REALTIME INDICATOR
      ======================================== */}

      <div className="fixed bottom-5 left-5 z-40 hidden lg:block">
        <div
          className={`inline-flex items-center gap-2 rounded-full border border-white/70 px-4 py-2.5 text-xs font-black shadow-[5px_5px_12px_rgba(90,60,60,0.12),-4px_-4px_10px_rgba(255,255,255,0.75)] backdrop-blur-xl ${
            realtimeConnected &&
            emailRealtimeConnected
              ? "bg-[#e4f6e9]/90 text-[#4f8a61]"
              : "bg-[#fff8f5]/90 text-[#806e6e]"
          }`}
        >
          <span className="relative flex h-2.5 w-2.5">
            {realtimeConnected &&
              emailRealtimeConnected && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#6aa67a] opacity-50" />
              )}

            <span
              className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                realtimeConnected &&
                emailRealtimeConnected
                  ? "bg-[#4f8a61]"
                  : "bg-[#a58f8f]"
              }`}
            />
          </span>

          {realtimeConnected &&
          emailRealtimeConnected
            ? "Admin Live"
            : "Connecting..."}
        </div>
      </div>

      <style jsx global>{`
        @keyframes adminToastIn {
          from {
            opacity: 0;
            transform: translateY(18px)
              scale(0.97);
          }

          to {
            opacity: 1;
            transform: translateY(0)
              scale(1);
          }
        }

        @keyframes adminToastTimer {
          from {
            transform: scaleX(1);
          }

          to {
            transform: scaleX(0);
          }
        }
      `}</style>
    </div>
  );
}
