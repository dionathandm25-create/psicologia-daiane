import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const TOKEN_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

type GuestPaymentTokenPayload = {
  appointmentId: number;
  expiresAt: number;
  nonce: string;
};

function deriveSigningKey(serviceRoleKey: string) {
  return createHmac("sha256", serviceRoleKey)
    .update("guest-payment-capability-v1")
    .digest();
}

export function createGuestPaymentToken(
  appointmentId: number,
  serviceRoleKey: string,
  now = Date.now()
) {
  const payload: GuestPaymentTokenPayload = {
    appointmentId,
    expiresAt: now + TOKEN_LIFETIME_MS,
    nonce: randomBytes(16).toString("base64url"),
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    "base64url"
  );
  const signature = createHmac(
    "sha256",
    deriveSigningKey(serviceRoleKey)
  )
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

export function verifyGuestPaymentToken(
  token: string,
  appointmentId: number,
  serviceRoleKey: string,
  now = Date.now()
) {
  if (token.length > 2048) {
    return false;
  }

  const [encodedPayload, encodedSignature, extra] = token.split(".");
  if (!encodedPayload || !encodedSignature || extra !== undefined) {
    return false;
  }

  let decodedPayload: unknown;
  try {
    decodedPayload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    );
  } catch {
    return false;
  }

  if (
    typeof decodedPayload !== "object" ||
    decodedPayload === null ||
    Array.isArray(decodedPayload)
  ) {
    return false;
  }

  const payload = decodedPayload as GuestPaymentTokenPayload;
  if (
    payload.appointmentId !== appointmentId ||
    !Number.isSafeInteger(payload.expiresAt) ||
    payload.expiresAt <= now ||
    payload.expiresAt > now + TOKEN_LIFETIME_MS ||
    typeof payload.nonce !== "string" ||
    !/^[A-Za-z0-9_-]{20,24}$/.test(payload.nonce)
  ) {
    return false;
  }

  const expectedSignature = createHmac(
    "sha256",
    deriveSigningKey(serviceRoleKey)
  )
    .update(encodedPayload)
    .digest();
  const providedSignature = Buffer.from(encodedSignature, "base64url");

  return (
    providedSignature.length === expectedSignature.length &&
    timingSafeEqual(providedSignature, expectedSignature)
  );
}
