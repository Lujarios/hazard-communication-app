import assert from "node:assert/strict";
import { describe, it } from "vitest";

import { selectFollowUpQuestions, resolvePreviousQuestions } from "~/server/evaluation/select-follow-up-questions";
import type { PersonaFeedback } from "~/types/feedback";

const personas = [
  {
    id: "new-hire",
    name: "New Hire",
    experienceLevel: "entry",
    englishLiteracy: "professional",
  },
  {
    id: "foreman",
    name: "Experienced Foreman",
    experienceLevel: "experienced",
    englishLiteracy: "fluent",
  },
  {
    id: "limited-english",
    name: "Limited English Worker",
    experienceLevel: "intermediate",
    englishLiteracy: "limited",
  },
];

function feedback(
  personaId: string,
  overrides: Partial<PersonaFeedback> = {},
): PersonaFeedback {
  return {
    personaId,
    reaction: "Need a bit more detail.",
    shortFeedback: "Need a bit more detail.",
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
    missedCriticalInformation: [
      {
        description: "Exclusion zone was never explained",
        severity: "high",
        relatedHazardId: "suspended-load",
      },
    ],
    followUpQuestionCandidates: [],
    ...overrides,
  };
}

describe("selectFollowUpQuestions", () => {
  it("returns an empty list when there are no useful questions", () => {
    const selected = selectFollowUpQuestions(
      [
        feedback("new-hire", {
          understood: true,
          wouldKnowWhatActionToTake: true,
          hadAmbiguousInformation: false,
          missedCriticalInformation: [],
          followUpQuestionCandidates: [
            { question: "Can you tell me more?", reason: "vague" },
          ],
        }),
      ],
      personas,
    );

    assert.deepEqual(selected, []);
  });

  it("caps the shown list at two questions", () => {
    const selected = selectFollowUpQuestions(
      [
        feedback("new-hire", {
          followUpQuestionCandidates: [
            {
              question: "Where should I stand while the lift is operating?",
              reason: "Location missing",
              relatedHazardId: "suspended-load",
            },
          ],
        }),
        feedback("foreman", {
          followUpQuestionCandidates: [
            {
              question: "Who is the signal person for this lift?",
              reason: "Accountability missing",
              relatedHazardId: "suspended-load",
            },
          ],
        }),
        feedback("limited-english", {
          followUpQuestionCandidates: [
            {
              question: "When do I need to wear the fall protection harness?",
              reason: "Timing missing",
              relatedHazardId: "fall-hazard",
            },
          ],
        }),
      ],
      personas,
    );

    assert.equal(selected.length, 2);
  });

  it("merges questions about the same hazard even when the wording differs", () => {
    const selected = selectFollowUpQuestions(
      [
        feedback("new-hire", {
          followUpQuestionCandidates: [
            {
              question: "Where should I stand while the lift is operating?",
              reason: "Location missing",
              relatedHazardId: "suspended-load",
            },
          ],
        }),
        feedback("foreman", {
          followUpQuestionCandidates: [
            {
              question: "Who is the signal person and where is the exclusion zone?",
              reason: "Controls implied",
              relatedHazardId: "suspended-load",
            },
          ],
        }),
      ],
      personas,
    );

    assert.equal(selected.length, 1);
    assert.ok(selected[0]?.mergedFromPersonaIds.includes("foreman") || selected[0]?.personaId === "foreman");
  });

  it("returns no questions when the max is zero", () => {
    const selected = selectFollowUpQuestions(
      [
        feedback("new-hire", {
          followUpQuestionCandidates: [
            {
              question: "Where should I stand while the lift is operating?",
              reason: "Location missing",
              relatedHazardId: "suspended-load",
            },
          ],
        }),
      ],
      personas,
      { max: 0 },
    );

    assert.deepEqual(selected, []);
  });

  it("merges stop-work questions even when one worker asks about seeing something unsafe", () => {
    const selected = selectFollowUpQuestions(
      [
        feedback("new-hire", {
          followUpQuestionCandidates: [
            {
              question: "When should I stop work if I see a hazard?",
              reason: "Stop-work missing",
            },
          ],
        }),
        feedback("limited-english", {
          followUpQuestionCandidates: [
            {
              question: "Can you tell me again what I should do if I see something unsafe?",
              reason: "Same stop-work gap",
            },
          ],
        }),
      ],
      personas,
    );

    assert.equal(selected.length, 1);
    assert.ok(
      selected[0]?.mergedFromPersonaIds.includes("limited-english") ||
        selected[0]?.personaId === "limited-english",
    );
  });

  it("merges near-duplicate questions from different personas", () => {
    const selected = selectFollowUpQuestions(
      [
        feedback("new-hire", {
          followUpQuestionCandidates: [
            {
              question: "Where should I stand while the lift is operating?",
              reason: "Location missing",
              relatedHazardId: "suspended-load",
            },
          ],
        }),
        feedback("limited-english", {
          followUpQuestionCandidates: [
            {
              question: "Where should I stand while the lift is operating?",
              reason: "Same location gap",
              relatedHazardId: "suspended-load",
            },
          ],
        }),
      ],
      personas,
    );

    assert.equal(selected.length, 1);
    assert.equal(selected[0]?.personaId, "new-hire");
    assert.deepEqual(selected[0]?.mergedFromPersonaIds, ["limited-english"]);
  });

  it("prefers high-severity actionable gaps over weaker follow-ups", () => {
    const selected = selectFollowUpQuestions(
      [
        feedback("foreman", {
          understood: true,
          wouldKnowWhatActionToTake: true,
          hadAmbiguousInformation: false,
          missedCriticalInformation: [
            {
              description: "Signal person was not named",
              severity: "info",
            },
          ],
          followUpQuestionCandidates: [
            {
              question: "Who is running signals for this lift?",
              reason: "Nice to have",
            },
          ],
        }),
        feedback("new-hire", {
          followUpQuestionCandidates: [
            {
              question: "Where should I stand while the scissor lift is operating?",
              reason: "Life-safety location missing",
              relatedHazardId: "suspended-load",
            },
          ],
        }),
      ],
      personas,
      { max: 1 },
    );

    assert.equal(selected.length, 1);
    assert.ok(selected[0]?.question.includes("scissor lift"));
  });

  it("drops questions that were already shown in an earlier round", () => {
    const selected = selectFollowUpQuestions(
      [
        feedback("new-hire", {
          followUpQuestionCandidates: [
            {
              question: "Where should I stand while the lift is operating?",
              reason: "Still missing",
              relatedHazardId: "suspended-load",
            },
          ],
        }),
      ],
      personas,
      {
        previouslyShown: [
          {
            personaId: "new-hire",
            personaName: "New Hire",
            question: "Where should I stand while the lift is operating?",
            reason: "Asked already",
            relatedHazardId: "suspended-load",
            mergedFromPersonaIds: [],
          },
        ],
      },
    );

    assert.deepEqual(selected, []);
  });

  it("still allows a later-round question about a different detail of the same hazard", () => {
    const selected = selectFollowUpQuestions(
      [
        feedback("foreman", {
          followUpQuestionCandidates: [
            {
              question: "Who is the signal person for this lift?",
              reason: "Accountability missing",
              relatedHazardId: "suspended-load",
            },
          ],
        }),
      ],
      personas,
      {
        max: 1,
        previouslyShown: [
          {
            personaId: "new-hire",
            personaName: "New Hire",
            question: "Where should I stand while the lift is operating?",
            reason: "Location missing",
            relatedHazardId: "suspended-load",
            mergedFromPersonaIds: [],
          },
        ],
      },
    );

    assert.equal(selected.length, 1);
    assert.ok(selected[0]?.question.includes("signal person"));
  });
});

describe("resolvePreviousQuestions", () => {
  const previous = [
    {
      personaId: "new-hire",
      personaName: "New Hire",
      question: "Where should I stand while the lift is operating?",
      reason: "Location missing",
      relatedHazardId: "suspended-load",
      mergedFromPersonaIds: [] as string[],
    },
  ];

  it("marks a previous question as addressed when that worker now understands", () => {
    const resolutions = resolvePreviousQuestions(
      previous,
      [
        feedback("new-hire", {
          understood: true,
          wouldKnowWhatActionToTake: true,
          hadAmbiguousInformation: false,
          missedCriticalInformation: [],
          followUpQuestionCandidates: [],
        }),
      ],
      personas,
    );

    assert.equal(resolutions.length, 1);
    assert.equal(resolutions[0]?.addressed, true);
    assert.equal(resolutions[0]?.understood, true);
  });

  it("keeps the previous question flagged when the clarification was not enough", () => {
    const resolutions = resolvePreviousQuestions(
      previous,
      [
        feedback("new-hire", {
          understood: false,
          wouldKnowWhatActionToTake: false,
          followUpQuestionCandidates: [
            {
              question: "I still do not know where to stand during the lift.",
              reason: "Location still missing",
              relatedHazardId: "suspended-load",
            },
          ],
        }),
      ],
      personas,
    );

    assert.equal(resolutions[0]?.addressed, false);
    assert.equal(resolutions[0]?.understood, false);
    assert.equal(
      resolutions[0]?.question,
      "Where should I stand while the lift is operating?",
    );
  });

  it("marks a directly answered question as addressed even if other unrelated gaps remain", () => {
    const stopWorkReply = [
      "I should stop work if I see a hazard that creates an immediate risk to me, another worker, or the public.",
      "If you see something unsafe, don't ignore it. Warn anyone who may be at risk, and report it to the supervisor.",
    ].join(" ");
    const ppeReply =
      "For safety gear, wear the PPE required for the construction zone. At a minimum, a hard hat, high-visibility clothing, safety glasses, and CSA-approved safety boots.";

    const stillHasOtherGaps = feedback("limited-english", {
      understood: false,
      wouldKnowWhatActionToTake: false,
      missedCriticalInformation: [
        {
          description: "Public barrier is still incomplete",
          severity: "high",
          relatedHazardId: "public-barrier",
        },
      ],
      followUpQuestionCandidates: [],
    });

    const resolutions = resolvePreviousQuestions(
      [
        {
          personaId: "new-hire",
          personaName: "New Hire",
          question: "When should I stop work if I see a hazard?",
          reason: "Stop-work missing",
          relatedHazardId: "public-barrier",
          mergedFromPersonaIds: [],
          responseText: stopWorkReply,
        },
        {
          personaId: "limited-english",
          personaName: "Low Literacy",
          question: "Can you tell me again what I should do if I see something unsafe?",
          reason: "Unsafe response missing",
          relatedHazardId: "public-barrier",
          mergedFromPersonaIds: [],
          responseText: stopWorkReply,
        },
        {
          personaId: "limited-english",
          personaName: "Low Literacy",
          question: "Can you tell me what to do for safety gear?",
          reason: "PPE missing",
          relatedHazardId: "ppe",
          mergedFromPersonaIds: [],
          responseText: ppeReply,
        },
      ],
      [
        feedback("new-hire", {
          understood: false,
          wouldKnowWhatActionToTake: false,
          missedCriticalInformation: stillHasOtherGaps.missedCriticalInformation,
          followUpQuestionCandidates: [],
        }),
        stillHasOtherGaps,
      ],
      personas,
    );

    assert.equal(resolutions.every((resolution) => resolution.addressed), true);
  });

  it("keeps a question flagged when a later reply talks about a different topic", () => {
    const resolutions = resolvePreviousQuestions(
      [
        {
          ...previous[0]!,
          responseText:
            "For safety gear, wear a hard hat, safety glasses, and CSA-approved boots.",
        },
      ],
      [
        feedback("new-hire", {
          understood: false,
          wouldKnowWhatActionToTake: false,
          followUpQuestionCandidates: [],
        }),
      ],
      personas,
    );

    assert.equal(resolutions[0]?.addressed, false);
  });
});
