"use client";

import { useMemo, useState, useTransition } from "react";
import type { JobWithAssignments } from "@/lib/admin/types";
import RatePanel from "./RatePanel";

type Truck = {
  id: number;
  truckType: string;
  make: string | null;
  model: string | null;
  year: number | null;
  capacityTons: number | null;
  baseLocation: string | null;
  status: string;
  companyId: number;
  companyName: string;
  companyContactEmail: string;
  companyContactName: string;
};

type JobRow = {
  id: number;
  material: string | null;
  pickupSite: string | null;
  dropoffSite: string | null;
  tonnage: number | null;
  requiredTruckType: string | null;
  requiredTruckCount: number | null;
  startDate: string | null;
  status: string;
  createdAt: string;
  assignedCount: number;
  suggestedKm?: number | null;
  defaultRate: number;
  defaultMargin: number;
};

const statusTone: Record<string, string> = {
  open: "bg-amber-50 text-amber-800 border-amber-200",
  matching: "bg-blue-50 text-blue-800 border-blue-200",
  assigned: "bg-purple-50 text-purple-800 border-purple-200",
  in_progress: "bg-emerald-50 text-emerald-800 border-emerald-200",
  completed: "bg-slate-100 text-slate-700 border-slate-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

export default function JobsClient({
  jobs,
  availableTrucks,
  highlightJob,
  assignAction,
  sendAction,
  removeAction,
  setStatusAction,
  mailConfigured,
}: {
  jobs: JobRow[];
  availableTrucks: Truck[];
  highlightJob: JobWithAssignments | null;
  assignAction: (jobId: number, truckIds: number[]) => Promise<void>;
  sendAction: (jobId: number) => Promise<{ queued: number }>;
  removeAction: (assignmentId: number) => Promise<void>;
  setStatusAction: (jobId: number, status: string) => Promise<void>;
  mailConfigured: boolean;
}) {
  const [openId, setOpenId] = useState<number | null>(
    highlightJob?.id ?? jobs[0]?.id ?? null,
  );
  const [pending, start] = useTransition();
  const [sentMsg, setSentMsg] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {jobs.length === 0 && (
        <div className="card p-8 text-center text-steel">
          No jobs yet. Create one above to get started.
        </div>
      )}
      {jobs.map((j) => {
        const expanded = openId === j.id;
        const isHighlight = highlightJob?.id === j.id;
        return (
          <div
            key={j.id}
            className={"card overflow-hidden " + (isHighlight ? "ring-2 ring-gold" : "")}
          >
            <button
              onClick={() => setOpenId(expanded ? null : j.id)}
              className="w-full text-left p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-bone/60 transition"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-steel">#{j.id}</span>
                  <span className="font-semibold text-ink">
                    {j.material ?? "Load"}
                  </span>
                  <span
                    className={
                      "text-xs rounded-full border px-2 py-0.5 " +
                      (statusTone[j.status] ?? "")
                    }
                  >
                    {j.status}
                  </span>
                </div>
                <div className="text-sm text-coal mt-1">
                  {[j.pickupSite, j.dropoffSite].filter(Boolean).join(" → ") ||
                    "Route TBC"}
                  {j.tonnage ? ` · ${j.tonnage}t` : ""}
                  {j.requiredTruckType
                    ? ` · ${j.requiredTruckType.replace(/_/g, " ")}`
                    : ""}
                  {j.requiredTruckCount ? ` · ${j.requiredTruckCount} trucks` : ""}
                </div>
                <div className="text-[11px] text-steel mt-1">
                  {new Date(j.createdAt).toLocaleString("en-ZA")}
                </div>
              </div>
              <div className="text-xs text-steel flex items-center gap-3">
                <span>{j.assignedCount} assigned</span>
                <span>{expanded ? "▾" : "▸"}</span>
              </div>
            </button>
            {expanded && (
              <JobDetail
                job={isHighlight ? highlightJob! : null}
                jobId={j.id}
                status={j.status}
                material={j.material}
                defaultKm={j.suggestedKm ?? null}
                defaultTons={j.tonnage}
                defaultRate={j.defaultRate}
                defaultMargin={j.defaultMargin}
                availableTrucks={availableTrucks}
                assignAction={assignAction}
                sendAction={sendAction}
                removeAction={removeAction}
                setStatusAction={setStatusAction}
                pending={pending}
                start={start}
                sentMsg={sentMsg}
                setSentMsg={setSentMsg}
                mailConfigured={mailConfigured}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function JobDetail({
  job,
  jobId,
  status,
  material,
  defaultKm,
  defaultTons,
  defaultRate,
  defaultMargin,
  availableTrucks,
  assignAction,
  sendAction,
  removeAction,
  setStatusAction,
  pending,
  start,
  sentMsg,
  setSentMsg,
  mailConfigured,
}: {
  job: JobWithAssignments | null;
  jobId: number;
  status: string;
  material: string | null;
  defaultKm: number | null;
  defaultTons: number | null;
  defaultRate: number;
  defaultMargin: number;
  availableTrucks: Truck[];
  assignAction: (jobId: number, truckIds: number[]) => Promise<void>;
  sendAction: (jobId: number) => Promise<{ queued: number }>;
  removeAction: (assignmentId: number) => Promise<void>;
  setStatusAction: (jobId: number, status: string) => Promise<void>;
  pending: boolean;
  start: (cb: () => void) => void;
  sentMsg: string | null;
  setSentMsg: (m: string | null) => void;
  mailConfigured: boolean;
}) {
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const filtered = useMemo(() => {
    return availableTrucks.filter((t) => {
      if (typeFilter && t.truckType !== typeFilter) return false;
      if (!q) return true;
      const s = q.toLowerCase();
      return (
        (t.companyName ?? "").toLowerCase().includes(s) ||
        (t.make ?? "").toLowerCase().includes(s) ||
        (t.model ?? "").toLowerCase().includes(s) ||
        (t.baseLocation ?? "").toLowerCase().includes(s)
      );
    });
  }, [q, typeFilter, availableTrucks]);

  const toggle = (id: number) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const doAssign = () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    start(async () => {
      await assignAction(jobId, ids);
      setSelected(new Set());
    });
  };

  const doSend = () => {
    start(async () => {
      const r = await sendAction(jobId);
      setSentMsg(
        `Queued ${r.queued} email${r.queued === 1 ? "" : "s"}. ${
          !mailConfigured
            ? "Mail isn't configured in this preview — open Settings to view/copy queued messages."
            : ""
        }`,
      );
      setTimeout(() => setSentMsg(null), 6000);
    });
  };

  const types = Array.from(new Set(availableTrucks.map((t) => t.truckType)));

  return (
    <div className="border-t border-dust p-5 bg-bone/40 space-y-5">
      <RatePanel
        defaultKm={defaultKm}
        defaultTons={defaultTons}
        material={material}
        defaultRate={defaultRate}
        defaultMargin={defaultMargin}
      />
      <div>
        <h3 className="text-sm font-semibold text-coal mb-2">Assignments</h3>
        {job && job.assignments.length > 0 ? (
          <ul className="card divide-y divide-dust overflow-hidden">
            {job.assignments.map((a) => (
              <li
                key={a.id}
                className="p-3 flex flex-wrap items-center justify-between gap-2 bg-white"
              >
                <div className="text-sm">
                  <div className="font-medium text-ink">{a.company.name}</div>
                  <div className="text-xs text-steel">
                    {a.truck
                      ? `${a.truck.make ?? ""} ${a.truck.model ?? ""} ${a.truck.truckType.replace(/_/g, " ")}`
                      : "Truck unassigned"}{" "}
                    · {a.company.contactEmail} · {a.company.contactPhone}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs rounded-full border px-2 py-0.5 bg-amber-50 text-amber-800 border-amber-200">
                    {a.status}
                  </span>
                  <button
                    onClick={() => start(() => removeAction(a.id))}
                    className="text-xs text-red-600 hover:underline"
                    disabled={pending}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-steel">
            No trucks assigned yet — pick from the list below.
          </p>
        )}
      </div>

      <div>
        <div className="flex flex-wrap items-end justify-between gap-3 mb-2">
          <h3 className="text-sm font-semibold text-coal">
            Pick available trucks
          </h3>
          <div className="flex flex-wrap gap-2">
            <input
              className="field text-xs"
              placeholder="Search company/make/base…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select
              className="field text-xs"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All types</option>
              {types.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="card overflow-hidden">
          <div className="max-h-72 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-bone text-steel text-xs uppercase sticky top-0">
                <tr>
                  <th className="w-8"></th>
                  <th className="text-left px-3 py-2 font-medium">Company</th>
                  <th className="text-left px-3 py-2 font-medium">Truck</th>
                  <th className="text-left px-3 py-2 font-medium">Base</th>
                  <th className="text-left px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-4 text-sm text-steel">
                      No trucks match.
                    </td>
                  </tr>
                )}
                {filtered.map((t) => {
                  const isSel = selected.has(t.id);
                  return (
                    <tr
                      key={t.id}
                      className={
                        "border-t border-dust cursor-pointer " +
                        (isSel ? "bg-gold/5" : "hover:bg-bone")
                      }
                      onClick={() => toggle(t.id)}
                    >
                      <td className="px-3 py-2">
                        <input type="checkbox" checked={isSel} readOnly />
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-medium text-ink">
                          {t.companyName}
                        </div>
                        <div className="text-[11px] text-steel">
                          {t.companyContactEmail}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-coal">
                        {t.make} {t.model} ·{" "}
                        <span className="text-xs text-steel">
                          {t.truckType.replace(/_/g, " ")}
                        </span>
                        {t.capacityTons ? (
                          <span className="text-xs text-steel">
                            {" "}
                            · {t.capacityTons}t
                          </span>
                        ) : (
                          ""
                        )}
                      </td>
                      <td className="px-3 py-2 text-steel">
                        {t.baseLocation ?? "—"}
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-[11px] rounded-full border px-2 py-0.5 bg-emerald-50 text-emerald-800 border-emerald-200">
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-3 flex flex-wrap items-center justify-between gap-2 border-t border-dust bg-white">
            <div className="text-xs text-steel">{selected.size} selected</div>
            <div className="flex gap-2">
              <button
                onClick={doAssign}
                disabled={selected.size === 0 || pending}
                className="btn-primary text-xs disabled:opacity-50"
              >
                Assign selected
              </button>
              <button
                onClick={doSend}
                disabled={pending || !(job && job.assignments.length > 0)}
                className="btn bg-navy text-white hover:bg-[#0e3679] text-xs disabled:opacity-50"
                title="Email all assigned companies"
              >
                ✉ Send email to hauliers
              </button>
            </div>
          </div>
          {sentMsg && (
            <div className="px-3 pb-3 text-xs text-emerald-700">{sentMsg}</div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center text-sm">
        <span className="text-steel text-xs mr-1">Job status:</span>
        {(
          [
            "open",
            "matching",
            "assigned",
            "in_progress",
            "completed",
            "cancelled",
          ] as const
        ).map((s) => (
          <button
            key={s}
            disabled={pending}
            onClick={() => start(() => setStatusAction(jobId, s))}
            className={
              "text-xs px-2.5 py-1 rounded-full border " +
              (s === status
                ? "bg-navy text-white border-navy"
                : "bg-white text-coal border-dust hover:border-gold")
            }
          >
            {s.replace("_", " ")}
          </button>
        ))}
      </div>
    </div>
  );
}
