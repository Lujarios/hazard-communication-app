import assert from "node:assert/strict";
import { describe, it } from "vitest";

import { toPersonaEvaluationInserts } from "~/server/evaluation/persist-persona-evaluations";
import type { EvaluationPersona } from "~/server/scenarios/load-evaluation-context";
import type { PersonaFeedback } from "~/types/feedback";

const personas: EvaluationPersona[] = [
  {
    id: "new-hire",
    name: "New Hire",
    description: "Recently joined",
    evaluationInstructions: "Need plain language",
    experienceLevel: "entry",
    jobRole: "labourer",
    jobRoleOther: null,
    englishLiteracy: "professional",
    projectExperience: "limited",
  },
];

const personaFeedback: PersonaFeedback[] = [
  {
    personaId: "new-hire",
    reaction: "I still do not know where to stand.",
    shortFeedback: "I still do not know where to stand.",
    understood: false,
    wouldKnowWhatActionToTake: false,
    hadAmbiguousInformation: true,
    scores: {
      clarity: 2,
      completeness: 2,
      understandability: 3,
      actionability: 2,
    },
    overallStars: 2,
    understoodPoints: ["There is a crane lift"],
    unclearPoints: ["Where I should stand"],
    missedCriticalInformation: [
      {
        description: "Exclusion zone was never explained",
        severity: "high",
        relatedHazardId: "suspended-load",
      },
    ],
    followUpQuestionCandidates: [
      {
        question: "Where should I stand during the lift?",
        reason: "Location missing",
        relatedHazardId: "suspended-load",
      },
    ],
    question: "Where should I stand during the lift?",
  },
];

describe("toPersonaEvaluationInserts", () => {
  it("snapshots persona characteristics with the scored evaluation", () => {
    const rows = toPersonaEvaluationInserts(
      "attempt-1",
      personaFeedback,
      personas,
    );

    assert.equal(rows.length, 1);
    const row = rows[0];
    assert.equal(row?.assessmentAttemptId, "attempt-1");
    assert.equal(row?.personaId, "new-hire");
    assert.equal(row?.experienceLevel, "entry");
    assert.equal(row?.jobRole, "labourer");
    assert.equal(row?.englishLiteracy, "professional");
    assert.equal(row?.projectExperience, "limited");
    assert.equal(row?.clarityStars, 2);
    assert.equal(row?.completenessStars, 2);
    assert.equal(row?.understandabilityStars, 3);
    assert.equal(row?.actionabilityStars, 2);
    assert.equal(row?.overallStars, 2);
    assert.equal(row?.understood, false);
    assert.equal(row?.wouldKnowWhatActionToTake, false);
    assert.equal(row?.hadAmbiguousInformation, true);
    assert.deepEqual(
      row?.followUpQuestionCandidates,
      personaFeedback[0]?.followUpQuestionCandidates,
    );
  });
});
