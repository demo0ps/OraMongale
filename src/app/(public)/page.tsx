import Link from "next/link";
import Image from "next/image";
import Hero from "@/components/Hero";

export default function HomePage() {
  return (
    <>
      <Hero />

      {/* SOCIAL PROOF STRIP */}
      <section className="bg-white border-b border-dust">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 text-center text-steel text-sm">
          Hauling coal, platinum ore, iron ore, chrome, manganese and overburden
          across Mpumalanga, Limpopo, Northern Cape, North West and the Free State.
        </div>
      </section>

      {/* TWO-SIDED VALUE */}
      <section className="bg-bone py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-ink text-center">
            Built for both sides of the haul road
          </h2>
          <p className="text-center text-steel mt-3 max-w-2xl mx-auto">
            Mines need capacity on short notice. Hauliers need legitimate contracts
            without chasing tenders. OraMongale closes that gap.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <Card
              eyebrow="For hauliers"
              title="Get your trucks to work."
              body="List your fleet once, upload your compliance paperwork, and let the right contracts come to you. No more cold-calling procurement offices or paying to be on six different WhatsApp groups."
              ctaHref="/hauliers/join"
              ctaLabel="List your trucks →"
            />
            <Card
              eyebrow="For mines"
              title="Verified capacity when you need it."
              body="Tell us what you need to move, from where, to where, and when. We match you with operators whose trucks and paperwork are already checked and current. No surprises at the gate."
              ctaHref="/mines/post-job"
              ctaLabel="Post a haulage need →"
            />
          </div>
        </div>
      </section>

      {/* PERSON SECTION */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 grid md:grid-cols-2 gap-12 items-center">
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg shadow-md bg-slate2">
            <Image
              src="/images/person-dispatcher.jpg"
              alt="An OraMongale coordinator on the phone with a clipboard at the truck yard"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div>
            <p className="uppercase tracking-widest text-xs text-gold mb-3">
              How we work
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-ink">
              You deal with a person, not a portal.
            </h2>
            <p className="mt-4 text-coal leading-relaxed">
              Behind every load is a coordinator who knows the operators, knows
              the routes, and knows what compliance actually looks like. You pick
              up the phone, you get the same person.
            </p>
            <ul className="mt-6 space-y-3 text-coal">
              <Bullet>A real person answers when you call — not a chatbot.</Bullet>
              <Bullet>Trucks and paperwork checked before a truck is offered to you.</Bullet>
              <Bullet>Expired docs pull a truck off the board automatically.</Bullet>
              <Bullet>One point of contact for the job, start to finish.</Bullet>
            </ul>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-bone py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-ink text-center">
            How it works
          </h2>
          <p className="text-center text-steel mt-3 max-w-2xl mx-auto">
            Four steps. No tenders. No algorithms.
          </p>
          <ol className="mt-12 grid gap-6 md:grid-cols-4 text-center">
            <Step n={1} title="Haulier lists trucks" body="Register your company, upload current compliance paperwork, list your fleet." />
            <Step n={2} title="We verify paperwork" body="Our team checks every license, disc, permit and insurance policy. Trucks only go live when current." />
            <Step n={3} title="Mine posts a need" body="A mine tells us what material, tonnage and route. We look at who is actually available and compliant." />
            <Step n={4} title="Trucks roll" body="You get the call, the truck shows up on site, and the paperwork is already in order." />
          </ol>
        </div>
      </section>

      {/* LOADING SHOT */}
      <section className="relative h-80 md:h-[28rem] bg-black">
        <Image
          src="/images/mine-loading.jpg"
          alt="An excavator loading ore into a haul truck at an open-pit mine"
          fill
          unoptimized
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/20" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 h-full flex items-center">
          <blockquote className="max-w-2xl text-white">
            <p className="text-2xl md:text-3xl font-semibold leading-snug">
              &ldquo;We don&rsquo;t sell &lsquo;access to a platform&rsquo;. We match
              people who need hauling with people who haul, and we stay on the
              phone until the load is delivered.&rdquo;
            </p>
          </blockquote>
        </div>
      </section>

      {/* TRUCK YARD + CTA */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1">
            <h2 className="text-3xl font-bold tracking-tight text-ink">
              Hauliers: stop chasing tenders.
            </h2>
            <p className="mt-4 text-coal leading-relaxed">
              If your trucks are compliant, your discs are current, and you show up
              when you say you will, we want you on the board. Register once, upload
              your paperwork, and we&rsquo;ll call when there&rsquo;s work that fits
              your fleet.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/hauliers/join" className="btn-primary">List your trucks</Link>
              <Link href="/hauliers" className="btn-ghost">Learn more for hauliers</Link>
            </div>
          </div>
          <div className="order-1 md:order-2 relative aspect-[4/3] overflow-hidden rounded-lg shadow-md bg-slate2">
            <Image
              src="/images/truck-yard.jpg"
              alt="A haulier's yard at dawn with trucks lined up ready to roll"
              fill
              unoptimized
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-black text-white py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Need trucks? Have trucks? Either way, start with a person.
          </h2>
          <p className="mt-4 text-bone/80">
            Tell us what you need and we&rsquo;ll get back to you within one business day.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/mines/post-job" className="btn bg-gold text-navy hover:bg-goldbright font-semibold">
              Post a haulage need
            </Link>
            <Link href="/hauliers/join" className="btn bg-white text-navy hover:bg-bone">
              List your trucks
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function Card({
  eyebrow,
  title,
  body,
  ctaHref,
  ctaLabel,
}: {
  eyebrow: string;
  title: string;
  body: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <div className="card p-7">
      <div className="text-xs uppercase tracking-widest text-gold">{eyebrow}</div>
      <h3 className="mt-2 text-xl font-semibold text-ink">{title}</h3>
      <p className="mt-3 text-coal leading-relaxed">{body}</p>
      <Link
        href={ctaHref}
        className="mt-5 inline-block text-gold font-medium hover:underline"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span
        aria-hidden
        className="mt-1.5 inline-block h-1.5 w-1.5 rounded-full bg-gold shrink-0"
      />
      <span>{children}</span>
    </li>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <li className="card p-6 text-left">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gold text-navy font-semibold">
          {n}
        </span>
        <h3 className="font-semibold text-ink">{title}</h3>
      </div>
      <p className="mt-3 text-sm text-coal leading-relaxed">{body}</p>
    </li>
  );
}
