import { and, eq, isNull } from "drizzle-orm";

import { workerPersonas } from "~/lib/demo-data";
import { db } from "~/server/db";
import { personas } from "~/server/db/schema";
import type {
  EnglishLiteracy,
  ExperienceLevel,
  JobRole,
  ProjectExperience,
} from "~/types/persona";

const personaEvaluationInstructions: Record<string, string> = {
  "experienced-worker":
    "Respond as a veteran tradesperson with 15+ years on site. You expect clear, practical hazard callouts and specific controls. You notice when controls are vague or missing.",
  "new-hire":
    "Respond as a worker with less than six months on the job. You need plain language, step-by-step explanations, and reassurance about what to do first.",
  "limited-english":
    "Respond as a worker whose primary language is Spanish. Favor short sentences, concrete actions, and avoid idioms or jargon without explanation.",
  "low-literacy":
    "Respond as a worker who prefers visual and simple verbal cues. Flag when instructions rely too heavily on written terms or complex vocabulary.",
  "site-supervisor":
    "Respond as the site supervisor overseeing daily operations. You evaluate completeness, accountability, and whether the talk sets clear expectations for the crew.",
};

const builtinPersonaCharacteristics: Record<
  string,
  {
    experienceLevel: ExperienceLevel;
    jobRole: JobRole;
    englishLiteracy: EnglishLiteracy;
    projectExperience: ProjectExperience;
  }
> = {
  "experienced-worker": {
    experienceLevel: "experienced",
    jobRole: "labourer",
    englishLiteracy: "fluent",
    projectExperience: "extensive",
  },
  "new-hire": {
    experienceLevel: "entry",
    jobRole: "labourer",
    englishLiteracy: "professional",
    projectExperience: "limited",
  },
  "limited-english": {
    experienceLevel: "intermediate",
    jobRole: "labourer",
    englishLiteracy: "limited",
    projectExperience: "moderate",
  },
  "low-literacy": {
    experienceLevel: "intermediate",
    jobRole: "labourer",
    englishLiteracy: "developing",
    projectExperience: "moderate",
  },
  "site-supervisor": {
    experienceLevel: "very-experienced",
    jobRole: "site-supervisor",
    englishLiteracy: "fluent",
    projectExperience: "extensive",
  },
};

async function backfillPersonaCharacteristics() {
  for (const [id, characteristics] of Object.entries(
    builtinPersonaCharacteristics,
  )) {
    await db
      .update(personas)
      .set(characteristics)
      .where(and(eq(personas.id, id), isNull(personas.experienceLevel)));
  }
}

export async function ensurePersonasSeeded() {
  const existing = await db.query.personas.findFirst();

  if (!existing) {
    await db.insert(personas).values(
      workerPersonas.map((persona) => ({
        id: persona.id,
        organizationId: null,
        isCustom: false,
        name: persona.name,
        roleDescription: persona.description,
        evaluationInstructions:
          personaEvaluationInstructions[persona.id] ??
          `Respond as ${persona.name} (${persona.description}).`,
        initials: persona.initials,
        avatarColor: persona.avatarColor,
        ...builtinPersonaCharacteristics[persona.id],
      })),
    );
  }

  await backfillPersonaCharacteristics();
}

export type DbPersona = typeof personas.$inferSelect;
