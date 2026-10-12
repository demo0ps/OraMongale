export const dynamic = "force-dynamic";
import Link from "next/link";
import { db } from "@/db";
import { companies, provinces, companyOperatingProvinces, trucks } from "@/db/schema";
import { eq, count } from "drizzle-orm";

export const metadata = { title: "Companies — Admin" };

export default async function CompaniesPage() {
  const rows = await db.select().from(companies).orderBy(companies.createdAt);
  const truckCounts = await db
    .select({ companyId: trucks.companyId, c: count() })
    .from(trucks)
    .groupBy(trucks.companyId);
  const truckMap = new Map(truckCounts.map((r) => [r.companyId, r.c]));

  const provinceRows = await db
    .select({
      companyId: companyOperatingProvinces.companyId,
      code: provinces.code,
    })
    .from(companyOperatingProvinces)
    .innerJoin(provinces, eq(companyOperatingProvinces.provinceId, provinces.id));
  const provincesByCompany = new Map<number, string[]>();
  for (const r of provinceRows) {
    if (!r.companyId) continue;
    const arr = provincesByCompany.get(r.companyId) ?? [];
    arr.push(r.code);
    provincesByCompany.set(r.companyId, arr);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Companies</h1>
        <p className="text-sm text-steel mt-1">
          Haulier companies registered through the public site. Review documents
          before approving.
        </p>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bone text-steel text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Company</th>
              <th className="text-left px-4 py-2 font-medium">Contact</th>
              <th className="text-left px-4 py-2 font-medium">Provinces</th>
              <th className="text-left px-4 py-2 font-medium">Trucks</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
              <th className="text-left px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-sm text-steel">No companies registered yet.</td></tr>
            )}
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-dust">
                <td className="px-4 py-3">
                  <div className="font-medium text-ink">{c.name}</div>
                  <div className="text-[11px] text-steel">
                    Joined {new Date(c.createdAt).toLocaleDateString("en-ZA")}
                  </div>
                </td>
                <td className="px-4 py-3 text-steel">
                  <div>{c.contactName}</div>
                  <div className="text-xs">{c.contactEmail}</div>
                  <div className="text-xs">{c.contactPhone}</div>
                </td>
                <td className="px-4 py-3 text-xs text-steel">
                  {(provincesByCompany.get(c.id) ?? []).join(", ") || "—"}
                </td>
                <td className="px-4 py-3 text-steel">{truckMap.get(c.id) ?? 0}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      "text-xs rounded-full border px-2 py-0.5 " +
                      (c.status === "approved"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : c.status === "rejected"
                        ? "bg-red-50 text-red-800 border-red-200"
                        : "bg-amber-50 text-amber-800 border-amber-200")
                    }
                  >
                    {c.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/companies/${c.id}`} className="text-gold text-xs hover:underline">
                    Review →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
