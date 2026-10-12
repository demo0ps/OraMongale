import { redirect } from "next/navigation";

// Login removed per request — admin console is open in preview.
export default function AdminLoginEntry() {
  redirect("/admin");
}
