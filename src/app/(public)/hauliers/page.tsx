import Link from "next/link";

export const metadata = { title: "For hauliers" };

export default function HauliersPage() {
  return (
    <div className="bg-white">
      <PageIntro
        eyebrow="For hauliers"
        title="Get your trucks to work. Stop chasing tenders."
        body="ORAMONGALE works with compliant, reliable haulage companies across South Africa. Register once, upload your paperwork, list your trucks, and we call you when there is work that fits."
      />
      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-20">
        <div className="grid md:grid-cols-2 gap-6">
          <Panel title="What you get">
            <ul className="space-y-2 text-coal">
              <Li>Access to mine haulage contracts without cold-calling procurement.</Li>
              <Li>One point of contact — a person who knows your fleet.</Li>
              <Li>Clear job specs: material, tonnage, route, start date.</Li>
              <Li>Payments and contracts stay between you and the mine; we just make the connection.</Li>
            </ul>
          </Panel>
          <Panel title="What we require">
            <ul className="space-y-2 text-coal">
              <Li>Valid, registered company with current CIPC documents.</Li>
              <Li>COIDA Letter of Good Standing.</Li>
              <Li>Public liability and Goods in Transit insurance.</Li>
              <Li>For every truck: valid license disc, roadworthy certificate, operator card and operating permit.</Li>
              <Li>No expired paperwork on the board — we check, and the system pulls expired trucks automatically.</Li>
            </ul>
          </Panel>
        </div>
        <div className="mt-10 card p-7 bg-bone border-dust">
          <h3 className="text-xl font-semibold text-ink">Ready to list?</h3>
          <p className="mt-2 text-coal">
            It takes about 10 minutes to sign up. After that you can add your
            trucks and upload compliance paperwork at your own pace. We only
            contact you once your fleet is approved and there is a fit.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/hauliers/join" className="btn-primary">List your trucks</Link>
            <Link href="/hauliers/dashboard" className="btn-ghost">Open my fleet dashboard</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function PageIntro({
  eyebrow, title, body,
}: { eyebrow: string; title: string; body: string }) {
  return (
    <section className="bg-ink text-white py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-xs uppercase tracking-widest text-gold mb-3">{eyebrow}</div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight max-w-2xl">{title}</h1>
        <p className="mt-4 text-bone/90 max-w-2xl">{body}</p>
      </div>
    </section>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-7">
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span aria-hidden className="mt-2 h-1.5 w-1.5 rounded-full bg-gold shrink-0" />
      <span>{children}</span>
    </li>
  );
}
