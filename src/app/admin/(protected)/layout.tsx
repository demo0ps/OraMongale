import Link from "next/link";
import { getAdminSession } from "@/admin-auth";
import Wordmark from "@/components/Wordmark";
import AdminSearch from "./_components/AdminSearch";
import { seedDemoData } from "./actions";

export const metadata = { title: "Admin — OraMongale" };

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/jobs", label: "Jobs" },
  { href: "/admin/trucks", label: "Trucks" },
  { href: "/admin/drivers", label: "Drivers" },
  { href: "/admin/companies", label: "Companies" },
  { href: "/admin/mines", label: "Mines" },
  { href: "/admin/people", label: "People" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/compliance", label: "Compliance" },
  { href: "/admin/invoices", label: "Invoices" },
  { href: "/admin/insights", label: "Insights" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function AdminLayout({
  children,
}: { children: React.ReactNode }) {
  const session = await getAdminSession().catch(() => null);

  // Seed demo data the first time the admin is opened so the console isn't empty.
  await seedDemoData().catch(() => {});

  return (
    <div className="min-h-screen flex flex-col bg-bone">
      <header className="border-b border-dust bg-white sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 min-h-16 py-3 flex flex-wrap items-center gap-4">
          <Link href="/" className="shrink-0"><Wordmark size="sm" /></Link>
          <span className="hidden sm:inline text-xs text-steel border-l border-dust pl-3">
            Admin console <span className="ml-1 px-1.5 py-0.5 rounded bg-gold/10 text-gold">preview</span>
          </span>

          <nav className="hidden lg:flex items-center gap-1 text-sm ml-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded px-3 py-1.5 text-coal hover:bg-bone"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3 w-full sm:w-auto max-w-md">
            <AdminSearch />
          </div>
        </div>
        {/* Mobile nav */}
        <div className="lg:hidden border-t border-dust overflow-x-auto">
          <div className="flex gap-1 px-4 py-2 text-sm whitespace-nowrap">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="rounded px-3 py-1 text-coal hover:bg-bone">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">{children}</div>
      </main>
      <footer className="border-t border-dust bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 text-xs text-steel flex justify-between">
          <span>© {new Date().getFullYear()} OraMongale Tradings</span>
          <span>{session?.email ? session.email : "Preview mode — login disabled"}</span>
        </div>
      </footer>
    </div>
  );
}
