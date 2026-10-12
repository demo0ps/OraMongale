"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function SeedDemoButton({ action }: { action: () => Promise<{ ok?: boolean; skipped?: boolean; error?: string }> }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <div className="card">
      <h2 className="section-title">Demo data</h2>
      <p className="text-sm text-steel mt-1 mb-3">
        Populate the system with demo mines, hauliers, trucks, drivers, jobs,
        PODs and invoices so you can walk the console end-to-end. Runs
        once — won&rsquo;t overwrite any real data you add.
      </p>
      <button
        className="btn-primary"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setMsg(null);
            const r = await action();
            if (r.error) setMsg("Error: " + r.error);
            else if (r.skipped) setMsg("Demo data already loaded.");
            else { setMsg("Demo data loaded ✓"); router.refresh(); }
          })
        }
      >
        {pending ? "Loading…" : "Load demo data"}
      </button>
      {msg && <span className="ml-3 text-sm text-slate-600">{msg}</span>}
    </div>
  );
}
