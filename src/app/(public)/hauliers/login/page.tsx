import { redirect } from "next/navigation";

// Haulier login removed at operator request: go straight through to the
// dashboard (mirrors the admin console behaviour). The join page now signs
// you in automatically; if no company exists the dashboard shows a prompt.
export const dynamic = "force-dynamic";

export default async function HaulierLoginPage() {
  redirect("/hauliers/dashboard");
}
