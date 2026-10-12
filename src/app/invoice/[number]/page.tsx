import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { invoices } from "@/db/ops-schema";
import { getInvoiceSettings, formatMoney } from "@/lib/invoice-settings";
import { loadInvoiceForPdf } from "@/lib/invoice-data";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  return { title: `${number} — OraMongale` };
}

export default async function InvoicePublicPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const row = await db.select().from(invoices).where(eq(invoices.number, number)).limit(1);
  const inv = row[0];
  if (!inv) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
        <div className="card max-w-md text-center">
          <h1 className="text-xl font-bold">Invoice not found</h1>
          <p className="text-slate-500 mt-2 text-sm">This invoice link is invalid or has been removed.</p>
        </div>
      </div>
    );
  }
  const data = await loadInvoiceForPdf(inv.id);
  const s = await getInvoiceSettings();

  return (
    <div className="min-h-screen bg-slate-200 py-4 sm:py-8 px-2 sm:px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="text-sm text-slate-600">
            {s.tradingName} · {data.number}
          </div>
          <div className="flex gap-2">
            <a href={`/invoice/${data.number}/pdf`} className="btn-primary !py-2 !px-4 text-sm" target="_blank">Download PDF</a>
            <a href={`/invoice/${data.number}/pdf?download=1`} className="btn-ghost !py-2 !px-4 text-sm">Save to disk</a>
          </div>
        </div>

        <div className="bg-white shadow-lg">
          {/* Header */}
          <div className="bg-black text-white p-8 flex justify-between items-start">
            <div>
              <img src="/brand/logo.png" alt={s.tradingName} className="h-16 w-auto object-contain bg-black" style={{ background: "black" }} />
            </div>
            <div className="text-right">
              <div className="text-[var(--accent)] text-3xl font-black tracking-wide">{s.tradingName.toUpperCase()}</div>
              <div className="text-sm mt-1 text-slate-300">{s.legalName}</div>
              <div className="text-xs text-slate-400 mt-1">Reg: {s.regNumber} · VAT: {s.vatNumber}</div>
              <div className="text-xs text-[var(--accent)] mt-1">{s.billingPhone} · {s.billingEmail}</div>
            </div>
          </div>

          {/* Title bar */}
          <div className="bg-[var(--accent)] text-black px-8 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-black">
                {data.direction === "incoming" ? "TAX INVOICE" : "REMITTANCE ADVICE"}
              </h1>
              <div className="text-sm">
                <div><span className="font-bold">Invoice:</span> {data.number}</div>
                <div><span className="font-bold">Date:</span> {data.issueDate}</div>
                <div><span className="font-bold">Due:</span> {data.dueDate ?? "—"}</div>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6">
            {/* From / Bill to */}
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">From</div>
                <div className="font-bold">{s.legalName}</div>
                <div className="text-slate-700 whitespace-pre-line">
                  {s.physicalAddress}{"\n"}
                  {s.postalAddress}{"\n"}
                  Email: {s.billingEmail}{"\n"}
                  Tel: {s.billingPhone}{"\n"}
                  Reg: {s.regNumber}{"\n"}
                  VAT: {s.vatNumber}
                </div>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                  {data.direction === "incoming" ? "Bill to" : "Pay to"}
                </div>
                <div className="font-bold">{data.billTo.name}</div>
                <div className="text-slate-700 whitespace-pre-line">
                  {data.billTo.contactName ? `Attn: ${data.billTo.contactName}\n` : ""}
                  {data.billTo.address ? data.billTo.address + "\n" : ""}
                  {data.billTo.contactEmail ? `Email: ${data.billTo.contactEmail}\n` : ""}
                  {data.billTo.contactPhone ? `Tel: ${data.billTo.contactPhone}\n` : ""}
                  {data.billTo.regNumber ? `Reg: ${data.billTo.regNumber}\n` : ""}
                  {data.billTo.vatNumber ? `VAT: ${data.billTo.vatNumber}` : ""}
                </div>
              </div>
            </div>

            {/* Job summary */}
            {data.job && (
              <div className="bg-slate-50 border border-slate-200 p-4 text-sm grid md:grid-cols-2 gap-2">
                <div className="font-bold text-slate-500 uppercase text-xs col-span-2 mb-1">Job summary</div>
                {data.job.material && <div><span className="font-bold">Commodity:</span> {data.job.material}</div>}
                {data.job.tonnage && <div className="md:text-right"><span className="font-bold">Tonnage:</span> {Number(data.job.tonnage).toLocaleString()} t</div>}
                {data.job.pickupSite && <div><span className="font-bold">From:</span> {data.job.pickupSite}</div>}
                {data.job.dropoffSite && <div className="md:text-right"><span className="font-bold">To:</span> {data.job.dropoffSite}</div>}
              </div>
            )}

            {/* Line items */}
            <div className="overflow-x-auto -mx-2 sm:mx-0">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="bg-black text-white">
                  <th className="text-left p-3">Description</th>
                  <th className="text-right p-3 w-20">Qty</th>
                  <th className="text-right p-3 w-32">Unit price</th>
                  <th className="text-right p-3 w-36">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.lines.map((l, i) => (
                  <tr key={i} className={i % 2 ? "bg-slate-50" : ""}>
                    <td className="p-3">{l.description}</td>
                    <td className="p-3 text-right">{Number(l.quantity).toLocaleString()}</td>
                    <td className="p-3 text-right">{formatMoney(Number(l.unitPrice))}</td>
                    <td className="p-3 text-right font-bold">{formatMoney(Number(l.amount))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>{/* close overflow wrapper */}

            {/* Totals */}
            <div className="flex justify-end overflow-x-auto">
              <table className="text-sm w-72">
                <tbody>
                  <tr className="border-t">
                    <td className="p-2 text-slate-600">Subtotal</td>
                    <td className="p-2 text-right">{formatMoney(data.subtotal)}</td>
                  </tr>
                  <tr className="border-t">
                    <td className="p-2 text-slate-600">VAT {s.vatRate > 0 ? `@ ${s.vatRate}%` : `(${s.vatNumber})`}</td>
                    <td className="p-2 text-right">{formatMoney(data.vatAmount)}</td>
                  </tr>
                  <tr className="bg-[var(--accent)] text-black font-black">
                    <td className="p-3">TOTAL DUE</td>
                    <td className="p-3 text-right text-lg">{formatMoney(data.total)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Banking */}
            <div>
              <div className="h-1 bg-[var(--accent)] mb-2" />
              <div className="font-black text-sm">PAYMENT INSTRUCTIONS</div>
              <div className="text-sm text-slate-700 mt-2 space-y-0.5">
                <div><span className="font-bold">Bank:</span> {s.bankName}</div>
                <div><span className="font-bold">Account holder:</span> {s.bankAccountHolder}</div>
                <div><span className="font-bold">Account number:</span> {s.bankAccountNumber}</div>
                <div><span className="font-bold">Branch code:</span> {s.bankBranchCode}{s.bankBranchName ? ` (${s.bankBranchName})` : ""}</div>
                <div><span className="font-bold">Reference:</span> <span className="font-mono">{data.number}</span></div>
              </div>
            </div>

            <div>
              <div className="h-1 bg-[var(--accent)] mb-2" />
              <div className="font-black text-sm">TERMS: {s.paymentTermsDays} DAYS FROM DATE OF INVOICE</div>
              <div className="text-sm text-slate-700 mt-1">{s.invoiceFooterNote}</div>
            </div>

            {data.notes && (
              <div>
                <div className="font-black text-sm mb-1">NOTES</div>
                <div className="text-sm text-slate-700 whitespace-pre-wrap">{data.notes}</div>
              </div>
            )}
          </div>

          <div className="bg-black text-white text-center text-xs py-4 text-slate-400">
            <div className="text-[var(--accent)] font-bold">{s.tradingName} · {s.legalName}</div>
            <div>Reg: {s.regNumber} · VAT: {s.vatNumber}</div>
            <div className="mt-1">This is a system-generated document. EFT only — no cash deposits.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
