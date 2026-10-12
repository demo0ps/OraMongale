import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, ensureBootstrap } from "@/db";
import { invoices } from "@/db/ops-schema";
import { loadInvoiceForPdf } from "@/lib/invoice-data";
import { getInvoiceSettings } from "@/lib/invoice-settings";
import { renderInvoicePdf } from "@/lib/pdf-render";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ number: string }> }
) {
  await ensureBootstrap();
  const { number } = await params;
  const row = await db.select().from(invoices).where(eq(invoices.number, number)).limit(1);
  const inv = row[0];
  if (!inv) return NextResponse.json({ error: "not found" }, { status: 404 });

  const data = await loadInvoiceForPdf(inv.id);
  const settings = await getInvoiceSettings();
  const stream = renderInvoicePdf(data, settings);
  const chunks: Buffer[] = [];
  for await (const c of stream as any) chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c));
  const buf = Buffer.concat(chunks);

  const download = req.nextUrl.searchParams.get("download") === "1";
  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${data.number}.pdf"`,
      "Content-Length": String(buf.length),
      "Cache-Control": "private, no-store",
    },
  });
}
