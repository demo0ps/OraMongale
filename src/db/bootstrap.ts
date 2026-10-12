import { sql, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "./index";
import { provinces, users, auditEvents } from "./schema";
import { isDemoSeeded, seedDemoData } from "@/lib/demo-seed";

const SA_PROVINCES: { code: string; name: string }[] = [
  { code: "EC", name: "Eastern Cape" },
  { code: "FS", name: "Free State" },
  { code: "GP", name: "Gauteng" },
  { code: "KZN", name: "KwaZulu-Natal" },
  { code: "LP", name: "Limpopo" },
  { code: "MP", name: "Mpumalanga" },
  { code: "NC", name: "Northern Cape" },
  { code: "NW", name: "North West" },
  { code: "WC", name: "Western Cape" },
];

/**
 * Idempotent bootstrap: ensure tables exist, provinces are seeded, and the
 * bootstrap admin exists. Safe to call on every server start and during
 * Next.js's parallel prerender.
 */
export async function bootstrap(): Promise<void> {
  // ---------- Schema (CREATE TABLE IF NOT EXISTS for every table) ----------
  // admin users
  await db.run(sql`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL DEFAULT 'Admin',
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    must_change_password INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    last_login_at TEXT
  );`);

  await db.run(sql`CREATE TABLE IF NOT EXISTS audit_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actor_id INTEGER,
    actor_type TEXT,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    metadata_json TEXT,
    created_at TEXT NOT NULL
  );`);

  await db.run(sql`CREATE INDEX IF NOT EXISTS audit_actor_idx ON audit_events(actor_id);`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS audit_action_idx ON audit_events(action);`);

  await db.run(sql`CREATE TABLE IF NOT EXISTS provinces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL UNIQUE
  );`);

  await db.run(sql`CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    base_province_id INTEGER REFERENCES provinces(id),
    status TEXT NOT NULL DEFAULT 'pending_review',
    review_note TEXT,
    created_at TEXT NOT NULL
  );`);

  await db.run(sql`CREATE TABLE IF NOT EXISTS company_operating_provinces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    province_id INTEGER NOT NULL REFERENCES provinces(id),
    UNIQUE(company_id, province_id)
  );`);

  await db.run(sql`CREATE TABLE IF NOT EXISTS company_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    email_verified INTEGER NOT NULL DEFAULT 0,
    email_verify_token TEXT,
    email_verify_expires_at TEXT,
    created_at TEXT NOT NULL,
    last_login_at TEXT
  );`);

  await db.run(sql`CREATE TABLE IF NOT EXISTS compliance_docs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    truck_id INTEGER REFERENCES trucks(id),
    doc_type TEXT NOT NULL,
    file_name TEXT,
    file_url TEXT NOT NULL,
    expiry_date TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    review_note TEXT,
    uploaded_by_company_user_id INTEGER REFERENCES company_users(id),
    created_at TEXT NOT NULL,
    reviewed_at TEXT
  );`);

  await db.run(sql`CREATE TABLE IF NOT EXISTS trucks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    truck_type TEXT NOT NULL,
    make TEXT,
    model TEXT,
    year INTEGER,
    capacity_tons INTEGER,
    base_location TEXT,
    status TEXT NOT NULL DEFAULT 'docs_pending',
    review_note TEXT,
    created_at TEXT NOT NULL
  );`);

  await db.run(sql`CREATE TABLE IF NOT EXISTS mines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact_name TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    site_address TEXT,
    province_id INTEGER REFERENCES provinces(id),
    created_at TEXT NOT NULL
  );`);

  await db.run(sql`CREATE TABLE IF NOT EXISTS mine_leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mine_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    contact_email TEXT,
    material TEXT,
    pickup_site TEXT,
    dropoff_site TEXT,
    tonnage TEXT,
    required_truck_type TEXT,
    start_date TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'new',
    admin_note TEXT,
    created_at TEXT NOT NULL
  );`);

  await db.run(sql`CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mine_id INTEGER REFERENCES mines(id),
    lead_id INTEGER REFERENCES mine_leads(id),
    description TEXT,
    pickup_site TEXT,
    dropoff_site TEXT,
    material TEXT,
    tonnage INTEGER,
    required_truck_type TEXT,
    required_truck_count INTEGER,
    start_date TEXT,
    status TEXT NOT NULL DEFAULT 'open',
    admin_notes TEXT,
    created_by_admin_id INTEGER,
    created_at TEXT NOT NULL
  );`);

  await db.run(sql`CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    truck_id INTEGER NOT NULL REFERENCES trucks(id),
    status TEXT NOT NULL DEFAULT 'proposed',
    company_response_note TEXT,
    created_at TEXT NOT NULL
  );`);

  await db.run(sql`CREATE TABLE IF NOT EXISTS email_outbox (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER REFERENCES jobs(id),
    to_email TEXT NOT NULL,
    to_name TEXT,
    subject TEXT NOT NULL,
    body_text TEXT NOT NULL,
    body_html TEXT,
    status TEXT NOT NULL DEFAULT 'queued',
    provider_message_id TEXT,
    error_message TEXT,
    sent_at TEXT,
    created_at TEXT NOT NULL
  );`);

  await db.run(sql`CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TEXT NOT NULL
  );`);

  await db.run(sql`CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    number TEXT NOT NULL UNIQUE,
    direction TEXT NOT NULL,
    job_id INTEGER REFERENCES jobs(id),
    mine_id INTEGER REFERENCES mines(id),
    company_id INTEGER REFERENCES companies(id),
    status TEXT NOT NULL DEFAULT 'draft',
    issue_date TEXT NOT NULL,
    due_date TEXT,
    subtotal INTEGER NOT NULL DEFAULT 0,
    vat_amount INTEGER NOT NULL DEFAULT 0,
    total INTEGER NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'ZAR',
    notes TEXT,
    paid_at TEXT,
    created_at TEXT NOT NULL
  );`);

  await db.run(sql`CREATE TABLE IF NOT EXISTS invoice_lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price INTEGER NOT NULL DEFAULT 0,
    amount INTEGER NOT NULL DEFAULT 0
  );`);

  // ---------- Batch 2: assignment invites, mine users, drivers, PODs ----------
  await db.run(sql`CREATE TABLE IF NOT EXISTS assignment_invites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    to_email TEXT NOT NULL,
    to_name TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    response_note TEXT,
    expires_at TEXT NOT NULL,
    responded_at TEXT,
    created_at TEXT NOT NULL
  );`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS invite_token_idx ON assignment_invites(token);`);

  await db.run(sql`CREATE TABLE IF NOT EXISTS mine_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mine_id INTEGER NOT NULL,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    last_login_at TEXT
  );`);

  await db.run(sql`CREATE TABLE IF NOT EXISTS drivers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    pin_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    last_login_at TEXT
  );`);

  await db.run(sql`CREATE TABLE IF NOT EXISTS trip_updates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    assignment_id INTEGER,
    driver_id INTEGER NOT NULL,
    status TEXT NOT NULL,
    lat TEXT,
    lng TEXT,
    notes TEXT,
    created_at TEXT NOT NULL
  );`);

  await db.run(sql`CREATE TABLE IF NOT EXISTS pod_uploads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_update_id INTEGER NOT NULL,
    job_id INTEGER NOT NULL,
    driver_id INTEGER NOT NULL,
    kind TEXT NOT NULL DEFAULT 'other',
    file_path TEXT NOT NULL,
    file_name TEXT,
    file_size INTEGER,
    tons INTEGER,
    created_at TEXT NOT NULL
  );`);

  // ---------- Default rate/quote settings on first run ----------
  const defaults: Record<string, string> = {
    default_margin_pct: "15",
    default_vat_pct: "0",
    diesel_price_per_l: "25.50",
    r_per_tkm_coal: "2.10",
    r_per_tkm_chrome: "2.40",
    r_per_tkm_manganese: "2.30",
    r_per_tkm_pgms: "2.60",
    r_per_tkm_iron_ore: "2.00",
    r_per_tkm_default: "2.20",
    payment_terms_days: "30",
    company_vat_number: "",
    company_reg_number: "",
    company_bank_name: "",
    company_bank_account: "",
    invoice_prefix: "INV",
  };
  for (const [k, v] of Object.entries(defaults)) {
    await db.run(
      sql`INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES (${k}, ${v}, ${new Date().toISOString()})`,
    );
  }

  // ---------- Seed provinces (idempotent) ----------
  for (const p of SA_PROVINCES) {
    await db.run(
      sql`INSERT OR IGNORE INTO provinces (code, name) VALUES (${p.code}, ${p.name});`
    );
  }

  // ---------- Seed bootstrap admin (idempotent, race-safe) ----------
  const email =
    process.env.ADMIN_BOOTSTRAP_EMAIL ?? "admin@oramongale.co.za";
  const rawPassword =
    process.env.ADMIN_BOOTSTRAP_PASSWORD ?? "change-me-on-first-login";
  const passwordHash = await bcrypt.hash(rawPassword, 12);
  const now = new Date().toISOString();

  await db.run(sql`
    INSERT OR IGNORE INTO users (email, name, password_hash, role, must_change_password, created_at)
    VALUES (${email}, 'Admin', ${passwordHash}, 'admin', 1, ${now});
  `);

  const already = (await db.get(
    sql`SELECT COUNT(*) as c FROM audit_events WHERE action = 'bootstrap.admin_created'`
  )) as { c: number } | undefined;
  if (!already || already.c === 0) {
    await db.run(sql`
      INSERT INTO audit_events (action, actor_type, target_type, target_id, metadata_json, created_at)
      VALUES ('bootstrap.admin_created', 'system', 'users', 'bootstrap', ${JSON.stringify({ email })}, ${now});
    `);
    // eslint-disable-next-line no-console
    console.log(
      `[bootstrap] Admin account ready: ${email} (change password on first login)`
    );
  }

  // ---------- Auto-seed demo data on empty DB ----------
  // On Vercel serverless the DB lives in /tmp and resets between cold starts
  // (ephemeral), so demo data is reseeded automatically. Controlled via
  // SEED_DEMO env var (default: true).
  const seedFlag = process.env.SEED_DEMO ?? "true";
  if (seedFlag === "true" || seedFlag === "1") {
    try {
      if (!(await isDemoSeeded())) {
        console.log("[bootstrap] Seeding demo data...");
        await seedDemoData();
        console.log("[bootstrap] Demo data seeded.");
      }
    } catch (e) {
      console.error("[bootstrap] Demo seed failed:", e);
    }
  }
}

/** Mark a login event for an admin user. */
export async function recordAdminLogin(userId: number) {
  await db
    .update(users)
    .set({ lastLoginAt: new Date().toISOString() })
    .where(eq(users.id, userId));
  await db.insert(auditEvents).values({
    actorId: userId,
    actorType: "admin",
    action: "login.success",
    createdAt: new Date().toISOString(),
  });
}
