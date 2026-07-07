import { notFound } from "next/navigation";

import { AssessmentExperience } from "~/components/demo/AssessmentExperience";
import { toAssessmentScenario } from "~/lib/assessment-scenario";
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
    <AssessmentExperience scenario={toAssessmentScenario(scenario)} />
  );
}
