import "server-only";
import { randomBytes, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { users, auditEvents } from "./db/schema";

// Admin session cookie: same secure+samesite=none approach as the haulier
// cookie, but separate name/secret so roles can never collide.
const COOKIE_NAME = "__Secure-oramongale.admin_session";
const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours (admin sessions)

function getSecret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is required");
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export interface AdminSession {
  userId: number;
  email: string;
  name: string;
  role: "admin";
}

function encodeSession(s: AdminSession): string {
  const payload = Buffer.from(JSON.stringify(s)).toString("base64url");
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

function decodeSession(raw: string): AdminSession | null {
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
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as AdminSession;
    if (parsed.role !== "admin") return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
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

export async function setAdminSessionCookie(s: AdminSession) {
  const c = await cookies();
  c.set(COOKIE_NAME, encodeSession(s), COOKIE_OPTS);
}

export async function clearAdminSessionCookie() {
  const c = await cookies();
  c.set(COOKIE_NAME, "", { ...COOKIE_OPTS, maxAge: 0 });
}

export async function authenticateAdmin(
  email: string,
  password: string
): Promise<AdminSession | null> {
  const found = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))
    .limit(1);
  const u = found[0];
  if (!u) return null;
  const ok = await bcrypt.compare(password, u.passwordHash);
  if (!ok) return null;

  const now = new Date().toISOString();
  await db
    .update(users)
    .set({ lastLoginAt: now })
    .where(eq(users.id, u.id));
  await db.insert(auditEvents).values({
    actorId: u.id,
    actorType: "admin",
    action: "login.success",
    targetType: "users",
    targetId: String(u.id),
    createdAt: now,
  });

  return { userId: u.id, email: u.email, name: u.name, role: "admin" };
}

// CSRF double-submit cookie for admin form POSTs. Cookie is set by middleware
// (src/middleware.ts) because Next.js Server Components cannot mutate cookies
// during render. On login POST we compare the submitted hidden field to the
// cookie value.
const CSRF_COOKIE = "oramongale.admin_csrf";

export async function getAdminCsrfToken(): Promise<string> {
  const c = await cookies();
  return c.get(CSRF_COOKIE)?.value ?? "";
}

export async function verifyAdminCsrf(submitted: string) {
  const c = await cookies();
  const expected = c.get(CSRF_COOKIE)?.value;
  if (!expected || !submitted) return false;
  if (submitted.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(submitted), Buffer.from(expected));
  } catch {
    return false;
  }
}
