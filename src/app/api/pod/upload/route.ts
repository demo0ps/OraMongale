import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { db } from "@/db";
import { tripUpdates, podUploads } from "@/db/mail-schema";
import { getDriverSession } from "@/lib/driver-auth";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const s = await getDriverSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  const jobId = Number(form.get("jobId"));
  const assignmentIdRaw = form.get("assignmentId");
  const assignmentId = assignmentIdRaw ? Number(assignmentIdRaw) : null;
  const status = String(form.get("status") ?? "delivered");
  const tons = Number(form.get("tons") ?? 0) || null;
  const kind = String(form.get("kind") ?? "other");
  const notes = String(form.get("notes") ?? "") || null;
  const lat = String(form.get("lat") ?? "") || null;
  const lng = String(form.get("lng") ?? "") || null;

  if (!(file instanceof File) || !jobId) {
    return NextResponse.json({ error: "Missing file or job" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  // Vercel serverless fs is read-only under /var/task; use /tmp.
  const isVercel = !!process.env.VERCEL;
  const uploadDir = isVercel
    ? "/tmp/pods"
    : path.join(process.cwd(), "public", "uploads", "pods");
  fs.mkdirSync(uploadDir, { recursive: true });
  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
  const safeExt = ["jpg", "jpeg", "png", "webp", "pdf"].includes(ext) ? ext : "jpg";
  const fname = `${Date.now()}-${randomBytes(6).toString("hex")}.${safeExt}`;
  const fullPath = path.join(uploadDir, fname);
  fs.writeFileSync(fullPath, buf);
  // POD images won't be served from /tmp on Vercel; fileUrl is for local dev.
  // In production the DB record stores fullPath; the admin POD viewer will fall back.
  const fileUrl = isVercel ? null : `/uploads/pods/${fname}`;

  // Insert trip update
  const ins = await db
    .insert(tripUpdates)
    .values({
      jobId,
      assignmentId,
      driverId: s.driverId,
      status: status as any,
      lat,
      lng,
      notes,
    })
    .returning();
  const tuId = ins[0]!.id;

  await db.insert(podUploads).values({
    tripUpdateId: tuId,
    jobId,
    driverId: s.driverId,
    kind: kind as any,
    filePath: fileUrl as any,
    fileName: file.name,
    fileSize: buf.length,
    tons,
  });

  return NextResponse.json({ ok: true, tripUpdateId: tuId, filePath: fileUrl });
}
