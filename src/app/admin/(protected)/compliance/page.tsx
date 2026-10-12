import Link from "next/link";
import { db } from "@/db";
import { complianceDocs, companies, trucks } from "@/db/schema";
import { eq, isNotNull, desc, and } from "drizzle-orm";

export const metadata = { title: "Compliance — Admin" };
export const dynamic = "force-dynamic";

type Bucket = "expired" | "days30" | "days60" | "days90" | "ok" | "no_expiry";

type Row = {
  id: number;
  docType: string;
  company: { id: number; name: string };
  truck: { id: number | null; label: string | null } | null;
  expiryDate: string | null;
  status: string;
  bucket: Bucket;
  daysUntil: number | null;
};

function docTypeLabel(t: string) {
  const map: Record<string, string> = {
    cipc: "CIPC registration",
    coida: "COIDA letter of good standing",
    liability_insurance: "Public liability insurance",
    git: "Goods-in-transit insurance",
    license_disc: "Vehicle license disc",
    roadworthy: "Roadworthy certificate",
    operator_card: "Operator card",
    nlta_permit: "NLTA operating permit",
  };
  return map[t] ?? t.replace(/_/g, " ");
}

export default async function CompliancePage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const docs = await db
    .select({
      id: complianceDocs.id,
      docType: complianceDocs.docType,
      expiryDate: complianceDocs.expiryDate,
      status: complianceDocs.status,
      companyId: companies.id,
      companyName: companies.name,
      truckId: trucks.id,
      truckMake: trucks.make,
      truckModel: trucks.model,
      truckType: trucks.truckType,
      truckBase: trucks.baseLocation,
    })
    .from(complianceDocs)
    .innerJoin(companies, eq(complianceDocs.companyId, companies.id))
    .leftJoin(trucks, eq(complianceDocs.truckId, trucks.id))
    .orderBy(desc(complianceDocs.expiryDate));

  const rows: Row[] = docs.map((d) => {
    let bucket: Bucket = "no_expiry";
    let daysUntil: number | null = null;
    if (d.expiryDate) {
      const exp = new Date(d.expiryDate);
      exp.setHours(0, 0, 0, 0);
      daysUntil = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntil < 0) bucket = "expired";
      else if (daysUntil <= 30) bucket = "days30";
      else if (daysUntil <= 60) bucket = "days60";
      else if (daysUntil <= 90) bucket = "days90";
      else bucket = "ok";
    }
    return {
      id: d.id,
      docType: d.docType,
      company: { id: d.companyId, name: d.companyName },
      truck: d.truckId
        ? {
            id: d.truckId,
            label: [d.truckMake, d.truckModel].filter(Boolean).join(" ") || (d.truckType ?? ""),
          }
        : null,
      expiryDate: d.expiryDate,
      status: d.status,
      bucket,
      daysUntil,
    };
  });

  const counts = {
    expired: rows.filter((r) => r.bucket === "expired").length,
    days30: rows.filter((r) => r.bucket === "days30").length,
    days60: rows.filter((r) => r.bucket === "days60").length,
    days90: rows.filter((r) => r.bucket === "days90").length,
    no_expiry: rows.filter((r) => r.bucket === "no_expiry").length,
    ok: rows.filter((r) => r.bucket === "ok").length,
    pending: rows.filter((r) => r.status === "pending").length,
  };

  const buckets: { key: Bucket; title: string; tone: string; subtitle: string }[] = [
    { key: "expired", title: "Expired", tone: "bg-red-600 text-white", subtitle: "Needs attention today" },
    { key: "days30", title: "Next 30 days", tone: "bg-amber-500 text-white", subtitle: "Renew now" },
    { key: "days60", title: "30–60 days", tone: "bg-amber-300 text-amber-900", subtitle: "On the radar" },
    { key: "days90", title: "60–90 days", tone: "bg-blue-100 text-blue-800", subtitle: "Upcoming" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Compliance</h1>
        <p className="text-sm text-steel mt-1">
          Every company and truck document with an expiry date. Act on red and amber before trucks get turned away at the gate.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatTile tone="bg-red-600 text-white" label="Expired" value={counts.expired} />
        <StatTile tone="bg-amber-500 text-white" label="≤ 30 days" value={counts.days30} />
        <StatTile tone="bg-amber-200 text-amber-900" label="30–60 days" value={counts.days60} />
        <StatTile tone="bg-blue-100 text-blue-800" label="60–90 days" value={counts.days90} />
        <StatTile tone="bg-emerald-50 text-emerald-800" label="In date" value={counts.ok} />
      </div>

      {buckets.map((b) => {
        const items = rows.filter((r) => r.bucket === b.key);
        if (items.length === 0) return null;
        return (
          <section key={b.key} className="card overflow-hidden">
            <div className={"px-4 py-3 flex items-center justify-between " + b.tone}>
              <h2 className="font-semibold">{b.title} <span className="font-normal opacity-80 text-sm">· {b.subtitle}</span></h2>
              <span className="text-sm font-semibold">{items.length}</span>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-bone text-steel text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Company</th>
                  <th className="text-left px-4 py-2 font-medium">Document</th>
                  <th className="text-left px-4 py-2 font-medium">Truck</th>
                  <th className="text-left px-4 py-2 font-medium">Expires</th>
                  <th className="text-left px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id} className="border-t border-dust">
                    <td className="px-4 py-2">
                      <Link href={`/admin/companies`} className="font-medium text-ink hover:text-gold">
                        {r.company.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-coal">{docTypeLabel(r.docType)}</td>
                    <td className="px-4 py-2 text-steel">{r.truck?.label ?? "— (company level)"}</td>
                    <td className="px-4 py-2">
                      <div className="text-coal">
                        {r.expiryDate ? new Date(r.expiryDate).toLocaleDateString("en-ZA") : "—"}
                      </div>
                      {r.daysUntil !== null && (
                        <div className="text-[11px] text-steel">
                          {r.daysUntil < 0
                            ? `${-r.daysUntil} days ago`
                            : `in ${r.daysUntil} days`}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={
                          "text-[11px] rounded-full border px-2 py-0.5 " +
                          (r.status === "verified"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : r.status === "rejected"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-amber-50 text-amber-800 border-amber-200")
                        }
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        );
      })}

      {counts.expired === 0 && counts.days30 === 0 && counts.days60 === 0 && counts.days90 === 0 && (
        <div className="card p-8 text-center text-emerald-700 bg-emerald-50/40 border-emerald-200">
          ✓ All compliance documents are in date (or have no expiry).
        </div>
      )}
    </div>
  );
}

function StatTile({ tone, label, value }: { tone: string; label: string; value: number }) {
  return (
    <div className={"rounded-lg p-4 " + tone}>
      <div className="text-2xl font-black">{value}</div>
      <div className="text-xs uppercase tracking-wide opacity-80">{label}</div>
    </div>
  );
}
