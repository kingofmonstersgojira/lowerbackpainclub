import { auth0 } from "@/lib/auth0";
import { SiteHeader } from "@/components/site-header";

const therapists = [
  {
    name: "Dr Lim",
    line: "Senior physiotherapist for disc and nerve pain, with a return-to-work plan.",
  },
  {
    name: "Dr Tan",
    line: "Treats desk-related stiffness and the lumbar strain that keeps coming back.",
  },
  {
    name: "Dr Wong",
    line: "Hands-on care for acute flares, plus home exercises you can actually keep.",
  },
];

export default async function HomePage() {
  const session = await auth0.getSession();
  const user = session?.user;

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-16 sm:py-24">
        <p className="text-sm font-medium tracking-[0.18em] text-accent uppercase">
          Physiotherapy
        </p>
        <h1 className="mt-4 max-w-2xl font-serif text-5xl leading-[1.05] text-ink sm:text-6xl">
          Lower back pain, treated properly.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
          Clinical care in Singapore for people who are tired of guarding their
          back — so sitting, lifting, and getting through the day stop feeling
          like a negotiation.
        </p>

        <section className="mt-16" aria-labelledby="therapists-heading">
          <h2
            id="therapists-heading"
            className="text-sm font-medium tracking-[0.18em] text-muted uppercase"
          >
            Therapists
          </h2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-3">
            {therapists.map((therapist) => (
              <li
                key={therapist.name}
                className="rounded-2xl border border-line bg-card px-5 py-6"
              >
                <h3 className="font-serif text-2xl text-ink">{therapist.name}</h3>
                <p className="mt-3 text-base leading-relaxed text-muted">
                  {therapist.line}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-12">
          {user ? (
            <a
              href="/book"
              className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-accent-strong"
            >
              Book appointment
            </a>
          ) : (
            <p className="text-base text-muted">
              Log in to book an appointment.
            </p>
          )}
        </div>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto w-full max-w-5xl px-6 py-6 text-sm text-muted">
          LowerBackPainClub · Physiotherapy · Singapore
        </div>
      </footer>
    </div>
  );
}
