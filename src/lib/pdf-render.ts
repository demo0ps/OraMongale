import PDFDocument from "pdfkit";
import type { Readable } from "node:stream";
import path from "node:path";
import fs from "node:fs";
import { formatMoney } from "./invoice-settings";
import type { InvoiceSettings } from "./invoice-settings";

export interface InvoicePdfInput {
  number: string;
  direction: "incoming" | "outgoing";
  status: string;
  issueDate: string;
  dueDate: string | null;
  subtotal: number;
  vatAmount: number;
  total: number;
  notes: string | null;
  lines: { description: string; quantity: number; unitPrice: number; amount: number }[];
  job?: {
    material: string | null;
    pickupSite: string | null;
    dropoffSite: string | null;
    tonnage: number | null;
  } | null;
  billTo: {
    name: string;
    contactName?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    address?: string | null;
    regNumber?: string | null;
    vatNumber?: string | null;
  };
}

// Brand palette
const BLACK = "#0a0a0a";
const INK = "#111111";
const GOLD = "#c9a24a";
const GOLD_DARK = "#a88534";
const GREY_LINE = "#d9d9d9";
const GREY_SOFT = "#f6f3ec";
const WHITE = "#ffffff";

export function renderInvoicePdf(inv: InvoicePdfInput, s: InvoiceSettings): Readable {
  const doc = new PDFDocument({ size: "A4", margin: 48, info: { Title: inv.number } });

  // ----- HEADER BAND (black) -----
  doc.rect(0, 0, doc.page.width, 110).fill(BLACK);

  // Logo — try to embed the transparent PNG; skip silently if missing.
  const logoPath = path.join(process.cwd(), "public", "brand", "logo.png");
  if (fs.existsSync(logoPath)) {
    try {
      doc.image(logoPath, 48, 22, { fit: [80, 70] });
    } catch {
      // ignore
    }
  }

  // Trading name in gold on header
  doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(22).text(s.tradingName.toUpperCase(), 150, 28, { align: "right", width: doc.page.width - 198 });
  doc.fillColor(WHITE).font("Helvetica").fontSize(9).text(s.legalName, 150, 56, { align: "right", width: doc.page.width - 198 });
  const regLine = `Reg: ${s.regNumber}  •  VAT: ${s.vatNumber}`;
  doc.fillColor("#cfcfcf").fontSize(8).text(regLine, 150, 70, { align: "right", width: doc.page.width - 198 });
  doc.fillColor(GOLD).fontSize(9).text(s.billingPhone + "  •  " + s.billingEmail, 150, 84, { align: "right", width: doc.page.width - 198 });

  // ----- Title strip -----
  const titleY = 135;
  doc.rect(0, 115, doc.page.width, 50).fill(GOLD);
  const title = inv.direction === "incoming" ? "TAX INVOICE" : "REMITTANCE ADVICE";
  doc.fillColor(BLACK).font("Helvetica-Bold").fontSize(22).text(title, 48, titleY - 5);

  // ----- Bill-from / Bill-to block -----
  const blockY = 190;
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(9).text("FROM", 48, blockY);
  doc.font("Helvetica").fontSize(9).fillColor(INK);
  const fromLines = [
    s.legalName,
    s.physicalAddress,
    s.postalAddress,
    `Email: ${s.billingEmail}`,
    `Tel: ${s.billingPhone}`,
    `Reg: ${s.regNumber}`,
    `VAT: ${s.vatNumber}`,
  ].filter(Boolean);
  doc.text(fromLines.join("\n"), 48, blockY + 13, { width: 230, lineGap: 2 });

  doc.fillColor(INK).font("Helvetica-Bold").fontSize(9).text(inv.direction === "incoming" ? "BILL TO" : "PAY TO", 300, blockY);
  doc.font("Helvetica").fontSize(9).fillColor(INK);
  const toLines = [
    inv.billTo.name,
    inv.billTo.contactName ? `Attn: ${inv.billTo.contactName}` : "",
    inv.billTo.address || "",
    inv.billTo.contactEmail ? `Email: ${inv.billTo.contactEmail}` : "",
    inv.billTo.contactPhone ? `Tel: ${inv.billTo.contactPhone}` : "",
    inv.billTo.regNumber ? `Reg: ${inv.billTo.regNumber}` : "",
    inv.billTo.vatNumber ? `VAT: ${inv.billTo.vatNumber}` : "",
  ].filter(Boolean);
  doc.text(toLines.join("\n"), 300, blockY + 13, { width: 250, lineGap: 2 });

  // ----- Invoice meta box (right aligned) -----
  const metaY = blockY;
  const metaX = doc.page.width - 200;
  doc.fillColor(GREY_SOFT).rect(metaX, metaY, 152, 68).fill();
  doc.rect(metaX, metaY, 152, 68).strokeColor(GREY_LINE).stroke();
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(8).text("INVOICE NO.", metaX + 8, metaY + 8);
  doc.font("Helvetica-Bold").fontSize(12).fillColor(BLACK).text(inv.number, metaX + 8, metaY + 18);
  doc.font("Helvetica-Bold").fontSize(8).fillColor(INK).text("DATE", metaX + 8, metaY + 34);
  doc.font("Helvetica").fontSize(9).fillColor(BLACK).text(inv.issueDate, metaX + 8, metaY + 44);
  doc.font("Helvetica-Bold").fontSize(8).fillColor(INK).text("DUE DATE", metaX + 80, metaY + 34);
  doc.font("Helvetica").fontSize(9).fillColor(BLACK).text(inv.dueDate ?? "—", metaX + 80, metaY + 44);

  // ----- Job summary (if available) -----
  let y = blockY + 95;
  if (inv.job) {
    doc.rect(48, y - 6, doc.page.width - 96, 48).fill(GREY_SOFT);
    doc.rect(48, y - 6, doc.page.width - 96, 48).strokeColor(GREY_LINE).stroke();
    doc.font("Helvetica-Bold").fontSize(9).fillColor(BLACK).text("JOB SUMMARY", 56, y);
    doc.font("Helvetica").fontSize(9).fillColor(INK);
    const col1 = [
      inv.job.material ? `Commodity: ${inv.job.material}` : "",
      inv.job.pickupSite ? `From: ${inv.job.pickupSite}` : "",
      inv.job.dropoffSite ? `To: ${inv.job.dropoffSite}` : "",
    ].filter(Boolean).join("   •   ");
    const col2 = inv.job.tonnage ? `Tonnage: ${Number(inv.job.tonnage).toLocaleString()} t` : "";
    doc.text(col1, 56, y + 14, { width: doc.page.width - 200 });
    doc.font("Helvetica-Bold").text(col2, doc.page.width - 148, y + 14, { width: 100, align: "right" });
    y += 54;
  }

  // ----- Line items table -----
  const tableTop = y;
  const tableX = 48;
  const tableW = doc.page.width - 96;
  const colQtyW = 50;
  const colRateW = 80;
  const colAmtW = 90;
  const colDescW = tableW - colQtyW - colRateW - colAmtW;

  // header
  doc.rect(tableX, tableTop, tableW, 22).fill(BLACK);
  doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(9);
  doc.text("DESCRIPTION", tableX + 8, tableTop + 7, { width: colDescW - 8 });
  doc.text("QTY", tableX + colDescW, tableTop + 7, { width: colQtyW, align: "right" });
  doc.text("UNIT PRICE", tableX + colDescW + colQtyW, tableTop + 7, { width: colRateW, align: "right" });
  doc.text("AMOUNT", tableX + colDescW + colQtyW + colRateW, tableTop + 7, { width: colAmtW - 8, align: "right" });

  let rowY = tableTop + 22;
  const rowH = 20;
  doc.font("Helvetica").fontSize(9).fillColor(INK);
  inv.lines.forEach((l, i) => {
    const bg = i % 2 === 1 ? GREY_SOFT : WHITE;
    doc.rect(tableX, rowY, tableW, rowH).fill(bg);
    doc.rect(tableX, rowY, tableW, rowH).strokeColor(GREY_LINE).lineWidth(0.3).stroke();
    doc.fillColor(INK).text(l.description, tableX + 8, rowY + 6, { width: colDescW - 8 });
    doc.text(Number(l.quantity).toLocaleString(), tableX + colDescW, rowY + 6, { width: colQtyW, align: "right" });
    doc.text(formatMoney(Number(l.unitPrice)), tableX + colDescW + colQtyW, rowY + 6, { width: colRateW, align: "right" });
    doc.font("Helvetica-Bold").text(formatMoney(Number(l.amount)), tableX + colDescW + colQtyW + colRateW, rowY + 6, { width: colAmtW - 8, align: "right" });
    doc.font("Helvetica");
    rowY += rowH;
  });

  // ----- Totals -----
  const totalsX = tableX + colDescW + colQtyW + colRateW;
  const totalsW = colAmtW;
  const tLabel = (label: string, val: string, bold = false, gold = false) => {
    doc.rect(totalsX, rowY, totalsW, rowH).fill(gold ? GOLD : WHITE);
    doc.rect(totalsX, rowY, totalsW, rowH).strokeColor(GREY_LINE).lineWidth(0.3).stroke();
    doc.fillColor(gold ? BLACK : INK).font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(9);
    doc.text(label, totalsX + 8, rowY + 6, { width: totalsW - 90, align: "left" });
    doc.text(val, totalsX, rowY + 6, { width: totalsW - 8, align: "right" });
    rowY += rowH;
  };
  tLabel("Subtotal", formatMoney(inv.subtotal));
  if (s.vatRate > 0 || inv.vatAmount > 0) {
    tLabel(`VAT @ ${s.vatRate}%`, formatMoney(inv.vatAmount));
  } else {
    tLabel("VAT", `${formatMoney(0)}  (${s.vatNumber})`);
  }
  tLabel("TOTAL DUE", formatMoney(inv.total), true, true);

  // ----- Payment instructions -----
  rowY += 18;
  doc.rect(48, rowY, doc.page.width - 96, 6).fill(GOLD);
  rowY += 14;
  doc.fillColor(BLACK).font("Helvetica-Bold").fontSize(10).text("PAYMENT INSTRUCTIONS", 48, rowY);
  rowY += 16;
  doc.font("Helvetica").fontSize(9).fillColor(INK);
  const bankLines = [
    `Bank: ${s.bankName}`,
    `Account holder: ${s.bankAccountHolder}`,
    `Account number: ${s.bankAccountNumber}`,
    `Branch code: ${s.bankBranchCode}${s.bankBranchName ? ` (${s.bankBranchName})` : ""}`,
    `Reference: ${inv.number}`,
  ];
  doc.text(bankLines.join("\n"), 48, rowY, { width: doc.page.width - 96, lineGap: 3 });
  rowY += 60;

  doc.rect(48, rowY, doc.page.width - 96, 6).fill(GOLD);
  rowY += 14;
  doc.fillColor(BLACK).font("Helvetica-Bold").fontSize(10).text(`TERMS: ${s.paymentTermsDays} DAYS FROM DATE OF INVOICE`, 48, rowY);
  rowY += 18;
  doc.font("Helvetica").fontSize(9).fillColor(INK).text(s.invoiceFooterNote, 48, rowY, { width: doc.page.width - 96 });

  if (inv.notes) {
    rowY += 40;
    doc.fillColor(BLACK).font("Helvetica-Bold").fontSize(10).text("NOTES", 48, rowY);
    rowY += 16;
    doc.font("Helvetica").fontSize(9).fillColor(INK).text(inv.notes, 48, rowY, { width: doc.page.width - 96 });
  }

  // ----- Footer -----
  const footerY = doc.page.height - 40;
  doc.moveTo(48, footerY - 6).lineTo(doc.page.width - 48, footerY - 6).strokeColor(GOLD).lineWidth(1).stroke();
  doc.fillColor(GOLD_DARK).font("Helvetica-Bold").fontSize(8).text(
    `${s.tradingName}  •  ${s.legalName}  •  Reg: ${s.regNumber}  •  VAT: ${s.vatNumber}`,
    48, footerY, { width: doc.page.width - 96, align: "center" }
  );
  doc.fillColor("#666").font("Helvetica").fontSize(7).text(
    "This is a system-generated document. EFT only — no cash deposits.",
    48, footerY + 12, { width: doc.page.width - 96, align: "center" }
  );

  doc.end();
  return doc;
}
