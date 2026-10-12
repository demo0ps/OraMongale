"use client";

import { useFormState as useActionState } from "react-dom";
import { useState, useTransition } from "react";
import { submitLead, type LeadFormState } from "./actions";
import { TRUCK_TYPES } from "@/lib/constants";

export default function PostJobForm() {
  const [state, action] = useActionState<LeadFormState, FormData>(submitLead, {});
  const [pending, start] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(() => action(new FormData(e.currentTarget)));
      }}
      className="space-y-6"
    >
      {state?.error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.error}
        </div>
      )}

      <fieldset className="space-y-4">
        <legend className="font-semibold text-coal">Your details</legend>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Mine / company name" error={state?.fieldErrors?.mineName}>
            <input name="mineName" className="field" required />
          </Field>
          <Field label="Your name" error={state?.fieldErrors?.contactName}>
            <input name="contactName" className="field" required />
          </Field>
          <Field label="Phone" error={state?.fieldErrors?.contactPhone}>
            <input name="contactPhone" className="field" required placeholder="082 123 4567" />
          </Field>
          <Field label="Email (optional)">
            <input name="contactEmail" type="email" className="field" />
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="font-semibold text-coal">The load</legend>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Material (coal, ore, overburden, etc.)">
            <input name="material" className="field" />
          </Field>
          <Field label="Approx. tonnage">
            <input name="tonnage" className="field" placeholder="e.g. 5 000t / 30 loads/day" />
          </Field>
          <Field label="Pickup site">
            <input name="pickupSite" className="field" placeholder="e.g. Khutala Colliery" />
          </Field>
          <Field label="Drop-off site">
            <input name="dropoffSite" className="field" placeholder="e.g. Kendal power station" />
          </Field>
          <Field label="Required truck type">
            <select name="requiredTruckType" className="field" defaultValue="">
              <option value="">No preference / we will advise</option>
              {TRUCK_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Target start date">
            <input type="date" name="startDate" className="field" />
          </Field>
        </div>
        <Field label="Anything else we should know?">
          <textarea name="notes" rows={4} className="field" />
        </Field>
      </fieldset>

      <button className="btn-primary w-full sm:w-auto" disabled={pending}>
        {pending ? "Submitting…" : "Submit haulage need"}
      </button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}
