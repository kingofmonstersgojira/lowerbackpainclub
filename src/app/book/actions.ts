"use server";

import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import {
  attachPaymentRequest,
  createBooking,
  isTherapist,
  markBookingFailed,
} from "@/lib/bookings";
import { DEPOSIT_AMOUNT, DEPOSIT_CURRENCY, HITPAY_API_BASE } from "@/lib/hitpay";

export async function payDeposit(formData: FormData) {
  const session = await auth0.getSession();
  const email = session?.user.email;
  if (!email) {
    redirect("/auth/login?returnTo=/book");
  }

  const therapist = String(formData.get("therapist") ?? "");
  const slot = String(formData.get("slot") ?? "");
  if (!isTherapist(therapist)) {
    redirect("/book?error=therapist");
  }

  const apiKey = process.env.HITPAY_API_KEY;
  const appUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";
  if (!apiKey) {
    redirect("/book?error=hitpay-key");
  }

  let booking;
  try {
    booking = await createBooking({
      therapist,
      slot,
      email,
      name: session.user.name ?? email,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("time slots")) {
      redirect("/book?error=slot");
    }
    throw error;
  }

  const response = await fetch(`${HITPAY_API_BASE}/v1/payment-requests`, {
    method: "POST",
    headers: {
      "X-BUSINESS-API-KEY": apiKey,
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    body: JSON.stringify({
      amount: DEPOSIT_AMOUNT,
      currency: DEPOSIT_CURRENCY,
      email,
      name: session.user.name,
      purpose: `Appointment deposit with ${therapist}`,
      reference_number: booking.id,
      redirect_url: `${appUrl}/book/return?booking=${booking.id}`,
      webhook: `${appUrl}/api/webhooks/hitpay`,
    }),
  });

  const data = (await response.json()) as {
    id?: string;
    url?: string;
  };

  if (!response.ok || !data.url || !data.id) {
    await markBookingFailed(booking.id);
    redirect("/book?error=hitpay");
  }

  await attachPaymentRequest(booking.id, data.id);
  redirect(data.url);
}
