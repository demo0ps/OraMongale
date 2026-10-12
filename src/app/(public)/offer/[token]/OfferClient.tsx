"use client";
import { useTransition } from "react";
import { useState } from "react";

export default function OfferClient({
  action,
  token,
  invite,
}: {
  action: (token: string, a: "accept" | "decline", note?: string) => Promise<{ error?: string } | void>;
  token: string;
  invite: any;
}) {
  const [pending, start] = useTransition();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const doRespond = (a: "accept" | "decline") => {
    setError(null);
    start(async () => {
      const r = await action(token, a, note || undefined);
      if (r?.error) setError(r.error);
    });
  };

  const route = [invite.job.pickupSite, invite.job.dropoffSite].filter(Boolean).join(" → ") || "TBC";

  if (invite.responded === "accept") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-bone">
        <div className="card p-8 max-w-lg text-center">
          <div className="text-5xl mb-3">✓</div>
          <h1 className="text-2xl font-bold text-emerald-700">Load accepted</h1>
          <p className="text-coal mt-3">
            Thanks, {invite.toName?.split(" ")[0] ?? ""}. OraMongale has been notified. Dispatch will be in touch
            on WhatsApp ({invite.toEmail}) within the hour to confirm timings.
          </p>
        </div>
      </div>
    );
  }
  if (invite.responded === "decline") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-bone">
        <div className="card p-8 max-w-lg text-center">
          <div className="text-5xl mb-3">✗</div>
          <h1 className="text-2xl font-bold text-coal">Offer declined</h1>
          <p className="text-coal mt-3">Thanks for letting us know — we'll offer this load to another haulier.</p>
        </div>
      </div>
    );
  }
  if (invite.expired) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-bone">
        <div className="card p-8 max-w-lg text-center">
          <h1 className="text-xl font-semibold text-ink">Offer expired</h1>
          <p className="text-sm text-steel mt-2">This offer has expired. Please call or WhatsApp dispatch.</p>
        </div>
      </div>
    );
  }
  if (invite.already) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-bone">
        <div className="card p-8 max-w-lg text-center">
          <h1 className="text-xl font-semibold text-ink">Already responded</h1>
          <p className="text-sm text-steel mt-2">
            Status: <strong>{invite.status}</strong>. Call dispatch if you need to change your response.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bone px-4 py-10">
      <div className="max-w-xl mx-auto">
        <div className="card p-6 sm:p-8">
          <p className="text-xs uppercase tracking-widest text-gold">OraMongale haulage offer</p>
          <h1 className="mt-2 text-2xl font-bold text-ink">{invite.company}</h1>
          <p className="text-sm text-steel">{invite.toName} · {invite.toEmail}</p>

          <div className="mt-5 rounded-lg bg-navy text-white p-5">
            <div className="text-xs uppercase tracking-wider text-gold/80">Job #{invite.job.id}</div>
            <div className="mt-2 text-xl font-bold">{invite.job.material ?? "Load"}</div>
            <div className="text-sm text-bone/90 mt-1">{route}</div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Row k="Tonnage" v={invite.job.tonnage ? `${invite.job.tonnage} t` : "—"} />
              <Row k="Trucks" v={invite.job.requiredTruckCount ?? "—"} />
              <Row k="Truck type" v={invite.job.requiredTruckType?.replace(/_/g, " ") ?? "—"} />
              <Row k="Start" v={invite.job.startDate ?? "TBC"} />
            </dl>
            {invite.truck && (
              <div className="mt-4 pt-4 border-t border-white/10 text-sm">
                <div className="text-xs uppercase tracking-wider text-bone/60">Assigned unit</div>
                <div className="mt-1 font-medium">
                  {invite.truck.make} {invite.truck.model} · {invite.truck.type.replace(/_/g, " ")}{invite.truck.base ? ` · ${invite.truck.base}` : ""}
                </div>
              </div>
            )}
          </div>

          <label className="label mt-5">Note to dispatch (optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="field min-h-[80px]"
            placeholder="e.g. Can do from Wednesday only, can we shift start date?"
          />

          {error && <p className="text-sm text-red-700 mt-2">{error}</p>}

          <div className="mt-5 flex flex-col sm:flex-row gap-2">
            <button
              disabled={pending}
              onClick={() => doRespond("accept")}
              className="flex-1 bg-[#25D366] hover:bg-[#1ebe5b] text-white font-bold py-3 rounded-md disabled:opacity-50"
            >
              ✓ Accept load
            </button>
            <button
              disabled={pending}
              onClick={() => doRespond("decline")}
              className="flex-1 bg-bone hover:bg-dust text-coal font-semibold py-3 rounded-md border border-dust disabled:opacity-50"
            >
              ✗ Decline
            </button>
          </div>
          <p className="text-[11px] text-steel mt-4">
            Questions? <a className="underline" href="https://wa.me/27728204661">WhatsApp us on 072 820 4661</a> or reply to the email.
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string | number }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-bone/60">{k}</dt>
      <dd className="font-semibold">{v}</dd>
    </div>
  );
}
