"use client";

import { useMemo, useState } from "react";
import { fmtRands } from "@/lib/format";

// Very simple t×km×rate calculator (mirrors server formula) so the user can
// tweak km / tons / margin and see the sell price update live. Values default
// from the job; overrideable.
export default function RatePanel({
  defaultKm,
  defaultTons,
  material,
  defaultRate,
  defaultMargin,
}: {
  defaultKm: number | null;
  defaultTons: number | null;
  material: string | null;
  defaultRate: number;
  defaultMargin: number;
}) {
  const [km, setKm] = useState<string>(defaultKm ? String(defaultKm) : "");
  const [tons, setTons] = useState<string>(defaultTons ? String(defaultTons) : "");
  const [rate, setRate] = useState<string>(String(defaultRate));
  const [margin, setMargin] = useState<string>(String(defaultMargin));

  const quote = useMemo(() => {
    const k = Number(km);
    const t = Number(tons);
    const r = Number(rate);
    const m = Number(margin);
    if (!k || !t || !r || Number.isNaN(k) || Number.isNaN(t)) return null;
    const cost = r * k;
    const sell = cost * (1 + m / 100);
    return {
      cost,
      sell,
      marginPerTon: sell - cost,
      totalCost: cost * t,
      totalSell: sell * t,
      totalMargin: (sell - cost) * t,
    };
  }, [km, tons, rate, margin]);

  return (
    <section className="card p-5 bg-navy/95 text-white border-navy">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Suggested quote</h3>
        <span className="text-[10px] uppercase tracking-widest text-gold">
          {material ? material : "general"} · R/t-km
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <Num label="Distance (km, one-way)" value={km} onChange={setKm} />
        <Num label="Tons" value={tons} onChange={setTons} />
        <Num label="R per ton-km" value={rate} onChange={setRate} />
        <Num label="Margin %" value={margin} onChange={setMargin} />
      </div>
      {quote ? (
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/10">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-bone/60">Haulier cost / t</div>
            <div className="text-lg font-semibold text-bone">{fmtRands(quote.cost)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-bone/60">Sell / t</div>
            <div className="text-lg font-bold text-gold">{fmtRands(quote.sell)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-bone/60">Margin / t</div>
            <div className="text-lg font-semibold text-emerald-300">{fmtRands(quote.marginPerTon)}</div>
          </div>
          <div className="col-span-3 grid grid-cols-3 gap-4 pt-3 border-t border-white/10">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-bone/60">Total cost</div>
              <div className="font-semibold">{fmtRands(quote.totalCost)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-bone/60">Total sell</div>
              <div className="font-bold text-gold">{fmtRands(quote.totalSell)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-bone/60">Gross margin</div>
              <div className="font-bold text-emerald-300">{fmtRands(quote.totalMargin)}</div>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-bone/60 mt-2">Enter distance and tonnage to calculate a suggested sell price.</p>
      )}
      <p className="mt-3 text-[10px] text-bone/50 leading-relaxed">
        Based on the R/ton-km rate for this commodity. Edit the numbers to match what you actually negotiated; this is just a starting point. Round-trip and diesel levy can be built in later.
      </p>
    </section>
  );
}

function Num({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wide text-bone/70 block mb-1">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="decimal"
        className="w-full rounded-md bg-white/10 border border-white/20 px-2 py-1.5 text-sm text-white placeholder:text-bone/40 focus:outline-none focus:ring-1 focus:ring-gold"
      />
    </label>
  );
}
