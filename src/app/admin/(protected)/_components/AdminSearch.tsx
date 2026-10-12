"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { SearchResult } from "@/lib/admin/types";

const kindIcon: Record<SearchResult["kind"], string> = {
  truck: "🚚",
  company: "🏢",
  person: "👤",
  job: "📋",
  lead: "🆕",
  mine: "⛏",
};

export default function AdminSearch() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    fetch(`/api/admin/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => {
        setResults(d.results as SearchResult[]);
        setOpen(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [q]);

  return (
    <div ref={ref} className="relative w-full">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => q && setOpen(true)}
        placeholder="Search trucks, companies, people…"
        className="field w-full"
      />
      {loading && (
        <span className="absolute right-3 top-2.5 text-[10px] text-steel">searching…</span>
      )}
      {open && results.length > 0 && (
        <div className="absolute right-0 left-0 top-full mt-1 bg-white rounded-md border border-dust shadow-lg z-40 max-h-96 overflow-y-auto">
          <ul className="py-1 text-sm">
            {results.map((r, i) => (
              <li key={`${r.kind}-${r.id}-${i}`}>
                <Link
                  href={r.href}
                  onClick={() => {
                    setOpen(false);
                    setQ("");
                  }}
                  className="flex items-start gap-3 px-3 py-2 hover:bg-bone"
                >
                  <span className="text-lg leading-none mt-0.5">{kindIcon[r.kind]}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-ink truncate">{r.title}</span>
                      {r.status && (
                        <span className="text-[10px] uppercase rounded px-1.5 py-0.5 bg-bone text-steel">
                          {r.status.replace("_", " ")}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-steel truncate">{r.subtitle}</div>
                  </div>
                  <span className="text-[10px] uppercase text-steel/60 pt-1">{r.kind}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {open && q.trim() && !loading && results.length === 0 && (
        <div className="absolute right-0 left-0 top-full mt-1 bg-white rounded-md border border-dust shadow-lg p-3 text-xs text-steel">
          No matches.
        </div>
      )}
    </div>
  );
}
