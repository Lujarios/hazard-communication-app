import assert from "node:assert/strict";
import { describe, it } from "vitest";

import {
  buildAssessmentProgression,
  clarificationRoundsUsed,
  finishedEarly,
  missedItemKey,
  toParticipantCompletionSummary,
} from "~/lib/assessment-progression";
import type {
  AssessmentRunSnapshot,
  AssessmentStageSnapshot,
} from "~/types/assessment-run";
import type { SafetyTalkFeedback } from "~/types/feedback";

function feedback(overrides: Partial<SafetyTalkFeedback>): SafetyTalkFeedback {
  return {
    overallStars: 3,
    overallSummary: "The talk covered part of the job.",
    criteriaRatings: [
      {
        criterionId: "hazard-identification-completeness",
        stars: 3,
        summary: "Some hazards were named.",
      },
      {
        criterionId: "control-measures",
        stars: 2,
        summary: "Controls were incomplete.",
      },
    ],
    missedItems: [
      {
        category: "hazard",
        description: "Overhead work was not explained.",
        severity: "high",
        relatedHazardId: "overhead-work",
      },
    ],
    personaFeedback: [
      {
        personaId: "new-hire",
        reaction: "I am not sure where to stand.",
        shortFeedback: "I am not sure where to stand.",
        understood: false,
        wouldKnowWhatActionToTake: false,
        hadAmbiguousInformation: true,
        scores: {
          clarity: 2,
          completeness: 2,
          understandability: 2,
          actionability: 2,
        },
        overallStars: 2,
        understoodPoints: [],
        unclearPoints: ["Where to stand"],
        missedCriticalInformation: [],
        followUpQuestionCandidates: [],
      },
    ],
    ...overrides,
  };
}

function stage(
  overrides: Partial<AssessmentStageSnapshot> &
    Pick<AssessmentStageSnapshot, "stageType" | "stageIndex">,
): AssessmentStageSnapshot {
  return {
    id: `stage-${overrides.stageIndex}`,
    segmentTranscript: "Stay clear of the lift.",
    cumulativeTranscript: "Stay clear of the lift.",
    feedback: feedback({}),
    selectedFollowUpQuestions: [],
    participantFinishedAfterStage: false,
    createdAt: new Date("2026-08-18T12:00:00.000Z"),
    ...overrides,
  };
}

function snapshot(
  overrides: Partial<AssessmentRunSnapshot>,
): AssessmentRunSnapshot {
  return {
    runId: "11111111-1111-4111-8111-111111111111",
    status: "completed",
    stageCount: 1,
    workflowVersion: 2,
    completionReason: "no_followups",
    completedAt: new Date("2026-08-18T12:05:00.000Z"),
    pendingSegmentTranscript: null,
    lastError: null,
    selectedQuestions: [],
    questionResolutions: [],
    stages: [stage({ stageType: "initial", stageIndex: 0 })],
    canSubmit: false,
    canComplete: false,
    needsFinishConfirmation: false,
    ...overrides,
  };
}

describe("clarificationRoundsUsed", () => {
  it("counts successful speeches after the initial talk", () => {
    assert.equal(clarificationRoundsUsed(0), 0);
    assert.equal(clarificationRoundsUsed(1), 0);
    assert.equal(clarificationRoundsUsed(2), 1);
    assert.equal(clarificationRoundsUsed(3), 2);
  });
});

describe("finishedEarly", () => {
  it("is true only for an early participant finish", () => {
    assert.equal(finishedEarly("early_finish"), true);
    assert.equal(finishedEarly("max_rounds"), false);
    assert.equal(finishedEarly("no_followups"), false);
    assert.equal(finishedEarly(null), false);
  });
});

describe("missedItemKey", () => {
  it("prefers hazard id when present", () => {
    assert.equal(
      missedItemKey({
        category: "hazard",
        description: "Overhead work was not explained.",
        severity: "high",
        relatedHazardId: "overhead-work",
      }),
      "hazard:overhead-work",
    );
  });
});

describe("buildAssessmentProgression", () => {
  it("preserves each round instead of collapsing to the final score", () => {
    const result = buildAssessmentProgression(
      snapshot({
        stageCount: 2,
        completionReason: "no_followups",
        questionResolutions: [
          {
            personaId: "new-hire",
            personaName: "New Hire",
            question: "Where should I stand?",
            reason: "Location missing",
            relatedHazardId: "overhead-work",
            addressed: true,
            understood: true,
          },
        ],
        stages: [
          stage({
            stageType: "initial",
            stageIndex: 0,
            selectedFollowUpQuestions: [
              {
                personaId: "new-hire",
                personaName: "New Hire",
                question: "Where should I stand?",
                reason: "Location missing",
                relatedHazardId: "overhead-work",
                mergedFromPersonaIds: [],
              },
            ],
          }),
          stage({
            stageType: "clarification_1",
            stageIndex: 1,
            segmentTranscript: "Stand behind the barricade.",
            cumulativeTranscript:
              "Stay clear of the lift.\n\nStand behind the barricade.",
            participantFinishedAfterStage: true,
            feedback: feedback({
              overallStars: 4,
              criteriaRatings: [
                {
                  criterionId: "hazard-identification-completeness",
                  stars: 4,
                  summary: "Overhead work was explained.",
                },
                {
                  criterionId: "control-measures",
                  stars: 4,
                  summary: "The barricade was named.",
                },
              ],
              missedItems: [],
              personaFeedback: [
                {
                  personaId: "new-hire",
                  reaction: "I know where to stand now.",
                  shortFeedback: "I know where to stand now.",
                  understood: true,
                  wouldKnowWhatActionToTake: true,
                  hadAmbiguousInformation: false,
                  scores: {
                    clarity: 4,
                    completeness: 4,
                    understandability: 4,
                    actionability: 4,
                  },
                  overallStars: 4,
                  understoodPoints: ["Stand behind the barricade"],
                  unclearPoints: [],
                  missedCriticalInformation: [],
                  followUpQuestionCandidates: [],
                },
              ],
            }),
          }),
        ],
      }),
    );

    assert.equal(result.clarificationRoundsUsed, 1);
    assert.equal(result.finishedEarly, false);
    assert.equal(result.completionStage, "clarification_1");
    assert.deepEqual(result.overallStars, { initial: 3, final: 4, delta: 1 });
    assert.equal(result.rounds.length, 2);
    assert.equal(result.rounds[0]?.questionsShown[0]?.question, "Where should I stand?");
    assert.equal(result.resolvedMissedItems[0]?.relatedHazardId, "overhead-work");
    assert.equal(result.remainingMissedItems.length, 0);
    assert.equal(result.resolvedMisunderstandings.length, 1);
    assert.equal(result.personas[0]?.delta, 2);
    assert.equal(result.personas[0]?.initiallyUnderstood, false);
    assert.equal(result.personas[0]?.finallyUnderstood, true);
  });

  it("marks an early finish after the initial talk", () => {
    const result = buildAssessmentProgression(
      snapshot({
        completionReason: "early_finish",
        stageCount: 1,
      }),
    );

    assert.equal(result.finishedEarly, true);
    assert.equal(result.clarificationRoundsUsed, 0);
    assert.equal(result.completionStage, "initial");
  });
});

describe("toParticipantCompletionSummary", () => {
  it("keeps participant copy concise and omits improvement when no clarification happened", () => {
    const summary = toParticipantCompletionSummary(
      buildAssessmentProgression(
        snapshot({
          stages: [
            stage({
              stageType: "initial",
              stageIndex: 0,
              feedback: feedback({
                overallStars: 4,
                criteriaRatings: [
                  {
                    criterionId: "hazard-identification-completeness",
                    stars: 4,
                    summary: "Hazards were named clearly.",
                  },
                  {
                    criterionId: "control-measures",
                    stars: 4,
                    summary: "Controls were specific.",
                  },
                ],
                missedItems: [],
                personaFeedback: [
                  {
                    personaId: "new-hire",
                    reaction: "Clear enough.",
                    shortFeedback: "Clear enough.",
                    understood: true,
                    wouldKnowWhatActionToTake: true,
                    hadAmbiguousInformation: false,
                    scores: {
                      clarity: 4,
                      completeness: 4,
                      understandability: 4,
                      actionability: 4,
                    },
                    overallStars: 4,
                    understoodPoints: ["Stay clear"],
                    unclearPoints: [],
                    missedCriticalInformation: [],
                    followUpQuestionCandidates: [],
                  },
                ],
              }),
            }),
          ],
        }),
      ),
    );

    assert.equal(summary.clarificationRoundsUsed, 0);
    assert.equal(
      summary.completionStageLabel,
      "Completed after the initial safety talk",
    );
    assert.deepEqual(summary.improvedAreas, []);
    assert.ok(summary.strengths.includes("Hazard Identification"));
    assert.ok(summary.strengths.includes("Control Measures"));
  });

  it("summarizes growth after clarification without exposing internal fields", () => {
    const summary = toParticipantCompletionSummary(
      buildAssessmentProgression(
        snapshot({
          stageCount: 2,
          completionReason: "no_followups",
          questionResolutions: [
            {
              personaId: "new-hire",
              personaName: "New Hire",
              question: "Where should I stand?",
              reason: "internal ranking reason",
              relatedHazardId: "overhead-work",
              addressed: true,
              understood: true,
            },
          ],
          stages: [
            stage({
              stageType: "initial",
              stageIndex: 0,
            }),
            stage({
              stageType: "clarification_1",
              stageIndex: 1,
              feedback: feedback({
                overallStars: 4,
                criteriaRatings: [
                  {
                    criterionId: "hazard-identification-completeness",
                    stars: 4,
                    summary: "Hazards were named.",
                  },
                  {
                    criterionId: "control-measures",
                    stars: 4,
                    summary: "Controls were named.",
                  },
                ],
                missedItems: [],
                personaFeedback: [
                  {
                    personaId: "new-hire",
                    reaction: "Clear now.",
                    shortFeedback: "Clear now.",
                    understood: true,
                    wouldKnowWhatActionToTake: true,
                    hadAmbiguousInformation: false,
                    scores: {
                      clarity: 4,
                      completeness: 4,
                      understandability: 4,
                      actionability: 4,
                    },
                    overallStars: 4,
                    understoodPoints: [],
                    unclearPoints: [],
                    missedCriticalInformation: [],
                    followUpQuestionCandidates: [],
                  },
                ],
              }),
            }),
          ],
        }),
      ),
    );

    assert.equal(summary.clarificationRoundsUsed, 1);
    assert.ok(
      summary.improvedAreas.some((area) => area.toLowerCase().includes("hazard")),
    );
    assert.equal(
      summary.improvedAreas.some((area) => area.includes("internal ranking")),
      false,
    );
  });
});
