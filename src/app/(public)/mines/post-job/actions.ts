"use server";

import { z } from "zod";
import { sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { mineLeads, auditEvents } from "@/db/schema";

const phoneRegex = /^[+()\-\s0-9]{7,20}$/;
const leadSchema = z.object({
  mineName: z.string().min(2).max(120),
  contactName: z.string().min(2).max(80),
  contactPhone: z.string().regex(phoneRegex),
  contactEmail: z.string().email().optional().or(z.literal("")),
  material: z.string().max(80).optional(),
  pickupSite: z.string().max(160).optional(),
  dropoffSite: z.string().max(160).optional(),
  tonnage: z.string().max(40).optional(),
  requiredTruckType: z.string().max(60).optional(),
  startDate: z.string().max(40).optional(),
  notes: z.string().max(1000).optional(),
});

export type LeadFormState = { error?: string; fieldErrors?: Record<string, string> };

export async function submitLead(
  _prev: LeadFormState,
  formData: FormData
): Promise<LeadFormState> {
  const parsed = leadSchema.safeParse({
    mineName: (formData.get("mineName") as string)?.trim(),
    contactName: (formData.get("contactName") as string)?.trim(),
    contactPhone: (formData.get("contactPhone") as string)?.trim(),
    contactEmail: (formData.get("contactEmail") as string)?.trim() || "",
    material: (formData.get("material") as string)?.trim() || "",
    pickupSite: (formData.get("pickupSite") as string)?.trim() || "",
    dropoffSite: (formData.get("dropoffSite") as string)?.trim() || "",
    tonnage: (formData.get("tonnage") as string)?.trim() || "",
    requiredTruckType: (formData.get("requiredTruckType") as string)?.trim() || "",
    startDate: (formData.get("startDate") as string)?.trim() || "",
    notes: (formData.get("notes") as string)?.trim() || "",
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const iss of parsed.error.issues) fieldErrors[iss.path[0] as string] = iss.message;
    return { fieldErrors };
  }
  const d = parsed.data;
  const now = new Date().toISOString();

  await db.run(sql`
    INSERT INTO mine_leads (mine_name, contact_name, contact_phone, contact_email, material, pickup_site, dropoff_site, tonnage, required_truck_type, start_date, notes, status, created_at)
    VALUES (${d.mineName}, ${d.contactName}, ${d.contactPhone}, ${d.contactEmail || null}, ${d.material || null}, ${d.pickupSite || null}, ${d.dropoffSite || null}, ${d.tonnage || null}, ${d.requiredTruckType || null}, ${d.startDate || null}, ${d.notes || null}, 'new', ${now});
  `);
  const row = (await db.get(sql`SELECT last_insert_rowid() as id`)) as { id: number };
  await db.run(sql`
    INSERT INTO audit_events (actor_type, action, target_type, target_id, metadata_json, created_at)
    VALUES ('public', 'mine_lead.submitted', 'mine_leads', ${String(row.id)}, ${JSON.stringify({ mineName: d.mineName })}, ${now});
  `);

  redirect("/mines/post-job/thank-you");
}
