import { NextRequest, NextResponse } from "next/server";
import { loadInvoiceForPdf } from "@/lib/invoice-data";
import { getInvoiceSettings } from "@/lib/invoice-settings";
import { renderInvoicePdf } from "@/lib/pdf-render";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const invId = Number(id);
  if (!Number.isFinite(invId)) return NextResponse.json({ error: "bad id" }, { status: 400 });

  const data = await loadInvoiceForPdf(invId);
  const settings = await getInvoiceSettings();
  const stream = renderInvoicePdf(data, settings);

  // Collect into a Buffer (easy, invoices are small).
  const chunks: Buffer[] = [];
  for await (const c of stream as any) chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c));
  const buf = Buffer.concat(chunks);

  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${data.number}.pdf"`,
      "Content-Length": String(buf.length),
      "Cache-Control": "private, no-store",
    },
  });
}
