import { NextResponse } from "next/server";
import { globalSearch } from "@/lib/admin/queries";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const results = await globalSearch(q);
  return NextResponse.json({ results });
}

export const runtime = "nodejs";
