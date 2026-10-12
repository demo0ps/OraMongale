import { db } from "@/db";
import {
  companies,
  companyUsers,
  trucks,
  jobs,
  assignments,
  mineLeads,
  mines,
  provinces,
} from "@/db/schema";
import { emailOutbox } from "@/db/mail-schema";
import { eq, desc, like, or, sql, and } from "drizzle-orm";
import type { AssignmentWithDetails, JobWithAssignments, SearchResult } from "./types";

export async function getJobWithAssignments(
  jobId: number,
): Promise<JobWithAssignments | null> {
  const rows = await db
    .select({
      job: jobs,
      assignment: assignments,
      company: companies,
      truck: trucks,
      mine: mines,
      lead: mineLeads,
    })
    .from(jobs)
    .leftJoin(mineLeads, eq(jobs.leadId, mineLeads.id))
    .leftJoin(mines, eq(jobs.mineId, mines.id))
    .leftJoin(assignments, eq(assignments.jobId, jobs.id))
    .leftJoin(trucks, eq(assignments.truckId, trucks.id))
    .leftJoin(companies, eq(trucks.companyId, companies.id))
    .where(eq(jobs.id, jobId));

  if (rows.length === 0 || !rows[0]?.job) return null;
  const first = rows[0];
  const job = first.job;
  const out: JobWithAssignments = {
    id: job.id,
    description: job.description,
    pickupSite: job.pickupSite,
    dropoffSite: job.dropoffSite,
    material: job.material,
    tonnage: job.tonnage,
    requiredTruckType: job.requiredTruckType,
    requiredTruckCount: job.requiredTruckCount,
    startDate: job.startDate,
    status: job.status,
    adminNotes: job.adminNotes,
    createdAt: job.createdAt,
    mine: first.mine
      ? { id: first.mine.id, name: first.mine.name }
      : null,
    lead: first.lead
      ? {
          id: first.lead.id,
          mineName: first.lead.mineName,
          contactName: first.lead.contactName,
          contactPhone: first.lead.contactPhone,
          contactEmail: first.lead.contactEmail,
        }
      : null,
    assignments: [],
  };
  for (const r of rows) {
    if (!r.assignment || !r.company) continue;
    const a = r.assignment;
    out.assignments.push({
      id: a.id,
      truckId: a.truckId,
      companyId: r.company.id,
      status: a.status as AssignmentWithDetails["status"],
      companyResponseNote: a.companyResponseNote,
      createdAt: a.createdAt,
      contactName: null,
      company: {
        id: r.company.id,
        name: r.company.name,
        contactEmail: r.company.contactEmail,
        contactName: r.company.contactName,
        contactPhone: r.company.contactPhone,
      },
      truck: r.truck
        ? {
            id: r.truck.id,
            truckType: r.truck.truckType,
            make: r.truck.make,
            model: r.truck.model,
            baseLocation: r.truck.baseLocation,
            status: r.truck.status,
            registration: (r.truck as { registration?: string | null }).registration ?? null,
          }
        : null,
    });
  }
  return out;
}

export async function listJobs() {
  return db
    .select({
      id: jobs.id,
      material: jobs.material,
      pickupSite: jobs.pickupSite,
      dropoffSite: jobs.dropoffSite,
      tonnage: jobs.tonnage,
      requiredTruckType: jobs.requiredTruckType,
      requiredTruckCount: jobs.requiredTruckCount,
      startDate: jobs.startDate,
      status: jobs.status,
      createdAt: jobs.createdAt,
      assignedCount: sql<number>`(select count(*) from assignments where assignments.job_id = jobs.id)`,
    })
    .from(jobs)
    .orderBy(desc(jobs.createdAt));
}

export async function listAvailableTrucks() {
  return db
    .select({
      id: trucks.id,
      truckType: trucks.truckType,
      make: trucks.make,
      model: trucks.model,
      year: trucks.year,
      capacityTons: trucks.capacityTons,
      baseLocation: trucks.baseLocation,
      status: trucks.status,
      companyId: trucks.companyId,
      companyName: companies.name,
      companyContactEmail: companies.contactEmail,
      companyContactName: companies.contactName,
    })
    .from(trucks)
    .innerJoin(companies, eq(trucks.companyId, companies.id))
    .where(sql`${trucks.status} IN ('available','on_job')`)
    .orderBy(companies.name, trucks.truckType);
}

export async function globalSearch(q: string): Promise<SearchResult[]> {
  const needle = `%${q.trim()}%`;
  if (!q.trim()) return [];
  const results: SearchResult[] = [];

  const truckRows = await db
    .select({
      id: trucks.id,
      type: trucks.truckType,
      make: trucks.make,
      model: trucks.model,
      base: trucks.baseLocation,
      status: trucks.status,
      company: companies.name,
    })
    .from(trucks)
    .leftJoin(companies, eq(trucks.companyId, companies.id))
    .where(
      or(
        like(trucks.truckType, needle),
        like(trucks.make ?? "", needle),
        like(trucks.model ?? "", needle),
        like(trucks.baseLocation ?? "", needle),
        like(companies.name, needle),
      ),
    )
    .limit(8);
  for (const r of truckRows) {
    results.push({
      kind: "truck",
      id: r.id,
      title: `${r.make ?? ""} ${r.model ?? ""}`.trim() || r.type.replace(/_/g, " "),
      subtitle: `${r.type.replace(/_/g, " ")} · ${r.company ?? "—"}${r.base ? " · " + r.base : ""}`,
      status: r.status,
      href: `/admin/trucks`,
    });
  }

  const companyRows = await db
    .select()
    .from(companies)
    .where(
      or(
        like(companies.name, needle),
        like(companies.contactName, needle),
        like(companies.contactEmail, needle),
        like(companies.contactPhone, needle),
      ),
    )
    .limit(8);
  for (const c of companyRows) {
    results.push({
      kind: "company",
      id: c.id,
      title: c.name,
      subtitle: `${c.contactName} · ${c.contactEmail} · ${c.contactPhone}`,
      status: c.status,
      href: `/admin/companies`,
    });
  }

  const peopleRows = await db
    .select()
    .from(companyUsers)
    .where(
      or(
        like(companyUsers.name, needle),
        like(companyUsers.email, needle),
      ),
    )
    .limit(8);
  for (const p of peopleRows) {
    results.push({
      kind: "person",
      id: p.id,
      title: p.name,
      subtitle: p.email,
      status: p.emailVerified ? "verified" : "unverified",
      href: `/admin/people`,
    });
  }

  const jobRows = await db
    .select()
    .from(jobs)
    .where(
      or(
        like(jobs.material ?? "", needle),
        like(jobs.pickupSite ?? "", needle),
        like(jobs.dropoffSite ?? "", needle),
        like(jobs.description ?? "", needle),
      ),
    )
    .limit(8);
  for (const j of jobRows) {
    results.push({
      kind: "job",
      id: j.id,
      title: `Job #${j.id} · ${j.material ?? "Load"}`,
      subtitle: ([j.pickupSite, j.dropoffSite].filter(Boolean).join(" → ") || j.description) ?? "",
      status: j.status,
      href: `/admin/jobs`,
    });
  }

  const leadRows = await db
    .select()
    .from(mineLeads)
    .where(
      or(
        like(mineLeads.mineName, needle),
        like(mineLeads.contactName, needle),
        like(mineLeads.contactPhone, needle),
        like(mineLeads.contactEmail ?? "", needle),
        like(mineLeads.material ?? "", needle),
      ),
    )
    .limit(6);
  for (const l of leadRows) {
    results.push({
      kind: "lead",
      id: l.id,
      title: l.mineName,
      subtitle: `${l.contactName} · ${l.contactPhone}`,
      status: l.status,
      href: `/admin/leads`,
    });
  }

  const mineRows = await db
    .select()
    .from(mines)
    .where(
      or(
        like(mines.name, needle),
        like(mines.contactName ?? "", needle),
        like(mines.contactPhone ?? "", needle),
        like(mines.contactEmail ?? "", needle),
      ),
    )
    .limit(6);
  for (const m of mineRows) {
    results.push({
      kind: "mine",
      id: m.id,
      title: m.name,
      subtitle: [m.contactName, m.contactPhone, m.siteAddress].filter(Boolean).join(" · "),
      status: null,
      href: `/admin/jobs`,
    });
  }

  return results.slice(0, 24);
}

export async function listEmails() {
  return db
    .select()
    .from(emailOutbox)
    .orderBy(desc(emailOutbox.createdAt))
    .limit(50);
}
