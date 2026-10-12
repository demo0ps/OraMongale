import Link from "next/link";
import Wordmark from "@/components/Wordmark";
import WhatsAppButton from "@/components/WhatsAppButton";
import { getCompanySession } from "@/company-auth";
import { BRAND } from "@/lib/brand";

export const metadata = {
  title: "OraMongale — Verified haulage for South African mines",
  description:
    "OraMongale connects South African mines with vetted, compliant haulage companies. You deal with a person, not a portal.",
};

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCompanySession();
  return (
    <div className="min-h-full flex flex-col bg-white text-ink relative">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-dust">
        {/* Contact strip */}
        <div className="bg-navy text-white/90 text-xs">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 h-8 flex items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <a href={`tel:${BRAND.phoneTel}`} className="hover:text-gold inline-flex items-center gap-1">
                <span aria-hidden>📞</span> {BRAND.phoneDisplay}
              </a>
              <a href={`mailto:${BRAND.email}`} className="hidden sm:inline-flex items-center gap-1 hover:text-gold">
                <span aria-hidden>✉</span> {BRAND.email}
              </a>
            </div>
            <div className="flex items-center gap-2">
              <WhatsAppButton
                label="WhatsApp us"
                className="!py-0.5 !px-2 !text-xs !h-auto !bg-transparent !text-white hover:!text-gold"
              />
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 min-h-16 py-3 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" aria-label="OraMongale home" className="shrink-0">
            <Wordmark />
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-coal">
            <Link href="/hauliers" className="hover:text-gold">For hauliers</Link>
            <Link href="/mines" className="hover:text-gold">For mines</Link>
            <Link href="/how-it-works" className="hover:text-gold">How it works</Link>
            <a href="#contact" className="hover:text-gold">Contact</a>
          </nav>
          <div className="flex items-center gap-2 ml-auto">
            {session ? (
              <Link href="/hauliers/dashboard" className="btn-primary">My dashboard</Link>
            ) : (
              <>
                <Link href="/hauliers/dashboard" className="btn-ghost hidden sm:inline-flex">My fleet</Link>
                <Link href="/hauliers/join" className="btn-primary">List your trucks</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer id="contact" className="border-t border-dust bg-bone">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 grid gap-8 md:grid-cols-4 text-sm">
          <div className="md:col-span-2">
            <Wordmark size="sm" />
            <p className="mt-3 text-steel max-w-sm">
              Connecting South African mines with vetted, compliant haulage companies.
              You deal with a person, not a portal.
            </p>
            <div className="mt-4 space-y-1 text-steel">
              <div>
                <a href={`tel:${BRAND.phoneTel}`} className="hover:text-gold">
                  {BRAND.phoneDisplay}
                </a>
              </div>
              <div>
                <a href={`mailto:${BRAND.email}`} className="hover:text-gold break-all">
                  {BRAND.email}
                </a>
              </div>
              <div>
                <WhatsAppButton label="Chat on WhatsApp" className="!mt-2" />
              </div>
            </div>
          </div>
          <div>
            <div className="font-semibold text-coal mb-2">Hauliers</div>
            <ul className="space-y-1 text-steel">
              <li><Link href="/hauliers" className="hover:text-gold">Why list with us</Link></li>
              <li><Link href="/hauliers/join" className="hover:text-gold">List your trucks</Link></li>
              <li><Link href="/hauliers/dashboard" className="hover:text-gold">My fleet</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-coal mb-2">Mines</div>
            <ul className="space-y-1 text-steel">
              <li><Link href="/mines" className="hover:text-gold">How we source trucks</Link></li>
              <li><Link href="/mines/post-job" className="hover:text-gold">Post a haulage need</Link></li>
              <li><Link href="/admin/login" className="hover:text-gold">Admin console</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-dust">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 text-xs text-steel flex flex-wrap items-center justify-between gap-2">
            <span>© {new Date().getFullYear()} {BRAND.fullName}</span>
            <span>South Africa · POPIA-aligned</span>
          </div>
          <div className="border-t border-dust/60">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 py-2 text-center text-[11px] text-steel/70">
              <a
                href="https://eliteway.co.za"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gold transition-colors"
              >
                Product of Elite Way Holdings ↗
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp CTA */}
      <a
        href={BRAND.whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-whatsapp text-white px-4 py-3 shadow-lg hover:bg-[#1ebe5b] transition-colors"
      >
        <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.04 20.032h-.003c-1.48 0-2.93-.4-4.186-1.155L4.8 20.25l1.43-3.02a8.02 8.02 0 01-1.24-4.3c0-4.44 3.613-8.05 8.06-8.05 2.15 0 4.173.84 5.697 2.363a8 8 0 012.352 5.697c-.004 4.44-3.616 8.04-8.06 8.09z"/>
        </svg>
        <span className="text-sm font-semibold hidden sm:inline">Chat with us</span>
      </a>
    </div>
  );
}
