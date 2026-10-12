import Link from "next/link";
import { redirect } from "next/navigation";
import { getCompanySession } from "@/company-auth";
import JoinForm from "./JoinForm";

export const metadata = { title: "List your trucks — Haulier sign up" };

export default async function JoinPage() {
  const session = await getCompanySession();
  if (session) redirect("/hauliers/dashboard");

  return (
    <div className="bg-white">
      <section className="bg-bone py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="text-xs uppercase tracking-widest text-gold mb-2">
            Haulier registration
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-ink">
            List your trucks with ORAMONGALE
          </h1>
          <p className="mt-3 text-coal max-w-2xl">
            Fill in your company details. There&rsquo;s no password or email
            verification — you go straight through to your fleet dashboard where
            you can add trucks and upload compliance paperwork.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        <div className="card p-6 sm:p-8">
          <JoinForm />
        </div>
        <p className="mt-5 text-sm text-steel">
          Already registered? Your session is remembered automatically when you
          come back from the same browser. If you need to reach an existing
          fleet dashboard,{" "}
          <Link href="/hauliers/dashboard" className="text-gold hover:underline">
            open it directly
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
