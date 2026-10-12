import nodemailer from "nodemailer";
import { db } from "@/db";
import { settings } from "@/db/ops-schema";
import { eq } from "drizzle-orm";

export type MailSettings = {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string; // e.g. "OraMongale <dispatch@oramongale.co.za>"
  secure: boolean; // true for 465, false for STARTTLS (587)
};

export async function getMailSettings(): Promise<MailSettings | null> {
  const keys = ["smtp_host", "smtp_port", "smtp_user", "smtp_pass", "smtp_from", "smtp_secure"];
  const rows = await db
    .select()
    .from(settings)
    .where(
      // Simple IN using OR
      keys.reduce(
        (cond, k, i) => (i === 0 ? eq(settings.key, k) : cond),
        eq(settings.key, keys[0]),
      ),
    );
  // Fetch all individually — simpler
  const map = new Map<string, string | null>();
  for (const k of keys) {
    const r = await db.select().from(settings).where(eq(settings.key, k)).limit(1);
    map.set(k, r[0]?.value ?? null);
  }
  const host = map.get("smtp_host");
  const user = map.get("smtp_user");
  const pass = map.get("smtp_pass");
  if (!host || !user || !pass) return null;
  return {
    host,
    port: Number(map.get("smtp_port") ?? 587),
    user,
    pass,
    from: map.get("smtp_from") ?? user,
    secure: map.get("smtp_secure") === "1" || map.get("smtp_secure") === "true",
  };
}

export async function setMailSettings(s: MailSettings) {
  const entries = {
    smtp_host: s.host,
    smtp_port: String(s.port),
    smtp_user: s.user,
    smtp_pass: s.pass,
    smtp_from: s.from,
    smtp_secure: s.secure ? "1" : "0",
  };
  for (const [k, v] of Object.entries(entries)) {
    await db
      .insert(settings)
      .values({ key: k, value: v, updatedAt: new Date().toISOString() })
      .onConflictDoUpdate({ target: settings.key, set: { value: v, updatedAt: new Date().toISOString() } });
  }
}

export async function sendMailWithSMTP({
  to,
  subject,
  text,
  html,
  attachments,
}: {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  attachments?: { filename: string; path?: string; content?: Buffer; contentType?: string }[];
}): Promise<{ ok: true; messageId: string } | { ok: false; error: string }> {
  const s = await getMailSettings();
  if (!s) return { ok: false, error: "SMTP not configured" };
  try {
    const transporter = nodemailer.createTransport({
      host: s.host,
      port: s.port,
      secure: s.secure,
      auth: { user: s.user, pass: s.pass },
      connectionTimeout: 8000,
    });
    const info = await transporter.sendMail({
      from: s.from,
      to: Array.isArray(to) ? to.join(",") : to,
      subject,
      text,
      html: html ?? undefined,
      attachments: attachments as any,
    });
    return { ok: true, messageId: String(info.messageId ?? "") };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function getSetting(key: string): Promise<string | null> {
  const r = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  return r[0]?.value ?? null;
}

export async function setSetting(key: string, value: string | null) {
  if (value === null) {
    await db.delete(settings).where(eq(settings.key, key));
    return;
  }
  await db
    .insert(settings)
    .values({ key, value, updatedAt: new Date().toISOString() })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date().toISOString() } });
}
