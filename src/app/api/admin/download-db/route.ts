import { NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs";

// Download the whole SQLite database. Because this is the preview build
// without real auth, no further gating — remove or password-lock before
// deploying publicly.
export async function GET() {
  const isServerless =
    !!process.env.VERCEL ||
    !!process.env.VERCEL_ENV ||
    process.cwd() === "/var/task";
  const defaultDbPath = isServerless ? "/tmp/oramongale.db" : "data/oramongale.db";
  let dbPath =
    process.env.DATABASE_URL?.replace(/^file:/, "") ?? defaultDbPath;
  let abs = path.isAbsolute(dbPath)
    ? dbPath
    : path.join(process.cwd(), dbPath);
  if (!fs.existsSync(abs)) abs = "/tmp/oramongale.db";
  if (!fs.existsSync(abs)) {
    return NextResponse.json({ error: "no database" }, { status: 404 });
  }
  const buf = fs.readFileSync(abs);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.sqlite3",
      "Content-Disposition": `attachment; filename="oramongale-${stamp}.db"`,
    },
  });
}

export const runtime = "nodejs";
