"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  jobs,
  assignments,
  trucks,
  companies,
  mineLeads,
  mines,
} from "@/db/schema";
import { emailOutbox } from "@/db/mail-schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import { getJobWithAssignments } from "@/lib/admin/queries";
import { queueAssignmentEmailsForJob, sendQueuedEmail } from "@/lib/mailer";

// Ensure optional columns exist on older DBs (idempotent).
async function ensureExtraCols() {
  try {
    await db.run(sql`ALTER TABLE trucks ADD COLUMN registration TEXT`);
  } catch {
    /* already exists or not needed */
  }
}

// ---------------- Jobs ----------------

export async function createJob(formData: FormData) {
  const material = String(formData.get("material") ?? "").trim() || null;
  const pickup = String(formData.get("pickupSite") ?? "").trim() || null;
  const dropoff = String(formData.get("dropoffSite") ?? "").trim() || null;
  const tonnageRaw = String(formData.get("tonnage") ?? "").trim();
  const truckType = String(formData.get("requiredTruckType") ?? "").trim() || null;
  const countRaw = String(formData.get("requiredTruckCount") ?? "").trim();
  const startDate = String(formData.get("startDate") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  const leadIdRaw = String(formData.get("leadId") ?? "").trim();
  const mineIdRaw = String(formData.get("mineId") ?? "").trim();

  const inserted = await db
    .insert(jobs)
    .values({
      material,
      pickupSite: pickup,
      dropoffSite: dropoff,
      tonnage: tonnageRaw ? Number(tonnageRaw) : null,
      requiredTruckType: truckType,
      requiredTruckCount: countRaw ? Number(countRaw) : null,
      startDate,
      description,
      leadId: leadIdRaw ? Number(leadIdRaw) : null,
      mineId: mineIdRaw ? Number(mineIdRaw) : null,
      status: "open",
    })
    .returning();
  revalidatePath("/admin/jobs");
  revalidatePath("/admin");
  redirect(`/admin/jobs?highlight=${inserted[0]!.id}`);
}

export async function assignTrucksToJob(jobId: number, truckIds: number[]) {
  const existing = (
    await db
      .select({ truckId: assignments.truckId })
      .from(assignments)
      .where(eq(assignments.jobId, jobId))
  ).map((r) => r.truckId);
  const fresh = truckIds.filter((t) => !existing.includes(t));
  if (fresh.length > 0) {
    await db.insert(assignments).values(
      fresh.map((tid) => ({ jobId, truckId: tid, status: "proposed" as const })),
    );
  }
  const assigned = (
    await db
      .select({ c: sql<number>`count(*)` })
      .from(assignments)
      .where(eq(assignments.jobId, jobId))
  )[0]!;
  await db
    .update(jobs)
    .set({ status: assigned.c > 0 ? "assigned" : "matching" })
    .where(eq(jobs.id, jobId));
  if (fresh.length > 0) {
    await db
      .update(trucks)
      .set({ status: "on_job" })
      .where(inArray(trucks.id, fresh));
  }
  revalidatePath("/admin/jobs");
}

export async function sendAssignmentEmails(jobId: number) {
  const job = await getJobWithAssignments(jobId);
  if (!job) return { queued: 0 };
  const { headers: getHeaders } = await import("next/headers");
  const h = await getHeaders();
  const forwardedProto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const baseUrl = `${forwardedProto}://${host}`;
  const ids = await queueAssignmentEmailsForJob(job, baseUrl);
  for (const id of ids) await sendQueuedEmail(id);
  await db.update(jobs).set({ status: "assigned" }).where(eq(jobs.id, jobId));
  revalidatePath("/admin/jobs");
  return { queued: ids.length };
}

export async function removeAssignment(assignmentId: number) {
  const row = (
    await db.select().from(assignments).where(eq(assignments.id, assignmentId))
  )[0];
  if (!row) return;
  await db.delete(assignments).where(eq(assignments.id, assignmentId));
  const others = await db
    .select({ id: assignments.id })
    .from(assignments)
    .innerJoin(jobs, eq(assignments.jobId, jobs.id))
    .where(
      and(
        eq(assignments.truckId, row.truckId),
        inArray(jobs.status, ["open", "matching", "assigned", "in_progress"]),
      ),
    );
  if (others.length === 0) {
    await db
      .update(trucks)
      .set({ status: "available" })
      .where(eq(trucks.id, row.truckId));
  }
  revalidatePath("/admin/jobs");
}

export async function setJobStatus(jobId: number, status: string) {
  const s = status as typeof jobs.$inferInsert.status;
  await db.update(jobs).set({ status: s }).where(eq(jobs.id, jobId));
  if (s === "completed" || s === "cancelled") {
    const ass = await db
      .select({ truckId: assignments.truckId })
      .from(assignments)
      .where(eq(assignments.jobId, jobId));
    if (ass.length) {
      await db
        .update(trucks)
        .set({ status: "available" })
        .where(inArray(trucks.id, ass.map((a) => a.truckId)));
    }
  }
  revalidatePath("/admin/jobs");
  revalidatePath("/admin");
}

// ---------------- Trucks ----------------

export async function addTruck(formData: FormData) {
  await ensureExtraCols();
  const companyId = Number(formData.get("companyId"));
  const truckType = String(formData.get("truckType") ?? "tipper");
  const make = String(formData.get("make") ?? "").trim() || null;
  const model = String(formData.get("model") ?? "").trim() || null;
  const yearRaw = String(formData.get("year") ?? "").trim();
  const capRaw = String(formData.get("capacityTons") ?? "").trim();
  const base = String(formData.get("baseLocation") ?? "").trim() || null;
  const reg = String(formData.get("registration") ?? "").trim() || null;

  await db.insert(trucks).values({
    companyId,
    truckType: truckType as typeof trucks.$inferInsert.truckType,
    make,
    model,
    year: yearRaw ? Number(yearRaw) : null,
    capacityTons: capRaw ? Number(capRaw) : null,
    baseLocation: base,
    status: "available",
  });
  // If registration column exists, patch it via raw SQL
  if (reg) {
    const [ins] = await db
      .select({ id: trucks.id })
      .from(trucks)
      .orderBy(sql`id DESC`)
      .limit(1);
    if (ins) {
      await db.run(sql`UPDATE trucks SET registration = ${reg} WHERE id = ${ins.id}`);
    }
  }
  revalidatePath("/admin/trucks");
}

// ---------------- Companies ----------------

export async function setCompanyStatus(
  companyId: number,
  status: "approved" | "rejected" | "pending_review",
  note?: string,
) {
  await db
    .update(companies)
    .set({ status, reviewNote: note ?? null })
    .where(eq(companies.id, companyId));
  revalidatePath("/admin/companies");
}

// ---------------- Leads ----------------

export async function convertLeadToJob(leadId: number) {
  const lead = (await db.select().from(mineLeads).where(eq(mineLeads.id, leadId)))[0];
  if (!lead) return;
  let mineId: number | null = null;
  const existingMine = (
    await db.select().from(mines).where(eq(mines.name, lead.mineName)).limit(1)
  )[0];
  if (existingMine) {
    mineId = existingMine.id;
  } else {
    const ins = await db
      .insert(mines)
      .values({
        name: lead.mineName,
        contactName: lead.contactName,
        contactPhone: lead.contactPhone,
        contactEmail: lead.contactEmail ?? null,
        siteAddress: lead.pickupSite ?? null,
      })
      .returning();
    mineId = ins[0]!.id;
  }
  const ins = await db
    .insert(jobs)
    .values({
      mineId,
      leadId,
      material: lead.material ?? null,
      pickupSite: lead.pickupSite ?? null,
      dropoffSite: lead.dropoffSite ?? null,
      requiredTruckType: lead.requiredTruckType ?? null,
      startDate: lead.startDate ?? null,
      description: lead.notes ?? null,
      status: "open",
    })
    .returning();
  await db.update(mineLeads).set({ status: "converted" }).where(eq(mineLeads.id, leadId));
  revalidatePath("/admin/leads");
  redirect(`/admin/jobs?highlight=${ins[0]!.id}`);
}

export async function updateLeadStatus(
  leadId: number,
  status: "new" | "contacted" | "converted" | "lost",
) {
  await db.update(mineLeads).set({ status }).where(eq(mineLeads.id, leadId));
  revalidatePath("/admin/leads");
}

// ---------------- Demo seed ----------------

export async function seedDemoData() {
  const count = (await db.select({ n: sql<number>`count(*)` }).from(companies))[0]!;
  if ((count.n as number) > 0) return { seeded: false };

  const [c1] = await db
    .insert(companies)
    .values({
      name: "Limpopo Hauliers (Pty) Ltd",
      contactName: "Thabo M.",
      contactEmail: "dispatch@limpopohauliers.example",
      contactPhone: "082 555 0101",
      status: "approved",
    })
    .returning();
  const [c2] = await db
    .insert(companies)
    .values({
      name: "Highveld Coal Carriers",
      contactName: "Annette K.",
      contactEmail: "ops@highveldcoal.example",
      contactPhone: "083 555 0202",
      status: "approved",
    })
    .returning();
  await db.insert(trucks).values([
    {
      companyId: c1!.id,
      truckType: "interlink_tipper",
      make: "MAN",
      model: "TGS 26.440",
      year: 2020,
      capacityTons: 34,
      baseLocation: "Steelpoort",
      status: "available",
    },
    {
      companyId: c1!.id,
      truckType: "side_tipper",
      make: "Scania",
      model: "R500",
      year: 2019,
      capacityTons: 30,
      baseLocation: "Burgersfort",
      status: "available",
    },
    {
      companyId: c2!.id,
      truckType: "tipper",
      make: "Mercedes-Benz",
      model: "Actros 3345",
      year: 2021,
      capacityTons: 25,
      baseLocation: "Witbank",
      status: "available",
    },
    {
      companyId: c2!.id,
      truckType: "superlink",
      make: "Volvo",
      model: "FH440",
      year: 2018,
      capacityTons: 38,
      baseLocation: "Middelburg",
      status: "available",
    },
  ]);
  await db.insert(mineLeads).values({
    mineName: "Khwezi Colliery",
    contactName: "Pieter vd M.",
    contactPhone: "082 900 3001",
    contactEmail: "procurement@khwezi.example",
    material: "Coal",
    pickupSite: "Witbank",
    dropoffSite: "Richards Bay",
    tonnage: "3000t/month",
    requiredTruckType: "interlink_tipper",
    startDate: "2026-10-20",
    notes: "Daily round trips, 24-month contract.",
    status: "new",
  });
  revalidatePath("/admin");
  revalidatePath("/admin/trucks");
  revalidatePath("/admin/companies");
  revalidatePath("/admin/leads");
  revalidatePath("/admin/jobs");
  return { seeded: true };
}
