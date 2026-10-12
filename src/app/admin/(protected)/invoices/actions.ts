"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { invoices, invoiceLines, settings } from "@/db/ops-schema";
import { jobs, companies, assignments, trucks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nextInvoiceNumber, addDays, getInvoiceSettings } from "@/lib/invoice-settings";
import { loadInvoiceForPdf } from "@/lib/invoice-data";
import { renderInvoicePdf } from "@/lib/pdf-render";
import { sendMailWithSMTP, getMailSettings } from "@/lib/mail-settings";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

async function getSetting(key: string, fb = "") {
  const r = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  return r[0]?.value ?? fb;
}

export async function generateInvoiceFromJob(formData: FormData) {
  const jobId = Number(formData.get("jobId"));
  const direction = String(formData.get("direction") ?? "outgoing") as "incoming" | "outgoing";
  if (!jobId) return;

  const job = (await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1))[0];
  if (!job) return;

  const marginPct = Number(await getSetting("default_margin_pct", "15")) / 100;
  const invSet = await getInvoiceSettings();
  const paymentTerms = invSet.paymentTermsDays || Number(await getSetting("payment_terms_days", "30"));
  const vatPct = invSet.vatRate / 100;

  const materialKeyMap: Record<string, string> = {
    coal: "r_per_tkm_coal",
    chrome: "r_per_tkm_chrome",
    manganese: "r_per_tkm_manganese",
    platinum: "r_per_tkm_pgms",
    pgms: "r_per_tkm_pgms",
    "iron ore": "r_per_tkm_iron_ore",
  };
  const m = (job.material ?? "").toLowerCase();
  const key =
    materialKeyMap[m] ??
    (() => {
      for (const k of Object.keys(materialKeyMap)) if (m.includes(k)) return materialKeyMap[k];
      return "r_per_tkm_default";
    })();
  const ratePerTkm = Number(await getSetting(key, "2.2"));

  const tons = job.tonnage ?? 0;
  const km = Number(formData.get("km") ?? (job as any).km ?? 100);
  const costPerTon = ratePerTkm * km;
  const sellPerTon = costPerTon * (1 + marginPct);
  const unitPrice = direction === "incoming" ? sellPerTon : costPerTon;
  // Amounts in RANDS (matches existing fmtCents & DB convention).
  const subtotal = Math.round(unitPrice * tons * 100) / 100;
  const vatAmount = Math.round(subtotal * vatPct * 100) / 100;
  const grandTotal = Math.round((subtotal + vatAmount) * 100) / 100;

  const now = new Date();
  const issueIso = now.toISOString().slice(0, 10);
  const dueIso = addDays(issueIso, paymentTerms);

  let mineId: number | null = job.mineId;
  let companyId: number | null = null;
  if (direction === "outgoing") {
    const asgRow = await db
      .select({ companyId: companies.id })
      .from(assignments)
      .innerJoin(trucks, eq(assignments.truckId, trucks.id))
      .innerJoin(companies, eq(trucks.companyId, companies.id))
      .where(eq(assignments.jobId, jobId))
      .limit(1);
    companyId = asgRow[0]?.companyId ?? null;
  }

  const number = await nextInvoiceNumber(direction);

  const ins = await db
    .insert(invoices)
    .values({
      number,
      direction,
      jobId,
      mineId: direction === "incoming" ? mineId : null,
      companyId: direction === "outgoing" ? companyId : null,
      issueDate: issueIso,
      dueDate: dueIso,
      subtotal,
      vatAmount,
      total: grandTotal,
      notes: `Generated from Job #${jobId}${job.material ? " · " + job.material : ""}${job.pickupSite && job.dropoffSite ? " · " + job.pickupSite + " → " + job.dropoffSite : ""}`,
      status: "draft",
    })
    .returning();

  const invId = ins[0]!.id;
  await db.insert(invoiceLines).values({
    invoiceId: invId,
    description: `${job.material ?? "Haulage"} · ${job.pickupSite ?? ""} → ${job.dropoffSite ?? ""} · ${km} km · ${ratePerTkm.toFixed(2)} R/t-km${direction === "incoming" ? ` · margin ${Math.round(marginPct * 100)}%` : ""}`,
    quantity: tons,
    unitPrice: Math.round(unitPrice * 100) / 100,
    amount: subtotal,
  });

  revalidatePath("/admin/invoices");
  redirect(`/admin/invoices`);
}

export async function setInvoiceStatus(id: number, status: "draft" | "sent" | "paid" | "overdue" | "cancelled") {
  const patch: Partial<typeof invoices.$inferInsert> = { status };
  if (status === "paid") patch.paidAt = new Date().toISOString();

  if (status === "sent") {
    try { await emailInvoice(id); } catch (e) { console.error("[invoice] send failed", e); }
  }

  await db.update(invoices).set(patch).where(eq(invoices.id, id));
  revalidatePath("/admin/invoices");
}

// ---------- Send invoice email with branded PDF attached ----------
async function emailInvoice(id: number) {
  const data = await loadInvoiceForPdf(id);
  const s = await getInvoiceSettings();

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "inv-"));
  const pdfPath = path.join(tmpDir, `${data.number}.pdf`);
  try {
    await new Promise<void>((resolve, reject) => {
      const stream = renderInvoicePdf(data, s);
      const ws = fs.createWriteStream(pdfPath);
      stream.pipe(ws);
      ws.on("finish", () => resolve());
      ws.on("error", reject);
      stream.on("error", reject);
    });

    const toEmail = data.billTo.contactEmail;
    if (!toEmail) {
      console.log(`[invoice] ${data.number} no contact email, skipping email send`);
      return;
    }

    const subject =
      data.direction === "incoming"
        ? `${s.tradingName} invoice ${data.number} — ${data.billTo.name}`
        : `Remittance ${data.number} from ${s.tradingName}`;

    const bodyText =
      data.direction === "incoming"
        ? `Dear ${data.billTo.contactName ?? data.billTo.name},\n\nPlease find attached invoice ${data.number} for ${fmt(data.total)}, due ${data.dueDate ?? "on receipt"}.\n\nBanking details:\n  ${s.bankName}\n  ${s.bankAccountHolder}\n  ${s.bankAccountNumber}\n  Branch: ${s.bankBranchCode}${s.bankBranchName ? " (" + s.bankBranchName + ")" : ""}\n  Reference: ${data.number}\n\n${s.invoiceFooterNote}\n\nKind regards,\n${s.tradingName}\n${s.billingEmail} · ${s.billingPhone}`
        : `Dear ${data.billTo.contactName ?? data.billTo.name},\n\nPlease find attached remittance advice ${data.number} for ${fmt(data.total)}, payable ${data.dueDate ?? "shortly"}.\n\n${s.invoiceFooterNote}\n\nKind regards,\n${s.tradingName}`;

    const bodyHtml = `
      <div style="font-family:Arial,sans-serif;color:#111;max-width:600px;">
        <div style="background:#0a0a0a;color:#fff;padding:20px;">
          <div style="color:#c9a24a;font-size:22px;font-weight:bold;">${s.tradingName.toUpperCase()}</div>
          <div style="font-size:12px;color:#ccc;">${s.legalName}</div>
        </div>
        <div style="padding:20px;">
          <p>Dear ${data.billTo.contactName ?? data.billTo.name},</p>
          <p>Please find attached <strong>${data.direction === "incoming" ? "invoice" : "remittance advice"} ${data.number}</strong>
             for <strong style="color:#0a0a0a;">${fmt(data.total)}</strong>, due ${data.dueDate ?? "on receipt"}.</p>
          <table style="margin:16px 0;font-size:14px;">
            <tr><td style="padding:4px 12px 4px 0;"><strong>Bank:</strong></td><td>${s.bankName}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;"><strong>Account:</strong></td><td>${s.bankAccountHolder} — ${s.bankAccountNumber}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;"><strong>Branch:</strong></td><td>${s.bankBranchCode}${s.bankBranchName ? " (" + s.bankBranchName + ")" : ""}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;"><strong>Reference:</strong></td><td><strong>${data.number}</strong></td></tr>
          </table>
          <p style="font-size:12px;color:#555;">${s.invoiceFooterNote}</p>
          <p>Kind regards,<br/>${s.tradingName}<br/>${s.billingEmail} · ${s.billingPhone}</p>
        </div>
      </div>`;

    await queueEmailLog(data, s, toEmail, subject, bodyText, bodyHtml);
    const cfg = await getMailSettings();
    if (cfg) {
      await sendMailWithSMTP({
        to: toEmail,
        subject,
        text: bodyText,
        html: bodyHtml,
        attachments: [{ filename: `${data.number}.pdf`, path: pdfPath }],
      });
    } else {
      console.log(`[invoice] ${data.number} SMTP not configured — queued for later, PDF not attached.`);
    }
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  }
}

async function queueEmailLog(data: any, s: any, toEmail: string, subject: string, bodyText: string, bodyHtml: string) {
  // Best-effort log of the email in the outbox (without the attachment, since
  // the outbox table has no attachment column).
  const { db } = await import("@/db");
  const { emailOutbox } = await import("@/db/mail-schema");
  await db.insert(emailOutbox).values({
    toEmail,
    toName: data.billTo.contactName ?? data.billTo.name,
    subject,
    bodyText,
    bodyHtml,
    status: "queued",
  });
}

function fmt(n: number) {
  return "R " + (Number(n) || 0).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
