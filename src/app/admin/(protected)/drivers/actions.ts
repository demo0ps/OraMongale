"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { drivers } from "@/db/mail-schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

function normPhone(p: string) {
  return p.replace(/[\s\-()+]/g, "").replace(/^27/, "0");
}

export async function addDriver(formData: FormData) {
  const companyId = Number(formData.get("companyId"));
  const name = String(formData.get("name") ?? "").trim();
  const phone = normPhone(String(formData.get("phone") ?? ""));
  const pin = String(formData.get("pin") ?? "");
  if (!name || !phone || !pin || pin.length !== 4 || !companyId) {
    return { error: "Name, SA phone and 4-digit PIN required." };
  }
  const existing = (await db.select().from(drivers).where(eq(drivers.phone, phone)).limit(1))[0];
  if (existing) return { error: "A driver with that phone already exists." };
  const pinHash = await bcrypt.hash(pin, 12);
  await db.insert(drivers).values({ companyId, name, phone, pinHash, createdAt: new Date().toISOString() });
  revalidatePath("/admin/drivers");
  return { ok: true };
}
