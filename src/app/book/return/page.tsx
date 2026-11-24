import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { getBooking } from "@/lib/bookings";
import { SiteHeader } from "@/components/site-header";

export default async function BookingReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ booking?: string }>;
}) {
  const session = await auth0.getSession();
  if (!session?.user.email) {
    redirect("/auth/login?returnTo=/book");
  }

  const { booking: bookingId } = await searchParams;
  const booking = bookingId ? await getBooking(bookingId) : undefined;
  const ownsBooking =
    booking &&
    booking.email.toLowerCase() === session.user.email.toLowerCase();

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-16">
        <p className="text-sm font-medium tracking-[0.18em] text-accent uppercase">
          Deposit
        </p>
        <h1 className="mt-4 font-serif text-5xl text-ink">Back from checkout</h1>
        <p className="mt-4 max-w-xl text-lg text-muted">
          Returning from HitPay does not confirm the booking. It is confirmed
          only after the signed webhook arrives.
        </p>
        {ownsBooking ? (
          <p className="mt-8 rounded-2xl border border-line bg-card px-5 py-4 text-ink">
            {booking.therapist} · {booking.slot.replace("T", " ")} ·{" "}
            <span className="capitalize">{booking.status}</span>
          </p>
        ) : (
          <p className="mt-8 text-muted">No matching booking for this account.</p>
        )}
        <a
          href="/book"
          className="mt-8 inline-flex w-fit text-sm font-semibold text-accent hover:text-accent-strong"
        >
          Back to booking
        </a>
      </main>
    </div>
  );
}
