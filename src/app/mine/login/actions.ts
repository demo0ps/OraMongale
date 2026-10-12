"use server";

import { redirect } from "next/navigation";
import { authenticateMine, setMineSessionCookie } from "@/lib/mine-auth";

export async function loginMine(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const s = await authenticateMine(email, password);
  if (!s) return { error: "Invalid email or password." };
  await setMineSessionCookie(s);
  redirect("/mine/jobs");
}
