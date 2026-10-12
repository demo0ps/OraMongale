"use client";
import { useTransition, useState } from "react";

export default function AddMineUserForm({
  action,
  mineId,
}: {
  action: (fd: FormData) => Promise<{ error?: string; ok?: boolean }>;
  mineId: number;
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setMsg(null);
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const r = await action(fd);
          if (r?.error) setMsg(r.error);
          else {
            setMsg("✓ User added — share credentials with the contact.");
            (e.target as HTMLFormElement).reset();
          }
        });
      }}
      className="mt-3 grid md:grid-cols-4 gap-2"
    >
      <input type="hidden" name="mineId" value={mineId} />
      <input name="name" required placeholder="Contact name" className="field" />
      <input name="email" type="email" required placeholder="name@mine.co.za" className="field" />
      <input name="password" required placeholder="Temporary password" className="field" />
      <button className="btn-primary text-xs" disabled={pending}>
        {pending ? "adding…" : "+ Add portal user"}
      </button>
      {msg && <div className={"md:col-span-4 text-xs " + (msg.startsWith("✓") ? "text-emerald-700" : "text-red-700")}>{msg}</div>}
    </form>
  );
}
