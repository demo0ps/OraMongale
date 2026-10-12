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

export const sqlite = new Database(absolutePath);
sqlite.pragma("journal_mode = DELETE");
sqlite.pragma("foreign_keys = ON");
sqlite.pragma("busy_timeout = 8000");
sqlite.pragma("synchronous = NORMAL");

export const db = drizzle(sqlite, { schema });

// Synchronous schema bootstrap at module load so ANY worker/route that imports
// '@/db' is guaranteed to have all tables before the first query runs. This
// fixes Vercel serverless cold starts where a standalone Route Handler (like
// /invoice/[number]/pdf) is invoked before RootLayout has called the async
// bootstrap() — on Vercel each function runs in an isolated worker.
//
// Demo-data seeding (which needs bcrypt/async) is then done lazily.
(function syncBootstrap() {
  try {
    const already = (sqlite.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
    ).get() as any);
    if (already) return; // schema already present in this DB
  } catch {
    // DB fresh — create schema below.
  }
  // Minimal synchronous DDL that mirrors bootstrap.ts. Only creates missing
  // tables/indexes (IF NOT EXISTS). Full bootstrap (admin user, provinces,
  // demo data) continues in async bootstrap() from RootLayout or ensureBootstrap().
  const ddl = [
    `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL DEFAULT 'Admin', password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'admin', must_change_password INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, last_login_at TEXT)`,
    `CREATE TABLE IF NOT EXISTS audit_events (id INTEGER PRIMARY KEY AUTOINCREMENT, actor_id INTEGER, actor_type TEXT, action TEXT NOT NULL, target_type TEXT, target_id TEXT, metadata_json TEXT, created_at TEXT NOT NULL)`,
    `CREATE INDEX IF NOT EXISTS audit_actor_idx ON audit_events(actor_id)`,
    `CREATE INDEX IF NOT EXISTS audit_action_idx ON audit_events(action)`,
    `CREATE TABLE IF NOT EXISTS provinces (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT NOT NULL UNIQUE, name TEXT NOT NULL UNIQUE)`,
    `CREATE TABLE IF NOT EXISTS companies (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, contact_name TEXT NOT NULL, contact_email TEXT NOT NULL, contact_phone TEXT NOT NULL, base_province_id INTEGER REFERENCES provinces(id), status TEXT NOT NULL DEFAULT 'pending_review', review_note TEXT, created_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS company_operating_provinces (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE, province_id INTEGER NOT NULL REFERENCES provinces(id), UNIQUE(company_id, province_id))`,
    `CREATE TABLE IF NOT EXISTS company_users (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, name TEXT NOT NULL, email_verified INTEGER NOT NULL DEFAULT 0, email_verify_token TEXT, email_verify_expires_at TEXT, created_at TEXT NOT NULL, last_login_at TEXT)`,
    `CREATE TABLE IF NOT EXISTS compliance_docs (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE, truck_id INTEGER REFERENCES trucks(id), doc_type TEXT NOT NULL, file_name TEXT, file_url TEXT NOT NULL, expiry_date TEXT, status TEXT NOT NULL DEFAULT 'pending', review_note TEXT, uploaded_by_company_user_id INTEGER REFERENCES company_users(id), created_at TEXT NOT NULL, reviewed_at TEXT)`,
    `CREATE TABLE IF NOT EXISTS trucks (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE, truck_type TEXT NOT NULL, make TEXT, model TEXT, year INTEGER, capacity_tons INTEGER, base_location TEXT, status TEXT NOT NULL DEFAULT 'docs_pending', review_note TEXT, created_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS mines (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, contact_name TEXT, contact_phone TEXT, contact_email TEXT, site_address TEXT, province_id INTEGER REFERENCES provinces(id), created_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS mine_leads (id INTEGER PRIMARY KEY AUTOINCREMENT, mine_name TEXT NOT NULL, contact_name TEXT NOT NULL, contact_phone TEXT NOT NULL, contact_email TEXT, material TEXT, pickup_site TEXT, dropoff_site TEXT, tonnage TEXT, required_truck_type TEXT, start_date TEXT, notes TEXT, status TEXT NOT NULL DEFAULT 'new', admin_note TEXT, created_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS jobs (id INTEGER PRIMARY KEY AUTOINCREMENT, mine_id INTEGER REFERENCES mines(id), lead_id INTEGER REFERENCES mine_leads(id), description TEXT, pickup_site TEXT, dropoff_site TEXT, material TEXT, tonnage INTEGER, required_truck_type TEXT, required_truck_count INTEGER, start_date TEXT, status TEXT NOT NULL DEFAULT 'open', admin_notes TEXT, created_by_admin_id INTEGER, created_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS assignments (id INTEGER PRIMARY KEY AUTOINCREMENT, job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE, truck_id INTEGER NOT NULL REFERENCES trucks(id), status TEXT NOT NULL DEFAULT 'proposed', company_response_note TEXT, created_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS email_outbox (id INTEGER PRIMARY KEY AUTOINCREMENT, job_id INTEGER REFERENCES jobs(id), to_email TEXT NOT NULL, to_name TEXT, subject TEXT NOT NULL, body_text TEXT NOT NULL, body_html TEXT, status TEXT NOT NULL DEFAULT 'queued', provider_message_id TEXT, error_message TEXT, sent_at TEXT, created_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT, updated_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS invoices (id INTEGER PRIMARY KEY AUTOINCREMENT, number TEXT NOT NULL UNIQUE, direction TEXT NOT NULL, job_id INTEGER REFERENCES jobs(id), mine_id INTEGER REFERENCES mines(id), company_id INTEGER REFERENCES companies(id), status TEXT NOT NULL DEFAULT 'draft', issue_date TEXT NOT NULL, due_date TEXT, subtotal INTEGER NOT NULL DEFAULT 0, vat_amount INTEGER NOT NULL DEFAULT 0, total INTEGER NOT NULL DEFAULT 0, currency TEXT NOT NULL DEFAULT 'ZAR', notes TEXT, paid_at TEXT, created_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS invoice_lines (id INTEGER PRIMARY KEY AUTOINCREMENT, invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE, description TEXT NOT NULL, quantity INTEGER NOT NULL DEFAULT 1, unit_price INTEGER NOT NULL DEFAULT 0, amount INTEGER NOT NULL DEFAULT 0)`,
    `CREATE TABLE IF NOT EXISTS assignment_invites (id INTEGER PRIMARY KEY AUTOINCREMENT, assignment_id INTEGER NOT NULL, token TEXT NOT NULL UNIQUE, to_email TEXT NOT NULL, to_name TEXT, status TEXT NOT NULL DEFAULT 'pending', response_note TEXT, expires_at TEXT NOT NULL, responded_at TEXT, created_at TEXT NOT NULL)`,
    `CREATE INDEX IF NOT EXISTS invite_token_idx ON assignment_invites(token)`,
    `CREATE TABLE IF NOT EXISTS mine_users (id INTEGER PRIMARY KEY AUTOINCREMENT, mine_id INTEGER NOT NULL, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, password_hash TEXT NOT NULL, created_at TEXT NOT NULL, last_login_at TEXT)`,
    `CREATE TABLE IF NOT EXISTS drivers (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER NOT NULL, name TEXT NOT NULL, phone TEXT NOT NULL UNIQUE, pin_hash TEXT NOT NULL, created_at TEXT NOT NULL, last_login_at TEXT)`,
    `CREATE TABLE IF NOT EXISTS trip_updates (id INTEGER PRIMARY KEY AUTOINCREMENT, job_id INTEGER NOT NULL, assignment_id INTEGER, driver_id INTEGER NOT NULL, status TEXT NOT NULL, lat TEXT, lng TEXT, notes TEXT, created_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS pod_uploads (id INTEGER PRIMARY KEY AUTOINCREMENT, trip_update_id INTEGER NOT NULL, job_id INTEGER NOT NULL, driver_id INTEGER NOT NULL, kind TEXT NOT NULL DEFAULT 'other', file_path TEXT NOT NULL, file_name TEXT, file_size INTEGER, tons INTEGER, created_at TEXT NOT NULL)`,
  ];
  sqlite.exec("BEGIN");
  try {
    for (const stmt of ddl) sqlite.exec(stmt);
    sqlite.exec("COMMIT");
  } catch (e) {
    try { sqlite.exec("ROLLBACK"); } catch {}
    // eslint-disable-next-line no-console
    console.error("[db] sync bootstrap schema failed:", e);
  }
})();

// Async bootstrap promise (admin user + provinces + demo data) triggered on
// module load. Await ensureBootstrap() in any code path that needs demo data
// (e.g. the PDF route which may be the first hit on Vercel).
let _bootPromise: Promise<void> | null = null;
export function ensureBootstrap(): Promise<void> {
  if (!_bootPromise) {
    _bootPromise = (async () => {
      const { bootstrap } = await import("./bootstrap");
      await bootstrap();
    })().catch((e) => {
      // eslint-disable-next-line no-console
      console.error("[db] async bootstrap failed:", e);
    });
  }
  return _bootPromise;
}
void ensureBootstrap();
