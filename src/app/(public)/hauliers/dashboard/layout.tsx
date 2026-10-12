import Link from "next/link";
import { eq, asc } from "drizzle-orm";
import {
  getCompanySession,
  getCompanyForSession,
  clearCompanySessionCookie,
} from "@/company-auth";
import Wordmark from "@/components/Wordmark";
import { db } from "@/db";
import { companies } from "@/db/schema";

export const metadata = { title: "My fleet" };

export default async function HaulierLayout({
  children,
}: { children: React.ReactNode }) {
  let session = await getCompanySession();
  let company: { id: number; name: string; status: string } | null = null;

  if (session) {
    const ctx = await getCompanyForSession(session);
    if (ctx) {
      company = ctx.company;
    } else {
      // Stale cookie (company was deleted) — clear it, but do NOT block the page.
      await clearCompanySessionCookie();
      session = null;
    }
  }

  // No password wall. If there's no session (first visit / cleared cookies),
  // just pick the first company in the DB for display purposes. We DON'T set
  // a cookie here — Next forbids mutating cookies during render — but the page
  // still renders straight through. Cookies are written only from the join
  // Server Action, which is allowed.
  if (!company) {
    const first = await db
      .select({ id: companies.id, name: companies.name, status: companies.status })
      .from(companies)
      .orderBy(asc(companies.id))
      .limit(1);
    if (first[0]) company = first[0];
  }

  const statusPill = (s: string | null) => {
    if (!s) return null;
    const cls =
      s === "approved"
        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
        : s === "rejected"
        ? "bg-red-50 text-red-800 border border-red-200"
        : "bg-amber-50 text-amber-800 border border-amber-200";
    const label =
      s === "approved" ? "Approved" : s === "rejected" ? "Rejected" : "Awaiting review";
    return (
      <span className={`rounded-full px-2 py-0.5 text-[11px] uppercase tracking-wide ${cls}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="min-h-full flex flex-col bg-bone">
      <header className="border-b border-dust bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/"><Wordmark size="sm" /></Link>
            <span className="hidden sm:inline text-xs text-steel border-l border-dust pl-4">
              Haulier portal
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {company ? (
              <>
                <span className="hidden sm:inline text-steel">{company.name}</span>
                {statusPill(company.status)}
              </>
            ) : (
              <Link href="/hauliers/join" className="btn-primary !py-1.5 !px-3 text-xs">
                List your fleet
              </Link>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
