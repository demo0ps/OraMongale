import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import fs from "node:fs";
import path from "node:path";

const dbPath = process.env.DATABASE_URL?.replace(/^file:/, "") ?? "data/oramongale.db";
const absolutePath = path.isAbsolute(dbPath)
  ? dbPath
  : path.join(process.cwd(), dbPath);
fs.mkdirSync(path.dirname(absolutePath), { recursive: true });

const sqlite = new Database(absolutePath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
