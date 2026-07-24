import Link from "next/link";

import { AppHeader } from "~/components/demo/AppHeader";
import { JoinCodeForm } from "~/components/join/JoinCodeForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

export default function JoinPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <main className="mx-auto flex max-w-md flex-col px-4 py-10">
        <Card className="gap-0 py-0 ring-1 ring-slate-200">
          <CardHeader className="border-b border-slate-100 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#1e4a8c]">
              Trainee access
            </p>
            <CardTitle className="text-xl font-semibold text-slate-900">
              Join an assessment
            </CardTitle>
            <CardDescription>
              Enter the join code from your trainer. No account needed.
            </CardDescription>
          </CardHeader>
          <CardContent className="py-5">
            <JoinCodeForm />
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-sm text-slate-500">
          <Link href="/" className="text-[#1e4a8c] hover:underline">
            Back to home
          </Link>
        </p>
      </main>
    </div>
  );
}
