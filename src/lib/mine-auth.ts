import "server-only";
import { randomBytes, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { mineUsers } from "@/db/mail-schema";
import { mines } from "@/db/schema";

const COOKIE_NAME = "__Secure-oramongale.mine_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 14;

function getSecret(): string {
  return process.env.AUTH_SECRET ?? "dev-secret-change-me";
}
function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export interface MineSession {
  mineUserId: number;
  mineId: number;
  email: string;
  name: string;
}

function encode(s: MineSession) {
  const p = Buffer.from(JSON.stringify(s)).toString("base64url");
  return `${p}.${sign(p)}`;
}
function decode(raw: string): MineSession | null {
  const dot = raw.lastIndexOf(".");
  if (dot < 0) return null;
  const p = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  const exp = sign(p);
  if (sig.length !== exp.length) return null;
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(exp))) return null;
  try { return JSON.parse(Buffer.from(p, "base64url").toString()); } catch { return null; }
}

export async function getMineSession(): Promise<MineSession | null> {
  const c = await cookies();
  const raw = c.get(COOKIE_NAME)?.value;
  return raw ? decode(raw) : null;
}

export async function setMineSessionCookie(s: MineSession) {
  const c = await cookies();
  c.set(COOKIE_NAME, encode(s), {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}
export async function clearMineSessionCookie() {
  const c = await cookies();
  c.delete(COOKIE_NAME);
}

export async function authenticateMine(email: string, password: string): Promise<MineSession | null> {
  const row = (await db.select().from(mineUsers).where(eq(mineUsers.email, email.toLowerCase().trim())).limit(1))[0];
  if (!row) return null;
  const ok = await bcrypt.compare(password, row.passwordHash);
  if (!ok) return null;
  await db.update(mineUsers).set({ lastLoginAt: new Date().toISOString() }).where(eq(mineUsers.id, row.id));
  return { mineUserId: row.id, mineId: row.mineId, email: row.email, name: row.name };
}

export async function hashPinOrPassword(raw: string) {
  return bcrypt.hash(raw, 12);
}

export async function getMineForSession(s: MineSession) {
  return (await db.select().from(mines).where(eq(mines.id, s.mineId)).limit(1))[0] ?? null;
}
