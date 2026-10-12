import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function GET(req: NextRequest) {
  const obj: Record<string, string> = {};
  req.headers.forEach((v, k) => {
    obj[k] = v;
  });
  return NextResponse.json({
    url: req.url,
    nextUrl: {
      host: req.nextUrl.host,
      protocol: req.nextUrl.protocol,
      origin: req.nextUrl.origin,
    },
    headers: obj,
  });
}
