import crypto from "node:crypto";

export const ORDER_TRACKING_COOKIE =
  "doughy_order_tracking";

type TrackingSessionPayload = {
  orderId: number;
  email: string;
  exp: number;
};

function getSecret() {
  const secret =
    process.env.ORDER_TRACKING_SECRET;

  if (
    !secret ||
    secret.length < 32
  ) {
    throw new Error(
      "ORDER_TRACKING_SECRET must be configured with at least 32 characters."
    );
  }

  return secret;
}

function sign(value: string) {
  return crypto
    .createHmac(
      "sha256",
      getSecret()
    )
    .update(value)
    .digest("base64url");
}

export function createTrackingSession(
  orderId: number,
  email: string
) {
  const payload: TrackingSessionPayload = {
    orderId,
    email:
      email.trim().toLowerCase(),
    exp:
      Date.now() +
      1000 * 60 * 60 * 24,
  };

  const encoded =
    Buffer.from(
      JSON.stringify(payload),
      "utf8"
    ).toString("base64url");

  const signature = sign(encoded);

  return `${encoded}.${signature}`;
}

export function verifyTrackingSession(
  token: string | undefined
): TrackingSessionPayload | null {
  if (!token) {
    return null;
  }

  const [
    encoded,
    signature,
  ] = token.split(".");

  if (
    !encoded ||
    !signature
  ) {
    return null;
  }

  const expected =
    sign(encoded);

  const actualBuffer =
    Buffer.from(signature);

  const expectedBuffer =
    Buffer.from(expected);

  if (
    actualBuffer.length !==
    expectedBuffer.length
  ) {
    return null;
  }

  if (
    !crypto.timingSafeEqual(
      actualBuffer,
      expectedBuffer
    )
  ) {
    return null;
  }

  try {
    const payload =
      JSON.parse(
        Buffer.from(
          encoded,
          "base64url"
        ).toString("utf8")
      ) as TrackingSessionPayload;

    if (
      !Number.isInteger(
        payload.orderId
      ) ||
      payload.orderId <= 0 ||
      typeof payload.email !==
        "string" ||
      !payload.email ||
      typeof payload.exp !==
        "number" ||
      Date.now() > payload.exp
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
