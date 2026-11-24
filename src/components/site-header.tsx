import { auth0 } from "@/lib/auth0";

export async function SiteHeader() {
  const session = await auth0.getSession();
  const user = session?.user;

  return (
    <header className="border-b border-line">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-6 px-6 py-5">
        <a href="/" className="font-serif text-xl tracking-tight text-ink">
          LowerBackPainClub
        </a>
        {user ? (
          <div className="text-right text-sm">
            <p className="font-medium text-ink">{user.name}</p>
            <p className="text-muted">{user.email}</p>
            <a
              href="/auth/logout"
              className="mt-1 inline-block text-accent hover:text-accent-strong"
            >
              Log out
            </a>
          </div>
        ) : (
          <a
            href="/auth/login"
            className="text-sm font-semibold text-accent hover:text-accent-strong"
          >
            Log in
          </a>
        )}
      </div>
    </header>
  );
}
