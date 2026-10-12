import DriverLoginForm from "./DriverLoginForm";
import { loginDriver } from "./actions";
import { getDriverSession } from "@/lib/driver-auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Driver sign in — OraMongale" };
export default async function DriverLoginPage() {
  const s = await getDriverSession();
  if (s) redirect("/driver/loads");
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-navy/80 backdrop-blur rounded-2xl border border-white/10 p-8">
        <div className="text-center mb-6">
          <div className="text-3xl">🚛</div>
          <h1 className="text-xl font-bold mt-2">Driver portal</h1>
          <p className="text-xs text-bone/70 mt-1">Sign in to see your loads and upload PODs.</p>
        </div>
        <DriverLoginForm action={loginDriver} />
      </div>
    </div>
  );
}
