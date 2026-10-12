"use client";
import { useState } from "react";

export default function NewInvoiceForm({
  jobs,
  action,
}: {
  jobs: { id: number; material: string | null; pickupSite: string | null; dropoffSite: string | null; tonnage: number | null; status: string }[];
  action: (fd: FormData) => Promise<void>;
}) {
  const [jobId, setJobId] = useState<string>("");
  const [direction, setDirection] = useState<string>("outgoing");
  return (
    <section className="card p-5">
      <h2 className="text-base font-semibold text-coal mb-3">Generate invoice from a job</h2>
      <form action={action} className="grid md:grid-cols-4 gap-3 items-end">
        <input type="hidden" name="direction" value={direction} />
        <div className="md:col-span-2">
          <label className="label">Job</label>
          <select
            name="jobId"
            required
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            className="field"
          >
            <option value="">Select a job…</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                #{j.id} · {j.material ?? "load"} · {[j.pickupSite, j.dropoffSite].filter(Boolean).join(" → ") || "route TBC"} [{j.status}]
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Type</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDirection("outgoing")}
              className={
                "text-xs px-3 py-2 rounded border flex-1 " +
                (direction === "outgoing"
                  ? "bg-amber-50 text-amber-800 border-amber-300"
                  : "bg-white text-coal border-dust")
              }
            >
              Us → Haulier
            </button>
            <button
              type="button"
              onClick={() => setDirection("incoming")}
              className={
                "text-xs px-3 py-2 rounded border flex-1 " +
                (direction === "incoming"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                  : "bg-white text-coal border-dust")
              }
            >
              Mine → Us
            </button>
          </div>
        </div>
        <div>
          <button className="btn-primary w-full" disabled={!jobId}>
            Generate invoice
          </button>
        </div>
      </form>
      <p className="text-xs text-steel mt-2">
        Uses the rate defaults from Settings (R/ton-km, margin, VAT, payment terms). Edit lines after generation.
      </p>
    </section>
  );
}
