import type { HazardSeverity } from "~/lib/demo-data";
import { getScenarioImagePath } from "~/lib/scenario-images";
import type { ScenarioAnswerKey } from "~/lib/scenario-answer-keys";

type DbHazard = {
  id: string;
  hazardTitle: string;
  hazardDescription: string;
  controlDescription: string;
  locationNote: string | null;
  sortOrder: number;
};

type DbScenarioForAnswerKey = {
  id: string;
  title: string;
  description: string;
  imageFileName: string;
  hazards: DbHazard[];
};

function defaultSeverity(index: number): HazardSeverity {
  if (index === 0) return "high";
  if (index < 3) return "medium";
  return "info";
}

function buildModelSummary(scenario: DbScenarioForAnswerKey): string {
  const hazardSummaries = scenario.hazards.map((hazard) => {
    const location = hazard.locationNote ? ` (${hazard.locationNote})` : "";
    return `${hazard.hazardTitle}${location}: ${hazard.hazardDescription} Control: ${hazard.controlDescription}`;
  });

  return [
    `Scenario briefing for ${scenario.title}.`,
    scenario.description,
    "",
    "Key hazards and controls:",
    ...hazardSummaries.map((line) => `- ${line}`),
  ].join("\n");
}

export function buildAnswerKeyFromDbScenario(
  scenario: DbScenarioForAnswerKey,
): ScenarioAnswerKey {
  return {
    id: scenario.id,
    title: scenario.title,
    imageSrc: getScenarioImagePath(scenario.imageFileName),
    workSteps: [
      `Review the ${scenario.title} work area shown in the scenario image`,
      "Identify visible hazards and explain controls before work continues",
    ],
    environmentalHazards: [
      "Assess surrounding conditions and crew coordination in the active work zone",
    ],
    hazards: scenario.hazards.map((hazard, index) => {
      const calloutPoints = [hazard.hazardDescription];
      if (hazard.locationNote) {
        calloutPoints.push(`Location on image: ${hazard.locationNote}`);
      }

      return {
        id: hazard.id,
        name: hazard.hazardTitle,
        severity: defaultSeverity(index),
        isLifeThreatening: index === 0,
        calloutPoints,
        requiredControls: [hazard.controlDescription],
      };
    }),
    modelSummary: buildModelSummary(scenario),
  };
}
