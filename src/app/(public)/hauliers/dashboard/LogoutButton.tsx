"use client";

import { useTransition } from "react";
import { logoutCompany } from "../login/actions";

export default function LogoutButton() {
  const [pending, start] = useTransition();
  return (
    <button
      className="btn-ghost"
      disabled={pending}
      onClick={() => start(() => logoutCompany())}
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
