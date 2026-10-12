"use client";
import { useState, useTransition } from "react";

type State = { ok?: boolean; error?: string };

export default function TestEmailForm({
  action,
}: {
  action: (formData: FormData) => Promise<State>;
}) {
  const [state, setState] = useState<State>({});
  const [pending, start] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const r = await action(fd);
          setState(r);
        });
      }}
      className="flex flex-wrap items-end gap-2"
    >
      <div className="flex-1 min-w-[220px]">
        <label className="label">Recipient</label>
        <input name="to" type="email" placeholder="your@email.com" className="field" required />
      </div>
      <button className="btn-navy" disabled={pending}>
        {pending ? "sending…" : "Send test email"}
      </button>
      {state.ok === true && <span className="text-xs text-emerald-700">✓ Sent</span>}
      {state.error && <span className="text-xs text-red-700">✗ {state.error}</span>}
    </form>
  );
}
