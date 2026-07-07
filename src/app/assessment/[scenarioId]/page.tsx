import Link from "next/link";
import { notFound } from "next/navigation";

import { AppHeader } from "~/components/demo/AppHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { getScenarioImagePath } from "~/lib/scenario-images";
import { api } from "~/trpc/server";

type AssessmentPageProps = {
  params: Promise<{ scenarioId: string }>;
};

export default async function AssessmentScenarioPage({
  params,
}: AssessmentPageProps) {
  const { scenarioId } = await params;

  let scenario;
  try {
    scenario = await api.scenario.getById({ id: scenarioId });
  } catch {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <main className="mx-auto max-w-3xl px-4 py-6">
        <Card className="gap-0 py-0 ring-1 ring-slate-200">
          <CardHeader className="border-b border-slate-100 py-4">
            <CardTitle className="text-base font-semibold text-slate-800">
              {scenario.title}
            </CardTitle>
            <CardDescription>{scenario.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 py-4">
            <p className="text-sm text-slate-600">
              This scenario has been saved and is ready for trainee assessment.
              The full dynamic assessment experience is still using the demo page
              at{" "}
              <Link href="/" className="text-[#1e4a8c] hover:underline">
                /
              </Link>
              .
            </p>
            <p className="text-xs text-slate-500">
              Image path:{" "}
              <code className="rounded bg-slate-100 px-1 py-0.5">
                {getScenarioImagePath(scenario.imageFileName)}
              </code>
            </p>
            <p className="text-xs text-slate-500">
              {scenario.hazards.length} hazard
              {scenario.hazards.length === 1 ? "" : "s"} ·{" "}
              {scenario.scenarioPersonas.length} persona
              {scenario.scenarioPersonas.length === 1 ? "" : "s"} · Status:{" "}
              {scenario.status}
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
