/**
 * Auth.js (NextAuth v5) Node runtime: Cognito and/or local Credentials,
 * plus the Drizzle adapter. Edge-safe config lives in ./config.ts.
 */
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import Cognito from "next-auth/providers/cognito";
import Credentials from "next-auth/providers/credentials";
import { cache } from "react";
import { z } from "zod";

import { env } from "~/env";
import { db } from "~/server/db";
import {
  accounts,
  sessions,
  users,
  verificationTokens,
} from "~/server/db/schema";

import { authConfig } from "./config";
import { verifyPassword } from "./password";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const cognitoConfigured =
  Boolean(env.AUTH_COGNITO_ID) &&
  Boolean(env.AUTH_COGNITO_SECRET) &&
  Boolean(env.AUTH_COGNITO_ISSUER);

const enableDevCredentials =
  env.AUTH_DEV_LOGIN === "true" ||
  (env.NODE_ENV === "development" && env.AUTH_DEV_LOGIN !== "false");

const providers = [
  ...(cognitoConfigured
    ? [
        Cognito({
          clientId: env.AUTH_COGNITO_ID!,
          clientSecret: env.AUTH_COGNITO_SECRET!,
          issuer: env.AUTH_COGNITO_ISSUER!,
          // Must match scopes enabled on the Cognito app client.
          // Cognito rejects the login with invalid_scope if these aren't allowed.
          authorization: {
            params: {
              // Keep this aligned with the Cognito app client's allowed OpenID scopes.
              // Your Cognito quick-start used openid + email (+ optional phone).
              scope: "openid email",
            },
          },
          // Lets seeded local users link when the Cognito email matches.
          allowDangerousEmailAccountLinking: true,
        }),
      ]
    : []),
  ...(enableDevCredentials
    ? [
        Credentials({
          name: "Dev login",
          credentials: {
            email: { label: "Email", type: "email" },
            password: { label: "Password", type: "password" },
          },
          async authorize(rawCredentials) {
            const parsed = credentialsSchema.safeParse(rawCredentials);
            if (!parsed.success) {
              return null;
            }

            const user = await db.query.users.findFirst({
              where: eq(users.email, parsed.data.email.toLowerCase()),
            });

            if (!user?.passwordHash) {
              return null;
            }

            const valid = verifyPassword(
              parsed.data.password,
              user.passwordHash,
            );
            if (!valid) {
              return null;
            }

            return {
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.image,
              organizationId: user.organizationId,
              role: user.role,
            };
          },
        }),
      ]
    : []),
];

const {
  auth: uncachedAuth,
  handlers,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger }) {
      if (user) {
        token.sub = user.id;
        token.organizationId = user.organizationId ?? null;
        token.role = user.role ?? "manager";
      }

      // Refresh org/role from DB on sign-in and explicit update (Cognito path).
      if ((user || trigger === "signIn" || trigger === "update") && token.sub) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, token.sub),
          columns: {
            organizationId: true,
            role: true,
            name: true,
            email: true,
          },
        });

        if (dbUser) {
          token.organizationId = dbUser.organizationId;
          token.role = dbUser.role;
          if (dbUser.name) token.name = dbUser.name;
          if (dbUser.email) token.email = dbUser.email;
        }
      }

      return token;
    },
  },
});

const auth = cache(uncachedAuth);

export { auth, handlers, signIn, signOut };
export { cognitoConfigured, enableDevCredentials };
