"use client";
import { useState, useTransition } from "react";
import { saveInvoiceSettingsAction } from "./actions";
import type { InvoiceSettings } from "@/lib/invoice-settings";

export default function InvoiceSettingsForm({ initial }: { initial: InvoiceSettings }) {
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const num = (k: string) => Number(fd.get(k) ?? 0);
    const str = (k: string) => String(fd.get(k) ?? "");
    const patch = {
      legalName: str("legalName"),
      tradingName: str("tradingName"),
      regNumber: str("regNumber"),
      vatNumber: str("vatNumber"),
      vatRate: num("vatRate"),
      physicalAddress: str("physicalAddress"),
      postalAddress: str("postalAddress"),
      billingEmail: str("billingEmail"),
      billingPhone: str("billingPhone"),
      bankName: str("bankName"),
      bankAccountHolder: str("bankAccountHolder"),
      bankAccountNumber: str("bankAccountNumber"),
      bankBranchCode: str("bankBranchCode"),
      bankBranchName: str("bankBranchName"),
      paymentTermsDays: num("paymentTermsDays"),
      invoiceFooterNote: str("invoiceFooterNote"),
    };
    start(async () => {
      await saveInvoiceSettingsAction(patch as any);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-5">
      <div>
        <h2 className="section-title">Invoice branding &amp; legal</h2>
        <p className="text-sm text-steel mt-1">
          These values print on every invoice and remittance PDF. Fill them in as your
          company registration, VAT and banking are finalised.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Trading name (shown on header)" name="tradingName" defaultValue={initial.tradingName} required />
        <Field label="Legal / registered name" name="legalName" defaultValue={initial.legalName} required />
        <Field label="Registration number (CIPC)" name="regNumber" defaultValue={initial.regNumber} placeholder="e.g. 2024/123456/07" />
        <Field label="VAT number" name="vatNumber" defaultValue={initial.vatNumber} placeholder="e.g. 4123456789 or 'Not registered'" />
        <Field label="VAT rate (%)" name="vatRate" type="number" defaultValue={String(initial.vatRate)} min="0" max="30" step="0.01" />
        <Field label="Payment terms (days)" name="paymentTermsDays" type="number" defaultValue={String(initial.paymentTermsDays)} min="0" max="120" />
        <Field label="Billing email" name="billingEmail" type="email" defaultValue={initial.billingEmail} />
        <Field label="Billing phone" name="billingPhone" defaultValue={initial.billingPhone} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Physical address" name="physicalAddress" defaultValue={initial.physicalAddress} textarea />
        <Field label="Postal address" name="postalAddress" defaultValue={initial.postalAddress} textarea />
      </div>

      <div>
        <h3 className="font-semibold text-ink mb-2">Banking details</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Bank name" name="bankName" defaultValue={initial.bankName} />
          <Field label="Branch name" name="bankBranchName" defaultValue={initial.bankBranchName} />
          <Field label="Account holder" name="bankAccountHolder" defaultValue={initial.bankAccountHolder} />
          <Field label="Account number" name="bankAccountNumber" defaultValue={initial.bankAccountNumber} />
          <Field label="Branch code" name="bankBranchCode" defaultValue={initial.bankBranchCode} />
        </div>
      </div>

      <Field label="Invoice footer note" name="invoiceFooterNote" defaultValue={initial.invoiceFooterNote} textarea />

      <div className="flex items-center gap-3">
        <button className="btn-primary" disabled={pending}>{pending ? "Saving…" : "Save invoice settings"}</button>
        {saved && <span className="text-sm text-emerald-700">Saved ✓</span>}
      </div>
    </form>
  );
}

function Field({
  label, name, defaultValue, required, placeholder, type = "text", textarea = false, min, max, step,
}: {
  label: string; name: string; defaultValue?: string; required?: boolean; placeholder?: string;
  type?: string; textarea?: boolean; min?: string; max?: string; step?: string;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {textarea ? (
        <textarea name={name} required={required} defaultValue={defaultValue ?? ""} placeholder={placeholder} rows={2} className="field" />
      ) : (
        <input name={name} type={type} required={required} defaultValue={defaultValue ?? ""} placeholder={placeholder}
          min={min} max={max} step={step} className="field" />
      )}
    </label>
  );
}
