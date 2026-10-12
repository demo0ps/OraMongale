import "server-only";
import { randomBytes, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { companyUsers, companies, auditEvents } from "./db/schema";

const COOKIE_NAME = "__Secure-oramongale.company_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 14;

function getSecret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is required");
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export interface CompanySession {
  companyUserId: number;
  companyId: number;
  email: string;
  name: string;
}

function encodeSession(sess: CompanySession): string {
  const payload = Buffer.from(JSON.stringify(sess)).toString("base64url");
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

function decodeSession(raw: string): CompanySession | null {
  const dot = raw.lastIndexOf(".");
  if (dot < 0) return null;
  const payload = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  const expected = sign(payload);
  try {
    if (sig.length !== expected.length) return null;
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch {
    return null;
  }
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as CompanySession;
  } catch {
    return null;
  }
}

export async function getCompanySession(): Promise<CompanySession | null> {
  const c = await cookies();
  const raw = c.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  return decodeSession(raw);
}

const COOKIE_OPTS = {
  httpOnly: true,
  secure: true,
  sameSite: "none" as const,
  path: "/",
  maxAge: COOKIE_MAX_AGE,
};

export async function setCompanySessionCookie(sess: CompanySession) {
  const c = await cookies();
  c.set(COOKIE_NAME, encodeSession(sess), COOKIE_OPTS);
}

export async function clearCompanySessionCookie() {
  const c = await cookies();
  c.set(COOKIE_NAME, "", { ...COOKIE_OPTS, maxAge: 0 });
}

export async function authenticateCompanyUser(
  email: string,
  password: string
): Promise<{ user: { id: number; email: string; name: string; companyId: number } } | null> {
  const found = await db
    .select()
    .from(companyUsers)
    .where(eq(companyUsers.email, email.toLowerCase().trim()))
    .limit(1);
  const u = found[0];
  if (!u) return null;
  const ok = await bcrypt.compare(password, u.passwordHash);
  if (!ok) return null;
  await db
    .update(companyUsers)
    .set({ lastLoginAt: new Date().toISOString() })
    .where(eq(companyUsers.id, u.id));
  await db.insert(auditEvents).values({
    actorId: u.id,
    actorType: "company_user",
    action: "company.login",
    targetType: "companies",
    targetId: String(u.companyId),
    createdAt: new Date().toISOString(),
  });
  return { user: { id: u.id, email: u.email, name: u.name, companyId: u.companyId } };
}

export async function getCompanyForSession(
  sess: CompanySession
): Promise<{ company: typeof companies.$inferSelect } | null> {
  const c = await db
    .select()
    .from(companies)
    .where(eq(companies.id, sess.companyId))
    .limit(1);
  return c[0] ? { company: c[0] } : null;
}

export function generateToken(): { token: string; expiresAt: string } {
  return {
    token: randomBytes(32).toString("hex"),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
  };
}
