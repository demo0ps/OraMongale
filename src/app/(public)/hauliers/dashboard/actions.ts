"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq, sql, asc } from "drizzle-orm";
import { db } from "@/db";
import {
  companies,
  trucks,
  complianceDocs,
  auditEvents,
} from "@/db/schema";
import {
  getCompanySession,
  getCompanyForSession,
  setCompanySessionCookie,
} from "@/company-auth";
import { saveUploadedFile } from "@/lib/uploads";
import {
  TRUCK_TYPES,
  COMPANY_DOC_TYPES,
  TRUCK_DOC_TYPES,
} from "@/lib/constants";

async function requireCompany() {
  let session = await getCompanySession();
  if (session) {
    const ctx = await getCompanyForSession(session);
    if (ctx) return { session, company: ctx.company };
  }
  // No-password mode: if no valid session, fall back to the first company in
  // the DB (matches the layout/page behaviour) and stamp a session cookie so
  // subsequent uploads are fast.
  const first = await db
    .select()
    .from(companies)
    .orderBy(asc(companies.id))
    .limit(1);
  const company = first[0];
  if (!company) throw new Error("No haulier company exists yet — register one first.");
  const fakeSession = { companyUserId: 0, companyId: company.id, email: company.contactEmail ?? "", name: company.contactName ?? company.name };
  try { await setCompanySessionCookie(fakeSession); } catch {}
  return { session: fakeSession, company };
}

// ---------- Upload a company-level document ----------
export async function uploadCompanyDoc(_prev: { error?: string; ok?: boolean }, formData: FormData) {
  const { session, company } = await requireCompany();
  const docType = String(formData.get("docType") ?? "");
  const file = formData.get("file");
  const expiryRaw = String(formData.get("expiryDate") ?? "");

  const allowed = COMPANY_DOC_TYPES.map((d) => d.key);
  if (!allowed.includes(docType as (typeof COMPANY_DOC_TYPES)[number]["key"]))
    return { error: "Pick a document type." };
  if (!(file instanceof File) || file.size === 0) return { error: "Select a file to upload." };

  let expiry: string | null = null;
  if (expiryRaw) {
    const d = new Date(expiryRaw);
    if (isNaN(d.getTime())) return { error: "Invalid expiry date." };
    expiry = d.toISOString().slice(0, 10);
  }

  try {
    const saved = await saveUploadedFile("compliance", file);
    await db.run(sql`
      INSERT INTO compliance_docs (company_id, truck_id, doc_type, file_name, file_url, expiry_date, status, uploaded_by_company_user_id, created_at)
      VALUES (${company.id}, NULL, ${docType}, ${saved.fileName}, ${saved.url}, ${expiry}, 'pending', ${session.companyUserId}, ${new Date().toISOString()});
    `);
    await db.run(sql`
      INSERT INTO audit_events (actor_id, actor_type, action, target_type, target_id, metadata_json, created_at)
      VALUES (${session.companyUserId}, 'company_user', 'company.doc_uploaded', 'companies', ${String(company.id)}, ${JSON.stringify({ docType })}, ${new Date().toISOString()});
    `);
    revalidatePath("/hauliers/dashboard");
    return { ok: true };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

// ---------- Add a truck (with all required per-truck docs) ----------
const truckSchema = z.object({
  truckType: z.enum([
    "side_tipper",
    "interlink_tipper",
    "tipper",
    "flat_deck",
    "lowbed",
    "superlink",
    "water_tanker",
    "fuel_tanker",
  ] as const),
  make: z.string().max(60).optional(),
  model: z.string().max(60).optional(),
  year: z.coerce.number().int().min(1980).max(2100).optional(),
  capacityTons: z.coerce.number().int().min(1).max(200).optional(),
  baseLocation: z.string().max(120).optional(),
});

export async function addTruckWithDocs(
  _prev: { error?: string; ok?: boolean },
  formData: FormData
) {
  const { session, company } = await requireCompany();

  const parsed = truckSchema.safeParse({
    truckType: formData.get("truckType"),
    make: (formData.get("make") as string)?.trim() || undefined,
    model: (formData.get("model") as string)?.trim() || undefined,
    year: (formData.get("year") as string)?.trim() || undefined,
    capacityTons: (formData.get("capacityTons") as string)?.trim() || undefined,
    baseLocation: (formData.get("baseLocation") as string)?.trim() || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your truck details." };
  }
  const d = parsed.data;

  try {
    await db.run(sql`BEGIN`);
    await db.run(sql`
      INSERT INTO trucks (company_id, truck_type, make, model, year, capacity_tons, base_location, status, created_at)
      VALUES (${company.id}, ${d.truckType}, ${d.make ?? null}, ${d.model ?? null}, ${d.year ?? null}, ${d.capacityTons ?? null}, ${d.baseLocation ?? null}, 'docs_pending', ${new Date().toISOString()});
    `);
    const row = (await db.get(
      sql`SELECT last_insert_rowid() as id`
    )) as { id: number };
    const truckId = row.id;

    const requiredDocs = TRUCK_DOC_TYPES.map((t) => t.key);
    for (const key of requiredDocs) {
      const file = formData.get(`doc_${key}`);
      const expiry = String(formData.get(`expiry_${key}`) ?? "");
      if (!(file instanceof File) || file.size === 0) {
        await db.run(sql`ROLLBACK`);
        return { error: `Upload all required documents (missing ${key.replace("_", " ")}).` };
      }
      const saved = await saveUploadedFile("compliance", file);
      let expiryIso: string | null = null;
      if (expiry) {
        const ed = new Date(expiry);
        if (isNaN(ed.getTime())) {
          await db.run(sql`ROLLBACK`);
          return { error: `Invalid expiry date for ${key.replace("_", " ")}.` };
        }
        expiryIso = ed.toISOString().slice(0, 10);
      }
      await db.run(sql`
        INSERT INTO compliance_docs (company_id, truck_id, doc_type, file_name, file_url, expiry_date, status, uploaded_by_company_user_id, created_at)
        VALUES (${company.id}, ${truckId}, ${key}, ${saved.fileName}, ${saved.url}, ${expiryIso}, 'pending', ${session.companyUserId}, ${new Date().toISOString()});
      `);
    }

    await db.run(sql`
      INSERT INTO audit_events (actor_id, actor_type, action, target_type, target_id, metadata_json, created_at)
      VALUES (${session.companyUserId}, 'company_user', 'truck.added', 'trucks', ${String(truckId)}, ${JSON.stringify({ truckType: d.truckType })}, ${new Date().toISOString()});
    `);

    await db.run(sql`COMMIT`);
    revalidatePath("/hauliers/dashboard");
    return { ok: true };
  } catch (err) {
    await db.run(sql`ROLLBACK`);
    return { error: (err as Error).message };
  }
}
