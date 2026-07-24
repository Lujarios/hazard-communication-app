import Link from "next/link";
import { redirect } from "next/navigation";

import { AppHeader } from "~/components/demo/AppHeader";
import { JoinCodeForm } from "~/components/join/JoinCodeForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { normalizeJoinCode } from "~/lib/join-code";
import { api } from "~/trpc/server";

type JoinWithCodePageProps = {
  params: Promise<{ code: string }>;
};

export default async function JoinWithCodePage({
  params,
}: JoinWithCodePageProps) {
  const { code: rawCode } = await params;
  const code = normalizeJoinCode(rawCode);

  let scenarioId: string | null = null;
  try {
    const resolved = await api.assessmentSession.resolveByCode({ code });
    scenarioId = resolved.scenarioId;
  } catch {
    scenarioId = null;
  }

  if (scenarioId) {
    redirect(`/assessment/${scenarioId}`);
  }

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
              That join code is invalid or no longer active. Check with your
              trainer and try again.
            </CardDescription>
          </CardHeader>
          <CardContent className="py-5">
            <JoinCodeForm initialCode={code} />
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-sm text-slate-500">
          <Link href="/join" className="text-[#1e4a8c] hover:underline">
            Enter a different code
          </Link>
        </p>
      </main>
    </div>
  );
}
