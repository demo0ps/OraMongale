import LoginForm from "./LoginForm";
import { loginMine } from "./actions";
import { getMineSession } from "@/lib/mine-auth";
import { redirect } from "next/navigation";
import Wordmark from "@/components/Wordmark";

export const metadata = { title: "Mine sign in — OraMongale" };

export default async function MineLoginPage() {
  const s = await getMineSession();
  if (s) redirect("/mine/jobs");
  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4">
      <div className="card w-full max-w-md p-8">
        <div className="flex justify-center mb-4"><Wordmark size="lg" /></div>
        <h1 className="text-xl font-semibold text-center text-ink">Mine portal</h1>
        <p className="text-center text-sm text-steel mt-1 mb-6">Sign in to view your live haulage board.</p>
        <LoginForm action={loginMine} />
      </div>
    </div>
  );
}
