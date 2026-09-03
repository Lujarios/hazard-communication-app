import type { SafetyTalkFeedback } from "~/types/feedback";

export const MAX_SPEECH_SUBMISSIONS = 3;

export const ASSESSMENT_STAGE_TYPES = [
  "initial",
  "clarification_1",
  "clarification_2",
] as const;

export type AssessmentStageType = (typeof ASSESSMENT_STAGE_TYPES)[number];

export const ASSESSMENT_RUN_STATUSES = [
  "awaiting_initial",
  "processing",
  "followup_available",
  "ready_to_complete",
  "completed",
] as const;

export type AssessmentRunStatus = (typeof ASSESSMENT_RUN_STATUSES)[number];

export const ASSESSMENT_COMPLETION_REASONS = [
  "early_finish",
  "no_followups",
  "max_rounds",
  "legacy_single_shot",
] as const;

export type AssessmentCompletionReason =
  (typeof ASSESSMENT_COMPLETION_REASONS)[number];

export const WORKFLOW_VERSION_LEGACY = 1;
export const WORKFLOW_VERSION_CLARIFICATION = 2;

export const MAX_SHOWN_FOLLOW_UP_QUESTIONS = 2;
export const MAX_FOLLOW_UP_QUESTIONS_AFTER_INITIAL = 2;
export const MAX_FOLLOW_UP_QUESTIONS_AFTER_CLARIFICATION_1 = 1;

export type SelectedFollowUpQuestion = {
  personaId: string;
  personaName: string;
  question: string;
  reason: string;
  relatedHazardId?: string | null;
  mergedFromPersonaIds: string[];
};

export type FollowUpQuestionResolution = {
  personaId: string;
  personaName: string;
  question: string;
  reason: string;
  relatedHazardId?: string | null;
  addressed: boolean;
  understood: boolean;
};

export type ConversationSegment = {
  stageType: AssessmentStageType;
  segmentTranscript: string;
  /** Questions this segment is answering, shown after the previous stage. */
  answeringQuestions?: SelectedFollowUpQuestion[];
};

export type AssessmentStageSnapshot = {
  id: string;
  stageType: AssessmentStageType;
  stageIndex: number;
  segmentTranscript: string;
  cumulativeTranscript: string;
  feedback: SafetyTalkFeedback | null;
  selectedFollowUpQuestions: SelectedFollowUpQuestion[];
  participantFinishedAfterStage: boolean;
  createdAt: Date;
};

export type AssessmentRunSnapshot = {
  runId: string;
  status: AssessmentRunStatus;
  stageCount: number;
  workflowVersion: number;
  completionReason: AssessmentCompletionReason | null;
  completedAt: Date | null;
  pendingSegmentTranscript: string | null;
  lastError: string | null;
  selectedQuestions: SelectedFollowUpQuestion[];
  questionResolutions: FollowUpQuestionResolution[];
  stages: AssessmentStageSnapshot[];
  canSubmit: boolean;
  canComplete: boolean;
  needsFinishConfirmation: boolean;
};
