import Link from "next/link";
import { db } from "@/db";
import { jobs, assignments, trucks, companies } from "@/db/schema";
import { tripUpdates } from "@/db/mail-schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { getDriverSession } from "@/lib/driver-auth";
import { redirect } from "next/navigation";

export const metadata = { title: "My loads" };
export const dynamic = "force-dynamic";

const statusLabel: Record<string, string> = {
  open: "Offered",
  matching: "Matching",
  assigned: "Assigned",
  in_progress: "On the road",
  completed: "Delivered",
  cancelled: "Cancelled",
};
const tone: Record<string, string> = {
  open: "bg-amber-50 text-amber-800",
  matching: "bg-blue-50 text-blue-800",
  assigned: "bg-purple-50 text-purple-800",
  in_progress: "bg-emerald-50 text-emerald-800",
  completed: "bg-slate-100 text-slate-700",
  cancelled: "bg-red-50 text-red-700",
};

export default async function DriverLoadsPage() {
  const s = await getDriverSession();
  if (!s) redirect("/driver/login");

  // Find the trucks belonging to this driver's company, then jobs assigned to them.
  const rows = await db
    .select({ j: jobs, a: assignments, t: trucks, c: companies })
    .from(assignments)
    .innerJoin(trucks, eq(assignments.truckId, trucks.id))
    .innerJoin(jobs, eq(assignments.jobId, jobs.id))
    .innerJoin(companies, eq(trucks.companyId, companies.id))
    .where(and(eq(trucks.companyId, s.companyId), sql`${jobs.status} NOT IN ('cancelled')`))
    .orderBy(desc(jobs.createdAt));

  // Driver sees all loads for their company (simple PWA for v1 — drivers tap their own)
  const latestByJob = new Map<number, { status: string }>();
  const tups = await db
    .select({ jobId: tripUpdates.jobId, status: tripUpdates.status, createdAt: tripUpdates.createdAt })
    .from(tripUpdates)
    .where(eq(tripUpdates.driverId, s.driverId))
    .orderBy(desc(tripUpdates.createdAt));
  for (const t of tups) if (!latestByJob.has(t.jobId!)) latestByJob.set(t.jobId!, { status: t.status });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">My loads</h1>
      {rows.length === 0 && (
        <div className="rounded-lg bg-white/5 border border-white/10 p-6 text-center text-bone/70">
          No loads assigned yet. Dispatch will send offers via email and they will appear here once accepted.
        </div>
      )}
      {rows.map(({ j, a, t }) => {
        const driverStatus = latestByJob.get(j.id)?.status;
        const effective = driverStatus ?? (a.status === "accepted" ? "assigned" : j.status);
        return (
          <Link key={a.id} href={`/driver/loads/${a.id}`} className="block rounded-lg bg-white/5 border border-white/10 p-4 active:bg-white/10">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-xs text-bone/60">Job #{j.id} · {t.make} {t.model}</div>
                <div className="font-bold text-lg mt-1">{j.material ?? "Load"}</div>
                <div className="text-sm text-bone/80">
                  {[j.pickupSite, j.dropoffSite].filter(Boolean).join(" → ") || "Route TBC"}
                </div>
                {j.startDate && <div className="text-xs text-bone/60 mt-1">Start {new Date(j.startDate).toLocaleDateString("en-ZA")}</div>}
              </div>
              <span className={"text-[10px] uppercase rounded-full px-2 py-1 " + (tone[effective] ?? "bg-white/10 text-bone")}>
                {(statusLabel[effective] ?? effective).replace("_", " ")}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
