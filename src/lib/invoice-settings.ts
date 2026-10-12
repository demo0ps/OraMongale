import { db } from "@/db";
import { sql } from "drizzle-orm";
import { getSetting, setSetting } from "./mail-settings";

export interface InvoiceSettings {
  legalName: string;
  tradingName: string;
  regNumber: string;
  vatNumber: string;
  vatRate: number;
  physicalAddress: string;
  postalAddress: string;
  billingEmail: string;
  billingPhone: string;
  bankName: string;
  bankAccountHolder: string;
  bankAccountNumber: string;
  bankBranchCode: string;
  bankBranchName: string;
  paymentTermsDays: number;
  invoiceFooterNote: string;
}

const DEFAULTS: InvoiceSettings = {
  legalName: "OraMongale Tradings (Pty) Ltd",
  tradingName: "OraMongale",
  regNumber: "TBD",
  vatNumber: "Not registered",
  vatRate: 0,
  physicalAddress: "Johannesburg, Gauteng, South Africa",
  postalAddress: "P.O. Box — TBD",
  billingEmail: "Oramongaletradings@gmail.com",
  billingPhone: "+27 72 820 4661",
  bankName: "TBD",
  bankAccountHolder: "OraMongale Tradings (Pty) Ltd",
  bankAccountNumber: "TBD",
  bankBranchCode: "TBD",
  bankBranchName: "TBD",
  paymentTermsDays: 30,
  invoiceFooterNote:
    "Thank you for your business. Please use the invoice number as the payment reference. EFT only — no cash deposits.",
};

const KEYS: (keyof InvoiceSettings)[] = [
  "legalName", "tradingName", "regNumber", "vatNumber", "vatRate",
  "physicalAddress", "postalAddress", "billingEmail", "billingPhone",
  "bankName", "bankAccountHolder", "bankAccountNumber", "bankBranchCode",
  "bankBranchName", "paymentTermsDays", "invoiceFooterNote",
];

export async function getInvoiceSettings(): Promise<InvoiceSettings> {
  const out: any = { ...DEFAULTS };
  for (const k of KEYS) {
    const v = await getSetting(`invoice_${k}`);
    if (v !== null && v !== undefined && v !== "") {
      if (k === "vatRate" || k === "paymentTermsDays") {
        const n = Number(v);
        out[k] = Number.isFinite(n) ? n : DEFAULTS[k];
      } else {
        out[k] = v;
      }
    }
  }
  return out;
}

export async function saveInvoiceSettings(patch: Partial<InvoiceSettings>) {
  for (const [kRaw, v] of Object.entries(patch)) {
    const k = kRaw as keyof InvoiceSettings;
    if (!KEYS.includes(k)) continue;
    await setSetting(`invoice_${k}`, v === null || v === undefined ? "" : String(v));
  }
}

export type Direction = "incoming" | "outgoing";

export async function nextInvoiceNumber(direction: Direction): Promise<string> {
  const prefix = direction === "incoming" ? "INV" : "CRN";
  const year = new Date().getFullYear();
  const prefixStr = `${prefix}-${year}-`;
  const like = prefixStr + "%";
  const row = db.get<{ n: string | null }>(
    sql`SELECT number as n FROM invoices WHERE number LIKE ${like} ORDER BY number DESC LIMIT 1`
  );
  let seq = 1;
  if (row?.n && row.n.startsWith(prefixStr)) {
    const n = parseInt(row.n.slice(prefixStr.length), 10);
    if (Number.isFinite(n)) seq = n + 1;
  }
  return `${prefixStr}${String(seq).padStart(4, "0")}`;
}

export function formatMoney(n: number): string {
  return "R " + (Number(n) || 0).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
