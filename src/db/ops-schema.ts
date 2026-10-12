import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// Persistent key/value settings stored in the DB so they survive restarts.
// We never log the smtp_password value directly.
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value"),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// Compliance documents already exist in schema.ts — we don't re-declare them.

// Invoices (broker model: invoices from mine → OraMongale, and OraMongale → haulier).
export const invoices = sqliteTable("invoices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  number: text("number").notNull().unique(), // e.g. INV-2026-0001
  direction: text("direction", { enum: ["incoming", "outgoing"] }).notNull(),
  // incoming = mine pays OraMongale
  // outgoing = OraMongale pays haulier
  jobId: integer("job_id"),
  mineId: integer("mine_id"),
  companyId: integer("company_id"), // haulier company id, for outgoing invoices
  status: text("status", {
    enum: ["draft", "sent", "paid", "overdue", "cancelled"],
  })
    .notNull()
    .default("draft"),
  issueDate: text("issue_date").notNull(),
  dueDate: text("due_date"),
  subtotal: integer("subtotal").notNull().default(0), // in cents/rands integer
  vatAmount: integer("vat_amount").notNull().default(0),
  total: integer("total").notNull().default(0),
  currency: text("currency").notNull().default("ZAR"),
  notes: text("notes"),
  paidAt: text("paid_at"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const invoiceLines = sqliteTable("invoice_lines", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  invoiceId: integer("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: integer("unit_price").notNull().default(0), // cents
  amount: integer("amount").notNull().default(0),
});
