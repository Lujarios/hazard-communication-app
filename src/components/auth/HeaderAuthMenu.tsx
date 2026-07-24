"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

import { Button } from "~/components/ui/button";

export function HeaderAuthMenu() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div
        className="ml-1 size-9 shrink-0 animate-pulse rounded-full bg-slate-200"
        aria-hidden
      />
    );
  }

  if (!session?.user) {
    return (
      <Button
        asChild
        variant="outline"
        size="sm"
        className="ml-1 border-slate-300 text-slate-700"
      >
        <Link href="/login">Sign in</Link>
      </Button>
    );
  }

  const initials = (session.user.name ?? session.user.email ?? "U")
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="ml-1 flex items-center gap-2">
      <div className="hidden text-right sm:block">
        <p className="max-w-[10rem] truncate text-xs font-medium text-slate-800">
          {session.user.name ?? "Manager"}
        </p>
        <p className="max-w-[10rem] truncate text-[11px] text-slate-500">
          {session.user.email}
        </p>
      </div>
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#1e4a8c] text-sm font-semibold text-white"
        title={session.user.email ?? undefined}
      >
        {initials}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-slate-600"
        onClick={() => signOut({ callbackUrl: "/" })}
      >
        Sign out
      </Button>
    </div>
  );
}
