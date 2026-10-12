import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { companies, mines } from "./schema";
import { jobs } from "./schema";

// Mail outbox: every assignment notification (and any other transactional
// email) gets a row here. If SMTP is configured it is sent immediately;
// otherwise it sits here ready to be sent later.
export const emailOutbox = sqliteTable("email_outbox", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  jobId: integer("job_id").references(() => jobs.id),
  toEmail: text("to_email").notNull(),
  toName: text("to_name"),
  subject: text("subject").notNull(),
  bodyText: text("body_text").notNull(),
  bodyHtml: text("body_html"),
  status: text("status", { enum: ["queued", "sent", "failed"] })
    .notNull()
    .default("queued"),
  providerMessageId: text("provider_message_id"),
  errorMessage: text("error_message"),
  sentAt: text("sent_at"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const assignmentInvites = sqliteTable("assignment_invites", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  assignmentId: integer("assignment_id").notNull(),
  token: text("token").notNull().unique(),
  toEmail: text("to_email").notNull(),
  toName: text("to_name"),
  status: text("status", { enum: ["pending", "accepted", "declined", "expired"] })
    .notNull()
    .default("pending"),
  responseNote: text("response_note"),
  expiresAt: text("expires_at").notNull(),
  respondedAt: text("responded_at"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const mineUsers = sqliteTable("mine_users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  mineId: integer("mine_id").notNull(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  lastLoginAt: text("last_login_at"),
});

export const drivers = sqliteTable("drivers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: integer("company_id").notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  pinHash: text("pin_hash").notNull(),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  lastLoginAt: text("last_login_at"),
});

export const tripUpdates = sqliteTable("trip_updates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  jobId: integer("job_id").notNull(),
  assignmentId: integer("assignment_id"),
  driverId: integer("driver_id").notNull(),
  status: text("status", {
    enum: ["accepted", "en_route_pickup", "arrived_pickup", "loading", "en_route_dropoff", "arrived_dropoff", "delivered"],
  }).notNull(),
  lat: text("lat"),
  lng: text("lng"),
  notes: text("notes"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const podUploads = sqliteTable("pod_uploads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tripUpdateId: integer("trip_update_id").notNull(),
  jobId: integer("job_id").notNull(),
  driverId: integer("driver_id").notNull(),
  kind: text("kind", { enum: ["weighbridge", "delivery", "other"] })
    .notNull()
    .default("other"),
  filePath: text("file_path").notNull(),
  fileName: text("file_name"),
  fileSize: integer("file_size"),
  tons: integer("tons"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
