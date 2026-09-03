/**
 * Idempotent seed for the construction-site demo scenario, plus orgs/personas.
 * Called from the home page and scenario list so a fresh database is usable.
 */
import { eq, isNull } from "drizzle-orm";

import { SEED_ORG_ACME_ID } from "~/lib/auth-constants";
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

import { ensureAuthSeeded } from "./seed-auth";
import { ensurePersonasSeeded } from "./seed-personas";

const DEMO_IMAGE_FILE = "construction-site-demo.png";

const overlayByHazardName = new Map(
  hazardLabels.map((label) => [label.label, label]),
);

export async function ensureConstructionSiteDemoSeeded(): Promise<string> {
  await ensureAuthSeeded();
  await ensurePersonasSeeded();

  const existing = await db.query.scenarios.findFirst({
    where: eq(scenarios.id, CONSTRUCTION_SITE_DEMO_SCENARIO_ID),
    columns: { id: true, organizationId: true },
  });

  if (existing) {
    if (!existing.organizationId) {
      await db
        .update(scenarios)
        .set({ organizationId: SEED_ORG_ACME_ID })
        .where(eq(scenarios.id, CONSTRUCTION_SITE_DEMO_SCENARIO_ID));
    }
    return existing.id;
  }

  await db.insert(scenarios).values({
    id: CONSTRUCTION_SITE_DEMO_SCENARIO_ID,
    organizationId: SEED_ORG_ACME_ID,
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

/**
 * Attach pre-auth scenarios (organizationId null) to the default Acme org
 * so managers in that org see them again after org scoping was added.
 */
async function backfillOrphanedScenarios(): Promise<void> {
  await db
    .update(scenarios)
    .set({ organizationId: SEED_ORG_ACME_ID })
    .where(isNull(scenarios.organizationId));
}

export async function ensureAppSeeded(): Promise<void> {
  await ensureConstructionSiteDemoSeeded();
  await backfillOrphanedScenarios();
}
