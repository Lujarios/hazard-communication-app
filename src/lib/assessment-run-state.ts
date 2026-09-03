import {
  ASSESSMENT_RUN_STATUSES,
  ASSESSMENT_STAGE_TYPES,
  MAX_SPEECH_SUBMISSIONS,
  type AssessmentCompletionReason,
  type AssessmentRunStatus,
  type AssessmentStageType,
  type ConversationSegment,
  type SelectedFollowUpQuestion,
} from "~/types/assessment-run";

const STAGE_HEADINGS: Record<AssessmentStageType, string> = {
  initial: "Initial safety talk",
  clarification_1: "Participant clarification 1",
  clarification_2: "Participant clarification 2",
};

export function isAssessmentRunStatus(
  value: string | null | undefined,
): value is AssessmentRunStatus {
  return ASSESSMENT_RUN_STATUSES.includes(value as AssessmentRunStatus);
}

export function isAssessmentStageType(
  value: string | null | undefined,
): value is AssessmentStageType {
  return ASSESSMENT_STAGE_TYPES.includes(value as AssessmentStageType);
}

export function stageTypeForIndex(index: number): AssessmentStageType {
  const stageType = ASSESSMENT_STAGE_TYPES[index];
  if (!stageType) {
    throw new Error("No more clarification rounds are available.");
  }
  return stageType;
}

export function maxFollowUpQuestionsAfterStage(
  stageType: AssessmentStageType,
): 0 | 1 | 2 {
  if (stageType === "initial") {
    return 2;
  }

  if (stageType === "clarification_1") {
    return 1;
  }

  return 0;
}

export function canSubmitResponse(
  status: AssessmentRunStatus,
  succeededStageCount: number,
): boolean {
  if (status === "completed" || status === "processing") {
    return false;
  }

  if (succeededStageCount >= MAX_SPEECH_SUBMISSIONS) {
    return false;
  }

  if (status === "ready_to_complete") {
    return false;
  }

  if (status === "awaiting_initial") {
    return succeededStageCount === 0;
  }

  return status === "followup_available" && succeededStageCount > 0;
}

export function canCompleteRun(
  status: AssessmentRunStatus,
  succeededStageCount: number,
): boolean {
  if (status === "completed" || status === "processing") {
    return false;
  }

  if (succeededStageCount <= 0) {
    return false;
  }

  return status === "followup_available" || status === "ready_to_complete";
}

export function needsFinishConfirmation(
  status: AssessmentRunStatus,
  selectedQuestionCount: number,
  succeededStageCount: number,
): boolean {
  return (
    status === "followup_available" &&
    selectedQuestionCount > 0 &&
    succeededStageCount < MAX_SPEECH_SUBMISSIONS
  );
}

export function nextStatusAfterEvaluation(input: {
  succeededStageCount: number;
  selectedQuestionCount: number;
}): {
  status: Exclude<AssessmentRunStatus, "awaiting_initial" | "processing">;
  completionReason: AssessmentCompletionReason | null;
} {
  if (input.succeededStageCount >= MAX_SPEECH_SUBMISSIONS) {
    return { status: "ready_to_complete", completionReason: "max_rounds" };
  }

  if (input.selectedQuestionCount <= 0) {
    return { status: "ready_to_complete", completionReason: "no_followups" };
  }

  return { status: "followup_available", completionReason: null };
}

/** Max clarification rounds lock the run immediately so recording cannot continue. */
export function shouldAutoCompleteAfterEvaluation(
  status: AssessmentRunStatus,
  completionReason: AssessmentCompletionReason | null,
): boolean {
  return status === "ready_to_complete" && completionReason === "max_rounds";
}

export function completionReasonForFinish(input: {
  status: AssessmentRunStatus;
  existingReason: AssessmentCompletionReason | null;
}): AssessmentCompletionReason {
  if (input.status === "ready_to_complete") {
    return input.existingReason ?? "no_followups";
  }

  return "early_finish";
}

export function statusAfterFailedSubmit(
  succeededStageCount: number,
): Extract<AssessmentRunStatus, "awaiting_initial" | "followup_available"> {
  return succeededStageCount === 0 ? "awaiting_initial" : "followup_available";
}

export function buildCumulativeTranscript(
  segments: Array<{ segmentTranscript: string }>,
): string {
  return segments
    .map((segment) => segment.segmentTranscript.trim())
    .filter(Boolean)
    .join("\n\n");
}

export function formatConversationForEvaluation(
  segments: ConversationSegment[],
): string {
  const parts: string[] = ["## Communication so far"];

  for (const segment of segments) {
    const answering = segment.answeringQuestions?.filter((question) =>
      question.question.trim(),
    );

    if (answering && answering.length > 0) {
      const roundLabel =
        segment.stageType === "clarification_2"
          ? "clarification 2"
          : "clarification 1";
      parts.push("");
      parts.push(`### Worker questions (${roundLabel})`);
      for (const question of answering) {
        const speaker = question.personaName.trim() || "Worker";
        parts.push(`- [${speaker}] ${question.question.trim()}`);
      }
    }

    parts.push("");
    parts.push(`### ${STAGE_HEADINGS[segment.stageType]}`);
    parts.push(segment.segmentTranscript.trim());
  }

  parts.push("");
  parts.push(
    "Evaluate everything communicated so far. Later clarifications add to the initial talk; do not require the speaker to repeat earlier points.",
  );

  return parts.join("\n");
}

export function conversationFromStages(
  stages: Array<{
    stageType: AssessmentStageType;
    segmentTranscript: string;
    selectedFollowUpQuestions: SelectedFollowUpQuestion[];
  }>,
): ConversationSegment[] {
  return stages.map((stage, index) => ({
    stageType: stage.stageType,
    segmentTranscript: stage.segmentTranscript,
    answeringQuestions:
      index === 0
        ? undefined
        : stages[index - 1]?.selectedFollowUpQuestions,
  }));
}
