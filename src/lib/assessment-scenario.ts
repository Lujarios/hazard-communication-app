import type { HazardLabel, HazardSeverity } from "~/lib/demo-data";
import { getScenarioImagePath } from "~/lib/scenario-images";
import type { AssessmentScenario } from "~/types/assessment";

type DbScenarioWithRelations = {
  id: string;
  title: string;
  description: string;
  imageFileName: string;
  hazards: Array<{
    id: string;
    hazardTitle: string;
    overlayTop: string | null;
    overlayLeft: string | null;
    severity: string | null;
  }>;
  scenarioPersonas: Array<{
    persona: {
      id: string;
      name: string;
      roleDescription: string;
      initials: string;
      avatarColor: string;
      experienceLevel: string | null;
      jobRole: string | null;
      jobRoleOther: string | null;
      englishLiteracy: string | null;
      projectExperience: string | null;
    };
  }>;
};

function toHazardSeverity(value: string | null): HazardSeverity {
  if (value === "high" || value === "medium" || value === "info") {
    return value;
  }
  return "medium";
}

function buildHazardLabels(
  hazards: DbScenarioWithRelations["hazards"],
): HazardLabel[] | undefined {
  const labels = hazards
    .filter((hazard) => hazard.overlayTop && hazard.overlayLeft)
    .map((hazard) => ({
      id: hazard.id,
      label: hazard.hazardTitle,
      severity: toHazardSeverity(hazard.severity),
      position: {
        top: hazard.overlayTop!,
        left: hazard.overlayLeft!,
      },
    }));

  return labels.length > 0 ? labels : undefined;
}

export function toAssessmentScenario(
  dbScenario: DbScenarioWithRelations,
): AssessmentScenario {
  return {
    id: dbScenario.id,
    title: dbScenario.title,
    description: dbScenario.description,
    imageSrc: getScenarioImagePath(dbScenario.imageFileName),
    imageAlt: `Workplace scenario: ${dbScenario.title}`,
    personas: dbScenario.scenarioPersonas.map(({ persona }) => ({
      id: persona.id,
      name: persona.name,
      description: persona.roleDescription,
      initials: persona.initials,
      avatarColor: persona.avatarColor,
      experienceLevel: persona.experienceLevel,
      jobRole: persona.jobRole,
      jobRoleOther: persona.jobRoleOther,
      englishLiteracy: persona.englishLiteracy,
      projectExperience: persona.projectExperience,
    })),
    hazardLabels: buildHazardLabels(dbScenario.hazards),
  };
}
