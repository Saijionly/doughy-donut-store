import { NextResponse } from "next/server";
import { Resend } from "resend";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/requireAdmin";
import {
  ORDER_TRACKING_COOKIE,
  verifyTrackingSession,
} from "@/lib/orderTrackingSession";
import { cookies } from "next/headers";

export const runtime = "nodejs";

type OrderItem = {
  id?: number;
  order_id?: number;
  product_id?: number;
  product_name: string;
  product_image?: string | null;
  price: number;
  quantity: number;
  created_at?: string;
};

type Order = {
  id: number;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  delivery_address: string;
  delivery_city: string;
  order_notes?: string | null;
  payment_method: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: string;
  created_at?: string;
};

type RequestBody = {
  order?: Order;
  orderItems?: OrderItem[];
  forceResend?: boolean;

  // Also supports the checkout route if it sends
  // flattened values instead of { order, orderItems }.
  orderId?: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  deliveryCity?: string;
  orderNotes?: string | null;
  paymentMethod?: string;
  subtotal?: number;
  deliveryFee?: number;
  total?: number;
  status?: string;
  items?: OrderItem[];
};

function escapeHtml(value: string) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(Number(value || 0));
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
      (await request.json()) as RequestBody;

    const orderId =
      Number(body.orderId);

    const forceResend =
      Boolean(body.forceResend);

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
     * Authorization:
     * - Manual resend is admin-only.
     * - Normal confirmation requires the signed
     *   tracking session for this exact order.
     */
    if (forceResend) {
      const admin = await requireAdmin();

      if (!admin.ok) {
        return NextResponse.json(
          { error: admin.error },
          { status: admin.status }
        );
      }
    } else {
      const cookieStore = await cookies();

      const trackingToken =
        cookieStore.get(
          ORDER_TRACKING_COOKIE
        )?.value;

      const trackingSession =
        verifyTrackingSession(
          trackingToken
        );

      if (
        !trackingSession ||
        trackingSession.orderId !== orderId
      ) {
        return NextResponse.json(
          {
            error:
              "You are not authorized to send this order confirmation.",
          },
          { status: 403 }
        );
      }
    }

    /*
     * Load all email content from the database.
     * The browser no longer controls recipient,
     * address, totals, payment method, or items.
     */
    const [
      orderResult,
      itemsResult,
    ] = await Promise.all([
      supabaseAdmin
        .from("orders")
        .select(
          "id, customer_name, customer_email, customer_phone, delivery_address, delivery_city, order_notes, payment_method, subtotal, delivery_fee, total, status, created_at"
        )
        .eq("id", orderId)
        .maybeSingle(),

      supabaseAdmin
        .from("order_items")
        .select(
          "id, order_id, product_id, product_name, product_image, price, quantity, created_at"
        )
        .eq("order_id", orderId)
        .order("id", {
          ascending: true,
        }),
    ]);

    if (orderResult.error) {
      console.warn(
        "Unable to load order for confirmation email:",
        orderResult.error
      );

      return NextResponse.json(
        {
          error:
            "Unable to load the order.",
        },
        { status: 500 }
      );
    }

    if (!orderResult.data) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      );
    }

    if (itemsResult.error) {
      console.warn(
        "Unable to load order items for confirmation email:",
        itemsResult.error
      );

      return NextResponse.json(
        {
          error:
            "Unable to load the order items.",
        },
        { status: 500 }
      );
    }

    const order =
      orderResult.data;

    const orderItems =
      (itemsResult.data ||
        []) as OrderItem[];

    const customerEmail =
      String(
        order.customer_email || ""
      )
        .trim()
        .toLowerCase();

    if (
      !customerEmail ||
      !customerEmail.includes("@")
    ) {
      return NextResponse.json(
        {
          error:
            "The stored order does not have a valid customer email.",
        },
        { status: 500 }
      );
    }

    /*
     * For a normal customer-triggered confirmation,
     * also make sure the signed session belongs to
     * the same stored email. Manual admin resends do
     * not require the customer's tracking cookie.
     */
    if (!forceResend) {
      const cookieStore =
        await cookies();

      const trackingSession =
        verifyTrackingSession(
          cookieStore.get(
            ORDER_TRACKING_COOKIE
          )?.value
        );

      if (
        !trackingSession ||
        trackingSession.email !==
          customerEmail
      ) {
        return NextResponse.json(
          {
            error:
              "You are not authorized to send this order confirmation.",
          },
          { status: 403 }
        );
      }
    }

    const siteUrl = (
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000"
    ).replace(/\/$/, "");

    const trackOrderUrl =
      `${siteUrl}/orders/${order.id}`;

    const safeName =
      escapeHtml(
        order.customer_name ||
          "Customer"
      );

    const safeAddress =
      escapeHtml(
        order.delivery_address || ""
      );

    const safeCity =
      escapeHtml(
        order.delivery_city || ""
      );

    const safePayment =
      escapeHtml(
        order.payment_method ||
          "Cash on Delivery"
      );

    const itemsHtml =
      orderItems.length > 0
        ? orderItems
            .map(
              (item) => `
                <tr>
                  <td style="padding:14px 0;border-bottom:1px solid #ead8d0;">
                    <div style="font-weight:800;color:#2d2424;">
                      ${escapeHtml(item.product_name)}
                    </div>
                    <div style="margin-top:4px;font-size:12px;color:#806e6e;">
                      ${formatCurrency(Number(item.price))} × ${Number(item.quantity)}
                    </div>
                  </td>
                  <td style="padding:14px 0;border-bottom:1px solid #ead8d0;text-align:right;font-weight:800;color:#c97888;">
                    ${formatCurrency(
                      Number(item.price) *
                        Number(item.quantity)
                    )}
                  </td>
                </tr>
              `
            )
            .join("")
        : `
            <tr>
              <td colspan="2" style="padding:16px 0;color:#806e6e;">
                Order items are unavailable in this email.
              </td>
            </tr>
          `;

    const html = `
      <!doctype html>
      <html>
        <body style="margin:0;padding:0;background:#f7eee9;font-family:Arial,Helvetica,sans-serif;color:#2d2424;">
          <div style="padding:32px 16px;">
            <div style="max-width:620px;margin:0 auto;overflow:hidden;border:1px solid #f0ded8;border-radius:28px;background:#fff8f5;">
              <div style="padding:34px 32px;text-align:center;background:#e8a0ad;color:#ffffff;">
                <div style="font-size:42px;line-height:1;">🍩</div>
                <p style="margin:12px 0 0;font-size:12px;font-weight:800;letter-spacing:1.6px;text-transform:uppercase;">
                  Doughy
                </p>
                <h1 style="margin:8px 0 0;font-size:28px;line-height:1.25;">
                  Order Received!
                </h1>
                <p style="margin:10px 0 0;font-size:14px;">
                  Order #${order.id}
                </p>
              </div>

              <div style="padding:32px;">
                <p style="margin:0;font-size:17px;font-weight:800;">
                  Hi ${safeName},
                </p>

                <p style="margin:12px 0 0;color:#806e6e;line-height:1.7;">
                  Thank you for ordering from Doughy. We received your order and will keep you updated as it moves through preparation and delivery.
                </p>

                <div style="margin-top:26px;padding:20px;border-radius:20px;background:#f9ebe2;">
                  <div style="font-size:11px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;color:#c97888;">
                    Delivery To
                  </div>
                  <div style="margin-top:7px;font-weight:800;">
                    ${safeAddress}${safeCity ? `, ${safeCity}` : ""}
                  </div>
                </div>

                <h2 style="margin:28px 0 8px;font-size:18px;">
                  Order Summary
                </h2>

                <table style="width:100%;border-collapse:collapse;">
                  ${itemsHtml}
                </table>

                <div style="margin-top:22px;padding:20px;border-radius:20px;background:#f9ebe2;">
                  <table style="width:100%;border-collapse:collapse;">
                    <tr>
                      <td style="padding:5px 0;color:#806e6e;">Subtotal</td>
                      <td style="padding:5px 0;text-align:right;font-weight:800;">
                        ${formatCurrency(Number(order.subtotal))}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:5px 0;color:#806e6e;">Delivery Fee</td>
                      <td style="padding:5px 0;text-align:right;font-weight:800;">
                        ${formatCurrency(Number(order.delivery_fee))}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-top:14px;font-size:17px;font-weight:900;">Total</td>
                      <td style="padding-top:14px;text-align:right;font-size:20px;font-weight:900;color:#c97888;">
                        ${formatCurrency(Number(order.total))}
                      </td>
                    </tr>
                  </table>
                </div>

                <div style="margin-top:20px;padding:18px 20px;border-radius:18px;background:#fff3e6;">
                  <div style="font-size:11px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;color:#a56d20;">
                    Payment
                  </div>
                  <div style="margin-top:6px;font-weight:900;color:#7d5a25;">
                    ${safePayment}
                  </div>
                </div>

                <div style="margin-top:28px;text-align:center;">
                  <a
                    href="${trackOrderUrl}"
                    style="display:inline-block;padding:14px 26px;border-radius:999px;background:#e8a0ad;color:#ffffff;text-decoration:none;font-weight:800;"
                  >
                    Track My Order
                  </a>
                </div>

                <p style="margin:28px 0 0;text-align:center;color:#a58f8f;font-size:12px;line-height:1.6;">
                  Keep this email for your order reference.
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

    const resend =
      new Resend(apiKey);

    const from =
      process.env.RESEND_FROM_EMAIL ||
      "Doughy <onboarding@resend.dev>";

    /*
     * Normal checkout sends use a stable
     * idempotency key for the order.
     *
     * Manual admin resend uses a unique key,
     * so Resend will intentionally send it again.
     */
    const idempotencyKey =
      forceResend
        ? `order-${order.id}-manual-${randomUUID()}`
        : `order-${order.id}-confirmation`;

    const subject =
      `Doughy Order #${order.id} Received 🍩`;

    const emailType =
      forceResend
        ? "confirmation_resend"
        : "confirmation";

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
        "Resend confirmation email error:",
        error
      );

      await logEmailAttempt({
        orderId: Number(order.id),
        emailType,
        recipient: customerEmail,
        subject,
        status: "failed",
        errorMessage:
          error.message ||
          "Unable to send confirmation email.",
      });

      return NextResponse.json(
        {
          error:
            error.message ||
            "Unable to send confirmation email.",
        },
        { status: 400 }
      );
    }

    await logEmailAttempt({
      orderId: Number(order.id),
      emailType,
      recipient: customerEmail,
      subject,
      status: "sent",
      providerEmailId:
        data?.id ?? null,
    });

    return NextResponse.json({
      success: true,
      resent: forceResend,
      emailId: data?.id ?? null,
    });
  } catch (error) {
    console.error(
      "Confirmation email route failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to send confirmation email.",
      },
      { status: 500 }
    );
  }
}
