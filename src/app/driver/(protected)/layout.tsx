import Link from "next/link";
import { redirect } from "next/navigation";
import { getDriverSession, clearDriverSessionCookie } from "@/lib/driver-auth";
import DriverLogout from "./DriverLogout";

export const metadata = { title: "Driver — OraMongale" };

export default async function DriverLayout({ children }: { children: React.ReactNode }) {
  const s = await getDriverSession();
  if (!s) redirect("/driver/login");
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="bg-navy/80 backdrop-blur border-b border-white/10 sticky top-0 z-20">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/driver/loads" className="font-bold">🚛 OraMongale</Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-bone/80">{s.name}</span>
            <DriverLogout />
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="max-w-xl mx-auto px-4 py-5">{children}</div>
      </main>
    </div>
  );
}
