import { db } from "@/db";
import { companyUsers, companies } from "@/db/schema";
import { eq } from "drizzle-orm";

export const metadata = { title: "People — Admin" };
export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  const people = await db
    .select({
      p: companyUsers,
      c: companies,
    })
    .from(companyUsers)
    .leftJoin(companies, eq(companyUsers.companyId, companies.id))
    .orderBy(companyUsers.name);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">People</h1>
        <p className="text-sm text-steel mt-1">Every contact registered on the platform — haulier account holders and key contacts.</p>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bone text-steel text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Name</th>
              <th className="text-left px-4 py-2 font-medium">Email</th>
              <th className="text-left px-4 py-2 font-medium">Company</th>
              <th className="text-left px-4 py-2 font-medium">Verified</th>
              <th className="text-left px-4 py-2 font-medium">Last login</th>
            </tr>
          </thead>
          <tbody>
            {people.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-sm text-steel">No accounts yet.</td></tr>
            )}
            {people.map(({ p, c }) => (
              <tr key={p.id} className="border-t border-dust">
                <td className="px-4 py-3 font-medium text-ink">{p.name}</td>
                <td className="px-4 py-3 text-coal">{p.email}</td>
                <td className="px-4 py-3 text-steel">{c?.name ?? "—"}</td>
                <td className="px-4 py-3">
                  {p.emailVerified ? (
                    <span className="text-xs rounded-full border px-2 py-0.5 bg-emerald-50 text-emerald-800 border-emerald-200">verified</span>
                  ) : (
                    <span className="text-xs rounded-full border px-2 py-0.5 bg-amber-50 text-amber-800 border-amber-200">unverified</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-steel">
                  {p.lastLoginAt ? new Date(p.lastLoginAt).toLocaleString("en-ZA") : "never"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
