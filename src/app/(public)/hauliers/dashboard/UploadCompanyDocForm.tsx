"use client";

import { useTransition } from "react";
import { useActionState } from "react";
import { uploadCompanyDoc } from "./actions";
import { COMPANY_DOC_TYPES } from "@/lib/constants";

const initialState: { error?: string; ok?: boolean } = {};

export default function UploadCompanyDocForm() {
  const [state, dispatch, pending] = useActionState(uploadCompanyDoc, initialState);
  return (
    <form
      action={dispatch}
      className="grid gap-3 sm:grid-cols-3"
    >
      <div className="sm:col-span-1">
        <label className="label">Document type</label>
        <select name="docType" className="field" required defaultValue="">
          <option value="" disabled>Select…</option>
          {COMPANY_DOC_TYPES.map((d) => (
            <option key={d.key} value={d.key}>{d.label}</option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-1">
        <label className="label">Expiry date (if applicable)</label>
        <input type="date" name="expiryDate" className="field" />
      </div>
      <div className="sm:col-span-1">
        <label className="label">File (PDF/JPG/PNG, max 8MB)</label>
        <input type="file" name="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="field" required />
      </div>
      <div className="sm:col-span-3 flex items-center justify-between">
        <div className="text-xs text-steel">
          COIDA and insurance certificates usually have expiry dates. CIPC
          registration does not.
        </div>
        <button className="btn-primary" disabled={pending}>
          {pending ? "Uploading…" : "Upload"}
        </button>
      </div>
      {state?.error && <p className="sm:col-span-3 text-sm text-red-700">{state.error}</p>}
      {state?.ok && <p className="sm:col-span-3 text-sm text-emerald-700">Uploaded. We will review it shortly.</p>}
    </form>
  );
}
