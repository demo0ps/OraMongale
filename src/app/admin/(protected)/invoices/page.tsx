import Link from "next/link";
import { db } from "@/db";
import { invoices, invoiceLines } from "@/db/ops-schema";
import { jobs, mines, assignments, trucks, companies } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { generateInvoiceFromJob, setInvoiceStatus } from "./actions";
import InvoiceRow from "./InvoiceRow";
import NewInvoiceForm from "./NewInvoiceForm";

export const metadata = { title: "Invoices — Admin" };
export const dynamic = "force-dynamic";

const fmtCents = (n: number | null) => {
  const v = n ?? 0;
  const rands = v; // totals stored as rands (not cents) in this iteration
  return "R " + rands.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default async function InvoicesPage() {
  const invRows = await db
    .select({
      inv: invoices,
      line: invoiceLines,
      job: jobs,
      mine: mines,
    })
    .from(invoices)
    .leftJoin(invoiceLines, eq(invoiceLines.invoiceId, invoices.id))
    .leftJoin(jobs, eq(invoices.jobId, jobs.id))
    .leftJoin(mines, eq(invoices.mineId, mines.id))
    .orderBy(desc(invoices.createdAt));

  // Per invoice: find primary assigned company (if any) via job -> assignments -> trucks -> companies
  const byId = new Map<number, { inv: any; lines: any[]; job: any; mine: any; companyName: string | null }>();
  for (const r of invRows) {
    if (!byId.has(r.inv.id)) {
      let companyName: string | null = null;
      if (r.inv.jobId) {
        const c = await db
          .select({ name: companies.name })
          .from(assignments)
          .innerJoin(trucks, eq(assignments.truckId, trucks.id))
          .innerJoin(companies, eq(trucks.companyId, companies.id))
          .where(eq(assignments.jobId, r.inv.jobId))
          .limit(1);
        companyName = c[0]?.name ?? null;
      }
      byId.set(r.inv.id, { inv: r.inv, lines: [], job: r.job, mine: r.mine, companyName });
    }
    const o = byId.get(r.inv.id)!;
    if (r.line) o.lines.push(r.line);
  }
  const list = Array.from(byId.values());

  const openJobs = await db
    .select()
    .from(jobs)
    .where(sql`${jobs.status} IN ('assigned','in_progress','completed')`)
    .orderBy(desc(jobs.createdAt));

  const totals = {
    owedToUs: list
      .filter((i) => i.inv.direction === "incoming" && i.inv.status !== "paid" && i.inv.status !== "cancelled")
      .reduce((s, i) => s + (i.inv.total ?? 0), 0),
    weOwe: list
      .filter((i) => i.inv.direction === "outgoing" && i.inv.status !== "paid" && i.inv.status !== "cancelled")
      .reduce((s, i) => s + (i.inv.total ?? 0), 0),
    paidToDate: list
      .filter((i) => i.inv.status === "paid")
      .reduce((s, i) => s + (i.inv.total ?? 0), 0),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Invoices</h1>
        <p className="text-sm text-steel mt-1">
          Invoices mines owe you and invoices you owe hauliers. Generate one from a completed/assigned job.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Tile label="Owed to us" value={fmtCents(totals.owedToUs)} tone="text-emerald-700" sub="from mines, unpaid" />
        <Tile label="We owe hauliers" value={fmtCents(totals.weOwe)} tone="text-amber-700" sub="outgoing invoices unpaid" />
        <Tile label="Paid to date" value={fmtCents(totals.paidToDate)} tone="text-coal" sub="all settled invoices" />
      </div>

      <NewInvoiceForm jobs={openJobs} action={generateInvoiceFromJob} />

      <section className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bone text-steel text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2 font-medium">#</th>
              <th className="text-left px-4 py-2 font-medium">Direction</th>
              <th className="text-left px-4 py-2 font-medium">For</th>
              <th className="text-left px-4 py-2 font-medium">Issued</th>
              <th className="text-left px-4 py-2 font-medium">Due</th>
              <th className="text-right px-4 py-2 font-medium">Total</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr><td colSpan={8} className="p-6 text-sm text-steel">No invoices yet. Mark a job as assigned/in-progress/completed, then generate one above.</td></tr>
            )}
            {list.map((i) => (
              <InvoiceRow key={i.inv.id} inv={{ ...i, company: { name: i.companyName } }} onStatus={setInvoiceStatus} />
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Tile({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: string }) {
  return (
    <div className="card p-5">
      <div className="text-xs uppercase tracking-wide text-steel">{label}</div>
      <div className={"mt-1 text-3xl font-black " + tone}>{value}</div>
      <div className="mt-1 text-[11px] text-steel">{sub}</div>
    </div>
  );
}
