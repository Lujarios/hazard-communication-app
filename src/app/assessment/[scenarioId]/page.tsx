import { notFound } from "next/navigation";

import { AssessmentExperience } from "~/components/demo/AssessmentExperience";
import { toAssessmentScenario } from "~/lib/assessment-scenario";
import { api } from "~/trpc/server";

type AssessmentPageProps = {
  params: Promise<{ scenarioId: string }>;
  searchParams: Promise<{ session?: string }>;
};

export default async function AssessmentScenarioPage({
  params,
  searchParams,
}: AssessmentPageProps) {
  const { scenarioId } = await params;
  const { session: rawSessionId } = await searchParams;
  const assessmentSessionId =
    rawSessionId &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      rawSessionId,
    )
      ? rawSessionId
      : undefined;

  let scenario;
  try {
    scenario = await api.scenario.getById({ id: scenarioId });
  } catch {
    notFound();
  }

  return (
    <AssessmentExperience
      scenario={toAssessmentScenario(scenario)}
      assessmentSessionId={assessmentSessionId}
    />
  );
}
