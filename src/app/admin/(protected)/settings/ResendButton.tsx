"use client";
import { useTransition } from "react";

export default function ResendButton({ id, action }: { id: number; action: (id: number) => Promise<void> }) {
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => start(() => action(id))}
      className="text-xs text-gold hover:underline disabled:opacity-50"
    >
      {pending ? "sending…" : "retry"}
    </button>
  );
}
