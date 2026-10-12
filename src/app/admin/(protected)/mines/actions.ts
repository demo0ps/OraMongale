"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { mineUsers } from "@/db/mail-schema";
import bcrypt from "bcryptjs";

export async function addMineUser(formData: FormData) {
  const mineId = Number(formData.get("mineId"));
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!name || !email || !password || !mineId) return { error: "Missing fields" };
  const existing = (await db.select().from(mineUsers).where(eq(mineUsers.email, email)).limit(1))[0];
  if (existing) return { error: "A user with that email already exists." };
  const passwordHash = await bcrypt.hash(password, 12);
  await db.insert(mineUsers).values({
    mineId,
    name,
    email,
    passwordHash,
    createdAt: new Date().toISOString(),
  });
  revalidatePath("/admin/mines");
  return { ok: true };
}
// eslint-disable-next-line
import { eq } from "drizzle-orm";
