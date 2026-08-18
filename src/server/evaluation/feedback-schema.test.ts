import assert from "node:assert/strict";
import { describe, it } from "vitest";

import {
  computeOverallStars,
  createSafetyTalkEvaluationResponseSchema,
  isVagueFollowUpQuestion,
  normalizeFollowUpQuestionCandidates,
  rubricCriterionIds,
  toSafetyTalkFeedback,
  type SafetyTalkEvaluationResponse,
} from "~/server/evaluation/feedback-schema";

const personaIds = ["new-hire", "experienced-worker"];

function allCriteriaRatings() {
  return rubricCriterionIds.map((criterionId, index) => ({
    criterionId,
    stars: ((index % 5) + 1) as 1 | 2 | 3 | 4 | 5,
    summary: `Summary for ${criterionId}`,
  }));
}

function personaEvaluation(
  personaId: "new-hire" | "experienced-worker",
  overrides: Partial<SafetyTalkEvaluationResponse["personaEvaluations"][number]> = {},
): SafetyTalkEvaluationResponse["personaEvaluations"][number] {
  return {
    personaId,
    scores: {
      clarity: 3,
      completeness: 3,
      understandability: 3,
      actionability: 3,
    },
    understood: true,
    hadAmbiguousInformation: false,
    understoodPoints: ["Stay out from under the load"],
    unclearPoints: [],
    missedCriticalInformation: [],
    followUpQuestionCandidates: [],
    shortFeedback: "I got the main point.",
    ...overrides,
  };
}

describe("createSafetyTalkEvaluationResponseSchema", () => {
  it("requires at least one persona", () => {
    assert.throws(
      () => createSafetyTalkEvaluationResponseSchema([]),
      /at least one persona/i,
    );
  });
});

describe("computeOverallStars", () => {
  it("returns the rounded mean of rubric stars", () => {
    assert.equal(
      computeOverallStars([
        { criterionId: "a", stars: 5, summary: "a" },
        { criterionId: "b", stars: 4, summary: "b" },
        { criterionId: "c", stars: 4, summary: "c" },
      ]),
      4,
    );
  });
});

describe("follow-up question normalization", () => {
  it("drops vague and duplicate questions and caps at three", () => {
    const normalized = normalizeFollowUpQuestionCandidates([
      { question: "Can you tell me more?", reason: "vague" },
      {
        question:
          "As the new worker, where should I stand while the lift is operating?",
        reason: "location missing",
      },
      {
        question:
          "As the new worker, where should I stand while the lift is operating?",
        reason: "duplicate",
      },
      {
        question: "You mentioned fall protection, but when do we tie off?",
        reason: "timing missing",
      },
      {
        question: "What exclusion zone should I keep around the crane?",
        reason: "zone missing",
      },
      {
        question: "Who is the signal person for this lift?",
        reason: "role missing",
      },
    ]);

    assert.equal(normalized.length, 3);
    assert.deepEqual(
      normalized.map((item) => item.question),
      [
        "As the new worker, where should I stand while the lift is operating?",
        "You mentioned fall protection, but when do we tie off?",
        "What exclusion zone should I keep around the crane?",
      ],
    );
  });

  it("flags generic clarification prompts as vague", () => {
    assert.equal(isVagueFollowUpQuestion("Can you clarify?"), true);
    assert.equal(isVagueFollowUpQuestion("Can you clarify the hazards?"), true);
    assert.equal(
      isVagueFollowUpQuestion(
        "You mentioned fall protection, but when exactly are we required to tie off?",
      ),
      false,
    );
  });
});

describe("toSafetyTalkFeedback", () => {
  it("maps objective scores and per-persona evaluations", () => {
    const feedback = toSafetyTalkFeedback(
      {
        criteriaRatings: allCriteriaRatings(),
        missedItems: [
          {
            category: "control",
            description: "No exclusion zone under the suspended load",
            severity: "high",
            relatedHazardId: "suspended-load",
          },
        ],
        overallSummary: "The talk named the crane but skipped the exclusion zone.",
        personaEvaluations: [
          personaEvaluation("new-hire", {
            scores: {
              clarity: 2,
              completeness: 2,
              understandability: 2,
              actionability: 1,
            },
            understood: false,
            hadAmbiguousInformation: true,
            unclearPoints: ["Where to stand during the lift"],
            missedCriticalInformation: [
              {
                description: "I still would not know where I am allowed to stand.",
                severity: "high",
                relatedHazardId: "suspended-load",
              },
            ],
            followUpQuestionCandidates: [
              {
                question:
                  "As the new worker on this crew, I'm not sure where you want me to stand while the lift is operating. Can you clarify?",
                reason: "Location was never stated.",
                relatedHazardId: "suspended-load",
              },
            ],
            shortFeedback:
              "I heard there is a crane, but I do not know where I should stand.",
          }),
          personaEvaluation("experienced-worker", {
            scores: {
              clarity: 4,
              completeness: 3,
              understandability: 5,
              actionability: 4,
            },
            understood: true,
            followUpQuestionCandidates: [
              {
                question:
                  "You mentioned the lift, but who is running signals and where is the exclusion zone?",
                reason: "Controls were implied rather than assigned.",
                relatedHazardId: "suspended-load",
              },
            ],
            shortFeedback:
              "I know to stay clear, but I still need the exclusion zone called out.",
          }),
        ],
      },
      personaIds,
    );

    assert.ok(feedback.overallStars >= 1);
    assert.equal(feedback.personaFeedback?.length, 2);

    const newHire = feedback.personaFeedback?.[0];
    assert.equal(newHire?.personaId, "new-hire");
    assert.ok(newHire?.shortFeedback.includes("crane"));
    assert.equal(newHire?.reaction, newHire?.shortFeedback);
    assert.equal(newHire?.wouldKnowWhatActionToTake, false);
    assert.equal(newHire?.overallStars, 2);
    assert.equal(newHire?.followUpQuestionCandidates.length, 1);
    assert.ok(newHire?.question?.includes("where you want me to stand"));

    const veteran = feedback.personaFeedback?.[1];
    assert.equal(veteran?.wouldKnowWhatActionToTake, true);
    assert.equal(veteran?.followUpQuestionCandidates.length, 1);
  });

  it("does not globally cap follow-up questions across personas", () => {
    const feedback = toSafetyTalkFeedback(
      {
        criteriaRatings: allCriteriaRatings(),
        missedItems: [],
        overallSummary: "Coverage was mixed.",
        personaEvaluations: [
          personaEvaluation("new-hire", {
            understood: false,
            followUpQuestionCandidates: [
              {
                question: "Where should I stand during the lift?",
                reason: "Location missing",
                relatedHazardId: "suspended-load",
              },
            ],
          }),
          personaEvaluation("experienced-worker", {
            followUpQuestionCandidates: [
              {
                question: "Who is the signal person for this lift?",
                reason: "Accountability missing",
                relatedHazardId: "suspended-load",
              },
            ],
          }),
        ],
      },
      personaIds,
    );

    assert.equal(
      feedback.personaFeedback?.filter((entry) => entry.question).length,
      2,
    );
  });

  it("throws when a persona evaluation is missing", () => {
    assert.throws(
      () =>
        toSafetyTalkFeedback(
          {
            criteriaRatings: allCriteriaRatings(),
            missedItems: [],
            overallSummary: "Incomplete model output.",
            personaEvaluations: [personaEvaluation("new-hire")],
          },
          personaIds,
        ),
      /missing persona feedback/i,
    );
  });
});
