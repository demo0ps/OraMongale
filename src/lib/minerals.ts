import { db } from "@/db";
import { sql } from "drizzle-orm";

export interface Mineral {
  id: string;
  name: string;
  ratePerTon: number;
  archived?: boolean;
}

const SETTINGS_KEY = "minerals";

const DEFAULTS: Mineral[] = [
  { id: "coal", name: "Coal", ratePerTon: 0 },
  { id: "chrome", name: "Chrome ore", ratePerTon: 0 },
  { id: "manganese", name: "Manganese", ratePerTon: 0 },
  { id: "iron-ore", name: "Iron ore", ratePerTon: 0 },
  { id: "pgm", name: "PGM (Platinum Group)", ratePerTon: 0 },
  { id: "diamonds", name: "Diamonds", ratePerTon: 0 },
  { id: "granite", name: "Granite / Aggregate", ratePerTon: 0 },
];

export async function getMinerals(includeArchived = false): Promise<Mineral[]> {
  const row = (await db.get(
    sql`SELECT value FROM settings WHERE key = ${SETTINGS_KEY}`
  )) as { value?: string | null } | undefined;
  if (!row?.value) return [...DEFAULTS];
  try {
    const parsed = JSON.parse(row.value) as Mineral[];
    const arr = Array.isArray(parsed) ? parsed : [];
    return includeArchived ? arr : arr.filter((m) => !m.archived);
  } catch {
    return [...DEFAULTS];
  }
}

export async function getMineralMap(): Promise<Map<string, Mineral>> {
  const list = await getMinerals(true);
  return new Map(list.map((m) => [m.id, m]));
}

export async function saveMinerals(minerals: Mineral[]): Promise<void> {
  const value = JSON.stringify(minerals);
  const now = new Date().toISOString();
  await db.run(
    sql`INSERT INTO settings (key, value, updated_at) VALUES (${SETTINGS_KEY}, ${value}, ${now})
        ON CONFLICT(key) DO UPDATE SET value = ${value}, updated_at = ${now}`
  );
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || `m-${Date.now().toString(36)}`;
}
