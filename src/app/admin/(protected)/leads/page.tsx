import { db } from "@/db";
import { mineLeads } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";

export const metadata = { title: "Leads — Admin" };

export default async function LeadsPage() {
  type LeadStatus = "new" | "contacted" | "converted" | "lost";
  const byStatus = async (status: LeadStatus) =>
    db.select().from(mineLeads).where(eq(mineLeads.status, status)).orderBy(desc(mineLeads.createdAt));
  const [nue, contacted, converted, lost] = await Promise.all([
    byStatus("new"),
    byStatus("contacted"),
    byStatus("converted"),
    byStatus("lost"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Haulage leads</h1>
        <p className="text-sm text-steel mt-1">
          Submissions from the public &ldquo;post a haulage need&rdquo; form. Convert a lead into a job once you have confirmed the details.
        </p>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Column title="New" tone="amber" leads={nue} />
        <Column title="Contacted" tone="blue" leads={contacted} />
        <Column title="Converted" tone="emerald" leads={converted} />
        <Column title="Lost" tone="slate" leads={lost} />
      </div>
    </div>
  );
}

function Column({
  title,
  tone,
  leads,
}: {
  title: string;
  tone: "amber" | "blue" | "emerald" | "slate";
  leads: typeof mineLeads.$inferSelect[];
}) {
  const toneMap = {
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    blue: "bg-blue-50 text-blue-800 border-blue-200",
    emerald: "bg-emerald-50 text-emerald-800 border-emerald-200",
    slate: "bg-bone text-steel border-dust",
  } as const;
  return (
    <section className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-dust flex items-center justify-between">
        <h2 className="font-semibold text-coal">{title}</h2>
        <span className={"text-xs rounded-full border px-2 py-0.5 " + toneMap[tone]}>{leads.length}</span>
      </div>
      {leads.length === 0 ? (
        <p className="p-4 text-sm text-steel">No leads in this column.</p>
      ) : (
        <ul className="divide-y divide-dust">
          {leads.map((l) => (
            <li key={l.id} className="p-4 text-sm">
              <div className="font-medium text-ink">{l.mineName}</div>
              <div className="text-xs text-steel">{l.contactName} · {l.contactPhone}{l.contactEmail ? ` · ${l.contactEmail}` : ""}</div>
              {(l.material || l.pickupSite || l.tonnage) && (
                <div className="text-coal mt-2 text-xs">
                  {[l.material, l.tonnage && `${l.tonnage}`, l.pickupSite && l.dropoffSite ? `${l.pickupSite} → ${l.dropoffSite}` : l.pickupSite].filter(Boolean).join(" · ")}
                </div>
              )}
              {l.notes && <p className="text-xs text-steel mt-1 line-clamp-2">{l.notes}</p>}
              <div className="text-[11px] text-steel mt-2">
                {new Date(l.createdAt).toLocaleString("en-ZA")}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
