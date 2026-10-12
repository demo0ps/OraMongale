import { db } from "@/db";
import { jobs, assignments, trucks, companies } from "@/db/schema";
import { podUploads, tripUpdates, drivers } from "@/db/mail-schema";
import { eq, and, desc } from "drizzle-orm";
import { getDriverSession } from "@/lib/driver-auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import DriverLoadClient from "./DriverLoadClient";

export const dynamic = "force-dynamic";

export default async function LoadDetail({ params }: { params: Promise<{ assignmentId: string }> }) {
  const s = await getDriverSession();
  if (!s) redirect("/driver/login");
  const { assignmentId } = await params;
  const row = (await db
    .select({ a: assignments, j: jobs, t: trucks, c: companies })
    .from(assignments)
    .innerJoin(trucks, eq(assignments.truckId, trucks.id))
    .innerJoin(jobs, eq(assignments.jobId, jobs.id))
    .innerJoin(companies, eq(trucks.companyId, companies.id))
    .where(and(eq(assignments.id, Number(assignmentId)), eq(trucks.companyId, s.companyId)))
    .limit(1))[0];
  if (!row) return notFound();

  const updates = await db
    .select()
    .from(tripUpdates)
    .where(eq(tripUpdates.jobId, row.j.id))
    .orderBy(desc(tripUpdates.createdAt))
    .limit(20);

  const pods = await db
    .select()
    .from(podUploads)
    .where(eq(podUploads.jobId, row.j.id))
    .orderBy(desc(podUploads.createdAt));

  return (
    <DriverLoadClient
      assignment={row.a}
      job={row.j}
      truck={row.t}
      company={row.c}
      updates={updates}
      pods={pods}
      driverName={s.name}
    />
  );
}
