"use client";

import { useActionState } from "react";
import { addTruckWithDocs } from "./actions";
import { TRUCK_TYPES, TRUCK_DOC_TYPES } from "@/lib/constants";

const initialState: { error?: string; ok?: boolean } = {};

export default function AddTruckAndDocsForm() {
  const [state, dispatch, pending] = useActionState(addTruckWithDocs, initialState);

  return (
    <form action={dispatch} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="label">Truck type</label>
          <select name="truckType" className="field" required defaultValue="">
            <option value="" disabled>Select…</option>
            {TRUCK_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <Field label="Make (e.g. MAN, Mercedes-Benz, Scania)">
          <input name="make" className="field" maxLength={60} />
        </Field>
        <Field label="Model">
          <input name="model" className="field" maxLength={60} />
        </Field>
        <Field label="Year">
          <input name="year" type="number" min={1980} max={2100} className="field" />
        </Field>
        <Field label="Capacity (tons)">
          <input name="capacityTons" type="number" min={1} max={200} className="field" />
        </Field>
        <div className="sm:col-span-2">
          <label className="label">Base location (town / yard)</label>
          <input name="baseLocation" className="field" maxLength={120} placeholder="e.g. eMalahleni, Middelburg, Rustenburg" />
        </div>
      </div>

      <div>
        <div className="font-medium text-coal text-sm mb-2">
          Per-truck compliance documents
        </div>
        <div className="rounded border border-dust bg-bone p-4 space-y-3">
          {TRUCK_DOC_TYPES.map((doc) => (
            <div key={doc.key} className="grid sm:grid-cols-3 gap-3 items-end">
              <div className="sm:col-span-1">
                <label className="label">{doc.label}</label>
                <input
                  type="file"
                  name={`doc_${doc.key}`}
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  className="field"
                  required
                />
              </div>
              <div className="sm:col-span-1">
                <label className="label">Expiry date</label>
                <input
                  type="date"
                  name={`expiry_${doc.key}`}
                  className="field"
                />
              </div>
            </div>
          ))}
          <p className="text-xs text-steel">
            The license disc and roadworthy have expiry dates on them. The
            operator card and NLTA permit also expire — check the document.
          </p>
        </div>
      </div>

      {state?.error && <p className="text-sm text-red-700">{state.error}</p>}
      {state?.ok && (
        <p className="text-sm text-emerald-700">
          Truck added. It will become available for matching once we verify your
          documents.
        </p>
      )}

      <button className="btn-primary" disabled={pending}>
        {pending ? "Adding truck…" : "Add truck and upload docs"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
