"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "~/components/ui/button";

type LoginFormProps = {
  cognitoEnabled: boolean;
  credentialsEnabled: boolean;
};

export function LoginForm({
  cognitoEnabled,
  credentialsEnabled,
}: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/admin/scenarios";
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("admin@acme.local");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState<string | null>(
    errorParam ? "Sign-in failed. Check your credentials or Cognito setup." : null,
  );
  const [pending, setPending] = useState(false);

  async function onCredentialsSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    setPending(false);

    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {cognitoEnabled ? (
        <Button
          type="button"
          className="w-full bg-[#1e4a8c] hover:bg-[#1e4a8c]/90"
          disabled={pending}
          onClick={() => signIn("cognito", { callbackUrl })}
        >
          Sign in with Cognito
        </Button>
      ) : null}

      {cognitoEnabled && credentialsEnabled ? (
        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden>
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-500">or local login</span>
          </div>
        </div>
      ) : null}

      {credentialsEnabled ? (
        <form className="space-y-4" onSubmit={onCredentialsSubmit}>
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="text-sm font-medium text-slate-700"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#1e4a8c] focus:ring-2 focus:ring-[#1e4a8c]/20"
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="text-sm font-medium text-slate-700"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#1e4a8c] focus:ring-2 focus:ring-[#1e4a8c]/20"
            />
          </div>

          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            className="w-full bg-[#1e4a8c] hover:bg-[#1e4a8c]/90"
            disabled={pending}
          >
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      ) : null}

      {!cognitoEnabled && !credentialsEnabled ? (
        <p className="text-sm text-slate-600">
          No login providers are configured. Set Cognito env vars or enable{" "}
          <code className="rounded bg-slate-100 px-1">AUTH_DEV_LOGIN=true</code>
          .
        </p>
      ) : null}
    </div>
  );
}
