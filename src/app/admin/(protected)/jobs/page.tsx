import Link from "next/link";
import { db } from "@/db";
import { companies, trucks, mineLeads, jobs } from "@/db/schema";
import { settings } from "@/db/ops-schema";
import { eq, sql } from "drizzle-orm";
import { listAvailableTrucks, listJobs, getJobWithAssignments } from "@/lib/admin/queries";
import { createJob, assignTrucksToJob, sendAssignmentEmails, removeAssignment, setJobStatus } from "../actions";
import JobsClient from "./JobsClient";
import { getMailSettings } from "@/lib/mail-settings";

export const metadata = { title: "Jobs — Admin" };
export const dynamic = "force-dynamic";

const materialKeyMap: Record<string, string> = {
  coal: "r_per_tkm_coal",
  chrome: "r_per_tkm_chrome",
  manganese: "r_per_tkm_manganese",
  platinum: "r_per_tkm_pgms",
  pgms: "r_per_tkm_pgms",
  "iron ore": "r_per_tkm_iron_ore",
};

function keyFor(material: string | null) {
  if (!material) return "r_per_tkm_default";
  const m = material.toLowerCase();
  if (materialKeyMap[m]) return materialKeyMap[m];
  for (const k of Object.keys(materialKeyMap)) {
    if (m.includes(k)) return materialKeyMap[k];
  }
  return "r_per_tkm_default";
}

async function getNum(key: string, fb: number): Promise<number> {
  const r = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  const v = Number(r[0]?.value);
  return Number.isFinite(v) && v > 0 ? v : fb;
}

// Crude one-way lookup between well-known SA hubs — used purely to seed the
// distance field. Admins override it per job.
const routeHints: Record<string, Record<string, number>> = {
  witbank: { "richards bay": 370, middelburg: 40 },
  middelburg: { "richards bay": 390, witbank: 40 },
  steelpoort: { burgersfort: 60, witbank: 260 },
  burgersfort: { steelpoort: 60 },
  rustenburg: { brits: 55, johannesburg: 120 },
  kathu: { kuruman: 130 },
  kuruman: { kathu: 130, "upington": 260 },
  thabazimbi: { lephalale: 130, rustenburg: 160 },
  lephalale: { thabazimbi: 130 },
};
function guessKm(pickup?: string | null, drop?: string | null): number | null {
  if (!pickup || !drop) return null;
  const a = pickup.toLowerCase().trim();
  const b = drop.toLowerCase().trim();
  for (const [ka, map] of Object.entries(routeHints)) {
    if (a.includes(ka)) {
      for (const [kb, km] of Object.entries(map)) {
        if (b.includes(kb)) return km;
      }
    }
    if (b.includes(ka)) {
      for (const [kb, km] of Object.entries(map)) {
        if (a.includes(kb)) return km;
      }
    }
  }
  return null;
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ highlight?: string }>;
}) {
  const sp = await searchParams;
  const [jobList, allTrucks, leads, mailConfigured, defaultMargin] = await Promise.all([
    listJobs(),
    listAvailableTrucks(),
    db.select().from(mineLeads).orderBy(sql`${mineLeads.createdAt} DESC`),
    getMailSettings().then((s) => !!s),
    getNum("default_margin_pct", 15),
  ]);
  const companiesList = await db.select().from(companies).orderBy(companies.name);

  const highlightId = sp.highlight ? Number(sp.highlight) : null;
  const highlightJob = highlightId ? await getJobWithAssignments(highlightId) : null;

  // Augment each job row with rate defaults
  const jobsAug = await Promise.all(
    jobList.map(async (j) => ({
      ...j,
      defaultRate: await getNum(keyFor(j.material), 2.2),
      defaultMargin,
      suggestedKm: guessKm(j.pickupSite, j.dropoffSite),
    })),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Jobs</h1>
          <p className="text-sm text-steel mt-1">
            Create a haulage job, assign trucks, and email the hauliers in one go.
          </p>
        </div>
        <a href="/api/admin/download-db" className="btn-navy text-xs">
          ⬇ Download database
        </a>
      </div>

      <section className="card p-5">
        <h2 className="text-base font-semibold text-coal mb-3">New job</h2>
        <form action={createJob} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Material" name="material" placeholder="Coal / Chrome / Manganese…" />
          <Field label="Pickup site" name="pickupSite" placeholder="Witbank" />
          <Field label="Dropoff site" name="dropoffSite" placeholder="Richards Bay" />
          <Field label="Tonnage (t)" name="tonnage" type="number" placeholder="3000" />
          <div>
            <label className="label">Truck type required</label>
            <select name="requiredTruckType" className="field">
              <option value="">Any</option>
              {["side_tipper","interlink_tipper","flat_deck","lowbed","superlink","tipper","water_tanker","fuel_tanker"].map((t) => (
                <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
          <Field label="Trucks needed" name="requiredTruckCount" type="number" placeholder="4" />
          <Field label="Start date" name="startDate" type="date" />
          {leads.length > 0 && (
            <div>
              <label className="label">From lead (optional)</label>
              <select name="leadId" className="field">
                <option value="">—</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>{l.mineName} — {l.material ?? ""}</option>
                ))}
              </select>
            </div>
          )}
          <div className="md:col-span-2">
            <label className="label">Description / notes</label>
            <input name="description" className="field" placeholder="Route details, contract length, timing…" />
          </div>
          <div className="md:col-span-3 flex justify-end">
            <button className="btn-primary">Create job</button>
          </div>
        </form>
      </section>

      <JobsClient
        jobs={jobsAug}
        availableTrucks={allTrucks}
        highlightJob={highlightJob}
        assignAction={assignTrucksToJob}
        sendAction={sendAssignmentEmails}
        removeAction={removeAssignment}
        setStatusAction={setJobStatus}
        mailConfigured={mailConfigured}
      />
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
}: { label: string; name: string; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input name={name} type={type} placeholder={placeholder} className="field" />
    </div>
  );
}
