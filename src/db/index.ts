import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import fs from "node:fs";
import path from "node:path";

// In Vercel serverless, /var/task is read-only; use /tmp for SQLite.
// Local dev keeps using data/oramongale.db.
const isVercel = !!process.env.VERCEL;
const defaultDbPath = isVercel ? "/tmp/oramongale.db" : "data/oramongale.db";
const dbPath = process.env.DATABASE_URL?.replace(/^file:/, "") ?? defaultDbPath;
const absolutePath = path.isAbsolute(dbPath)
  ? dbPath
  : path.join(process.cwd(), dbPath);

let _sqlite: Database.Database | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

function open() {
  if (_sqlite && _db) return { sqlite: _sqlite, db: _db };
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  const sqlite = new Database(absolutePath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  _sqlite = sqlite;
  _db = drizzle(sqlite, { schema });
  return { sqlite, db: _db };
}

// Proxy so property access triggers lazy open (first query opens DB exactly once per worker).
export const sqlite = new Proxy({} as Database.Database, {
  get(_t, prop) {
    const { sqlite: s } = open();
    const v = (s as any)[prop];
    return typeof v === "function" ? v.bind(s) : v;
  },
});

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_t, prop) {
    const { db: d } = open();
    const v = (d as any)[prop];
    return typeof v === "function" ? v.bind(d) : v;
  },
});
