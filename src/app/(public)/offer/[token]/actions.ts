"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { assignmentInvites } from "@/db/mail-schema";
import { assignments } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function respondToOffer(token: string, action: "accept" | "decline", note?: string) {
  const invite = (await db.select().from(assignmentInvites).where(eq(assignmentInvites.token, token)).limit(1))[0];
  if (!invite) return { error: "Invalid or expired link." };
  if (invite.status !== "pending") return { error: "You have already responded to this offer." };
  if (new Date(invite.expiresAt) < new Date()) {
    await db.update(assignmentInvites).set({ status: "expired" }).where(eq(assignmentInvites.id, invite.id));
    return { error: "This offer has expired." };
  }
  const assignmentStatus = action === "accept" ? "accepted" : "declined";
  await db.update(assignments).set({ status: assignmentStatus as any, companyResponseNote: note ?? null }).where(eq(assignments.id, invite.assignmentId));
  await db
    .update(assignmentInvites)
    .set({ status: action === "accept" ? "accepted" : "declined", responseNote: note ?? null, respondedAt: new Date().toISOString() })
    .where(eq(assignmentInvites.id, invite.id));
  revalidatePath("/admin/jobs");
  redirect(`/offer/${token}?responded=${action}`);
}
