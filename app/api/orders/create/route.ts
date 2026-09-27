import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  createTrackingSession,
  ORDER_TRACKING_COOKIE,
} from "@/lib/orderTrackingSession";

type CheckoutItemInput = {
  productId: number | string;
  quantity: number;
};

type CreateOrderBody = {
  customerName?: unknown;
  customerEmail?: unknown;
  customerPhone?: unknown;
  deliveryAddress?: unknown;
  deliveryCity?: unknown;
  orderNotes?: unknown;
  paymentMethod?: unknown;
  checkoutToken?: unknown;
  items?: unknown;
};

type StoreSettingsRow = {
  delivery_fee: number | string | null;
  minimum_order: number | string | null;
  default_eta_minutes: number | string | null;
  store_open: boolean | null;
  allow_cod: boolean | null;
};

type ProductRow = {
  id: number;
  name: string;
  price: number | string;
  image: string | null;
};

type AtomicOrderResult = {
  order?: Record<string, unknown>;
  orderItems?: Array<Record<string, unknown>>;
  duplicate?: boolean;
};

function cleanText(
  value: unknown,
  maxLength: number
) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLength);
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value
  );
}

function normalizeItems(
  value: unknown
): CheckoutItemInput[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const quantities = new Map<number, number>();

  for (const rawItem of value) {
    if (
      !rawItem ||
      typeof rawItem !== "object"
    ) {
      continue;
    }

    const item = rawItem as Record<
      string,
      unknown
    >;

    const productId = Number(
      item.productId
    );

    const quantity = Number(
      item.quantity
    );

    if (
      !Number.isInteger(productId) ||
      productId <= 0 ||
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      quantity > 99
    ) {
      continue;
    }

    const nextQuantity =
      (quantities.get(productId) || 0) +
      quantity;

    if (nextQuantity > 99) {
      throw new Error(
        "A product quantity cannot exceed 99."
      );
    }

    quantities.set(
      productId,
      nextQuantity
    );
  }

  return Array.from(
    quantities.entries()
  ).map(([productId, quantity]) => ({
    productId,
    quantity,
  }));
}

function money(value: number) {
  return (
    Math.round(
      (value + Number.EPSILON) * 100
    ) / 100
  );
}

export async function POST(
  request: Request
) {
  try {
    let body: CreateOrderBody;

    try {
      body =
        (await request.json()) as CreateOrderBody;
    } catch {
      return NextResponse.json(
        {
          error:
            "Invalid checkout request.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * =========================================
     * CUSTOMER INPUT VALIDATION
     * =========================================
     */

    const customerName = cleanText(
      body.customerName,
      120
    );

    const customerEmail = cleanText(
      body.customerEmail,
      254
    ).toLowerCase();

    const customerPhone = cleanText(
      body.customerPhone,
      40
    );

    const deliveryAddress = cleanText(
      body.deliveryAddress,
      500
    );

    const deliveryCity = cleanText(
      body.deliveryCity,
      120
    );

    const orderNotes = cleanText(
      body.orderNotes,
      1000
    );

    const paymentMethod = cleanText(
      body.paymentMethod,
      80
    );

    const checkoutToken = cleanText(
      body.checkoutToken,
      100
    );

    if (
      !customerName ||
      !customerEmail ||
      !customerPhone ||
      !deliveryAddress ||
      !deliveryCity
    ) {
      return NextResponse.json(
        {
          error:
            "Please complete all required checkout fields.",
        },
        {
          status: 400,
        }
      );
    }

    if (!checkoutToken) {
      return NextResponse.json(
        {
          error:
            "Missing checkout token. Please refresh the checkout page and try again.",
        },
        { status: 400 }
      );
    }

    if (!isValidEmail(customerEmail)) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid email address.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * =========================================
     * CART VALIDATION
     * =========================================
     */

    let normalizedItems:
      CheckoutItemInput[];

    try {
      normalizedItems =
        normalizeItems(body.items);
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Invalid cart items.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      normalizedItems.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Your cart is empty or contains invalid items.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      normalizedItems.length > 50
    ) {
      return NextResponse.json(
        {
          error:
            "Your cart contains too many different products.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * =========================================
     * LOAD CURRENT STORE SETTINGS
     * =========================================
     */

    const {
      data: settingsData,
      error: settingsError,
    } = await supabaseAdmin
      .from("store_settings")
      .select(
        "delivery_fee, minimum_order, default_eta_minutes, store_open, allow_cod"
      )
      .eq("id", 1)
      .maybeSingle();

    if (
      settingsError ||
      !settingsData
    ) {
      console.warn(
        "Secure checkout settings error:",
        settingsError
      );

      return NextResponse.json(
        {
          error:
            "Checkout is temporarily unavailable. Please try again shortly.",
        },
        {
          status: 503,
        }
      );
    }

    const settings =
      settingsData as StoreSettingsRow;

    const storeOpen =
      Boolean(settings.store_open);

    const allowCod =
      Boolean(settings.allow_cod);

    const deliveryFee = money(
      Math.max(
        0,
        Number(
          settings.delivery_fee || 0
        )
      )
    );

    const minimumOrder = money(
      Math.max(
        0,
        Number(
          settings.minimum_order || 0
        )
      )
    );

    const defaultEtaMinutes =
      Math.max(
        1,
        Math.min(
          1440,
          Math.round(
            Number(
              settings.default_eta_minutes ||
                45
            )
          )
        )
      );

    if (!storeOpen) {
      return NextResponse.json(
        {
          error:
            "The store is currently closed and is not accepting new orders.",
        },
        {
          status: 403,
        }
      );
    }

    if (!allowCod) {
      return NextResponse.json(
        {
          error:
            "Cash on Delivery is currently unavailable.",
        },
        {
          status: 403,
        }
      );
    }

    if (
      paymentMethod !==
      "Cash on Delivery"
    ) {
      return NextResponse.json(
        {
          error:
            "The selected payment method is unavailable.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * =========================================
     * LOAD AUTHORITATIVE PRODUCTS + PRICES
     * =========================================
     */

    const productIds =
      normalizedItems.map(
        (item) =>
          Number(item.productId)
      );

    const {
      data: productData,
      error: productsError,
    } = await supabaseAdmin
      .from("products")
      .select(
        "id, name, price, image"
      )
      .in("id", productIds);

    if (productsError) {
      console.warn(
        "Secure checkout products error:",
        productsError
      );

      return NextResponse.json(
        {
          error:
            "Unable to verify the products in your cart.",
        },
        {
          status: 500,
        }
      );
    }

    const products =
      (productData || []) as ProductRow[];

    const productsById = new Map(
      products.map((product) => [
        Number(product.id),
        product,
      ])
    );

    if (
      productsById.size !==
      normalizedItems.length
    ) {
      return NextResponse.json(
        {
          error:
            "One or more products in your cart are no longer available. Please refresh your cart.",
        },
        {
          status: 409,
        }
      );
    }

    /*
     * =========================================
     * SERVER-SIDE TOTALS
     * =========================================
     */

    let subtotal = 0;

    const verifiedItems =
      normalizedItems.map(
        (item) => {
          const product =
            productsById.get(
              Number(
                item.productId
              )
            );

          if (!product) {
            throw new Error(
              "Product validation failed."
            );
          }

          const price =
            Number(product.price);

          if (
            !Number.isFinite(price) ||
            price < 0
          ) {
            throw new Error(
              `Invalid price for product ${product.id}.`
            );
          }

          subtotal +=
            price * item.quantity;

          return {
            product_id:
              Number(product.id),

            product_name:
              product.name,

            product_image:
              product.image,

            price: money(price),

            quantity:
              item.quantity,
          };
        }
      );

    subtotal = money(subtotal);

    if (subtotal < minimumOrder) {
      const remaining = money(
        Math.max(
          minimumOrder - subtotal,
          0
        )
      );

      return NextResponse.json(
        {
          error:
            `Minimum order is ₱${minimumOrder.toLocaleString(
              "en-PH",
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            )}. Please add ₱${remaining.toLocaleString(
              "en-PH",
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            )} more to your cart.`,
        },
        {
          status: 400,
        }
      );
    }

    const total = money(
      subtotal + deliveryFee
    );

    const estimatedDeliveryAt =
      new Date(
        Date.now() +
          defaultEtaMinutes *
            60 *
            1000
      ).toISOString();

    /*
     * =========================================
     * ATOMIC DATABASE TRANSACTION
     * =========================================
     *
     * The PostgreSQL RPC inserts:
     * 1. orders row
     * 2. every order_items row
     *
     * If ANY part fails, PostgreSQL rolls back
     * the whole function call automatically.
     */

    const {
      data: atomicData,
      error: atomicError,
    } = await supabaseAdmin.rpc(
      "create_order_atomic",
      {
        p_checkout_token:
          checkoutToken,

        p_customer_name:
          customerName,

        p_customer_email:
          customerEmail,

        p_customer_phone:
          customerPhone,

        p_delivery_address:
          deliveryAddress,

        p_delivery_city:
          deliveryCity,

        p_order_notes:
          orderNotes || null,

        p_payment_method:
          "Cash on Delivery",

        p_subtotal:
          subtotal,

        p_delivery_fee:
          deliveryFee,

        p_total:
          total,

        p_estimated_minutes:
          defaultEtaMinutes,

        p_estimated_delivery_at:
          estimatedDeliveryAt,

        p_items:
          verifiedItems,
      }
    );

    if (
      atomicError ||
      !atomicData
    ) {
      console.warn(
        "Atomic order creation error:",
        atomicError
      );

      return NextResponse.json(
        {
          error:
            atomicError?.message ||
            "Unable to create your order.",
        },
        {
          status: 500,
        }
      );
    }

    const result =
      atomicData as AtomicOrderResult;

    if (!result.order) {
      return NextResponse.json(
        {
          error:
            "Order creation returned an invalid result.",
        },
        {
          status: 500,
        }
      );
    }

    const createdOrderId =
      Number(result.order.id);

    if (
      !Number.isInteger(createdOrderId) ||
      createdOrderId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Order creation returned an invalid order ID.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * Give the customer a temporary,
     * signed HttpOnly tracking session
     * immediately after checkout.
     *
     * This lets /order-success/[id] load
     * securely without asking for the
     * customer's email a second time.
     */
    const trackingToken =
      createTrackingSession(
        createdOrderId,
        customerEmail
      );

    const response =
      NextResponse.json(
        {
          success: true,
          duplicate:
            result.duplicate === true,
          order: result.order,
          orderItems:
            result.orderItems || [],
        },
        {
          status: 201,
        }
      );

    response.cookies.set(
      ORDER_TRACKING_COOKIE,
      trackingToken,
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV ===
          "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24,
      }
    );

    /*
     * =========================================
     * AUTOMATIC ORDER CONFIRMATION EMAIL
     * =========================================
     *
     * Send this side effect ONLY when the RPC
     * actually created a new order.
     *
     * If the same checkout token is retried,
     * create_order_atomic returns the existing
     * order with duplicate = true. In that case
     * we still return the same order and refresh
     * the tracking cookie, but we do NOT trigger
     * another confirmation-email request.
     */
    if (result.duplicate !== true) {
      const internalEmailSecret =
        process.env.INTERNAL_EMAIL_API_SECRET;

      if (!internalEmailSecret) {
        console.warn(
          "Automatic confirmation email skipped: INTERNAL_EMAIL_API_SECRET is not configured."
        );
      } else {
        try {
          const confirmationUrl = new URL(
            "/api/orders/send-confirmation",
            request.url
          );

          const emailResponse = await fetch(
            confirmationUrl,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-doughy-internal-email":
                  internalEmailSecret,
              },
              body: JSON.stringify({
                orderId: createdOrderId,
                forceResend: false,
              }),
              cache: "no-store",
            }
          );

          if (!emailResponse.ok) {
            const emailError =
              await emailResponse
                .json()
                .catch(() => null);

            console.warn(
              "Automatic confirmation email could not be sent:",
              emailError
            );
          }
        } catch (emailError) {
          console.warn(
            "Automatic confirmation email request failed:",
            emailError
          );
        }
      }
    }

    return response;
  } catch (error) {
    console.warn(
      "Secure checkout unexpected error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to place your order right now. Please try again.",
      },
      {
        status: 500,
      }
    );
  }
}
