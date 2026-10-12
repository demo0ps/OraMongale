import { getMinerals } from "@/lib/minerals";
import { addMineral, updateMineral, toggleMineral, deleteMineral } from "./actions";

export const metadata = { title: "Minerals & Rates — Admin" };
export const dynamic = "force-dynamic";

function fmtZAR(n: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 2,
  }).format(n);
}

export default async function MineralsPage() {
  const all = await getMinerals(true);
  const active = all.filter((m) => !m.archived);
  const archived = all.filter((m) => m.archived);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-coal">Minerals & base rates</h1>
        <p className="text-sm text-steel mt-1 max-w-xl">
          Add the minerals/commodities you haul and their standard R/ton base
          rate. The mineral list is used when creating new jobs.
        </p>
      </div>

      <form
        action={addMineral}
        className="rounded-lg border border-dust bg-white p-4 grid gap-3 sm:grid-cols-[1fr_180px_auto] items-end"
      >
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-steel">New mineral</span>
          <input
            name="name"
            required
            placeholder="e.g. Anthracite, Magnetite..."
            className="field"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-steel">Base rate (R/ton)</span>
          <input name="ratePerTon" type="number" min={0} step="0.01" defaultValue={0} className="field" />
        </label>
        <button className="btn-primary whitespace-nowrap">Add mineral</button>
      </form>

      <div className="rounded-lg border border-dust bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[640px] w-full text-sm">
            <thead className="bg-bone text-steel text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-2">Mineral</th>
                <th className="text-right px-4 py-2 w-48">Base rate (R/ton)</th>
                <th className="text-right px-4 py-2 w-80">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dust">
              {active.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-steel italic">
                    No minerals yet — add one above.
                  </td>
                </tr>
              )}
              {active.map((m) => (
                <MineralRow key={m.id} m={m} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {archived.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-steel uppercase tracking-wide mb-2">
            Archived ({archived.length})
          </h2>
          <div className="rounded-lg border border-dust bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-[640px] w-full text-sm">
                <tbody className="divide-y divide-dust">
                  {archived.map((m) => (
                    <tr key={m.id} className="text-steel">
                      <td className="px-4 py-2 line-through">{m.name}</td>
                      <td className="px-4 py-2 text-right">{fmtZAR(m.ratePerTon)}/t</td>
                      <td className="px-4 py-2 text-right">
                        <form action={toggleMineral} className="inline">
                          <input type="hidden" name="id" value={m.id} />
                          <input type="hidden" name="archive" value="false" />
                          <button className="text-xs text-gold hover:underline">Restore</button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Each row is a <form> wrapping all three cells; formAction on buttons overrides
// per-button so Save/Archive/Delete all post with the same hidden id field.
function MineralRow({ m }: { m: { id: string; name: string; ratePerTon: number } }) {
  return (
    <tr>
      <td colSpan={3} className="p-0">
        <form action={updateMineral} className="grid grid-cols-[1fr_180px_200px] gap-2 px-4 py-2 items-center min-w-[640px]">
          <input type="hidden" name="id" value={m.id} />
          <input name="name" defaultValue={m.name} required className="field !py-1.5 w-full" />
          <input
            name="ratePerTon"
            type="number"
            min={0}
            step="0.01"
            defaultValue={m.ratePerTon}
            className="field !py-1.5 w-full text-right"
          />
          <div className="inline-flex gap-2 justify-end flex-wrap">
            <button className="btn-primary !py-1 !px-3 text-xs">Save</button>
            <button
              formAction={toggleMineral}
              className="text-xs text-steel hover:text-coal border border-dust rounded px-2 py-1"
            >
              <input type="hidden" name="archive" value="true" />
              Archive
            </button>
            <button
              formAction={deleteMineral}
              type="submit"
              className="text-xs text-red-600 hover:text-red-800 border border-red-200 rounded px-2 py-1"
            >
              Delete
            </button>
          </div>
        </form>
      </td>
    </tr>
  );
}
