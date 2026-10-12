import { db } from "@/db";
import { mines } from "@/db/schema";
import { mineUsers } from "@/db/mail-schema";
import { eq } from "drizzle-orm";
import { addMineUser } from "./actions";
import AddMineUserForm from "./AddMineUserForm";

export const metadata = { title: "Mines — Admin" };
export const dynamic = "force-dynamic";

export default async function MinesPage() {
  const mineRows = await db.select().from(mines).orderBy(mines.name);
  const usersByMine = new Map<number, typeof mineUsers.$inferSelect[]>();
  for (const m of mineRows) {
    const us = await db.select().from(mineUsers).where(eq(mineUsers.mineId, m.id));
    usersByMine.set(m.id, us);
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Mines & contacts</h1>
        <p className="text-sm text-steel mt-1">Mines auto-create when leads convert; add portal users below to give mine contacts read-only access.</p>
      </div>
      <div className="space-y-4">
        {mineRows.length === 0 && <div className="card p-6 text-sm text-steel">No mines yet — convert a lead on the Leads page.</div>}
        {mineRows.map((m) => (
          <section key={m.id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-ink">{m.name}</h2>
                <div className="text-sm text-steel mt-1">
                  {m.contactName}{m.contactPhone ? ` · ${m.contactPhone}` : ""}{m.contactEmail ? ` · ${m.contactEmail}` : ""}
                </div>
                {m.siteAddress && <div className="text-xs text-steel">{m.siteAddress}</div>}
              </div>
              <span className="text-xs text-steel">{(usersByMine.get(m.id) ?? []).length} portal user(s)</span>
            </div>
            <div className="mt-4 border-t border-dust pt-4">
              <h3 className="text-xs uppercase tracking-wider text-steel mb-2">Portal users</h3>
              <ul className="divide-y divide-dust">
                {(usersByMine.get(m.id) ?? []).map((u) => (
                  <li key={u.id} className="py-2 flex items-center justify-between text-sm">
                    <span><span className="font-medium text-ink">{u.name}</span> <span className="text-steel">· {u.email}</span></span>
                    <span className="text-[11px] text-steel">
                      {u.lastLoginAt ? `Last login ${new Date(u.lastLoginAt).toLocaleDateString("en-ZA")}` : "Never signed in"}
                    </span>
                  </li>
                ))}
                {(usersByMine.get(m.id) ?? []).length === 0 && <li className="py-2 text-sm text-steel">No users — add one below.</li>}
              </ul>
              <AddMineUserForm action={addMineUser} mineId={m.id} />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
