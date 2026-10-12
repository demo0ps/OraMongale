import "server-only";
import { randomBytes, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { drivers } from "@/db/mail-schema";

const COOKIE_NAME = "__Secure-oramongale.driver_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

function getSecret(): string {
  return process.env.AUTH_SECRET ?? "dev-secret-change-me";
}
function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export interface DriverSession {
  driverId: number;
  companyId: number;
  name: string;
  phone: string;
}

function encode(s: DriverSession) {
  const p = Buffer.from(JSON.stringify(s)).toString("base64url");
  return `${p}.${sign(p)}`;
}
function decode(raw: string): DriverSession | null {
  const dot = raw.lastIndexOf(".");
  if (dot < 0) return null;
  const p = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  const exp = sign(p);
  if (sig.length !== exp.length) return null;
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(exp))) return null;
  try { return JSON.parse(Buffer.from(p, "base64url").toString()); } catch { return null; }
}

export async function getDriverSession(): Promise<DriverSession | null> {
  const c = await cookies();
  const raw = c.get(COOKIE_NAME)?.value;
  return raw ? decode(raw) : null;
}
export async function setDriverSessionCookie(s: DriverSession) {
  const c = await cookies();
  c.set(COOKIE_NAME, encode(s), { httpOnly: true, secure: true, sameSite: "none", path: "/", maxAge: COOKIE_MAX_AGE });
}
export async function clearDriverSessionCookie() {
  const c = await cookies();
  c.delete(COOKIE_NAME);
}

export async function authenticateDriver(phone: string, pin: string): Promise<DriverSession | null> {
  const norm = phone.replace(/\s+/g, "");
  const row = (await db.select().from(drivers).where(eq(drivers.phone, norm)).limit(1))[0];
  if (!row) return null;
  const ok = await bcrypt.compare(pin, row.pinHash);
  if (!ok) return null;
  await db.update(drivers).set({ lastLoginAt: new Date().toISOString() }).where(eq(drivers.id, row.id));
  return { driverId: row.id, companyId: row.companyId, name: row.name, phone: row.phone };
}
