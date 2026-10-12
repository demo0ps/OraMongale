import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// No-op middleware preserved for future use. Admin auth is currently disabled
// (preview mode), so no CSRF cookie is needed.
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}
