import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import fs from "node:fs";
import path from "node:path";

function resolveDbPath(): string {
  const isServerless =
    !!process.env.VERCEL ||
    !!process.env.VERCEL_ENV ||
    process.cwd() === "/var/task" ||
    !!(process as any).env.AWS_LAMBDA_FUNCTION_VERSION;
  const defaultDbPath = isServerless ? "/tmp/oramongale.db" : "data/oramongale.db";
  const dbPath = process.env.DATABASE_URL?.replace(/^file:/, "") ?? defaultDbPath;
  const abs = path.isAbsolute(dbPath) ? dbPath : path.join(process.cwd(), dbPath);
  try {
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    const probe = path.join(path.dirname(abs), ".write-probe");
    fs.writeFileSync(probe, "ok");
    fs.unlinkSync(probe);
    return abs;
  } catch {
    return "/tmp/oramongale.db";
  }
}

const absolutePath = resolveDbPath();
fs.mkdirSync(path.dirname(absolutePath), { recursive: true });

// Synchronous open at module load so every worker has a ready connection
// before any query fires. Use DELETE journal (not WAL) for multi-process
// safety during Next.js dev/prod worker fan-out; bootstrap serializes
// schema creation via BEGIN EXCLUSIVE.
export const sqlite = new Database(absolutePath);
sqlite.pragma("journal_mode = DELETE");
sqlite.pragma("foreign_keys = ON");
sqlite.pragma("busy_timeout = 8000");
sqlite.pragma("synchronous = NORMAL");

export const db = drizzle(sqlite, { schema });
