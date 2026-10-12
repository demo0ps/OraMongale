import { NextResponse } from "next/server";
import { clearMineSessionCookie } from "@/lib/mine-auth";

export async function POST() {
  await clearMineSessionCookie();
  return NextResponse.json({ ok: true });
}
export const runtime = "nodejs";
