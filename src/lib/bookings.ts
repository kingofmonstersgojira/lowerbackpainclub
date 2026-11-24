import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

export const THERAPISTS = ["Dr Lim", "Dr Tan", "Dr Wong"] as const;
export type Therapist = (typeof THERAPISTS)[number];

const SLOT_TIMES = ["09:00", "11:00", "14:00", "16:00"] as const;

export type BookingStatus = "pending" | "confirmed" | "failed";

export type Booking = {
  id: string;
  therapist: Therapist;
  slot: string;
  email: string;
  name: string;
  status: BookingStatus;
  paymentRequestId?: string;
  createdAt: string;
};

const dataFile = path.join(process.cwd(), "data", "bookings.json");

let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function readBookings(): Promise<Booking[]> {
  try {
    const raw = await readFile(dataFile, "utf8");
    const parsed = JSON.parse(raw) as Booking[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function writeBookings(bookings: Booking[]) {
  await mkdir(path.dirname(dataFile), { recursive: true });
  await writeFile(dataFile, JSON.stringify(bookings, null, 2));
}

export function tomorrowSlots(now = new Date()) {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Singapore",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const tomorrow = new Date(`${today}T00:00:00+08:00`);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Singapore",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(tomorrow);

  return SLOT_TIMES.map((time) => {
    const id = `${date}T${time}`;
    const label = new Intl.DateTimeFormat("en-SG", {
      timeZone: "Asia/Singapore",
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(`${id}:00+08:00`));
    return { id, label };
  });
}

export function isTherapist(value: string): value is Therapist {
  return THERAPISTS.includes(value as Therapist);
}

export async function createBooking(input: {
  therapist: Therapist;
  slot: string;
  email: string;
  name: string;
}) {
  const allowed = new Set(tomorrowSlots().map((slot) => slot.id));
  if (!allowed.has(input.slot)) {
    throw new Error("Choose one of tomorrow's time slots.");
  }

  const booking: Booking = {
    id: randomUUID(),
    therapist: input.therapist,
    slot: input.slot,
    email: input.email,
    name: input.name,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  await enqueue(async () => {
    const bookings = await readBookings();
    bookings.push(booking);
    await writeBookings(bookings);
  });

  return booking;
}

export async function attachPaymentRequest(id: string, paymentRequestId: string) {
  await enqueue(async () => {
    const bookings = await readBookings();
    const booking = bookings.find((item) => item.id === id);
    if (!booking) return;
    booking.paymentRequestId = paymentRequestId;
    await writeBookings(bookings);
  });
}

export async function markBookingFailed(id: string) {
  await enqueue(async () => {
    const bookings = await readBookings();
    const booking = bookings.find((item) => item.id === id);
    if (!booking || booking.status === "confirmed") return;
    booking.status = "failed";
    await writeBookings(bookings);
  });
}

export async function confirmBooking(id: string) {
  return enqueue(async () => {
    const bookings = await readBookings();
    const booking = bookings.find((item) => item.id === id);
    if (!booking) return "missing" as const;
    if (booking.status === "confirmed") return "already" as const;
    booking.status = "confirmed";
    await writeBookings(bookings);
    return "confirmed" as const;
  });
}

export async function getBooking(id: string) {
  const bookings = await readBookings();
  return bookings.find((item) => item.id === id);
}

export async function bookingsForEmail(email: string) {
  const bookings = await readBookings();
  return bookings
    .filter((item) => item.email.toLowerCase() === email.toLowerCase())
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
