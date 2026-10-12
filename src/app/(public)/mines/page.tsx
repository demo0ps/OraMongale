import Link from "next/link";

export const metadata = { title: "For mines" };

export default function MinesPage() {
  return (
    <div className="bg-white">
      <section className="bg-ink text-white py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-xs uppercase tracking-widest text-gold mb-3">For mines & mine contractors</div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight max-w-2xl">
            Verified haulage capacity on short notice.
          </h1>
          <p className="mt-4 text-bone/90 max-w-2xl">
            Tell us what you need moved. We put compliant trucks on the road and
            a single coordinator on the phone from quote to load delivered.
          </p>
          <div className="mt-6">
            <Link href="/mines/post-job" className="btn-primary">
              Post a haulage need
            </Link>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-4 sm:px-6 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          <Val title="Vetted before you see them" body="Every haulier is company-checked and every truck is paperwork-checked before it is offered for a load. Expired documents pull a truck off the board automatically." />
          <Val title="One person, one call" body="You deal with the same coordinator from first call to final delivery. No call centres, no chatbots, no chasing three different people." />
          <Val title="Right truck for the load" body="Side-tippers, interlinks, lowbeds, water tankers, fuel tankers — matched to the material, route and tonnage, not just whoever is nearby." />
        </div>
      </section>
    </div>
  );
}

function Val({ title, body }: { title: string; body: string }) {
  return (
    <div className="card p-6">
      <h3 className="font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm text-coal leading-relaxed">{body}</p>
    </div>
  );
}
