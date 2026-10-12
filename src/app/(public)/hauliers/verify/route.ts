import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { eq, sql, and, gt } from "drizzle-orm";
import { db } from "@/db";
import { companyUsers, auditEvents } from "@/db/schema";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const badTarget = new URL("/hauliers/dashboard", req.url);
  if (!token) return NextResponse.redirect(badTarget);

  const found = await db
    .select()
    .from(companyUsers)
    .where(eq(companyUsers.emailVerifyToken, token))
    .limit(1);
  const user = found[0];
  if (!user) return NextResponse.redirect(badTarget);
  if (
    user.emailVerifyExpiresAt &&
    new Date(user.emailVerifyExpiresAt).getTime() < Date.now()
  ) {
    return NextResponse.redirect(
      new URL("/hauliers/dashboard", req.url)
    );
  }

  await db.run(sql`
    UPDATE company_users
    SET email_verified = 1, email_verify_token = NULL, email_verify_expires_at = NULL
    WHERE id = ${user.id};
  `);
  await db.run(sql`
    INSERT INTO audit_events (actor_id, actor_type, action, target_type, target_id, created_at)
    VALUES (${user.id}, 'company_user', 'company.email_verified', 'companies', ${String(user.companyId)}, ${new Date().toISOString()});
  `);

  return NextResponse.redirect(new URL("/hauliers/dashboard", req.url));
}
