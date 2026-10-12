"use server";
import { redirect } from "next/navigation";
import { authenticateDriver, setDriverSessionCookie } from "@/lib/driver-auth";

export async function loginDriver(formData: FormData) {
  const phone = String(formData.get("phone") ?? "").trim();
  const pin = String(formData.get("pin") ?? "");
  const s = await authenticateDriver(phone, pin);
  if (!s) return { error: "Phone or PIN incorrect." };
  await setDriverSessionCookie(s);
  redirect("/driver/loads");
}
