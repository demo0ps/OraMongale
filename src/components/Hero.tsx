"use client";

import Link from "next/link";
import Image from "next/image";
import WhatsAppButton from "@/components/WhatsAppButton";
import { useEffect, useState } from "react";

export default function Hero() {
  // Rotating headline word for a touch of motion
  const words = ["haul.", "move.", "deliver.", "keep mines running."];
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % words.length), 2400);
    return () => clearInterval(t);
  }, [words.length]);

  return (
    <section className="relative overflow-hidden bg-black text-white">
      {/* Background image with dark/black cinematic treatment */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/images/hero-trucks.jpg"
          alt="Haulage trucks on an open-pit mine haul road at golden hour"
          fill
          priority
          unoptimized
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Heavy dark gradient so text reads clearly — bold dark-industrial look */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/75 to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        {/* Gold vignette for cinematic feel */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,160,23,0.18),transparent_55%)]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-16 sm:pt-24 pb-20 sm:pb-28 relative">
        <div className="grid lg:grid-cols-12 gap-10 items-end">
          {/* LEFT: headline + CTAs */}
          <div className="lg:col-span-7">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-gold animate-pulse" />
              <span className="text-xs uppercase tracking-[0.2em] text-bone/80">
                South African mining haulage · since 2014
              </span>
            </div>

            <h1 className="mt-6 text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.02]">
              Trucks that show up.
              <br />
              People who{" "}
              <span className="relative inline-block min-w-[6ch]">
                <span
                  key={i}
                  className="inline-block text-gold"
                  style={{ animation: "fadeSlide 0.5s ease" }}
                >
                  {words[i]}
                </span>
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-bone/85 max-w-xl leading-relaxed">
              OraMongale connects mines with vetted, compliant hauliers across SA.
              No algorithms, no auctions, no ghost trucks on WhatsApp — just
              capacity that actually rolls, and a coordinator on the phone from
              first call to final delivery.
            </p>

            {/* CTA row */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/mines/post-job"
                className="group inline-flex items-center gap-2 bg-gold hover:bg-goldbright text-navy font-bold px-6 py-3.5 rounded-md shadow-[0_10px_30px_-10px_rgba(212,160,23,0.6)] transition"
              >
                Post a haulage need
                <span className="transition group-hover:translate-x-0.5">→</span>
              </Link>
              <Link
                href="/hauliers/join"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3.5 rounded-md border border-white/20 backdrop-blur transition"
              >
                List your trucks
              </Link>
              <WhatsAppButton
                label="WhatsApp us"
                className="ml-0 sm:ml-2"
                variant="ghost-on-dark"
              />
            </div>

            {/* Trust line */}
            <div className="mt-8 flex items-center gap-4 text-sm text-bone/70">
              <div className="flex -space-x-2">
                {["#D4A017", "#E8B923", "#0A2A5C", "#ffffff"].map((c) => (
                  <span
                    key={c}
                    className="inline-block h-8 w-8 rounded-full border-2 border-black"
                    style={{ background: c }}
                  />
                ))}
              </div>
              <div>
                <div className="text-white font-semibold">47 hauliers onboard</div>
                <div className="text-xs text-bone/60">
                  Compliance-checked · avg. response 38 minutes
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: stats card (floating on black) */}
          <div className="lg:col-span-5">
            <div className="relative">
              {/* Black glass stat panel */}
              <div className="rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 p-6 sm:p-8 shadow-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-widest text-gold">
                    Live board
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    ● Operational
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-6">
                  <BigStat v="120+" k="Trucks on the board" />
                  <BigStat v="9" k="Provinces covered" />
                  <BigStat v="24h" k="Turnaround on jobs" />
                  <BigStat v="98%" k="On-site compliance" />
                </div>

                <div className="mt-6 pt-5 border-t border-white/10">
                  <div className="text-xs uppercase tracking-widest text-bone/50 mb-3">
                    Commodities hauled
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["Coal", "Chrome", "Manganese", "Platinum (PGMs)", "Iron ore", "Overburden", "Aggregates"].map(
                      (c) => (
                        <span
                          key={c}
                          className="px-2.5 py-1 rounded-full text-xs bg-white/5 border border-white/10 text-bone/90"
                        >
                          {c}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              </div>

              {/* Floating gold accent */}
              <div className="absolute -top-3 -right-3 h-20 w-20 bg-gold/30 blur-2xl rounded-full" aria-hidden />
              <div className="absolute -bottom-4 -left-4 h-24 w-24 bg-navy/60 blur-2xl rounded-full" aria-hidden />
            </div>
          </div>
        </div>

        {/* Bottom ticker: key routes */}
        <div className="mt-14 sm:mt-20 border-t border-white/10 pt-6 overflow-hidden">
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-xs uppercase tracking-[0.25em] text-bone/50">
            <span>Witbank · Middelburg</span>
            <span>Steelpoort · Burgersfort</span>
            <span>Rustenburg · Brits</span>
            <span>Kathu · Kuruman</span>
            <span>Thabazimbi · Lephalale</span>
            <span>Klerksdorp · Welkom</span>
            <span className="text-gold">Richards Bay · Maputo corridor</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}

function BigStat({ v, k }: { v: string; k: string }) {
  return (
    <div>
      <div className="text-3xl sm:text-4xl font-black text-white leading-none">{v}</div>
      <div className="mt-1 text-xs uppercase tracking-wider text-bone/60">{k}</div>
    </div>
  );
}
