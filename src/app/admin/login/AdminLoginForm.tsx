"use client";

import { useFormState as useActionState } from "react-dom";
import { useTransition } from "react";
import { useState } from "react";
import { loginAdmin } from "./actions";

type State = { error?: string };
const initial: State = {};

export default function AdminLoginForm({
  csrfToken,
  demoEmail,
  demoPassword,
}: {
  csrfToken: string;
  demoEmail: string;
  demoPassword: string;
}) {
  const [state, dispatch] = useActionState(loginAdmin, initial);
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function fillDemo() {
    setEmail(demoEmail);
    setPassword(demoPassword);
  }

  return (
    <form action={(fd) => startTransition(() => dispatch(fd))} className="space-y-4">
      <input type="hidden" name="csrfToken" value={csrfToken} />
      {state?.error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.error}
        </div>
      )}
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required
          autoFocus className="field" value={email}
          onChange={(e) => setEmail(e.target.value)} disabled={pending} />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password"
          required className="field" value={password}
          onChange={(e) => setPassword(e.target.value)} disabled={pending} />
      </div>

      <button type="button" onClick={fillDemo} disabled={pending}
        className="text-xs text-gold hover:text-goldbright underline disabled:opacity-50">
        Fill demo credentials
      </button>

      <button type="submit" className="btn-primary w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
