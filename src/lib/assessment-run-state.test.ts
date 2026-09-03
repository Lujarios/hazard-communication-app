import assert from "node:assert/strict";
import { describe, it } from "vitest";

import {
  buildCumulativeTranscript,
  canCompleteRun,
  canSubmitResponse,
  completionReasonForFinish,
  conversationFromStages,
  formatConversationForEvaluation,
  maxFollowUpQuestionsAfterStage,
  needsFinishConfirmation,
  nextStatusAfterEvaluation,
  shouldAutoCompleteAfterEvaluation,
  stageTypeForIndex,
  statusAfterFailedSubmit,
} from "~/lib/assessment-run-state";

describe("maxFollowUpQuestionsAfterStage", () => {
  it("allows two after the initial talk, one after clarification 1, and none after clarification 2", () => {
    assert.equal(maxFollowUpQuestionsAfterStage("initial"), 2);
    assert.equal(maxFollowUpQuestionsAfterStage("clarification_1"), 1);
    assert.equal(maxFollowUpQuestionsAfterStage("clarification_2"), 0);
  });
});

describe("stageTypeForIndex", () => {
  it("maps the three allowed speech submissions", () => {
    assert.equal(stageTypeForIndex(0), "initial");
    assert.equal(stageTypeForIndex(1), "clarification_1");
    assert.equal(stageTypeForIndex(2), "clarification_2");
  });

  it("rejects a fourth submission", () => {
    assert.throws(() => stageTypeForIndex(3), /no more clarification/i);
  });
});

describe("canSubmitResponse", () => {
  it("allows the initial talk before any stage exists", () => {
    assert.equal(canSubmitResponse("awaiting_initial", 0), true);
  });

  it("allows a clarification only while follow-up is available", () => {
    assert.equal(canSubmitResponse("followup_available", 1), true);
    assert.equal(canSubmitResponse("followup_available", 2), true);
    assert.equal(canSubmitResponse("followup_available", 3), false);
  });

  it("rejects submit while processing, ready to complete, or completed", () => {
    assert.equal(canSubmitResponse("processing", 0), false);
    assert.equal(canSubmitResponse("ready_to_complete", 1), false);
    assert.equal(canSubmitResponse("completed", 1), false);
  });
});

describe("canCompleteRun", () => {
  it("requires at least one successful stage", () => {
    assert.equal(canCompleteRun("awaiting_initial", 0), false);
    assert.equal(canCompleteRun("followup_available", 1), true);
    assert.equal(canCompleteRun("ready_to_complete", 1), true);
    assert.equal(canCompleteRun("processing", 1), false);
    assert.equal(canCompleteRun("completed", 1), false);
  });
});

describe("nextStatusAfterEvaluation", () => {
  it("opens a follow-up round when questions remain and rounds remain", () => {
    assert.deepEqual(
      nextStatusAfterEvaluation({
        succeededStageCount: 1,
        selectedQuestionCount: 2,
      }),
      { status: "followup_available", completionReason: null },
    );
  });

  it("does not invent a round when no useful questions were selected", () => {
    assert.deepEqual(
      nextStatusAfterEvaluation({
        succeededStageCount: 1,
        selectedQuestionCount: 0,
      }),
      { status: "ready_to_complete", completionReason: "no_followups" },
    );
  });

  it("ends after the third speech submission even if questions remain", () => {
    assert.deepEqual(
      nextStatusAfterEvaluation({
        succeededStageCount: 3,
        selectedQuestionCount: 2,
      }),
      { status: "ready_to_complete", completionReason: "max_rounds" },
    );
  });
});

describe("shouldAutoCompleteAfterEvaluation", () => {
  it("locks the run only after the maximum clarification rounds", () => {
    assert.equal(
      shouldAutoCompleteAfterEvaluation("ready_to_complete", "max_rounds"),
      true,
    );
    assert.equal(
      shouldAutoCompleteAfterEvaluation("ready_to_complete", "no_followups"),
      false,
    );
    assert.equal(
      shouldAutoCompleteAfterEvaluation("followup_available", null),
      false,
    );
  });
});

describe("completionReasonForFinish", () => {
  it("keeps the ready-to-complete reason and marks other finishes as early", () => {
    assert.equal(
      completionReasonForFinish({
        status: "ready_to_complete",
        existingReason: "max_rounds",
      }),
      "max_rounds",
    );
    assert.equal(
      completionReasonForFinish({
        status: "followup_available",
        existingReason: null,
      }),
      "early_finish",
    );
  });
});

describe("needsFinishConfirmation", () => {
  it("confirms only when a remaining worker question could still be answered", () => {
    assert.equal(needsFinishConfirmation("followup_available", 1, 1), true);
    assert.equal(needsFinishConfirmation("ready_to_complete", 0, 1), false);
    assert.equal(needsFinishConfirmation("followup_available", 1, 3), false);
  });
});

describe("statusAfterFailedSubmit", () => {
  it("returns the participant to the matching recordable status", () => {
    assert.equal(statusAfterFailedSubmit(0), "awaiting_initial");
    assert.equal(statusAfterFailedSubmit(1), "followup_available");
  });
});

describe("cumulative conversation", () => {
  it("joins segment transcripts without forcing a restatement", () => {
    assert.equal(
      buildCumulativeTranscript([
        { segmentTranscript: "There is overhead work. Stay clear of the area." },
        {
          segmentTranscript:
            "Specifically, no one should enter the barricaded walkway below.",
        },
      ]),
      [
        "There is overhead work. Stay clear of the area.",
        "Specifically, no one should enter the barricaded walkway below.",
      ].join("\n\n"),
    );
  });

  it("labels prior talk, worker questions, and the clarification", () => {
    const formatted = formatConversationForEvaluation(
      conversationFromStages([
        {
          stageType: "initial",
          segmentTranscript: "There is overhead work. Stay clear of the area.",
          selectedFollowUpQuestions: [
            {
              personaId: "new-hire",
              personaName: "New Hire",
              question: "Where should I stand while the scissor lift is operating?",
              reason: "Location missing",
              relatedHazardId: "overhead-work",
              mergedFromPersonaIds: [],
            },
          ],
        },
        {
          stageType: "clarification_1",
          segmentTranscript:
            "Specifically, no one should enter the barricaded walkway below.",
          selectedFollowUpQuestions: [],
        },
      ]),
    );

    assert.ok(formatted.includes("### Initial safety talk"));
    assert.ok(formatted.includes("There is overhead work. Stay clear of the area."));
    assert.ok(formatted.includes("### Worker questions (clarification 1)"));
    assert.ok(
      formatted.includes(
        "[New Hire] Where should I stand while the scissor lift is operating?",
      ),
    );
    assert.ok(
      formatted.includes(
        "Specifically, no one should enter the barricaded walkway below.",
      ),
    );
    assert.ok(formatted.includes("do not require the speaker to repeat"));
  });
});
