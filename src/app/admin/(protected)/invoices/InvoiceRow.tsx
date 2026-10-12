"use client";
import { useTransition } from "react";
import Link from "next/link";

const fmtMoney = (n: number | null) => {
  const v = n ?? 0;
  return "R " + v.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function InvoiceRow({
  inv,
  onStatus,
}: {
  inv: any;
  onStatus: (id: number, s: any) => Promise<void> | void;
}) {
  const [pending, start] = useTransition();
  const handleStatus = (id: number, s: any) => { start(async () => { await onStatus(id, s); }); };
  const statusColors: Record<string, string> = {
    draft: "bg-slate-100 text-slate-700 border-slate-200",
    sent: "bg-blue-50 text-blue-800 border-blue-200",
    paid: "bg-emerald-50 text-emerald-800 border-emerald-200",
    overdue: "bg-red-50 text-red-700 border-red-200",
    cancelled: "bg-bone text-steel border-dust",
  };
  return (
    <tr className="border-t border-dust">
      <td className="px-4 py-2 font-mono text-xs text-steel">
        <Link href={`/invoice/${inv.inv.number}`} className="hover:underline" target="_blank">{inv.inv.number}</Link>
      </td>
      <td className="px-4 py-2">
        <span className={"text-xs rounded-full border px-2 py-0.5 " + (inv.inv.direction === "incoming" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-amber-50 text-amber-800 border-amber-200")}>
          {inv.inv.direction === "incoming" ? "Mine → us" : "Us → haulier"}
        </span>
      </td>
      <td className="px-4 py-2 text-coal max-w-md">
        <div className="truncate">
          {inv.mine?.name ?? inv.companyName ?? inv.company?.name ?? inv.inv.notes ?? `Job #${inv.inv.jobId}`}
        </div>
        {inv.inv.notes && <div className="text-[11px] text-steel truncate">{inv.inv.notes}</div>}
      </td>
      <td className="px-4 py-2 text-xs text-steel">
        {inv.inv.issueDate ? new Date(inv.inv.issueDate).toLocaleDateString("en-ZA") : "—"}
      </td>
      <td className="px-4 py-2 text-xs text-steel">
        {inv.inv.dueDate ? new Date(inv.inv.dueDate).toLocaleDateString("en-ZA") : "—"}
      </td>
      <td className="px-4 py-2 text-right font-semibold text-ink">{fmtMoney(inv.inv.total ?? 0)}</td>
      <td className="px-4 py-2">
        <select
          disabled={pending}
          defaultValue={inv.inv.status}
          onChange={(e) => handleStatus(inv.inv.id, e.target.value as any)}
          className={"text-xs rounded-full border px-2 py-0.5 bg-transparent " + (statusColors[inv.inv.status] ?? "")}
        >
          {["draft","sent","paid","overdue","cancelled"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </td>
      <td className="px-4 py-2 text-right whitespace-nowrap">
        <Link href={`/invoice/${inv.inv.number}`} className="text-xs text-gold hover:underline mr-3" target="_blank">View</Link>
        <a href={`/admin/invoices/${inv.inv.id}/pdf`} className="text-xs text-gold hover:underline" target="_blank">PDF</a>
      </td>
    </tr>
  );
}

