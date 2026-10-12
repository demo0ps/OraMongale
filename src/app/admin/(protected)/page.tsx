import Link from "next/link";
import { db } from "@/db";
import {
  users,
  auditEvents,
  companies,
  trucks,
  mineLeads,
  jobs,
  assignments,
  companyUsers,
} from "@/db/schema";
import { emailOutbox } from "@/db/mail-schema";
import { eq, desc, count, sql, and } from "drizzle-orm";

export const metadata = { title: "Dashboard — OraMongale" };
export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [
    truckCount,
    availableTrucks,
    onJobTrucks,
    companyCount,
    pendingCompanies,
    newLeads,
    openJobs,
    assignedJobs,
    completedJobs,
    queuedEmails,
    peopleCount,
  ] = await Promise.all([
    one(db.select({ c: count() }).from(trucks)),
    one(db.select({ c: count() }).from(trucks).where(eq(trucks.status, "available"))),
    one(db.select({ c: count() }).from(trucks).where(eq(trucks.status, "on_job"))),
    one(db.select({ c: count() }).from(companies)),
    one(db.select({ c: count() }).from(companies).where(eq(companies.status, "pending_review"))),
    one(db.select({ c: count() }).from(mineLeads).where(eq(mineLeads.status, "new"))),
    one(db.select({ c: count() }).from(jobs).where(sql`${jobs.status} IN ('open','matching')`)),
    one(db.select({ c: count() }).from(jobs).where(eq(jobs.status, "assigned"))),
    one(db.select({ c: count() }).from(jobs).where(eq(jobs.status, "completed"))),
    one(db.select({ c: count() }).from(emailOutbox).where(eq(emailOutbox.status, "queued"))),
    one(db.select({ c: count() }).from(companyUsers)),
  ]);

  const recentJobs = await db
    .select()
    .from(jobs)
    .orderBy(desc(jobs.createdAt))
    .limit(5);

  const recentLeads = await db
    .select()
    .from(mineLeads)
    .orderBy(desc(mineLeads.createdAt))
    .limit(5);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Dashboard</h1>
          <p className="text-sm text-steel mt-1">
            Live board — manage trucks, assign jobs and keep hauliers moving.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/jobs" className="btn-primary">+ New job</Link>
          <Link href="/admin/trucks" className="btn-ghost text-sm">+ Add truck</Link>
          <a href="/api/admin/download-db" className="btn-navy text-xs">⬇ DB backup</a>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Trucks total" value={String(truckCount)} href="/admin/trucks" sub={`${availableTrucks} available · ${onJobTrucks} on job`} />
        <Stat label="Jobs" value={String(openJobs + assignedJobs)} href="/admin/jobs" sub={`${openJobs} open · ${assignedJobs} assigned · ${completedJobs} done`} accent />
        <Stat label="Companies" value={String(companyCount)} href="/admin/companies" sub={`${pendingCompanies} pending review`} />
        <Stat label="New leads" value={String(newLeads)} href="/admin/leads" sub={`${peopleCount} people registered`} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-dust">
            <h2 className="text-base font-semibold text-coal">Recent jobs</h2>
            <Link href="/admin/jobs" className="text-xs text-gold hover:underline">Open jobs →</Link>
          </div>
          {recentJobs.length === 0 ? (
            <div className="p-6 text-sm text-steel">No jobs yet — create one from the Jobs page.</div>
          ) : (
            <ul className="divide-y divide-dust">
              {recentJobs.map((j) => (
                <li key={j.id} className="p-4 flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-ink">
                      <span className="font-mono text-xs text-steel mr-2">#{j.id}</span>
                      {j.material ?? "Load"}
                    </div>
                    <div className="text-xs text-coal">
                      {[j.pickupSite, j.dropoffSite].filter(Boolean).join(" → ") || "Route TBC"}
                      {j.requiredTruckType ? ` · ${j.requiredTruckType.replace(/_/g, " ")}` : ""}
                    </div>
                  </div>
                  <span className={
                    "text-[10px] uppercase tracking-wide rounded-full border px-2 py-0.5 " +
                    (j.status === "assigned" || j.status === "in_progress"
                      ? "bg-purple-50 text-purple-800 border-purple-200"
                      : j.status === "completed"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : j.status === "cancelled"
                      ? "bg-red-50 text-red-700 border-red-200"
                      : "bg-amber-50 text-amber-800 border-amber-200")
                  }>
                    {j.status.replace("_", " ")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-dust">
            <h2 className="text-base font-semibold text-coal">Newest leads</h2>
            <Link href="/admin/leads" className="text-xs text-gold hover:underline">View all →</Link>
          </div>
          {recentLeads.length === 0 ? (
            <div className="p-6 text-sm text-steel">No leads yet.</div>
          ) : (
            <ul className="divide-y divide-dust">
              {recentLeads.map((l) => (
                <li key={l.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium text-ink">{l.mineName}</div>
                      <div className="text-xs text-steel">{l.contactName} · {l.contactPhone}</div>
                      <div className="text-sm text-coal mt-1">
                        {[l.material, l.tonnage, l.pickupSite && l.dropoffSite ? `${l.pickupSite} → ${l.dropoffSite}` : l.pickupSite].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                    <span className="text-[10px] uppercase rounded-full bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5">
                      {l.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <QuickCard title="Trucks" to="/admin/trucks" value={String(truckCount)} sub={`${availableTrucks} available right now`} />
        <QuickCard title="Compliance" to="/admin/compliance" value={String(pendingCompanies)} sub={`companies pending review`} tone="amber" />
        <QuickCard title="Mail queue" to="/admin/settings" value={String(queuedEmails)} sub="queued notifications" tone="amber" />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <QuickCard title="Invoices" to="/admin/invoices" value="—" sub="Generate from completed jobs" />
        <QuickCard title="Companies" to="/admin/companies" value={String(companyCount)} sub="registered hauliers" />
        <QuickCard title="People" to="/admin/people" value={String(peopleCount)} sub="haulier accounts" />
      </div>
    </div>
  );
}

async function one<T extends Promise<any[]>>(p: T): Promise<number> {
  const rows = await p;
  return Number((rows[0] as any)?.c ?? 0);
}

function Stat({ label, value, href, sub, accent }: { label: string; value: string; href?: string; sub?: string; accent?: boolean }) {
  const inner = (
    <>
      <div className="text-xs uppercase tracking-wide text-steel">{label}</div>
      <div className={"mt-1 text-3xl font-black " + (accent ? "text-gold" : "text-ink")}>{value}</div>
      {sub && <div className="mt-1 text-[11px] text-steel">{sub}</div>}
    </>
  );
  return (
    <Link href={href ?? "#"} className="card p-5 block hover:border-gold/40 transition-colors">
      {inner}
    </Link>
  );
}

function QuickCard({ title, to, value, sub, tone }: { title: string; to: string; value: string; sub: string; tone?: "amber" }) {
  return (
    <Link href={to} className={"card p-5 block hover:border-gold/40 transition"}>
      <div className="text-xs uppercase tracking-wide text-steel">{title}</div>
      <div className={"mt-1 text-3xl font-black " + (tone === "amber" ? "text-amber-700" : "text-ink")}>{value}</div>
      <div className="mt-1 text-xs text-steel">{sub}</div>
    </Link>
  );
}
