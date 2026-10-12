import { db } from "@/db";
import { companies, trucks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { addTruck } from "../actions";

export const metadata = { title: "Trucks — Admin" };
export const dynamic = "force-dynamic";

export default async function TrucksPage() {
  const rows = await db
    .select({
      truck: trucks,
      company: companies,
    })
    .from(trucks)
    .innerJoin(companies, eq(trucks.companyId, companies.id))
    .orderBy(companies.name, trucks.truckType);

  const companyList = await db.select().from(companies).orderBy(companies.name);

  const statusTone: Record<string, string> = {
    available: "bg-emerald-50 text-emerald-800 border-emerald-200",
    on_job: "bg-blue-50 text-blue-800 border-blue-200",
    docs_pending: "bg-amber-50 text-amber-800 border-amber-200",
    docs_expired: "bg-red-50 text-red-800 border-red-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Trucks</h1>
        <p className="text-sm text-steel mt-1">
          All trucks across every haulier company. Add manually or approve submissions from hauliers.
        </p>
      </div>

      <section className="card p-5">
        <h2 className="text-base font-semibold text-coal mb-3">Add a truck</h2>
        <form action={addTruck} className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="col-span-2 md:col-span-1">
            <label className="label">Company</label>
            <select name="companyId" required className="field">
              <option value="">Select…</option>
              {companyList.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Truck type</label>
            <select name="truckType" className="field">
              {[
                "tipper",
                "interlink_tipper",
                "side_tipper",
                "superlink",
                "flat_deck",
                "lowbed",
                "water_tanker",
                "fuel_tanker",
              ].map((t) => (
                <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
          <Field label="Make" name="make" placeholder="MAN" />
          <Field label="Model" name="model" placeholder="TGS 26.440" />
          <Field label="Year" name="year" type="number" placeholder="2020" />
          <Field label="Capacity (t)" name="capacityTons" type="number" placeholder="34" />
          <Field label="Registration" name="registration" placeholder="FN 12 XY GP" />
          <Field label="Base location" name="baseLocation" placeholder="Witbank" />
          <div className="col-span-2 md:col-span-4 flex justify-end">
            <button className="btn-primary">Add truck</button>
          </div>
        </form>
      </section>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bone text-steel text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2 font-medium">#</th>
              <th className="text-left px-4 py-2 font-medium">Company</th>
              <th className="text-left px-4 py-2 font-medium">Truck</th>
              <th className="text-left px-4 py-2 font-medium">Cap</th>
              <th className="text-left px-4 py-2 font-medium">Base</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-sm text-steel">No trucks yet — add one or wait for hauliers to submit.</td></tr>
            )}
            {rows.map(({ truck: t, company: c }) => (
              <tr key={t.id} className="border-t border-dust">
                <td className="px-4 py-3 font-mono text-xs text-steel">{t.id}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-ink">{c.name}</div>
                  <div className="text-[11px] text-steel">{c.contactName}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-ink">{t.make} {t.model}</div>
                  <div className="text-[11px] text-steel">
                    {t.truckType.replace(/_/g, " ")}
                    {t.year ? ` · ${t.year}` : ""}
                  </div>
                </td>
                <td className="px-4 py-3 text-coal">{t.capacityTons ? t.capacityTons + "t" : "—"}</td>
                <td className="px-4 py-3 text-steel">{t.baseLocation ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={"text-xs rounded-full border px-2 py-0.5 " + (statusTone[t.status] ?? "")}>
                    {t.status.replace("_", " ")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({ label, name, type = "text", placeholder }: { label: string; name: string; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input name={name} type={type} placeholder={placeholder} className="field" />
    </div>
  );
}
