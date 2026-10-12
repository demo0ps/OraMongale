import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// ---------------------------------------------------------------------------
// Admin users (ORAMONGALE staff).
// ---------------------------------------------------------------------------
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name").notNull().default("Admin"),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin"] }).notNull().default("admin"),
  mustChangePassword: integer("must_change_password", { mode: "boolean" })
    .notNull()
    .default(true),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  lastLoginAt: text("last_login_at"),
});

// ---------------------------------------------------------------------------
// Append-only audit log.
// ---------------------------------------------------------------------------
export const auditEvents = sqliteTable("audit_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  actorId: integer("actor_id"),
  actorType: text("actor_type"), // "admin" | "company_user" | "system"
  action: text("action").notNull(),
  targetType: text("target_type"),
  targetId: text("target_id"),
  metadataJson: text("metadata_json"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// ---------------------------------------------------------------------------
// Reference: SA provinces (static list, seeded once).
// ---------------------------------------------------------------------------
export const provinces = sqliteTable("provinces", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(), // e.g. "MP", "LP", "NC"
  name: text("name").notNull().unique(), // "Mpumalanga"
});

// ---------------------------------------------------------------------------
// Companies (haulage operators).
// ---------------------------------------------------------------------------
export const companies = sqliteTable("companies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  contactName: text("contact_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone").notNull(),
  baseProvinceId: integer("base_province_id").references(() => provinces.id),
  status: text("status", {
    enum: ["pending_review", "approved", "rejected"],
  })
    .notNull()
    .default("pending_review"),
  reviewNote: text("review_note"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const companyOperatingProvinces = sqliteTable(
  "company_operating_provinces",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    provinceId: integer("province_id")
      .notNull()
      .references(() => provinces.id),
  }
);

// Login accounts for company users.
export const companyUsers = sqliteTable("company_users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: integer("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .notNull()
    .default(false),
  emailVerifyToken: text("email_verify_token"),
  emailVerifyExpiresAt: text("email_verify_expires_at"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  lastLoginAt: text("last_login_at"),
});

// ---------------------------------------------------------------------------
// Compliance documents (one table for both company-level and truck-level docs).
// ---------------------------------------------------------------------------
export const complianceDocs = sqliteTable("compliance_docs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: integer("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  truckId: integer("truck_id"), // null for company-level docs
  docType: text("doc_type").notNull(),
  // e.g. "cipc", "coida", "liability_insurance", "git",
  //      "license_disc", "roadworthy", "operator_card", "nlta_permit"
  fileName: text("file_name"),
  fileUrl: text("file_url").notNull(),
  expiryDate: text("expiry_date"), // ISO date; null means non-expiring
  status: text("status", { enum: ["pending", "verified", "rejected"] })
    .notNull()
    .default("pending"),
  reviewNote: text("review_note"),
  uploadedByCompanyUserId: integer("uploaded_by_company_user_id").references(
    () => companyUsers.id
  ),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  reviewedAt: text("reviewed_at"),
});

// ---------------------------------------------------------------------------
// Trucks.
// ---------------------------------------------------------------------------
export const trucks = sqliteTable("trucks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: integer("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  truckType: text("truck_type", {
    enum: [
      "side_tipper",
      "interlink_tipper",
      "flat_deck",
      "lowbed",
      "superlink",
      "tipper",
      "water_tanker",
      "fuel_tanker",
    ],
  }).notNull(),
  make: text("make"),
  model: text("model"),
  year: integer("year"),
  capacityTons: integer("capacity_tons"),
  baseLocation: text("base_location"),
  // Computed status:
  //   docs_pending  – required compliance docs missing or pending review
  //   available     – approved, no active assignment, docs in date
  //   on_job        – assigned to an in-progress job (set by matching)
  //   rejected      – admin rejected the truck
  //   docs_expired  – a mandatory doc is past expiry (auto)
  status: text("status", {
    enum: ["docs_pending", "available", "on_job", "rejected", "docs_expired"],
  })
    .notNull()
    .default("docs_pending"),
  reviewNote: text("review_note"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// ---------------------------------------------------------------------------
// Mines (contacts added manually by admin, or created from a lead).
// ---------------------------------------------------------------------------
export const mines = sqliteTable("mines", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  contactName: text("contact_name"),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  siteAddress: text("site_address"),
  provinceId: integer("province_id").references(() => provinces.id),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// ---------------------------------------------------------------------------
// Leads (public "post a haulage need" submissions).
// ---------------------------------------------------------------------------
export const mineLeads = sqliteTable("mine_leads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  mineName: text("mine_name").notNull(),
  contactName: text("contact_name").notNull(),
  contactPhone: text("contact_phone").notNull(),
  contactEmail: text("contact_email"),
  material: text("material"),
  pickupSite: text("pickup_site"),
  dropoffSite: text("dropoff_site"),
  tonnage: text("tonnage"),
  requiredTruckType: text("required_truck_type"),
  startDate: text("start_date"),
  notes: text("notes"),
  status: text("status", { enum: ["new", "contacted", "converted", "lost"] })
    .notNull()
    .default("new"),
  adminNote: text("admin_note"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// ---------------------------------------------------------------------------
// Jobs & assignments (Sprint 4–5 — included in schema now so FKs exist; UI
// comes after onboarding).
// ---------------------------------------------------------------------------
export const jobs = sqliteTable("jobs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  mineId: integer("mine_id").references(() => mines.id),
  leadId: integer("lead_id").references(() => mineLeads.id),
  description: text("description"),
  pickupSite: text("pickup_site"),
  dropoffSite: text("dropoff_site"),
  material: text("material"),
  tonnage: integer("tonnage"),
  requiredTruckType: text("required_truck_type"),
  requiredTruckCount: integer("required_truck_count"),
  startDate: text("start_date"),
  status: text("status", {
    enum: ["open", "matching", "assigned", "in_progress", "completed", "cancelled"],
  })
    .notNull()
    .default("open"),
  adminNotes: text("admin_notes"),
  createdByAdminId: integer("created_by_admin_id"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const assignments = sqliteTable("assignments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  jobId: integer("job_id")
    .notNull()
    .references(() => jobs.id, { onDelete: "cascade" }),
  truckId: integer("truck_id")
    .notNull()
    .references(() => trucks.id),
  status: text("status", {
    enum: ["proposed", "accepted", "declined", "completed"],
  })
    .notNull()
    .default("proposed"),
  companyResponseNote: text("company_response_note"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
