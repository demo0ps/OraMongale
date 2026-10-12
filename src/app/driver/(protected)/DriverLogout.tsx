"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
export default function DriverLogout() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => start(async () => { await fetch("/api/driver/logout", { method: "POST" }); router.push("/driver/login"); router.refresh(); })}
      className="text-xs text-bone/70 hover:text-white"
    >Sign out</button>
  );
}
