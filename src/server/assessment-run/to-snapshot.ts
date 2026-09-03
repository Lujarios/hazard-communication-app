/**
 * Map DB assessment_run + attempt rows into the client AssessmentRunSnapshot.
 */
import type { SafetyTalkFeedback } from "~/types/feedback";
import type {
  AssessmentCompletionReason,
  AssessmentRunSnapshot,
  AssessmentRunStatus,
  AssessmentStageSnapshot,
  AssessmentStageType,
  SelectedFollowUpQuestion,
} from "~/types/assessment-run";
import {
  canCompleteRun,
  canSubmitResponse,
  isAssessmentStageType,
  needsFinishConfirmation,
} from "~/lib/assessment-run-state";
import { resolvePreviousQuestions } from "~/server/evaluation/select-follow-up-questions";

export type AssessmentRunRow = {
  id: string;
  status: string;
  stageCount: number;
  workflowVersion: number;
  completionReason: string | null;
  completedAt: Date | null;
  pendingSegmentTranscript: string | null;
  lastError: string | null;
};

export type AssessmentStageRow = {
  id: string;
  stageType: string;
  stageIndex: number;
  segmentTranscript: string | null;
  transcript: string;
  overallStars: number;
  overallSummary: string;
  criteriaRatings: unknown;
  missedItems: unknown;
  personaFeedback: unknown;
  selectedFollowUpQuestions: unknown;
  participantFinishedAfterStage: boolean;
  createdAt: Date;
};

function isStarRating(value: number): value is SafetyTalkFeedback["overallStars"] {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5;
}

export function asSelectedFollowUpQuestions(
  value: unknown,
): SelectedFollowUpQuestion[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const selected: SelectedFollowUpQuestion[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const row = item as Partial<SelectedFollowUpQuestion>;
    if (
      typeof row.personaId !== "string" ||
      typeof row.question !== "string" ||
      !row.question.trim()
    ) {
      continue;
    }

    selected.push({
      personaId: row.personaId,
      personaName:
        typeof row.personaName === "string" && row.personaName.trim()
          ? row.personaName
          : row.personaId,
      question: row.question,
      reason: typeof row.reason === "string" ? row.reason : "",
      relatedHazardId: row.relatedHazardId ?? null,
      mergedFromPersonaIds: Array.isArray(row.mergedFromPersonaIds)
        ? row.mergedFromPersonaIds.filter(
            (id): id is string => typeof id === "string",
          )
        : [],
    });
  }

  return selected;
}

export function feedbackFromStage(
  stage: AssessmentStageRow,
): SafetyTalkFeedback {
  const overallStars = isStarRating(stage.overallStars) ? stage.overallStars : 1;

  return {
    criteriaRatings: Array.isArray(stage.criteriaRatings)
      ? (stage.criteriaRatings as SafetyTalkFeedback["criteriaRatings"])
      : [],
    missedItems: Array.isArray(stage.missedItems)
      ? (stage.missedItems as SafetyTalkFeedback["missedItems"])
      : [],
    overallSummary: stage.overallSummary,
    overallStars,
    personaFeedback: Array.isArray(stage.personaFeedback)
      ? (stage.personaFeedback as SafetyTalkFeedback["personaFeedback"])
      : undefined,
  };
}

export function toStageSnapshot(stage: AssessmentStageRow): AssessmentStageSnapshot {
  const stageType: AssessmentStageType = isAssessmentStageType(stage.stageType)
    ? stage.stageType
    : "initial";

  return {
    id: stage.id,
    stageType,
    stageIndex: stage.stageIndex,
    segmentTranscript: stage.segmentTranscript ?? stage.transcript,
    cumulativeTranscript: stage.transcript,
    feedback: feedbackFromStage(stage),
    selectedFollowUpQuestions: asSelectedFollowUpQuestions(
      stage.selectedFollowUpQuestions,
    ),
    participantFinishedAfterStage: stage.participantFinishedAfterStage,
    createdAt: stage.createdAt,
  };
}

export function toRunSnapshot(
  run: AssessmentRunRow,
  stages: AssessmentStageRow[],
): AssessmentRunSnapshot {
  const ordered = [...stages].sort((a, b) => a.stageIndex - b.stageIndex);
  const snapshots = ordered.map(toStageSnapshot);
  const latest = snapshots[snapshots.length - 1];
  const status = run.status as AssessmentRunStatus;
  const selectedQuestions = latest?.selectedFollowUpQuestions ?? [];
  const previousQuestions = snapshots.slice(0, -1).flatMap((stage, index) => {
    const responseText = snapshots
      .slice(index + 1)
      .map((laterStage) => laterStage.segmentTranscript.trim())
      .filter(Boolean)
      .join("\n\n");

    return stage.selectedFollowUpQuestions.map((question) => ({
      ...question,
      responseText,
    }));
  });
  const questionResolutions = resolvePreviousQuestions(
    previousQuestions,
    latest?.feedback?.personaFeedback ?? [],
  );

  return {
    runId: run.id,
    status,
    stageCount: run.stageCount,
    workflowVersion: run.workflowVersion,
    completionReason: run.completionReason as AssessmentCompletionReason | null,
    completedAt: run.completedAt,
    pendingSegmentTranscript: run.pendingSegmentTranscript,
    lastError: run.lastError,
    selectedQuestions,
    questionResolutions,
    stages: snapshots,
    canSubmit: canSubmitResponse(status, run.stageCount),
    canComplete: canCompleteRun(status, run.stageCount),
    needsFinishConfirmation: needsFinishConfirmation(
      status,
      selectedQuestions.length,
      run.stageCount,
    ),
  };
}
