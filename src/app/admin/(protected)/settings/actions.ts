"use server";

import { revalidatePath } from "next/cache";
import { setMailSettings, setSetting } from "@/lib/mail-settings";
import { sendTestEmail } from "@/lib/mailer";
import { db } from "@/db";
import { settings } from "@/db/ops-schema";
import { emailOutbox } from "@/db/mail-schema";
import { eq } from "drizzle-orm";

export async function saveSmtpSettings(formData: FormData) {
  await setMailSettings({
    host: String(formData.get("host") ?? "").trim(),
    port: Number(String(formData.get("port") ?? "587")) || 587,
    user: String(formData.get("user") ?? "").trim(),
    pass: String(formData.get("pass") ?? ""),
    from: String(formData.get("from") ?? "").trim() || String(formData.get("user") ?? "").trim(),
    secure: String(formData.get("secure")) === "on",
  });
  revalidatePath("/admin/settings");
}

export async function sendTestEmailAction(formData: FormData) {
  const to = String(formData.get("to") ?? "").trim();
  if (!to) return { ok: false, error: "No recipient" };
  const r = await sendTestEmail(to);
  if (r.ok) {
    await db
      .insert(emailOutbox)
      .values({
        toEmail: to,
        subject: "OraMongale — SMTP test",
        bodyText: "SMTP test sent successfully.",
        status: "sent",
        providerMessageId: r.messageId,
        sentAt: new Date().toISOString(),
      })
      .catch(() => {});
    revalidatePath("/admin/settings");
    return { ok: true };
  }
  return { ok: false, error: r.error };
}

export async function saveRateDefaults(formData: FormData) {
  const fields = [
    "default_margin_pct",
    "default_vat_pct",
    "diesel_price_per_l",
    "payment_terms_days",
    "r_per_tkm_coal",
    "r_per_tkm_chrome",
    "r_per_tkm_manganese",
    "r_per_tkm_pgms",
    "r_per_tkm_iron_ore",
    "r_per_tkm_default",
    "company_vat_number",
    "company_reg_number",
    "company_bank_name",
    "company_bank_account",
    "invoice_prefix",
  ];
  for (const k of fields) {
    await setSetting(k, String(formData.get(k) ?? ""));
  }
  revalidatePath("/admin/settings");
}

export async function seedDemoAction() {
  "use server";
  try {
    const { bootstrap } = await import("@/db/bootstrap");
    const { seedDemoData } = await import("@/lib/demo-seed");
    await bootstrap();
    return await seedDemoData();
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function saveInvoiceSettingsAction(patch: Record<string, string>) {
  const { saveInvoiceSettings } = await import("@/lib/invoice-settings");
  await saveInvoiceSettings(patch);
  revalidatePath("/admin/settings");
}

export async function resendEmail(id: number) {
  const { sendQueuedEmail } = await import("@/lib/mailer");
  await sendQueuedEmail(id);
  revalidatePath("/admin/settings");
}
