import { eq } from "drizzle-orm";

import { hazardLabels } from "~/lib/demo-data";
import { CONSTRUCTION_SITE_DEMO_SCENARIO_ID } from "~/lib/scenario-constants";
import { constructionSiteDemoAnswerKey } from "~/lib/scenario-answer-keys";
import { workerPersonas } from "~/lib/demo-data";
import { db } from "~/server/db";
import {
  scenarioHazards,
  scenarioPersonas,
  scenarios,
} from "~/server/db/schema";

import { ensurePersonasSeeded } from "./seed-personas";

const DEMO_IMAGE_FILE = "construction-site-demo.png";

const overlayByHazardName = new Map(
  hazardLabels.map((label) => [label.label, label]),
);

export async function ensureConstructionSiteDemoSeeded(): Promise<string> {
  await ensurePersonasSeeded();

  const existing = await db.query.scenarios.findFirst({
    where: eq(scenarios.id, CONSTRUCTION_SITE_DEMO_SCENARIO_ID),
    columns: { id: true },
  });

  if (existing) {
    return existing.id;
  }

  await db.insert(scenarios).values({
    id: CONSTRUCTION_SITE_DEMO_SCENARIO_ID,
    title: "Scenario: Commercial Building Construction",
    description:
      "Review the construction site image. Identify visible hazards, explain why each is dangerous, and describe the controls workers should follow before work continues.",
    imageFileName: DEMO_IMAGE_FILE,
    status: "ready",
    modelSummary: constructionSiteDemoAnswerKey.modelSummary,
  });

  await db.insert(scenarioHazards).values(
    constructionSiteDemoAnswerKey.hazards.map((hazard, index) => {
      const overlay = overlayByHazardName.get(hazard.name);

      return {
        scenarioId: CONSTRUCTION_SITE_DEMO_SCENARIO_ID,
        hazardTitle: hazard.name,
        hazardDescription: hazard.calloutPoints.join(" "),
        controlDescription: hazard.requiredControls.join("\n"),
        locationNote: null,
        overlayTop: overlay?.position.top ?? null,
        overlayLeft: overlay?.position.left ?? null,
        severity: hazard.severity,
        isLifeThreatening: hazard.isLifeThreatening,
        sortOrder: index,
      };
    }),
  );

  await db.insert(scenarioPersonas).values(
    workerPersonas.map((persona) => ({
      scenarioId: CONSTRUCTION_SITE_DEMO_SCENARIO_ID,
      personaId: persona.id,
    })),
  );

  return CONSTRUCTION_SITE_DEMO_SCENARIO_ID;
}

export async function ensureAppSeeded(): Promise<void> {
  await ensureConstructionSiteDemoSeeded();
}
