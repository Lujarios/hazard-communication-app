import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z.string().url(),
    OPENAI_API_KEY: z.string().min(1),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    /**
     * Auth.js secret. Generate with: `openssl rand -base64 32`
     * @see https://authjs.dev/getting-started/deployment#auth_secret
     */
    AUTH_SECRET: z.string().min(1),
    /** Optional Cognito app client — leave unset for local Credentials-only login. */
    AUTH_COGNITO_ID: z.string().min(1).optional(),
    AUTH_COGNITO_SECRET: z.string().min(1).optional(),
    /**
     * Cognito issuer, e.g.
     * https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XXXXXXXXX
     */
    AUTH_COGNITO_ISSUER: z.string().url().optional(),
    /**
     * Enable email/password Credentials login against seeded users.
     * Defaults on in development unless set to "false". Set "true" to force on.
     */
    AUTH_DEV_LOGIN: z.enum(["true", "false"]).optional(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    NODE_ENV: process.env.NODE_ENV,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_COGNITO_ID: process.env.AUTH_COGNITO_ID,
    AUTH_COGNITO_SECRET: process.env.AUTH_COGNITO_SECRET,
    AUTH_COGNITO_ISSUER: process.env.AUTH_COGNITO_ISSUER,
    AUTH_DEV_LOGIN: process.env.AUTH_DEV_LOGIN,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
