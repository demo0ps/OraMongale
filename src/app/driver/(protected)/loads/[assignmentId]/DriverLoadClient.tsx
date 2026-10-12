"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

const STEPS = [
  { key: "en_route_pickup", label: "En route to pickup" },
  { key: "arrived_pickup", label: "Arrived at pickup" },
  { key: "loading", label: "Loading" },
  { key: "en_route_dropoff", label: "En route to dropoff" },
  { key: "arrived_dropoff", label: "Arrived at dropoff" },
  { key: "delivered", label: "Delivered" },
];

export default function DriverLoadClient({ assignment, job, truck, company, updates, pods }: any) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const current = updates[0]?.status ?? (assignment.status === "accepted" ? "assigned" : job.status);
  const doneSteps = new Set(updates.map((u: any) => u.status));

  async function updateStatus(status: string) {
    setMsg(null);
    start(async () => {
      const fd = new FormData();
      fd.append("jobId", String(job.id));
      fd.append("assignmentId", String(assignment.id));
      fd.append("status", status);
      const r = await fetch("/api/pod/upload", { method: "POST", body: fd });
      if (!r.ok) setMsg("Could not update status");
      else router.refresh();
    });
  }

  async function uploadPod(kind: string, file: File, tons?: string) {
    setMsg(null);
    start(async () => {
      try {
        const pos = await new Promise<GeolocationPosition | null>((res) => {
          if (typeof navigator !== "undefined" && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(res, () => res(null), { timeout: 5000 });
          } else res(null);
        });
        const fd = new FormData();
        fd.append("jobId", String(job.id));
        fd.append("assignmentId", String(assignment.id));
        fd.append("status", "delivered");
        fd.append("kind", kind);
        fd.append("file", file);
        if (tons) fd.append("tons", tons);
        if (pos) {
          fd.append("lat", String(pos.coords.latitude));
          fd.append("lng", String(pos.coords.longitude));
        }
        const r = await fetch("/api/pod/upload", { method: "POST", body: fd });
        if (!r.ok) setMsg("Upload failed — try again");
        else router.refresh();
      } catch (e) {
        setMsg("Upload failed");
      }
    });
  }

  return (
    <div className="space-y-5 pb-10">
      <Link href="/driver/loads" className="text-xs text-bone/70">← Back to loads</Link>
      <div className="rounded-lg bg-gold/10 border border-gold/30 p-4">
        <div className="text-xs uppercase tracking-widest text-gold/90">Job #{job.id} · {company.name}</div>
        <div className="text-2xl font-bold mt-1">{job.material ?? "Load"}</div>
        <div className="text-sm text-bone/90">{[job.pickupSite, job.dropoffSite].filter(Boolean).join(" → ") || "Route TBC"}</div>
        <div className="mt-3 text-xs text-bone/70 grid grid-cols-2 gap-2">
          <div>Truck: <b className="text-white">{[truck.make, truck.model].filter(Boolean).join(" ") || truck.truckType.replace(/_/g, " ")}</b></div>
          {job.startDate && <div>Start: <b className="text-white">{new Date(job.startDate).toLocaleDateString("en-ZA")}</b></div>}
        </div>
      </div>

      <section>
        <h2 className="text-sm uppercase tracking-wider text-bone/70 mb-2">Trip steps</h2>
        <ol className="space-y-2">
          {STEPS.map((s) => {
            const done = doneSteps.has(s.key);
            const isCurrent = current === s.key && !doneSteps.has("delivered");
            return (
              <li key={s.key} className={"rounded-lg p-3 border flex items-center justify-between " + (done ? "bg-emerald-500/10 border-emerald-500/40" : isCurrent ? "bg-gold/10 border-gold/40" : "bg-white/5 border-white/10")}>
                <span className={"text-sm " + (done ? "text-emerald-300" : isCurrent ? "text-gold font-semibold" : "text-bone/80")}>
                  {done ? "✓ " : ""}{s.label}
                </span>
                {!done && (
                  <button onClick={() => updateStatus(s.key)} disabled={pending}
                    className="text-xs px-3 py-1.5 rounded bg-gold text-navy font-bold disabled:opacity-50">
                    {isCurrent ? "Mark now" : "Tap"}
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      <section>
        <h2 className="text-sm uppercase tracking-wider text-bone/70 mb-2">Upload POD</h2>
        <div className="space-y-2">
          <PodUpload label="Weighbridge slip" kind="weighbridge" onUpload={uploadPod} />
          <PodUpload label="Delivery photo" kind="delivery" onUpload={uploadPod} />
        </div>
        <p className="text-[11px] text-bone/50 mt-2">Photos are saved and visible to dispatch and the mine. Location is attached if you allow it.</p>
      </section>

      {pods.length > 0 && (
        <section>
          <h2 className="text-sm uppercase tracking-wider text-bone/70 mb-2">Uploaded</h2>
          <div className="grid grid-cols-3 gap-2">
            {pods.map((p: any) => (
              /\.(jpe?g|png|webp)$/i.test(p.filePath) ? (
                <div key={p.id} className="relative aspect-square rounded overflow-hidden bg-white/5 border border-white/10">
                  <Image src={p.filePath} alt={p.fileName ?? ""} fill unoptimized className="object-cover" sizes="33vw" />
                </div>
              ) : (
                <a key={p.id} href={p.filePath} target="_blank" className="text-xs text-gold underline">{p.fileName}</a>
              )
            ))}
          </div>
        </section>
      )}
      {msg && <div className="text-sm text-red-300">{msg}</div>}
    </div>
  );
}

function PodUpload({ label, kind, onUpload }: { label: string; kind: string; onUpload: (k: string, f: File, tons?: string) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [tons, setTons] = useState("");
  return (
    <div className="rounded-lg bg-white/5 border border-white/10 p-3">
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-medium">{label}</label>
        <label className="text-xs px-3 py-1.5 rounded bg-white/10 cursor-pointer">
          Choose photo
          <input type="file" accept="image/*,application/pdf" capture="environment" className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
      </div>
      {file && (
        <div className="mt-2 flex gap-2 items-center">
          <span className="text-xs text-bone/80 truncate flex-1">{file.name}</span>
          {kind === "weighbridge" && (
            <input value={tons} onChange={(e) => setTons(e.target.value)} inputMode="decimal" placeholder="tons"
              className="w-20 bg-white/10 rounded px-2 py-1 text-sm text-white" />
          )}
          <button onClick={() => onUpload(kind, file, tons || undefined)} className="text-xs px-3 py-1.5 rounded bg-gold text-navy font-bold">Upload</button>
        </div>
      )}
    </div>
  );
}
