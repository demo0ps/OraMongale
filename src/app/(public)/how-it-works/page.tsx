import Link from "next/link";

export const metadata = { title: "How it works" };

export default function HowItWorks() {
  return (
    <div className="bg-white">
      <section className="bg-ink text-white py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">How ORAMONGALE works</h1>
          <p className="mt-4 text-bone/90 max-w-2xl">
            A deliberately simple process — because haulage is a phone business, not a software business.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-16 space-y-10">
        <Step n={1} title="Haulier registers" body="Company details, contact person, operating provinces, trucks and compliance documents." />
        <Step n={2} title="We review paperwork" body="Our team checks every license, permit, disc and insurance policy. Only compliant trucks go live." />
        <Step n={3} title="Mine posts a need" body="Via the form or on the phone — material, tonnage, from-to, start date, required truck type." />
        <Step n={4} title="We match the right trucks" body="Available, in-date, in-area. We call the hauliers; we call you back with confirmed capacity." />
        <Step n={5} title="Trucks roll" body="The haulier reports to site with paperwork in order. Our coordinator stays on the line through the job." />
        <Step n={6} title="After the job" body="Trucks return to available. Any expired docs are flagged automatically before the next load." />
        <div className="pt-4 flex flex-wrap gap-3">
          <Link href="/hauliers/join" className="btn-primary">List your trucks</Link>
          <Link href="/mines/post-job" className="btn-ghost">Post a haulage need</Link>
        </div>
      </section>
    </div>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="flex gap-5">
      <div className="shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-full bg-gold text-white font-semibold">{n}</div>
      <div>
        <h3 className="text-lg font-semibold text-ink">{title}</h3>
        <p className="mt-1 text-coal leading-relaxed">{body}</p>
      </div>
    </div>
  );
}
