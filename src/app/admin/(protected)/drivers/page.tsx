import { db } from "@/db";
import { drivers } from "@/db/mail-schema";
import { companies } from "@/db/schema";
import { eq } from "drizzle-orm";
import { addDriver } from "./actions";
import AddDriverForm from "./AddDriverForm";

export const metadata = { title: "Drivers — Admin" };
export const dynamic = "force-dynamic";

export default async function DriversPage() {
  const rows = await db
    .select({ d: drivers, c: companies })
    .from(drivers)
    .innerJoin(companies, eq(drivers.companyId, companies.id))
    .orderBy(companies.name, drivers.name);
  const companyList = await db.select().from(companies).orderBy(companies.name);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Drivers</h1>
        <p className="text-sm text-steel mt-1">Add drivers here; they sign into the driver PWA with their phone + 4-digit PIN.</p>
      </div>
      <section className="card p-5">
        <h2 className="text-base font-semibold text-coal mb-3">Add driver</h2>
        <AddDriverForm companies={companyList} action={addDriver} />
        <p className="text-xs text-steel mt-2">Share <code>/driver/login</code> with drivers. They open it on their phone, enter their number and PIN.</p>
      </section>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bone text-steel text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Name</th>
              <th className="text-left px-4 py-2 font-medium">Phone</th>
              <th className="text-left px-4 py-2 font-medium">Company</th>
              <th className="text-left px-4 py-2 font-medium">Last login</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={4} className="p-6 text-steel text-sm">No drivers yet.</td></tr>}
            {rows.map(({ d, c }) => (
              <tr key={d.id} className="border-t border-dust">
                <td className="px-4 py-2 font-medium text-ink">{d.name}</td>
                <td className="px-4 py-2 text-coal">{d.phone}</td>
                <td className="px-4 py-2 text-steel">{c.name}</td>
                <td className="px-4 py-2 text-xs text-steel">{d.lastLoginAt ? new Date(d.lastLoginAt).toLocaleString("en-ZA") : "never"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
