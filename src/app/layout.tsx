import type { Metadata } from "next";
import "./globals.css";
import { bootstrap } from "@/db/bootstrap";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: {
    default: "ORAMONGALE — Verified haulage for South African mines",
    template: "%s — ORAMONGALE",
  },
  description:
    "ORAMONGALE connects South African mines with vetted, compliant haulage companies. You deal with a person, not a portal.",
};

let didBootstrap = false;
async function ensureBootstrap() {
  if (!didBootstrap) {
    await bootstrap();
    didBootstrap = true;
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await ensureBootstrap();
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
