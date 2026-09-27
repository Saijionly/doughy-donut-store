import { createHmac } from "crypto";
import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  createTrackingSession,
  ORDER_TRACKING_COOKIE,
} from "@/lib/orderTrackingSession";

/*
 * =========================================
 * RATE LIMIT SETTINGS
 * =========================================
 */

const MAX_FAILED_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MINUTES = 15;

/*
 * =========================================
 * CLIENT IP
 * =========================================
 */

function getClientIp(request: Request) {
  const forwardedFor =
    request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    const firstIp = forwardedFor
      .split(",")[0]
      ?.trim();

    if (firstIp) {
      return firstIp;
    }
  }

  const realIp =
    request.headers.get("x-real-ip");

  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}

/*
 * =========================================
 * HASH IP
 * =========================================
 *
 * We do NOT store the customer's raw IP.
 *
 * HMAC is used instead of a plain SHA-256
 * hash so the stored value cannot easily
 * be reversed using common IP lists.
 */

function hashIp(ip: string) {
  const secret =
    process.env.ORDER_TRACKING_SECRET;

  if (!secret) {
    throw new Error(
      "Missing ORDER_TRACKING_SECRET."
    );
  }

  return createHmac(
    "sha256",
    secret
  )
    .update(ip)
    .digest("hex");
}

/*
 * =========================================
 * SAVE TRACKING ATTEMPT
 * =========================================
 */

async function saveAttempt(
  ipHash: string,
  success: boolean
) {
  const { error } =
    await supabaseAdmin
      .from("order_tracking_attempts")
      .insert({
        ip_hash: ipHash,
        success,
      });

  if (error) {
    console.warn(
      "Unable to save tracking attempt:",
      error
    );
  }
}

/*
 * =========================================
 * POST
 * =========================================
 */

export async function POST(
  request: Request
) {
  try {
    /*
     * =========================================
     * READ REQUEST
     * =========================================
     */

    const body =
      await request
        .json()
        .catch(() => null);

    const orderId =
      Number(body?.orderId);

    const email =
      typeof body?.email === "string"
        ? body.email
            .trim()
            .toLowerCase()
        : "";

    /*
     * =========================================
     * BASIC VALIDATION
     * =========================================
     */

    if (
      !Number.isInteger(orderId) ||
      orderId <= 0 ||
      !email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid order number and email address.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * =========================================
     * IDENTIFY CLIENT
     * =========================================
     */

    const clientIp =
      getClientIp(request);

    const ipHash =
      hashIp(clientIp);

    /*
     * =========================================
     * REMOVE OLD RATE-LIMIT RECORDS
     * =========================================
     *
     * We keep only roughly the last 24 hours.
     */

    const cleanupBefore =
      new Date(
        Date.now() -
          24 *
            60 *
            60 *
            1000
      ).toISOString();

    const {
      error: cleanupError,
    } =
      await supabaseAdmin
        .from(
          "order_tracking_attempts"
        )
        .delete()
        .lt(
          "created_at",
          cleanupBefore
        );

    if (cleanupError) {
      console.warn(
        "Tracking attempts cleanup error:",
        cleanupError
      );
    }

    /*
     * =========================================
     * RATE LIMIT CHECK
     * =========================================
     */

    const windowStart =
      new Date(
        Date.now() -
          RATE_LIMIT_WINDOW_MINUTES *
            60 *
            1000
      ).toISOString();

    const {
      count: failedAttempts,
      error: rateLimitError,
    } =
      await supabaseAdmin
        .from(
          "order_tracking_attempts"
        )
        .select(
          "id",
          {
            count: "exact",
            head: true,
          }
        )
        .eq(
          "ip_hash",
          ipHash
        )
        .eq(
          "success",
          false
        )
        .gte(
          "created_at",
          windowStart
        );

    if (rateLimitError) {
      /*
       * We log the problem but do not
       * completely break legitimate
       * order tracking if the rate-limit
       * table temporarily fails.
       */
      console.warn(
        "Order tracking rate limit error:",
        rateLimitError
      );
    }

    if (
      !rateLimitError &&
      (failedAttempts || 0) >=
        MAX_FAILED_ATTEMPTS
    ) {
      return NextResponse.json(
        {
          error:
            "Too many verification attempts. Please try again in 15 minutes.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              RATE_LIMIT_WINDOW_MINUTES *
                60
            ),
          },
        }
      );
    }

    /*
     * =========================================
     * LOAD ORDER
     * =========================================
     */

    const {
      data: order,
      error,
    } =
      await supabaseAdmin
        .from("orders")
        .select(
          "id, customer_email"
        )
        .eq(
          "id",
          orderId
        )
        .maybeSingle();

    if (error) {
      console.warn(
        "Order tracking verification error:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Unable to verify your order right now.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * =========================================
     * INVALID ORDER / EMAIL
     * =========================================
     *
     * SAME response is returned when:
     *
     * - order does not exist
     * - email is incorrect
     *
     * This prevents attackers from learning
     * which order numbers actually exist.
     */

    const storedEmail =
      String(
        order?.customer_email || ""
      )
        .trim()
        .toLowerCase();

    if (
      !order ||
      storedEmail !== email
    ) {
      await saveAttempt(
        ipHash,
        false
      );

      return NextResponse.json(
        {
          error:
            "We couldn't verify that order number and email combination.",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * =========================================
     * SUCCESSFUL VERIFICATION
     * =========================================
     */

    await saveAttempt(
      ipHash,
      true
    );

    /*
     * =========================================
     * CREATE SECURE TRACKING SESSION
     * =========================================
     */

    const token =
      createTrackingSession(
        orderId,
        email
      );

    const response =
      NextResponse.json({
        success: true,
        orderId,
      });

    /*
     * =========================================
     * SECURE HTTPONLY COOKIE
     * =========================================
     */

    response.cookies.set(
      ORDER_TRACKING_COOKIE,
      token,
      {
        httpOnly: true,

        secure:
          process.env.NODE_ENV ===
          "production",

        sameSite: "lax",

        path: "/",

        maxAge:
          60 *
          60 *
          24,
      }
    );

    return response;
  } catch (error) {
    console.warn(
      "Order tracking verification failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to verify your order right now.",
      },
      {
        status: 500,
      }
    );
  }
}