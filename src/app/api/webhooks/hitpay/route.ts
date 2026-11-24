import { NextResponse } from "next/server";
import { confirmBooking } from "@/lib/bookings";
import { isPaidDeposit, verifyHitPaySignature } from "@/lib/hitpay";

type HitPayPayload = {
  status?: string;
  amount?: string | number;
  currency?: string;
  reference_number?: string;
};

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("Hitpay-Signature");
  const salt = process.env.HITPAY_SALT;

  if (!salt || !verifyHitPaySignature(body, signature, salt)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: HitPayPayload;
  try {
    payload = JSON.parse(body) as HitPayPayload;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const eventObject = request.headers.get("Hitpay-Event-Object");
  const reference = payload.reference_number;
  const isPaymentRequest = !eventObject || eventObject === "payment_request";

  if (isPaymentRequest && reference && isPaidDeposit(payload)) {
    await confirmBooking(reference);
  }

  return NextResponse.json({ received: true });
}
