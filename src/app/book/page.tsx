import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import {
  THERAPISTS,
  bookingsForEmail,
  tomorrowSlots,
} from "@/lib/bookings";
import { SiteHeader } from "@/components/site-header";
import { payDeposit } from "./actions";

const errors: Record<string, string> = {
  therapist: "Choose one of the three therapists.",
  slot: "Choose one of tomorrow's time slots.",
  "hitpay-key": "Add your HitPay sandbox API key to .env.local, then restart the app.",
  hitpay: "HitPay did not start checkout. The booking was not confirmed.",
};

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth0.getSession();
  if (!session?.user.email) {
    redirect("/auth/login?returnTo=/book");
  }

  const { error } = await searchParams;
  const slots = tomorrowSlots();
  const bookings = await bookingsForEmail(session.user.email);

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-16">
        <p className="text-sm font-medium tracking-[0.18em] text-accent uppercase">
          Booking
        </p>
        <h1 className="mt-4 font-serif text-5xl text-ink">Book an appointment</h1>
        <p className="mt-4 max-w-xl text-lg text-muted">
          Choose a therapist and a time tomorrow. A S$20 deposit is collected
          in the HitPay sandbox. The booking stays pending until HitPay confirms
          the payment.
        </p>

        {error && errors[error] ? (
          <p className="mt-6 rounded-2xl border border-line bg-card px-5 py-4 text-sm text-ink">
            {errors[error]}
          </p>
        ) : null}

        <form action={payDeposit} className="mt-10 grid gap-8">
          <fieldset>
            <legend className="text-sm font-medium tracking-[0.18em] text-muted uppercase">
              Therapist
            </legend>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {THERAPISTS.map((therapist) => (
                <label
                  key={therapist}
                  className="rounded-2xl border border-line bg-card px-5 py-4 text-ink"
                >
                  <input
                    className="mr-3 accent-accent"
                    type="radio"
                    name="therapist"
                    value={therapist}
                    required
                  />
                  {therapist}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium tracking-[0.18em] text-muted uppercase">
              Tomorrow
            </legend>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {slots.map((slot) => (
                <label
                  key={slot.id}
                  className="rounded-2xl border border-line bg-card px-5 py-4 text-ink"
                >
                  <input
                    className="mr-3 accent-accent"
                    type="radio"
                    name="slot"
                    value={slot.id}
                    required
                  />
                  {slot.label}
                </label>
              ))}
            </div>
          </fieldset>

          <button
            type="submit"
            className="inline-flex w-fit items-center justify-center rounded-full bg-accent px-6 py-3 text-base font-semibold text-white hover:bg-accent-strong"
          >
            Pay S$20 deposit
          </button>
        </form>

        {bookings.length > 0 ? (
          <section className="mt-16">
            <h2 className="text-sm font-medium tracking-[0.18em] text-muted uppercase">
              Your bookings
            </h2>
            <ul className="mt-4 grid gap-3">
              {bookings.map((booking) => (
                <li
                  key={booking.id}
                  className="rounded-2xl border border-line bg-card px-5 py-4"
                >
                  <p className="font-medium text-ink">
                    {booking.therapist} · {booking.slot.replace("T", " ")}
                  </p>
                  <p className="mt-1 text-sm text-muted capitalize">
                    {booking.status}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
    </div>
  );
}
