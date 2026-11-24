import crypto from "crypto";

/** Sandbox only. Live HitPay is intentionally not selectable. */
export const HITPAY_API_BASE = "https://api.sandbox.hit-pay.com";

export const DEPOSIT_AMOUNT = 20;
export const DEPOSIT_CURRENCY = "SGD";

export function verifyHitPaySignature(
  body: string,
  signature: string | null,
  salt: string,
): boolean {
  if (!signature || !salt) return false;

  const expectedSignature = crypto
    .createHmac("sha256", salt)
    .update(body)
    .digest("hex");

  const received = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  if (received.length !== expected.length) return false;

  return crypto.timingSafeEqual(received, expected);
}

export function isPaidDeposit(payload: {
  status?: string;
  amount?: string | number;
  currency?: string;
}): boolean {
  if (payload.status !== "completed") return false;

  const amount = Number(payload.amount);
  const currency = payload.currency?.toLowerCase();
  return amount === DEPOSIT_AMOUNT && currency === "sgd";
}
