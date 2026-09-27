import {
  NextResponse,
} from "next/server";
import {
  cookies,
} from "next/headers";

import {
  supabaseAdmin,
} from "@/lib/supabaseAdmin";

import {
  ORDER_TRACKING_COOKIE,
  verifyTrackingSession,
} from "@/lib/orderTrackingSession";

async function authorizeOrder(
  idValue: string
) {
  const orderId =
    Number(idValue);

  if (
    !Number.isInteger(orderId) ||
    orderId <= 0
  ) {
    return {
      error: NextResponse.json(
        {
          error:
            "Invalid order number.",
        },
        {
          status: 400,
        }
      ),
    };
  }

  const cookieStore =
    await cookies();

  const token =
    cookieStore
      .get(
        ORDER_TRACKING_COOKIE
      )
      ?.value;

  const session =
    verifyTrackingSession(token);

  if (
    !session ||
    session.orderId !== orderId
  ) {
    return {
      error: NextResponse.json(
        {
          error:
            "Please verify this order before viewing it.",
        },
        {
          status: 401,
        }
      ),
    };
  }

  return {
    orderId,
    session,
  };
}

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const { id } =
      await context.params;

    const auth =
      await authorizeOrder(id);

    if ("error" in auth) {
      return auth.error;
    }

    const {
      data: order,
      error: orderError,
    } = await supabaseAdmin
      .from("orders")
      .select(
        "id, customer_name, customer_email, customer_phone, delivery_address, delivery_city, order_notes, payment_method, subtotal, delivery_fee, total, status, created_at, estimated_minutes, estimated_delivery_at"
      )
      .eq(
        "id",
        auth.orderId
      )
      .maybeSingle();

    if (orderError) {
      console.warn(
        "Secure tracking order error:",
        orderError
      );

      return NextResponse.json(
        {
          error:
            "Unable to load this order.",
        },
        {
          status: 500,
        }
      );
    }

    if (!order) {
      return NextResponse.json(
        {
          error:
            "Order not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Defense-in-depth:
     *
     * The signed session already authorizes
     * the order ID. We still compare the
     * normalized stored email with the
     * normalized session email in application
     * code, instead of using a case-sensitive
     * database filter.
     */

    const storedEmail =
      String(
        order.customer_email || ""
      )
        .trim()
        .toLowerCase();

    const sessionEmail =
      String(
        auth.session.email || ""
      )
        .trim()
        .toLowerCase();

    if (
      !storedEmail ||
      storedEmail !== sessionEmail
    ) {
      return NextResponse.json(
        {
          error:
            "Please verify this order before viewing it.",
        },
        {
          status: 401,
        }
      );
    }

    const [
      itemsResult,
      historyResult,
    ] = await Promise.all([
      supabaseAdmin
        .from("order_items")
        .select(
          "id, order_id, product_id, product_name, product_image, price, quantity, created_at"
        )
        .eq(
          "order_id",
          auth.orderId
        )
        .order(
          "created_at",
          {
            ascending: true,
          }
        ),

      supabaseAdmin
        .from(
          "order_status_history"
        )
        .select(
          "id, order_id, status, created_at"
        )
        .eq(
          "order_id",
          auth.orderId
        )
        .order(
          "created_at",
          {
            ascending: true,
          }
        ),
    ]);

    if (itemsResult.error) {
      console.warn(
        "Secure tracking items error:",
        itemsResult.error
      );
    }

    if (historyResult.error) {
      console.warn(
        "Secure tracking history error:",
        historyResult.error
      );
    }

    return NextResponse.json(
      {
        order,
        orderItems:
          itemsResult.data || [],
        statusHistory:
          historyResult.data || [],
      },
      {
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.warn(
      "Secure order tracking GET failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load this order.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const { id } =
      await context.params;

    const auth =
      await authorizeOrder(id);

    if ("error" in auth) {
      return auth.error;
    }

    const body =
      await request
        .json()
        .catch(() => null);

    if (
      body?.action !== "cancel"
    ) {
      return NextResponse.json(
        {
          error:
            "Unsupported order action.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Load the order first so we can
     * perform the same normalized email
     * verification before allowing the
     * cancellation.
     */

    const {
      data: existingOrder,
      error: existingOrderError,
    } = await supabaseAdmin
      .from("orders")
      .select(
        "id, customer_email, status"
      )
      .eq(
        "id",
        auth.orderId
      )
      .maybeSingle();

    if (existingOrderError) {
      console.warn(
        "Secure tracking cancellation verification error:",
        existingOrderError
      );

      return NextResponse.json(
        {
          error:
            "Unable to cancel your order right now.",
        },
        {
          status: 500,
        }
      );
    }

    if (!existingOrder) {
      return NextResponse.json(
        {
          error:
            "Order not found.",
        },
        {
          status: 404,
        }
      );
    }

    const storedEmail =
      String(
        existingOrder.customer_email || ""
      )
        .trim()
        .toLowerCase();

    const sessionEmail =
      String(
        auth.session.email || ""
      )
        .trim()
        .toLowerCase();

    if (
      !storedEmail ||
      storedEmail !== sessionEmail
    ) {
      return NextResponse.json(
        {
          error:
            "Please verify this order before updating it.",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * Concurrency protection:
     *
     * The order can only be cancelled
     * while it is STILL pending.
     *
     * If an admin changes the order at
     * the same time, this update affects
     * zero rows instead of overwriting
     * the newer status.
     */

    const {
      data: updatedOrder,
      error: cancelError,
    } = await supabaseAdmin
      .from("orders")
      .update({
        status: "cancelled",
      })
      .eq(
        "id",
        auth.orderId
      )
      .eq(
        "status",
        "pending"
      )
      .select(
        "id, customer_name, customer_email, customer_phone, delivery_address, delivery_city, order_notes, payment_method, subtotal, delivery_fee, total, status, created_at, estimated_minutes, estimated_delivery_at"
      )
      .maybeSingle();

    if (cancelError) {
      console.warn(
        "Secure tracking cancellation error:",
        cancelError
      );

      return NextResponse.json(
        {
          error:
            "Unable to cancel your order right now.",
        },
        {
          status: 500,
        }
      );
    }

    if (!updatedOrder) {
      return NextResponse.json(
        {
          error:
            "This order can no longer be cancelled because its status has already changed.",
        },
        {
          status: 409,
        }
      );
    }

    const {
      data: statusHistory,
      error: historyError,
    } = await supabaseAdmin
      .from(
        "order_status_history"
      )
      .select(
        "id, order_id, status, created_at"
      )
      .eq(
        "order_id",
        auth.orderId
      )
      .order(
        "created_at",
        {
          ascending: true,
        }
      );

    if (historyError) {
      console.warn(
        "Secure cancellation history error:",
        historyError
      );
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      statusHistory:
        statusHistory || [],
    });
  } catch (error) {
    console.warn(
      "Secure order tracking PATCH failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to update this order.",
      },
      {
        status: 500,
      }
    );
  }
}