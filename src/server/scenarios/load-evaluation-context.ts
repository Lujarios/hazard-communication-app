import "server-only";

import { eq } from "drizzle-orm";

import type { ScenarioAnswerKey } from "~/lib/scenario-answer-keys";
import type { db } from "~/server/db";
import { scenarios } from "~/server/db/schema";

import { buildAnswerKeyFromDbScenario } from "./build-answer-key";

export type EvaluationPersona = {
  id: string;
  name: string;
  description: string;
  evaluationInstructions: string;
};

export type ScenarioEvaluationContext = {
  answerKey: ScenarioAnswerKey;
  personas: EvaluationPersona[];
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isDatabaseScenarioId(scenarioId: string): boolean {
  return UUID_REGEX.test(scenarioId);
}

export async function loadScenarioEvaluationContext(
  database: typeof db,
  scenarioId: string,
): Promise<ScenarioEvaluationContext | null> {
  if (!isDatabaseScenarioId(scenarioId)) {
    return null;
  }

  const scenario = await database.query.scenarios.findFirst({
    where: eq(scenarios.id, scenarioId),
    with: {
      hazards: {
        orderBy: (hazardTable, { asc }) => [asc(hazardTable.sortOrder)],
      },
      scenarioPersonas: {
        with: {
          persona: true,
        },
      },
    },
  });

  if (!scenario) {
    return null;
  }

  return {
    answerKey: buildAnswerKeyFromDbScenario(scenario),
    personas: scenario.scenarioPersonas.map(({ persona }) => ({
      id: persona.id,
      name: persona.name,
      description: persona.roleDescription,
      evaluationInstructions: persona.evaluationInstructions,
    })),
  };
}
