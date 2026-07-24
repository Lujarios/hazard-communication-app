import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "~/components/auth/LoginForm";
import { SEED_DEV_PASSWORD } from "~/lib/auth-constants";
import {
  auth,
  cognitoConfigured,
  enableDevCredentials,
} from "~/server/auth";
import { ensureAuthSeeded } from "~/server/db/seed-auth";

export default async function LoginPage() {
  await ensureAuthSeeded();

  const session = await auth();
  if (session?.user) {
    redirect("/admin/scenarios");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#1e4a8c]">
            Manager access
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Sign in to SafeTalk
          </h1>
          <p className="text-sm text-slate-600">
            Only scenario managers need an account. Assessment links stay public.
          </p>
        </div>

        <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
          <LoginForm
            cognitoEnabled={cognitoConfigured}
            credentialsEnabled={enableDevCredentials}
          />
        </Suspense>

        {enableDevCredentials ? (
          <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
            <p className="font-medium text-slate-800">Local seed accounts</p>
            <ul className="mt-1 list-inside list-disc space-y-0.5">
              <li>admin@acme.local / {SEED_DEV_PASSWORD}</li>
              <li>manager@acme.local / {SEED_DEV_PASSWORD}</li>
              <li>manager@beacon.local / {SEED_DEV_PASSWORD}</li>
            </ul>
          </div>
        ) : null}

        <p className="text-center text-sm text-slate-500">
          <Link href="/" className="text-[#1e4a8c] hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
