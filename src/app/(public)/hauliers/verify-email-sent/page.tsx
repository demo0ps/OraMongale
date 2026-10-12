import Link from "next/link";

// Email verification is no longer part of the flow (no-password sign-up).
// Kept as a friendly landing in case anyone follows an old link.
export const metadata = { title: "Verification not needed" };

export default function VerifyEmailSentPage() {
  return (
    <div className="bg-white">
      <section className="bg-bone py-12">
        <div className="mx-auto max-w-xl px-4 sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight text-ink">
            You&rsquo;re good to go
          </h1>
          <p className="mt-2 text-coal">
            Haulier sign-up no longer requires email verification. Go straight to
            your fleet dashboard.
          </p>
          <div className="mt-6">
            <Link href="/hauliers/dashboard" className="btn-primary">
              Open my fleet dashboard
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
