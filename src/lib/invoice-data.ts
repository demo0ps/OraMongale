import { eq } from "drizzle-orm";
import { db } from "@/db";
import { invoices, invoiceLines } from "@/db/ops-schema";
import { jobs, mines, companies, assignments, trucks } from "@/db/schema";
import type { InvoicePdfInput } from "./pdf-render";

export async function loadInvoiceForPdf(id: number): Promise<InvoicePdfInput & { direction: "incoming" | "outgoing" }> {
  const invRow = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
  const inv = invRow[0];
  if (!inv) throw new Error("Invoice not found");

  const lines = await db
    .select()
    .from(invoiceLines)
    .where(eq(invoiceLines.invoiceId, id));

  let job: InvoicePdfInput["job"] = null;
  let billTo: InvoicePdfInput["billTo"];

  if (inv.direction === "incoming") {
    if (inv.mineId) {
      const m = await db.select().from(mines).where(eq(mines.id, inv.mineId)).limit(1);
      const mine = m[0];
      if (mine) {
        billTo = {
          name: mine.name,
          contactName: mine.contactName,
          contactEmail: mine.contactEmail,
          contactPhone: mine.contactPhone,
          address: mine.siteAddress,
        };
      } else {
        billTo = { name: "Mine" };
      }
    } else {
      billTo = { name: "Mine" };
    }
  } else {
    if (inv.companyId) {
      const c = await db.select().from(companies).where(eq(companies.id, inv.companyId)).limit(1);
      const co = c[0];
      if (co) {
        billTo = {
          name: co.name,
          contactName: co.contactName,
          contactEmail: co.contactEmail,
          contactPhone: co.contactPhone,
        };
      } else {
        billTo = { name: "Haulier" };
      }
    } else {
      billTo = { name: "Haulier" };
    }
  }

  if (inv.jobId) {
    const j = await db.select().from(jobs).where(eq(jobs.id, inv.jobId)).limit(1);
    if (j[0]) job = { material: j[0].material, pickupSite: j[0].pickupSite, dropoffSite: j[0].dropoffSite, tonnage: j[0].tonnage };

    // If this is an incoming (mine) invoice with no explicit lines, generate
    // a "Haulage services" summary line from the job totals so the invoice
    // always prints at least one line.
    if (lines.length === 0) {
      lines.push({
        id: 0,
        invoiceId: id,
        description: job
          ? `Haulage: ${job.pickupSite ?? "origin"} → ${job.dropoffSite ?? "destination"} (${job.material ?? "mineral"})`
          : "Haulage services",
        quantity: 1,
        unitPrice: inv.subtotal,
        amount: inv.total,
      });
    }
  }

  return {
    number: inv.number,
    direction: inv.direction as "incoming" | "outgoing",
    status: inv.status,
    issueDate: inv.issueDate,
    dueDate: inv.dueDate,
    subtotal: inv.subtotal,
    vatAmount: inv.vatAmount,
    total: inv.total,
    notes: inv.notes,
    lines: lines.map(l => ({
      description: l.description,
      quantity: l.quantity ?? 1,
      unitPrice: l.unitPrice,
      amount: l.amount,
    })),
    job,
    billTo,
  };
}

// Helper used elsewhere: find primary haulier company for a job.
export async function primaryHaulierForJob(jobId: number | null): Promise<{ id: number; name: string } | null> {
  if (!jobId) return null;
  const rows = await db
    .select({ id: companies.id, name: companies.name })
    .from(assignments)
    .innerJoin(trucks, eq(assignments.truckId, trucks.id))
    .innerJoin(companies, eq(trucks.companyId, companies.id))
    .where(eq(assignments.jobId, jobId))
    .limit(1);
  return rows[0] ?? null;
}
