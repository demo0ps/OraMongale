"use server";

import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  companies,
  companyOperatingProvinces,
  provinces,
  auditEvents,
} from "@/db/schema";
import { setCompanySessionCookie } from "@/company-auth";

const phoneRegex = /^[+()\-\s0-9]{7,20}$/;

const joinSchema = z.object({
  companyName: z.string().min(2).max(120),
  contactName: z.string().min(2).max(80),
  contactEmail: z.string().email(),
  contactPhone: z.string().regex(phoneRegex),
  baseProvinceCode: z.string().min(2),
  operatingProvinceCodes: z.array(z.string().min(2)).min(1),
});

export type JoinFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function joinCompany(
  _prev: JoinFormState,
  formData: FormData
): Promise<JoinFormState> {
  const operatingProvinceCodes = formData.getAll("operatingProvinces") as string[];
  const parsed = joinSchema.safeParse({
    companyName: (formData.get("companyName") as string)?.trim(),
    contactName: (formData.get("contactName") as string)?.trim(),
    contactEmail: (formData.get("contactEmail") as string)?.trim().toLowerCase(),
    contactPhone: (formData.get("contactPhone") as string)?.trim(),
    baseProvinceCode: (formData.get("baseProvince") as string)?.trim(),
    operatingProvinceCodes,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const iss of parsed.error.issues) {
      fieldErrors[iss.path[0] as string] = iss.message;
    }
    return { fieldErrors };
  }
  const data = parsed.data;

  // If a user/company with this email already exists, sign them straight in — no password.
  const existing = await db.get<{ id: number; company_id: number; email: string; name: string }>(
    sql`SELECT id, company_id, email, name FROM company_users WHERE email=${data.contactEmail} LIMIT 1`
  );
  if (existing) {
    await setCompanySessionCookie({
      companyUserId: existing.id,
      companyId: existing.company_id,
      email: existing.email,
      name: existing.name,
    });
    redirect("/hauliers/dashboard");
  }

  const provinceRows = await db
    .select({ id: provinces.id, code: provinces.code })
    .from(provinces);
  const provinceByCode = new Map(provinceRows.map((p) => [p.code, p.id]));
  const baseId = provinceByCode.get(data.baseProvinceCode);
  if (!baseId) return { fieldErrors: { baseProvinceCode: "Invalid province" } };
  const opIds = Array.from(
    new Set(
      [baseId, ...data.operatingProvinceCodes.map((c) => provinceByCode.get(c))].filter(
        (v): v is number => typeof v === "number"
      )
    )
  );

  const now = new Date().toISOString();

  try {
    await db.run(sql`BEGIN`);

    await db.run(sql`
      INSERT INTO companies (name, contact_name, contact_email, contact_phone, base_province_id, status, created_at)
      VALUES (${data.companyName}, ${data.contactName}, ${data.contactEmail}, ${data.contactPhone}, ${baseId}, 'pending_review', ${now});
    `);
    const companyRow = (await db.get(
      sql`SELECT last_insert_rowid() as id`
    )) as { id: number };
    const companyId = companyRow.id;

    // Create a company_user row WITHOUT a password (password_hash empty), auto-verified.
    await db.run(sql`
      INSERT INTO company_users (company_id, email, password_hash, name, email_verified, created_at)
      VALUES (${companyId}, ${data.contactEmail}, '', ${data.contactName}, 1, ${now});
    `);
    const userRow = (await db.get(
      sql`SELECT last_insert_rowid() as id`
    )) as { id: number };
    const userId = userRow.id;

    for (const pid of opIds) {
      await db.run(
        sql`INSERT OR IGNORE INTO company_operating_provinces (company_id, province_id) VALUES (${companyId}, ${pid});`
      );
    }

    await db.run(sql`
      INSERT INTO audit_events (actor_id, actor_type, action, target_type, target_id, metadata_json, created_at)
      VALUES (${userId}, 'company_user', 'company.signup', 'companies', ${String(companyId)}, ${JSON.stringify({ email: data.contactEmail, no_password: true })}, ${now});
    `);

    await db.run(sql`COMMIT`);

    // Auto sign-in, no email verification step.
    await setCompanySessionCookie({
      companyUserId: userId,
      companyId,
      email: data.contactEmail,
      name: data.contactName,
    });
  } catch (err) {
    await db.run(sql`ROLLBACK`);
    console.error("[join] transaction failed", err);
    return { error: "Something went wrong creating your account. Please try again." };
  }

  redirect("/hauliers/dashboard");
}
