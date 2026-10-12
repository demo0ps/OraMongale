import "server-only";
import NextAuth, { type DefaultSession, CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { users } from "./db/schema";
import { recordAdminLogin } from "./db/bootstrap";

declare module "next-auth" {
  interface Session {
    user: {
      id: number;
      role: "admin";
      mustChangePassword: boolean;
      email: string;
      name: string;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    uid?: number;
    role?: "admin";
    mustChangePassword?: boolean;
  }
}

class InvalidLogin extends CredentialsSignin {
  code = "Invalid email or password.";
}

// The OraMongale preview runs behind an HTTPS proxy (the e2b.app sandbox
// preview) but the local Next.js server sees plain HTTP. If we let NextAuth
// auto-detect "secure", it falls back to SameSite=Lax, non-Secure cookies —
// which the browser refuses to attach to cross-site POSTs (the actual
// cause of "MissingCSRF"). Force Secure + SameSite=None always. This is safe
// because production is also HTTPS.
const isSecure = true;
const prefix = "__Secure-";
const hostPrefix = "__Host-";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) throw new InvalidLogin();

        const found = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);
        const user = found[0];
        if (!user) throw new InvalidLogin();

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) throw new InvalidLogin();

        recordAdminLogin(user.id).catch((err) =>
          // eslint-disable-next-line no-console
          console.error("[auth] failed to record login", err)
        );

        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
  pages: { signIn: "/admin/login" },
  trustHost: true,
  useSecureCookies: isSecure,
  cookies: {
    pkceCodeVerifier: {
      name: `${prefix}authjs.pkce.code_verifier`,
      options: { httpOnly: true, sameSite: "none", secure: isSecure, path: "/" },
    },
    sessionToken: {
      name: `${prefix}authjs.session-token`,
      options: { httpOnly: true, sameSite: "none", secure: isSecure, path: "/" },
    },
    // CSRF MUST use __Host- prefix (no Path=/, no Domain=) so the browser
    // binds it strictly to the host — required for SameSite=None + Secure.
    csrfToken: {
      name: `${hostPrefix}authjs.csrf-token`,
      options: { httpOnly: true, sameSite: "none", secure: isSecure, path: "/" },
    },
    callbackUrl: {
      name: `${prefix}authjs.callback-url`,
      options: { httpOnly: true, sameSite: "none", secure: isSecure, path: "/" },
    },
    state: {
      name: `${prefix}authjs.state`,
      options: { httpOnly: true, sameSite: "none", secure: isSecure, path: "/" },
    },
    nonce: {
      name: `${prefix}authjs.nonce`,
      options: { httpOnly: true, sameSite: "none", secure: isSecure, path: "/" },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = Number((user as { id: string | number }).id);
        token.role = "admin";
        token.mustChangePassword = Boolean(
          (user as { mustChangePassword?: boolean }).mustChangePassword
        );
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: number; role: "admin"; mustChangePassword: boolean }).id =
          Number(token.uid ?? 0);
        (session.user as { id: number; role: "admin"; mustChangePassword: boolean }).role =
          "admin";
        (
          session.user as { id: number; role: "admin"; mustChangePassword: boolean }
        ).mustChangePassword = Boolean(token.mustChangePassword);
      }
      return session;
    },
  },
});
