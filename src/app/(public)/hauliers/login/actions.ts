"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import {
  authenticateCompanyUser,
  setCompanySessionCookie,
  clearCompanySessionCookie,
} from "@/company-auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function loginCompany(_prev: { error?: string }, formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: (formData.get("email") as string)?.trim().toLowerCase(),
    password: formData.get("password") as string,
  });
  if (!parsed.success) return { error: "Enter your email and password." };

  const res = await authenticateCompanyUser(parsed.data.email, parsed.data.password);
  if (!res) return { error: "Invalid email or password." };

  await setCompanySessionCookie({
    companyUserId: res.user.id,
    companyId: res.user.companyId,
    email: res.user.email,
    name: res.user.name,
  });
  redirect("/hauliers/dashboard");
}

export async function logoutCompany() {
  "use server";
  await clearCompanySessionCookie();
  redirect("/hauliers/dashboard");
}
