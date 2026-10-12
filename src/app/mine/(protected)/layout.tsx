import Link from "next/link";
import { redirect } from "next/navigation";
import { getMineSession, getMineForSession, clearMineSessionCookie } from "@/lib/mine-auth";
import Wordmark from "@/components/Wordmark";
import LogoutButton from "./LogoutButton";

export const metadata = { title: "Mine portal — OraMongale" };

const nav = [
  { href: "/mine/jobs", label: "Live jobs" },
  { href: "/mine/pods", label: "PODs" },
];

export default async function MineLayout({ children }: { children: React.ReactNode }) {
  const s = await getMineSession();
  if (!s) redirect("/mine/login");
  const mine = await getMineForSession(s);
  return (
    <div className="min-h-full flex flex-col bg-bone">
      <header className="bg-white border-b border-dust sticky top-0 z-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center gap-4">
          <Link href="/mine/jobs"><Wordmark size="sm" /></Link>
          <span className="hidden sm:inline text-xs text-steel border-l border-dust pl-3">
            Mine portal · {mine?.name ?? ""}
          </span>
          <nav className="hidden md:flex items-center gap-1 text-sm ml-4">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="rounded px-3 py-1.5 text-coal hover:bg-bone">{n.label}</Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="hidden sm:inline text-steel">{s.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
