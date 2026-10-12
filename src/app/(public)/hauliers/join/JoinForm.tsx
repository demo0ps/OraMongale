"use client";

import { useTransition } from "react";
import { useActionState } from "react";
import { joinCompany, type JoinFormState } from "./actions";
import { SA_PROVINCES } from "@/lib/constants";

const initial: JoinFormState = {};

export default function JoinForm() {
  const [state, formAction] = useActionState(joinCompany, initial);
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(fd) => startTransition(() => formAction(fd))}
      className="space-y-6"
    >
      {state?.error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.error}
        </div>
      )}

      <fieldset className="space-y-4">
        <legend className="font-semibold text-coal">Company details</legend>
        <Field label="Company name" error={state?.fieldErrors?.companyName}>
          <input name="companyName" className="field" required maxLength={120} />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Contact person" error={state?.fieldErrors?.contactName}>
            <input name="contactName" className="field" required maxLength={80} />
          </Field>
          <Field label="Contact phone" error={state?.fieldErrors?.contactPhone}>
            <input
              name="contactPhone"
              className="field"
              required
              placeholder="e.g. 082 123 4567"
            />
          </Field>
        </div>
        <Field label="Contact email" error={state?.fieldErrors?.contactEmail}>
          <input
            name="contactEmail"
            type="email"
            className="field"
            required
            autoComplete="email"
          />
        </Field>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="font-semibold text-coal">Where you operate</legend>
        <Field label="Base province" error={state?.fieldErrors?.baseProvinceCode}>
          <select name="baseProvince" className="field" required defaultValue="">
            <option value="" disabled>Select province…</option>
            {SA_PROVINCES.map((p) => (
              <option key={p.code} value={p.code}>{p.name}</option>
            ))}
          </select>
        </Field>
        <Field
          label="Provinces you operate in (select all that apply)"
          error={state?.fieldErrors?.operatingProvinceCodes}
        >
          <div className="grid sm:grid-cols-3 gap-2">
            {SA_PROVINCES.map((p) => (
              <label
                key={p.code}
                className="flex items-center gap-2 text-sm text-coal rounded border border-dust px-3 py-2 hover:bg-bone cursor-pointer"
              >
                <input
                  type="checkbox"
                  name="operatingProvinces"
                  value={p.code}
                  className="accent-gold"
                />
                {p.name}
              </label>
            ))}
          </div>
        </Field>
      </fieldset>

      <div className="text-xs text-steel">
        No password needed. Submit and you&rsquo;ll go straight to your fleet
        dashboard to add trucks and upload compliance paperwork.
      </div>

      <button type="submit" className="btn-primary w-full" disabled={pending}>
        {pending ? "Creating account…" : "List my fleet"}
      </button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}
