"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() =>
        start(async () => {
          await fetch("/api/mine/logout", { method: "POST" });
          router.push("/mine/login");
          router.refresh();
        })
      }
      className="text-sm text-steel hover:text-coal"
    >
      Sign out
    </button>
  );
}
