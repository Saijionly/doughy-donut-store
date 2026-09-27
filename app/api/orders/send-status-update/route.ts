import { NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/requireAdmin";

export const runtime = "nodejs";

type StatusUpdateRequest = {
  orderId: number;
};

const STATUS_CONTENT: Record<
  string,
  {
    label: string;
    emoji: string;
    headline: string;
    message: string;
  }
> = {
  pending: {
    label: "Pending",
    emoji: "🕒",
    headline:
      "Your order is waiting for confirmation.",
    message:
      "We received your order and it is currently waiting for confirmation.",
  },
  confirmed: {
    label: "Confirmed",
    emoji: "✅",
    headline:
      "Your order has been confirmed!",
    message:
      "Great news — your Doughy order has been confirmed and will move into preparation soon.",
  },
  preparing: {
    label: "Preparing",
    emoji: "🍩",
    headline:
      "Your donuts are being prepared.",
    message:
      "Our team is preparing your order. We’ll update you again when it is ready to head your way.",
  },
  out_for_delivery: {
    label: "Out for Delivery",
    emoji: "🛵",
    headline:
      "Your order is on the way!",
    message:
      "Your Doughy order is now out for delivery. Please keep your phone available in case the rider needs to contact you.",
  },
  completed: {
    label: "Delivered",
    emoji: "🎉",
    headline:
      "Your order has been delivered!",
    message:
      "Your Doughy order is marked as completed. We hope you enjoy every bite!",
  },
  cancelled: {
    label: "Cancelled",
    emoji: "✕",
    headline:
      "Your order has been cancelled.",
    message:
      "This order has been cancelled. If you believe this was a mistake, please contact Doughy for assistance.",
  },
};

function normalizeStatus(value: string) {
  const normalized =
    String(value || "")
      .trim()
      .toLowerCase()
      .replaceAll(" ", "_");

  if (normalized === "processing") {
    return "preparing";
  }

  if (normalized === "ready") {
    return "preparing";
  }

  if (normalized === "shipped") {
    return "out_for_delivery";
  }

  if (normalized === "delivered") {
    return "completed";
  }

  if (normalized === "canceled") {
    return "cancelled";
  }

  return normalized;
}

function escapeHtml(value: string) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat(
    "en-PH",
    {
      style: "currency",
      currency: "PHP",
    }
  ).format(Number(value || 0));
}

function formatEta(
  value?: string | null
) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return null;
  }

  return new Intl.DateTimeFormat(
    "en-PH",
    {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Manila",
    }
  ).format(date);
}


async function logEmailAttempt({
  orderId,
  emailType,
  recipient,
  subject,
  status,
  providerEmailId,
  errorMessage,
}: {
  orderId: number;
  emailType: string;
  recipient: string;
  subject: string;
  status: "sent" | "failed";
  providerEmailId?: string | null;
  errorMessage?: string | null;
}) {
  try {
    const { error } =
      await supabaseAdmin
        .from("order_email_logs")
        .insert({
          order_id: orderId,
          email_type: emailType,
          recipient,
          subject,
          status,
          provider_email_id:
            providerEmailId || null,
          error_message:
            errorMessage || null,
        });

    if (error) {
      console.warn(
        "Email log insert failed:",
        error
      );
    }
  } catch (error) {
    console.warn(
      "Email logging unavailable:",
      error
    );
  }
}

export async function POST(
  request: Request
) {
  try {
    const admin = await requireAdmin();

    if (!admin.ok) {
      return NextResponse.json(
        { error: admin.error },
        { status: admin.status }
      );
    }

    const apiKey =
      process.env.RESEND_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "RESEND_API_KEY is not configured.",
        },
        { status: 500 }
      );
    }

    const body =
      (await request.json()) as StatusUpdateRequest;

    const orderId =
      Number(body.orderId);

    if (
      !Number.isInteger(orderId) ||
      orderId <= 0
    ) {
      return NextResponse.json(
        { error: "Invalid order ID." },
        { status: 400 }
      );
    }

    /*
     * Never trust customer/status/total values
     * supplied by the browser. Load the current
     * authoritative order directly from Supabase.
     */
    const {
      data: order,
      error: orderError,
    } = await supabaseAdmin
      .from("orders")
      .select(
        "id, customer_name, customer_email, status, estimated_delivery_at, total"
      )
      .eq("id", orderId)
      .maybeSingle();

    if (orderError) {
      console.warn(
        "Unable to load order for status email:",
        orderError
      );

      return NextResponse.json(
        {
          error:
            "Unable to load the order.",
        },
        { status: 500 }
      );
    }

    if (!order) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      );
    }

    const customerName =
      String(
        order.customer_name || ""
      ).trim();

    const customerEmail =
      String(
        order.customer_email || ""
      )
        .trim()
        .toLowerCase();

    const status =
      normalizeStatus(
        String(order.status || "")
      );

    const total =
      Number(order.total || 0);

    if (
      !customerName ||
      !customerEmail ||
      !customerEmail.includes("@") ||
      !STATUS_CONTENT[status]
    ) {
      return NextResponse.json(
        {
          error:
            "The stored order contains invalid email data.",
        },
        { status: 500 }
      );
    }

    const content =
      STATUS_CONTENT[status];

    const resend =
      new Resend(apiKey);

    const siteUrl = (
      process.env
        .NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000"
    ).replace(/\/$/, "");

    const trackOrderUrl =
      `${siteUrl}/orders/${orderId}`;

    const safeCustomerName =
      escapeHtml(customerName);

    const eta =
      formatEta(
        order.estimated_delivery_at
      );

    const etaBlock =
      status ===
        "out_for_delivery" &&
      eta
        ? `
          <div style="margin-top:20px;padding:18px 20px;border-radius:18px;background:#eef4ff;">
            <div style="font-size:11px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;color:#5071a8;">
              Estimated Arrival
            </div>
            <div style="margin-top:6px;font-size:18px;font-weight:900;color:#3f5f93;">
              ${escapeHtml(eta)}
            </div>
          </div>
        `
        : "";

    const html = `
      <!doctype html>
      <html>
        <body style="margin:0;padding:0;background:#f7eee9;font-family:Arial,Helvetica,sans-serif;color:#2d2424;">
          <div style="padding:32px 16px;">
            <div style="max-width:620px;margin:0 auto;overflow:hidden;border:1px solid #f0ded8;border-radius:28px;background:#fff8f5;">
              <div style="padding:34px 32px;text-align:center;background:#e8a0ad;color:#ffffff;">
                <div style="font-size:42px;line-height:1;">
                  ${content.emoji}
                </div>

                <p style="margin:12px 0 0;font-size:12px;font-weight:800;letter-spacing:1.6px;text-transform:uppercase;">
                  Order #${orderId}
                </p>

                <h1 style="margin:8px 0 0;font-size:27px;line-height:1.25;">
                  ${content.headline}
                </h1>
              </div>

              <div style="padding:32px;">
                <p style="margin:0;font-size:17px;font-weight:800;">
                  Hi ${safeCustomerName},
                </p>

                <p style="margin:12px 0 0;color:#806e6e;line-height:1.7;">
                  ${content.message}
                </p>

                <div style="margin-top:26px;padding:20px;border-radius:20px;background:#f9ebe2;">
                  <div style="font-size:11px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;color:#c97888;">
                    Current Status
                  </div>

                  <div style="margin-top:7px;font-size:22px;font-weight:900;color:#c97888;">
                    ${content.label}
                  </div>

                  ${
                    total > 0
                      ? `
                        <div style="margin-top:15px;padding-top:15px;border-top:1px solid #ead8d0;">
                          <span style="color:#806e6e;font-size:13px;">
                            Order Total
                          </span>

                          <span style="float:right;font-weight:900;color:#2d2424;">
                            ${formatCurrency(total)}
                          </span>
                        </div>
                      `
                      : ""
                  }
                </div>

                ${etaBlock}

                <div style="margin-top:28px;text-align:center;">
                  <a
                    href="${trackOrderUrl}"
                    style="display:inline-block;padding:14px 26px;border-radius:999px;background:#e8a0ad;color:#ffffff;text-decoration:none;font-weight:800;"
                  >
                    Track My Order
                  </a>
                </div>

                <p style="margin:28px 0 0;text-align:center;color:#a58f8f;font-size:12px;line-height:1.6;">
                  You can use the tracking page anytime to see the latest status of your Doughy order.
                </p>
              </div>
            </div>

            <p style="margin:18px auto 0;max-width:620px;text-align:center;color:#a58f8f;font-size:11px;">
              © Doughy — Fresh donuts, made with love.
            </p>
          </div>
        </body>
      </html>
    `;

    const from =
      process.env
        .RESEND_FROM_EMAIL ||
      "Doughy <onboarding@resend.dev>";

    const subject =
      `Doughy Order #${orderId}: ${content.label} ${content.emoji}`;

    const emailType =
      `status_${status}`;

    /*
     * Resend idempotency:
     *
     * The same order + normalized status always
     * receives the same idempotency key.
     *
     * If this endpoint is accidentally triggered
     * twice for the same status, Resend will not
     * send a second identical status email.
     */
    const idempotencyKey =
      `order-${orderId}-status-${status}`;

    const {
      data,
      error,
    } = await resend.emails.send(
      {
        from,
        to: [customerEmail],
        subject,
        html,
      },
      {
        idempotencyKey,
      }
    );

    if (error) {
      console.error(
        "Resend status email error:",
        error
      );

      await logEmailAttempt({
        orderId,
        emailType,
        recipient: customerEmail,
        subject,
        status: "failed",
        errorMessage:
          error.message ||
          "Unable to send status update email.",
      });

      return NextResponse.json(
        {
          error:
            error.message ||
            "Unable to send status update email.",
        },
        { status: 400 }
      );
    }

    await logEmailAttempt({
      orderId,
      emailType,
      recipient: customerEmail,
      subject,
      status: "sent",
      providerEmailId:
        data?.id ?? null,
    });

    return NextResponse.json({
      success: true,
      emailId:
        data?.id ?? null,
    });
  } catch (error) {
    console.error(
      "Status update email route failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to send status update email.",
      },
      { status: 500 }
    );
  }
}
