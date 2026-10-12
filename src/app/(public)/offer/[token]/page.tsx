import { db } from "@/db";
import { assignmentInvites } from "@/db/mail-schema";
import { assignments, jobs, trucks, companies } from "@/db/schema";
import { eq } from "drizzle-orm";
import OfferClient from "./OfferClient";
import { respondToOffer } from "./actions";

export const dynamic = "force-dynamic";

export default async function OfferPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ action?: string; responded?: string; note?: string }>;
}) {
  const { token } = await params;
  const sp = await searchParams;

  const row = (await db
    .select({ inv: assignmentInvites, a: assignments, j: jobs, t: trucks, c: companies })
    .from(assignmentInvites)
    .innerJoin(assignments, eq(assignmentInvites.assignmentId, assignments.id))
    .innerJoin(jobs, eq(assignments.jobId, jobs.id))
    .leftJoin(trucks, eq(assignments.truckId, trucks.id))
    .innerJoin(companies, eq(trucks.companyId, companies.id))
    .where(eq(assignmentInvites.token, token))
    .limit(1))[0];

  if (!row) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-bone">
        <div className="card p-8 max-w-md text-center">
          <h1 className="text-xl font-semibold text-ink">Invalid link</h1>
          <p className="text-sm text-steel mt-2">
            This offer link isn't valid. It may have been revoked or the URL is incomplete.
          </p>
        </div>
      </div>
    );
  }

  const expired = new Date(row.inv.expiresAt) < new Date() && row.inv.status === "pending";
  const already = row.inv.status !== "pending";

  return (
    <OfferClient
      action={respondToOffer}
      token={token}
      invite={{
        company: row.c.name,
        toName: row.inv.toName,
        toEmail: row.inv.toEmail,
        status: row.inv.status,
        responded: sp.responded ?? null,
        expired,
        already,
        job: {
          id: row.j.id,
          material: row.j.material,
          pickupSite: row.j.pickupSite,
          dropoffSite: row.j.dropoffSite,
          tonnage: row.j.tonnage,
          requiredTruckType: row.j.requiredTruckType,
          requiredTruckCount: row.j.requiredTruckCount,
          startDate: row.j.startDate,
        },
        truck: row.t ? { make: row.t.make, model: row.t.model, type: row.t.truckType, base: row.t.baseLocation } : null,
      }}
    />
  );
}
