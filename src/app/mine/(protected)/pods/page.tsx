import { db } from "@/db";
import { jobs } from "@/db/schema";
import { podUploads, drivers, tripUpdates } from "@/db/mail-schema";
import { eq, desc, sql } from "drizzle-orm";
import { getMineSession } from "@/lib/mine-auth";
import { redirect } from "next/navigation";
import Image from "next/image";

export const metadata = { title: "PODs — Mine portal" };
export const dynamic = "force-dynamic";

export default async function PodsPage() {
  const s = await getMineSession();
  if (!s) redirect("/mine/login");

  const uploads = await db
    .select({
      p: podUploads,
      j: jobs,
      d: drivers,
      tu: tripUpdates,
    })
    .from(podUploads)
    .innerJoin(jobs, eq(podUploads.jobId, jobs.id))
    .leftJoin(tripUpdates, eq(podUploads.tripUpdateId, tripUpdates.id))
    .leftJoin(drivers, eq(podUploads.driverId, drivers.id))
    .where(eq(jobs.mineId, s.mineId))
    .orderBy(desc(podUploads.createdAt))
    .limit(100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Proof of delivery</h1>
        <p className="text-sm text-steel mt-1">Weighbridge slips, delivery photos and reported tonnage from drivers.</p>
      </div>
      {uploads.length === 0 ? (
        <div className="card p-8 text-center text-steel">No PODs uploaded yet — they'll appear here as drivers file them.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {uploads.map(({ p, j, d, tu }) => (
            <div key={p.id} className="card overflow-hidden">
              <div className="relative aspect-[4/3] bg-slate2">
                {/\.(jpe?g|png|webp)$/i.test(p.filePath) ? (
                  <Image src={p.filePath} alt={p.fileName ?? "POD"} fill unoptimized className="object-cover" sizes="(min-width:1024px)33vw,(min-width:640px)50vw,100vw" />
                ) : (
                  <a href={p.filePath} target="_blank" className="flex items-center justify-center h-full text-steel text-sm">Download file</a>
                )}
              </div>
              <div className="p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink">Job #{j.id} · {j.material ?? "Load"}</span>
                  <span className="text-[10px] uppercase rounded bg-bone text-steel px-2 py-0.5 border border-dust">{p.kind.replace("_", " ")}</span>
                </div>
                <div className="text-xs text-steel mt-1">
                  {[j.pickupSite, j.dropoffSite].filter(Boolean).join(" → ")}{p.tons ? ` · ${p.tons} t` : ""}
                </div>
                <div className="text-[11px] text-steel mt-1">
                  {d?.name ?? "Unknown driver"} · {new Date(p.createdAt).toLocaleString("en-ZA")}
                  {tu?.status ? ` · ${tu.status.replace("_", " ")}` : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
