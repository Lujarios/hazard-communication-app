import { type DefaultSession, type NextAuthConfig } from "next-auth";

/**
 * Edge-compatible Auth.js config (no DB adapter / Node-only imports).
 * Full providers + adapter are composed in `~/server/auth/index.ts`.
 *
 * @see https://authjs.dev/guides/edge-compatibility
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      organizationId: string | null;
      role: string;
    } & DefaultSession["user"];
  }

  interface User {
    organizationId?: string | null;
    role?: string;
  }
}

export const authConfig = {
  providers: [],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ auth, request }) {
      const pathname = request.nextUrl.pathname;
      const isProtected =
        pathname.startsWith("/admin") || pathname.startsWith("/api/admin");

      if (isProtected) {
        return !!auth?.user;
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.organizationId = user.organizationId ?? null;
        token.role = user.role ?? "manager";
      }
      return token;
    },
    session({ session, token }) {
      const organizationId =
        typeof token.organizationId === "string" ? token.organizationId : null;
      const role = typeof token.role === "string" ? token.role : "manager";

      session.user = {
        ...session.user,
        id: token.sub ?? "",
        organizationId,
        role,
      };

      return session;
    },
  },
} satisfies NextAuthConfig;
