// Transactional email. Emails are queued to email_outbox. If SMTP settings
// are saved in the DB (via Settings page) we attempt delivery immediately;
// otherwise messages stay in the outbox with status='queued'.
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { emailOutbox, assignmentInvites } from "@/db/mail-schema";
import { renderJobAssignmentEmail } from "@/lib/emails/job-assignment";
import { sendMailWithSMTP } from "@/lib/mail-settings";
import { randomToken } from "@/lib/tokens";
import type { JobWithAssignments } from "@/lib/admin/types";

type OutboxInput = {
  toEmail: string;
  toName?: string | null;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  jobId?: number | null;
};

export async function queueEmail(input: OutboxInput) {
  const row = await db
    .insert(emailOutbox)
    .values({
      jobId: input.jobId ?? null,
      toEmail: input.toEmail,
      toName: input.toName ?? null,
      subject: input.subject,
      bodyText: input.bodyText,
      bodyHtml: input.bodyHtml ?? null,
      status: "queued",
    })
    .returning();
  const id = row[0]!.id;
  const cfg = await import("@/lib/mail-settings").then((m) => m.getMailSettings());
  if (cfg) await sendQueuedEmail(id).catch(() => {});
  return id;
}

export async function sendQueuedEmail(id: number): Promise<boolean> {
  const msg = (await db.select().from(emailOutbox).where(eq(emailOutbox.id, id)))[0];
  if (!msg) return false;
  const cfg = await import("@/lib/mail-settings").then((m) => m.getMailSettings());
  if (!cfg) {
    await db.update(emailOutbox).set({ status: "failed", errorMessage: "SMTP not configured" }).where(eq(emailOutbox.id, id));
    return false;
  }
  const result = await sendMailWithSMTP({
    to: msg.toEmail,
    subject: msg.subject,
    text: msg.bodyText,
    html: msg.bodyHtml ?? undefined,
  });
  if (result.ok) {
    await db
      .update(emailOutbox)
      .set({ status: "sent", providerMessageId: result.messageId, sentAt: new Date().toISOString(), errorMessage: null })
      .where(eq(emailOutbox.id, id));
    return true;
  }
  await db.update(emailOutbox).set({ status: "failed", errorMessage: result.error.slice(0, 500) }).where(eq(emailOutbox.id, id));
  return false;
}

export async function sendTestEmail(to: string) {
  return sendMailWithSMTP({
    to,
    subject: "OraMongale — SMTP test",
    text: "SMTP is configured correctly. Dispatch emails from the admin console will come from this address.",
    html: "<p><strong>SMTP is configured correctly.</strong></p><p>Dispatch emails from the admin console will come from this address.</p>",
  });
}

// Queue assignment emails + create a magic accept/decline invite for each.
// Uses request.host from the caller (we pass in the baseUrl so links work in the iframe preview).
export async function queueAssignmentEmailsForJob(job: JobWithAssignments, baseUrl: string) {
  const ids: number[] = [];
  for (const a of job.assignments) {
    // Create a single-use magic token
    const token = randomToken(24);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(); // 7 days
    await db.insert(assignmentInvites).values({
      assignmentId: a.id,
      token,
      toEmail: a.company.contactEmail,
      toName: a.contactName ?? a.company.contactName,
      expiresAt,
      status: "pending",
    });
    const acceptUrl = `${baseUrl}/offer/${token}`;
    const rendered = renderJobAssignmentEmail({
      companyName: a.company.name,
      contactName: a.contactName ?? a.company.contactName,
      job,
      truck: a.truck ? { reg: a.truck.baseLocation ?? "", type: a.truck.truckType } : null,
      acceptUrl,
    });
    const id = await queueEmail({
      jobId: job.id,
      toEmail: a.company.contactEmail,
      toName: a.contactName ?? a.company.contactName,
      subject: rendered.subject,
      bodyText: rendered.text,
      bodyHtml: rendered.html,
    });
    ids.push(id);
  }
  return ids;
}
