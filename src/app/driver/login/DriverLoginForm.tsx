"use client";
import { useTransition, useState } from "react";

export default function DriverLoginForm({ action }: { action: (fd: FormData) => Promise<{ error?: string } | void> }) {
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setErr(null);
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const r = await action(fd);
          if (r?.error) setErr(r.error);
        });
      }}
      className="space-y-3"
    >
      <div>
        <label className="block text-xs uppercase tracking-wide text-bone/70 mb-1">Phone (SA)</label>
        <input name="phone" required placeholder="082 555 0101" className="w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 text-white placeholder:text-bone/40" />
      </div>
      <div>
        <label className="block text-xs uppercase tracking-wide text-bone/70 mb-1">4-digit PIN</label>
        <input name="pin" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} required placeholder="••••" className="w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 text-white tracking-[0.5em] text-center text-lg placeholder:text-bone/30" />
      </div>
      {err && <p className="text-sm text-red-300">{err}</p>}
      <button className="w-full bg-gold text-navy font-bold py-3 rounded-md disabled:opacity-50" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
