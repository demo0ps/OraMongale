import { db } from "@/db";
import { companies, jobs, mines, trucks, assignments } from "@/db/schema";
import { podUploads, drivers } from "@/db/mail-schema";
import { invoices } from "@/db/ops-schema";
import { count, eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const totalJobs = db.select({ c: count() }).from(jobs).get()!.c;
  const activeJobs = db.select({ c: count() }).from(jobs).where(eq(jobs.status, "in_progress")).get()!.c;
  const completedJobs = db.select({ c: count() }).from(jobs).where(eq(jobs.status, "completed")).get()!.c;
  const minesCount = db.select({ c: count() }).from(mines).get()!.c;
  const totalRevenue = Number(db.get<{ total: number }>(sql`SELECT coalesce(sum(total),0) as total FROM invoices WHERE direction='incoming'`)?.total || 0);
  const driverCount = db.select({ c: count() }).from(drivers).get()!.c;
  const truckCount = db.select({ c: count() }).from(trucks).get()!.c;
  const podsPending = db.select({ c: count() }).from(podUploads).get()!.c;

  const haulierPerf: { id: number; name: string; assigned: number; accepted: number; declined: number }[] = db.all(
    sql`SELECT c.id, c.name,
              count(a.id) as assigned,
              sum(CASE WHEN a.status='accepted' THEN 1 ELSE 0 END) as accepted,
              sum(CASE WHEN a.status='declined' THEN 1 ELSE 0 END) as declined
         FROM companies c
         LEFT JOIN trucks t ON t.company_id = c.id
         LEFT JOIN assignments a ON a.truck_id = t.id
         GROUP BY c.id, c.name
         ORDER BY accepted DESC
         LIMIT 8`
  );

  const materialVolumes: { material: string; totalTonnage: number }[] = db.all(
    sql`SELECT material, coalesce(sum(tonnage),0) as totalTonnage FROM jobs WHERE tonnage IS NOT NULL AND material IS NOT NULL GROUP BY material ORDER BY totalTonnage DESC LIMIT 8`
  );
  const maxVol = Math.max(1, ...materialVolumes.map(v => Number(v.totalTonnage) || 0));

  const fmtMoney = (n: number) => "R " + (Number(n) || 0).toLocaleString("en-ZA", { minimumFractionDigits: 0 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black">Broker Intelligence</h1>
          <p className="text-slate-400">Margin, volumes, haulier performance.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="Total jobs" value={String(totalJobs)} accent="black" />
        <KPI label="Active jobs" value={String(activeJobs)} accent="gold" />
        <KPI label="Completed jobs" value={String(completedJobs)} accent="dark" />
        <KPI label="Total invoiced (mine)" value={fmtMoney(totalRevenue)} accent="black" />
        <KPI label="Mines / clients" value={String(minesCount)} accent="dark" />
        <KPI label="Trucks on roster" value={String(truckCount)} accent="gold" />
        <KPI label="Active drivers" value={String(driverCount)} accent="black" />
        <KPI label="PODs uploaded" value={String(podsPending)} accent="dark" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="section-title">Volumes by commodity</h2>
          {materialVolumes.length === 0 ? (
            <p className="empty-state">No tonnage data yet.</p>
          ) : (
            <div className="space-y-3 mt-3">
              {materialVolumes.map(v => (
                <div key={v.material}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium capitalize">{v.material}</span>
                    <span className="text-slate-400">{Number(v.totalTonnage).toLocaleString()} t</span>
                  </div>
                  <div className="h-3 rounded bg-slate-800 overflow-hidden">
                    <div className="h-full bg-[var(--accent)]" style={{ width: `${(Number(v.totalTonnage) / maxVol) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="section-title">Haulier performance</h2>
          <div className="overflow-x-auto mt-2">
            <table className="table">
              <thead>
                <tr><th>Haulier</th><th>Assigned</th><th>Accepted</th><th>Declined</th></tr>
              </thead>
              <tbody>
                {haulierPerf.map(h => (
                  <tr key={h.id}>
                    <td>{h.name}</td>
                    <td>{Number(h.assigned)}</td>
                    <td className="text-green-400">{Number(h.accepted)}</td>
                    <td className="text-red-400">{Number(h.declined)}</td>
                  </tr>
                ))}
                {haulierPerf.length === 0 && <tr><td colSpan={4} className="empty-state">No assignments yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPI({ label, value, accent }: { label: string; value: string; accent: "black" | "gold" | "dark" }) {
  const bg = accent === "black" ? "bg-black" : accent === "gold" ? "bg-[var(--accent)] text-black" : "bg-slate-900";
  return (
    <div className={`card ${bg} !p-4`}>
      <div className={`text-xs uppercase tracking-wider ${accent === "gold" ? "text-black/70" : "text-slate-400"}`}>{label}</div>
      <div className={`text-2xl font-black mt-1 ${accent === "gold" ? "text-black" : ""}`}>{value}</div>
    </div>
  );
}
