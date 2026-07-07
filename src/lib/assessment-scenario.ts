import { scenario, workerPersonas } from "~/lib/demo-data";
import { getScenarioImagePath } from "~/lib/scenario-images";
import type { AssessmentScenario } from "~/types/assessment";

export const demoAssessmentScenario: AssessmentScenario = {
  id: scenario.id,
  title: scenario.title,
  description:
    "Review the construction site image. Identify visible hazards, explain why each is dangerous, and describe the controls workers should follow before work continues.",
  imageSrc: scenario.imageSrc,
  imageAlt: scenario.imageAlt,
  personas: workerPersonas.map((persona) => ({
    id: persona.id,
    name: persona.name,
    description: persona.description,
    initials: persona.initials,
    avatarColor: persona.avatarColor,
  })),
};

type DbScenarioWithRelations = {
  id: string;
  title: string;
  description: string;
  imageFileName: string;
  scenarioPersonas: Array<{
    persona: {
      id: string;
      name: string;
      roleDescription: string;
      initials: string;
      avatarColor: string;
    };
  }>;
};

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
    })),
  };
}
