"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import {
  authenticateAdmin,
  setAdminSessionCookie,
  verifyAdminCsrf,
} from "@/admin-auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  csrfToken: z.string().min(1),
});

export async function loginAdmin(
  _prev: { error?: string },
  formData: FormData
) {
  const parsed = schema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
    csrfToken: String(formData.get("csrfToken") ?? ""),
  });
  if (!parsed.success) return { error: "Enter your email and password." };
  if (!(await verifyAdminCsrf(parsed.data.csrfToken))) {
    return { error: "Your session expired. Refresh the page and try again." };
  }
  const session = await authenticateAdmin(parsed.data.email, parsed.data.password);
  if (!session) return { error: "Invalid email or password." };
  await setAdminSessionCookie(session);
  redirect("/admin");
}

export async function logoutAdmin() {
  "use server";
  const { clearAdminSessionCookie } = await import("@/admin-auth");
  await clearAdminSessionCookie();
  redirect("/admin/login");
}
