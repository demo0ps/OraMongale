import Link from "next/link";

export const metadata = { title: "Thank you" };

export default function ThankYou() {
  return (
    <div className="bg-white">
      <section className="mx-auto max-w-2xl px-4 sm:px-6 py-24 text-center">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-gold/10 text-gold text-2xl">
          ✓
        </div>
        <h1 className="mt-5 text-3xl font-bold tracking-tight text-ink">
          Thank you — we have your request.
        </h1>
        <p className="mt-3 text-coal">
          A coordinator will call you back within one business day to confirm
          details and confirm capacity. If it is urgent, please call us directly
          — phone number will be displayed here once you confirm your contact
          details.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/" className="btn-primary">Back to home</Link>
        </div>
      </section>
    </div>
  );
}
