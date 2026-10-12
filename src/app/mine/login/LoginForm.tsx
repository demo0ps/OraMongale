"use client";
import { useTransition, useState } from "react";

export default function LoginForm({ action }: { action: (fd: FormData) => Promise<{ error?: string } | void> }) {
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
        <label className="label">Email</label>
        <input name="email" type="email" required className="field" autoComplete="email" />
      </div>
      <div>
        <label className="label">Password</label>
        <input name="password" type="password" required className="field" autoComplete="current-password" />
      </div>
      {err && <p className="text-sm text-red-700">{err}</p>}
      <button className="btn-primary w-full" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}
