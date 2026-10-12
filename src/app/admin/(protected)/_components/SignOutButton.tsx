"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { logoutAdmin } from "../../login/actions";

export default function SignOutButton() {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button className="btn-ghost" disabled={pending}
      onClick={() => start(async () => { await logoutAdmin(); router.refresh(); })}>
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
