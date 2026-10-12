"use client";
import { useTransition, useState } from "react";

export default function AddDriverForm({ companies, action }: { companies: { id: number; name: string }[]; action: (fd: FormData) => Promise<{ error?: string; ok?: boolean }> }) {
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
          else { setMsg("✓ Driver added."); (e.target as HTMLFormElement).reset(); }
        });
      }}
      className="grid md:grid-cols-4 gap-3"
    >
      <div><label className="label">Company</label>
        <select name="companyId" required className="field">
          <option value="">Select…</option>
          {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <Field2 label="Driver name" name="name" placeholder="John D." />
      <Field2 label="Phone (SA)" name="phone" placeholder="082 555 0101" />
      <Field2 label="4-digit PIN" name="pin" placeholder="1234" type="password" />
      <div className="md:col-span-4 flex justify-end">
        <button className="btn-primary" disabled={pending}>{pending ? "adding…" : "+ Add driver"}</button>
      </div>
      {msg && <div className={"md:col-span-4 text-xs " + (msg.startsWith("✓") ? "text-emerald-700" : "text-red-700")}>{msg}</div>}
    </form>
  );
}
function Field2({ label, name, type = "text", placeholder }: { label: string; name: string; type?: string; placeholder?: string }) {
  return <div><label className="label">{label}</label><input name={name} type={type} placeholder={placeholder} className="field" required /></div>;
}
