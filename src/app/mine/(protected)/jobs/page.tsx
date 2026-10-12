import { db } from "@/db";
import { jobs, assignments, trucks, companies } from "@/db/schema";
import { podUploads } from "@/db/mail-schema";
import { eq, desc, sql } from "drizzle-orm";
import { getMineSession } from "@/lib/mine-auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Live jobs — Mine portal" };
export const dynamic = "force-dynamic";

const statusTone: Record<string, string> = {
  open: "bg-amber-50 text-amber-800 border-amber-200",
  matching: "bg-blue-50 text-blue-800 border-blue-200",
  assigned: "bg-purple-50 text-purple-800 border-purple-200",
  in_progress: "bg-emerald-50 text-emerald-800 border-emerald-200",
  completed: "bg-slate-100 text-slate-700 border-slate-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

export default async function MineJobsPage() {
  const s = await getMineSession();
  if (!s) redirect("/mine/login");
  const mineJobs = await db
    .select({ job: jobs })
    .from(jobs)
    .where(eq(jobs.mineId, s.mineId))
    .orderBy(desc(jobs.createdAt));

  // Pull assignments per job
  const jobIds = mineJobs.map((r) => r.job.id);
  const allAssigns = jobIds.length
    ? await db
        .select({
          a: assignments,
          c: companies,
          t: trucks,
          pods: sql<number>`(select count(*) from pod_uploads where pod_uploads.job_id = ${jobs.id})`,
        })
        .from(assignments)
        .innerJoin(trucks, eq(assignments.truckId, trucks.id))
        .innerJoin(companies, eq(trucks.companyId, companies.id))
        .where(sql`${assignments.jobId} IN (${jobIds.join(",")})`)
    : [];

  const byJob = new Map<number, typeof allAssigns>();
  for (const a of allAssigns) {
    const jid = a.a.jobId!;
    if (!byJob.has(jid)) byJob.set(jid, []);
    byJob.get(jid)!.push(a);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Your live jobs</h1>
        <p className="text-sm text-steel mt-1">
          All haulage jobs OraMongale is running for you. Click a job to see assigned hauliers and latest status.
        </p>
      </div>

      {mineJobs.length === 0 && (
        <div className="card p-8 text-center text-steel">No jobs yet — contact your OraMongale coordinator.</div>
      )}

      <div className="space-y-4">
        {mineJobs.map(({ job: j }) => {
          const ass = byJob.get(j.id) ?? [];
          return (
            <div key={j.id} className="card overflow-hidden">
              <div className="p-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-steel">#{j.id}</span>
                    <span className="font-semibold text-ink">{j.material ?? "Load"}</span>
                    <span className={"text-xs rounded-full border px-2 py-0.5 " + (statusTone[j.status] ?? "")}>{j.status.replace("_", " ")}</span>
                  </div>
                  <div className="text-sm text-coal mt-1">
                    {[j.pickupSite, j.dropoffSite].filter(Boolean).join(" → ") || "Route TBC"}
                    {j.tonnage ? ` · ${j.tonnage} t` : ""}
                    {j.requiredTruckType ? ` · ${j.requiredTruckType.replace(/_/g, " ")}` : ""}
                  </div>
                  {j.startDate && <div className="text-xs text-steel mt-1">Start: {new Date(j.startDate).toLocaleDateString("en-ZA")}</div>}
                  {j.adminNotes && <p className="text-sm text-coal mt-2 italic">{j.adminNotes}</p>}
                </div>
              </div>
              {ass.length > 0 && (
                <div className="border-t border-dust bg-bone/50">
                  <table className="w-full text-sm">
                    <thead className="bg-bone text-steel text-xs uppercase">
                      <tr>
                        <th className="text-left px-4 py-2 font-medium">Haulier</th>
                        <th className="text-left px-4 py-2 font-medium">Truck</th>
                        <th className="text-left px-4 py-2 font-medium">Response</th>
                        <th className="text-left px-4 py-2 font-medium">PODs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ass.map((a) => (
                        <tr key={a.a.id} className="border-t border-dust">
                          <td className="px-4 py-2 font-medium text-ink">{a.c.name}</td>
                          <td className="px-4 py-2 text-steel">
                            {[a.t.make, a.t.model].filter(Boolean).join(" ") || a.t.truckType.replace(/_/g, " ")}
                          </td>
                          <td className="px-4 py-2">
                            <span className={"text-[11px] rounded-full border px-2 py-0.5 " + (a.a.status === "accepted" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : a.a.status === "declined" ? "bg-red-50 text-red-700 border-red-200" : "bg-amber-50 text-amber-800 border-amber-200")}>
                              {a.a.status}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-steel">{Number(a.pods) ?? 0} uploaded</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
