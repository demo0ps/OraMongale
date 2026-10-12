"use client";

import { useFormState as useActionState } from "react-dom";
import { useState, useTransition } from "react";
import { loginCompany } from "./actions";

export default function HaulierLoginForm({ error }: { error?: string }) {
  const [state, formAction] = useActionState(loginCompany, { error });
  const [pending, startTransition] = useTransition();
  return (
    <form
      action={(fd) => startTransition(() => formAction(fd))}
      className="space-y-4"
    >
      {(state?.error || error) && (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {state?.error ?? friendlyError(error ?? "")}
        </div>
      )}
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoFocus className="field" />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required className="field" />
      </div>
      <button type="submit" className="btn-primary w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

function friendlyError(code: string) {
  if (code === "CredentialsSignin") return "Invalid email or password.";
  if (code === "invalid-token") return "Your verification link is invalid.";
  if (code === "expired-token") return "Your verification link has expired.";
  return code;
}
