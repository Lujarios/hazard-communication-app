import { notFound } from "next/navigation";

import { AssessmentComplete } from "~/components/demo/AssessmentComplete";
import { toAssessmentScenario } from "~/lib/assessment-scenario";
import { api } from "~/trpc/server";

/** Post-run summary. Requires `run` (and optional `session`) query params. */
type AssessmentCompletePageProps = {
  params: Promise<{ scenarioId: string }>;
  searchParams: Promise<{ run?: string; session?: string }>;
};

function asUuid(value: string | undefined): string | undefined {
  return value &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
    ? value
    : undefined;
}

export default async function AssessmentCompletePage({
  params,
  searchParams,
}: AssessmentCompletePageProps) {
  const { scenarioId } = await params;
  const query = await searchParams;
  const runId = asUuid(query.run);
  const assessmentSessionId = asUuid(query.session);

  let scenario;
  try {
    scenario = await api.scenario.getById({ id: scenarioId });
  } catch {
    notFound();
  }

  return (
    <AssessmentComplete
      scenario={toAssessmentScenario(scenario)}
      runId={runId}
      assessmentSessionId={assessmentSessionId}
    />
  );
}
