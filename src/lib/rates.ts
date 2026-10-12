import { db } from "@/db";
import { settings } from "@/db/ops-schema";
import { eq } from "drizzle-orm";

export type RateInputs = {
  km: number; // one-way distance
  tons: number;
  material: string | null;
  tripsPerMonth?: number; // optional — for a contract quote
};

export type RateQuote = {
  haulierCostPerTon: number; // R/ton
  sellPerTon: number; // R/ton with margin
  marginPerTon: number; // R/ton
  totalHaulierCost: number;
  totalSell: number;
  totalMargin: number;
  rPerTkmUsed: number;
  dieselPerLiter: number;
  marginPct: number;
  currency: "ZAR";
};

const materialKeyMap: Record<string, string> = {
  coal: "r_per_tkm_coal",
  chrome: "r_per_tkm_chrome",
  manganese: "r_per_tkm_manganese",
  platinum: "r_per_tkm_pgms",
  pgms: "r_per_tkm_pgms",
  "iron ore": "r_per_tkm_iron_ore",
  "iron-ore": "r_per_tkm_iron_ore",
};

async function getSettingNum(key: string, fallback: number): Promise<number> {
  const r = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  const v = Number(r[0]?.value);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

export async function quoteRate({ km, tons, material }: RateInputs): Promise<RateQuote> {
  const marginPct = await getSettingNum("default_margin_pct", 15);
  // diesel not used in the simple t×km×rate model yet — surfaced for the UI
  const dieselPerLiter = await getSettingNum("diesel_price_per_l", 25.5);
  let key = "r_per_tkm_default";
  if (material) {
    const m = material.toLowerCase();
    key = materialKeyMap[m] ?? "r_per_tkm_default";
    // Partial match fallback
    for (const [k, v] of Object.entries(materialKeyMap)) {
      if (m.includes(k)) {
        key = v;
        break;
      }
    }
  }
  const rPerTkm = await getSettingNum(key, 2.2);

  // One-way haul: cost = R/ton-km × km per loaded leg.
  // In SA the industry typically quotes per loaded ton one-way; return leg is
  // priced into the rate. This is intentionally simple so dispatchers understand it.
  const costPerTon = rPerTkm * km;
  const marginPerTon = costPerTon * (marginPct / 100);
  const sellPerTon = costPerTon + marginPerTon;

  return {
    haulierCostPerTon: Math.round(costPerTon * 100) / 100,
    sellPerTon: Math.round(sellPerTon * 100) / 100,
    marginPerTon: Math.round(marginPerTon * 100) / 100,
    totalHaulierCost: Math.round(costPerTon * tons * 100) / 100,
    totalSell: Math.round(sellPerTon * tons * 100) / 100,
    totalMargin: Math.round(marginPerTon * tons * 100) / 100,
    rPerTkmUsed: rPerTkm,
    dieselPerLiter,
    marginPct,
    currency: "ZAR",
  };
}

export function fmtZAR(n: number) {
  return "R " + n.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
