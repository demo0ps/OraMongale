import { db } from "@/db";
import { emailOutbox } from "@/db/mail-schema";
import { settings } from "@/db/ops-schema";
import { desc, eq } from "drizzle-orm";
import { getMailSettings } from "@/lib/mail-settings";
import {
  saveSmtpSettings,
  sendTestEmailAction,
  saveRateDefaults,
  resendEmail,
  seedDemoAction,
} from "./actions";
import ResendButton from "./ResendButton";
import TestEmailForm from "./TestEmailForm";
import InvoiceSettingsForm from "./InvoiceSettingsForm";
import SeedDemoButton from "./SeedDemoButton";
import { getInvoiceSettings } from "@/lib/invoice-settings";

export const metadata = { title: "Settings — Admin" };
export const dynamic = "force-dynamic";

async function getSettingMap() {
  const rows = await db.select().from(settings);
  return new Map(rows.map((r) => [r.key, r.value]));
}

export default async function SettingsPage() {
  const m = await getSettingMap();
  const smtp = await getMailSettings();
  const inv = await getInvoiceSettings();
  const mails = await db
    .select()
    .from(emailOutbox)
    .orderBy(desc(emailOutbox.createdAt))
    .limit(50);
  const configured = !!smtp;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Settings</h1>
        <p className="text-sm text-steel mt-1">
          SMTP, rate defaults, company details and email outbox.
        </p>
      </div>

      {/* SMTP */}
      <section className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-coal">SMTP / outgoing email</h2>
          <span
            className={
              "text-xs rounded-full border px-2 py-0.5 " +
              (configured
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-amber-50 text-amber-800 border-amber-200")
            }
          >
            {configured ? "connected" : "not configured"}
          </span>
        </div>
        <form action={saveSmtpSettings} className="grid md:grid-cols-3 gap-3">
          <Field label="SMTP host" name="host" defaultValue={smtp?.host ?? ""} placeholder="smtp.gmail.com" />
          <Field label="Port" name="port" defaultValue={String(smtp?.port ?? 587)} placeholder="587" />
          <div className="flex items-end gap-2">
            <label className="flex items-center gap-2 text-sm pb-2">
              <input
                type="checkbox"
                name="secure"
                defaultChecked={smtp?.secure ?? false}
                className="h-4 w-4"
              />
              <span className="text-coal">Use SSL/TLS (port 465)</span>
            </label>
          </div>
          <Field label="Username / email" name="user" defaultValue={smtp?.user ?? ""} placeholder="dispatch@oramongale.co.za" />
          <Field label="Password / app password" name="pass" type="password" defaultValue={smtp?.pass ?? ""} placeholder="••••••••" />
          <Field label='"From" address' name="from" defaultValue={smtp?.from ?? ""} placeholder="OraMongale &lt;dispatch@oramongale.co.za&gt;" />
          <div className="md:col-span-3 flex justify-end">
            <button className="btn-primary">Save SMTP</button>
          </div>
        </form>

        <div className="mt-4 pt-4 border-t border-dust">
          <h3 className="text-sm font-semibold text-coal mb-2">Send test email</h3>
          <TestEmailForm action={sendTestEmailAction} />
          <p className="text-xs text-steel mt-2">
            For Gmail, use an <a className="underline" href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer">App Password</a>, not your main password. Outlook/Office 365 uses host <code>smtp.office365.com</code> port 587 STARTTLS.
          </p>
        </div>
      </section>

      {/* Rate defaults */}
      <section className="card p-5">
        <h2 className="font-semibold text-coal mb-4">Rate calculator defaults</h2>
        <form action={saveRateDefaults} className="grid md:grid-cols-3 gap-3">
          <Field label="Default margin %" name="default_margin_pct" defaultValue={m.get("default_margin_pct") ?? "15"} />
          <Field label="VAT % (0 = not registered)" name="default_vat_pct" defaultValue={m.get("default_vat_pct") ?? "0"} />
          <Field label="Diesel price (R/l)" name="diesel_price_per_l" defaultValue={m.get("diesel_price_per_l") ?? "25.50"} />
          <Field label="Payment terms (days)" name="payment_terms_days" defaultValue={m.get("payment_terms_days") ?? "30"} />
          <Field label="Invoice prefix" name="invoice_prefix" defaultValue={m.get("invoice_prefix") ?? "INV"} />
          <div />
          <Field label="R/ton-km — Coal" name="r_per_tkm_coal" defaultValue={m.get("r_per_tkm_coal") ?? "2.10"} />
          <Field label="R/ton-km — Chrome" name="r_per_tkm_chrome" defaultValue={m.get("r_per_tkm_chrome") ?? "2.40"} />
          <Field label="R/ton-km — Manganese" name="r_per_tkm_manganese" defaultValue={m.get("r_per_tkm_manganese") ?? "2.30"} />
          <Field label="R/ton-km — PGMs (platinum)" name="r_per_tkm_pgms" defaultValue={m.get("r_per_tkm_pgms") ?? "2.60"} />
          <Field label="R/ton-km — Iron ore" name="r_per_tkm_iron_ore" defaultValue={m.get("r_per_tkm_iron_ore") ?? "2.00"} />
          <Field label="R/ton-km — Default/other" name="r_per_tkm_default" defaultValue={m.get("r_per_tkm_default") ?? "2.20"} />
          <div className="md:col-span-3 mt-3">
            <h3 className="text-sm font-semibold text-coal mb-2">Company details (for invoices)</h3>
          </div>
          <Field label="Company reg. number" name="company_reg_number" defaultValue={m.get("company_reg_number") ?? ""} />
          <Field label="VAT number" name="company_vat_number" defaultValue={m.get("company_vat_number") ?? ""} />
          <div />
          <Field label="Bank name" name="company_bank_name" defaultValue={m.get("company_bank_name") ?? ""} />
          <Field label="Bank account" name="company_bank_account" defaultValue={m.get("company_bank_account") ?? ""} />
          <div className="md:col-span-3 flex justify-end">
            <button className="btn-primary">Save defaults</button>
          </div>
        </form>
      </section>

      {/* Outbox */}
      <section className="card overflow-hidden">
        <div className="p-4 border-b border-dust flex items-center justify-between">
          <h2 className="font-semibold text-coal">Email outbox</h2>
          <span className="text-xs text-steel">{mails.length} most recent</span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-bone text-steel text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2 font-medium">When</th>
              <th className="text-left px-4 py-2 font-medium">To</th>
              <th className="text-left px-4 py-2 font-medium">Subject</th>
              <th className="text-left px-4 py-2 font-medium">Job</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {mails.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-steel text-sm">
                  No emails yet. Assign trucks to a job and click &ldquo;Send email to hauliers&rdquo;.
                </td>
              </tr>
            )}
            {mails.map((m) => (
              <tr key={m.id} className="border-t border-dust align-top">
                <td className="px-4 py-2 text-xs text-steel whitespace-nowrap">
                  {new Date(m.createdAt).toLocaleString("en-ZA")}
                </td>
                <td className="px-4 py-2">
                  <div className="font-medium text-ink">{m.toName ?? ""}</div>
                  <div className="text-xs text-steel">{m.toEmail}</div>
                </td>
                <td className="px-4 py-2 text-coal">{m.subject}</td>
                <td className="px-4 py-2 text-steel">{m.jobId ? "#" + m.jobId : "—"}</td>
                <td className="px-4 py-2">
                  <span
                    className={
                      "text-xs rounded-full border px-2 py-0.5 " +
                      (m.status === "sent"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : m.status === "failed"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-amber-50 text-amber-800 border-amber-200")
                    }
                  >
                    {m.status}
                  </span>
                  {m.errorMessage && <div className="text-[10px] text-red-600 mt-1 max-w-xs">{m.errorMessage}</div>}
                </td>
                <td className="px-4 py-2 text-right">
                  {m.status !== "sent" && <ResendButton id={m.id} action={resendEmail} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <InvoiceSettingsForm initial={inv} />
      <SeedDemoButton action={seedDemoAction} />
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input name={name} type={type} placeholder={placeholder} defaultValue={defaultValue ?? ""} className="field" />
    </div>
  );
}
