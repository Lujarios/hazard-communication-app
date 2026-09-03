"use client";

/**
 * Orchestrates the trainee assessment page: scenario intro, recording,
 * evaluation, worker follow-ups, and navigation to the completion screen.
 * Child components in this folder are presentational; run state lives here.
 */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { AppHeader } from "~/components/demo/AppHeader";
import { AssessmentProgress } from "~/components/demo/AssessmentProgress";
import { ClarificationOutcomeDialog } from "~/components/demo/ClarificationOutcomeDialog";
import { FeedbackPreview } from "~/components/demo/FeedbackPreview";
import { FinishAssessmentDialog } from "~/components/demo/FinishAssessmentDialog";
import { PersonaListeners } from "~/components/demo/PersonaListeners";
import { ScenarioIntroModal } from "~/components/demo/ScenarioIntroModal";
import { ScenarioViewer } from "~/components/demo/ScenarioViewer";
import { TalkTipsChecklist } from "~/components/demo/TalkTipsChecklist";
import { TranscriptionPanel } from "~/components/demo/TranscriptionPanel";
import { WorkerQuestionsDialog } from "~/components/demo/WorkerQuestionsDialog";
import { TutorialIntroModal } from "~/components/tutorial/TutorialIntroModal";
import { TutorialProvider } from "~/components/tutorial/TutorialProvider";
import { TutorialSpotlight } from "~/components/tutorial/TutorialSpotlight";
import { useTutorial } from "~/hooks/use-tutorial";
import { getOrCreateAnonymousParticipantId } from "~/lib/anonymous-participant";
import {
  assessmentCompletePath,
  assessmentPath,
} from "~/lib/assessment-routes";
import {
  clearStoredAssessmentRunId,
  getStoredAssessmentRunId,
  markAssessmentJustCompleted,
  storeAssessmentRunId,
} from "~/lib/assessment-run-storage";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import type { AssessmentScenario } from "~/types/assessment";
import type { AssessmentRunSnapshot } from "~/types/assessment-run";
import { initialFeedbackState, type FeedbackState } from "~/types/feedback";

type AssessmentExperienceProps = {
  scenario: AssessmentScenario;
  /** Present when the trainee joined via a share code. */
  assessmentSessionId?: string;
  /** Start a new attempt instead of reopening a completed session. */
  startNew?: boolean;
};

const STAGE_LABELS = {
  initial: "Initial safety talk",
  clarification_1: "Clarification 1",
  clarification_2: "Clarification 2",
} as const;

function snapshotFeedback(snapshot: AssessmentRunSnapshot | null): FeedbackState {
  const latest = snapshot?.stages[snapshot.stages.length - 1];

  if (snapshot?.status === "processing") {
    return { status: "loading", data: latest?.feedback ?? null, error: null };
  }

  if (snapshot?.lastError && !latest?.feedback) {
    return { status: "error", data: null, error: snapshot.lastError };
  }

  if (latest?.feedback) {
    return { status: "success", data: latest.feedback, error: snapshot?.lastError ?? null };
  }

  return initialFeedbackState;
}

function AssessmentExperienceContent({
  scenario,
  assessmentSessionId,
  startNew = false,
}: AssessmentExperienceProps) {
  const router = useRouter();
  const { open } = useTutorial();
  const [isRecording, setIsRecording] = useState(false);
  const [showScenarioIntro, setShowScenarioIntro] = useState(true);
  const [highlightHelp, setHighlightHelp] = useState(true);
  const [transcriptionFullWidth, setTranscriptionFullWidth] = useState(
    scenario.personas.length < 4,
  );
  const [transcriptionFillHeight, setTranscriptionFillHeight] = useState<
    number | null
  >(null);
  const [snapshot, setSnapshot] = useState<AssessmentRunSnapshot | null>(null);
  const [questionsOpen, setQuestionsOpen] = useState(false);
  const [outcomeOpen, setOutcomeOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [participantId] = useState(() => getOrCreateAnonymousParticipantId());
  const consumedStartNew = useRef(false);

  const startedFreshFromCompleted = useRef(false);

  const scenarioRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const openedQuestionsForStage = useRef<number | null>(null);
  const openedOutcomeForStage = useRef<number | null>(null);

  const feedbackState = snapshotFeedback(snapshot);

  const goToCompletion = (runId: string) => {
    markAssessmentJustCompleted(runId);
    clearStoredAssessmentRunId(scenario.id);
    router.replace(
      assessmentCompletePath(scenario.id, runId, assessmentSessionId),
    );
  };

  const startOrResume = api.assessmentRun.startOrResume.useMutation({
    onSuccess: (data) => {
      if (data.status === "completed") {
        clearStoredAssessmentRunId(scenario.id);
        if (startedFreshFromCompleted.current) {
          return;
        }
        startedFreshFromCompleted.current = true;
        startOrResume.mutate({
          scenarioId: scenario.id,
          anonymousParticipantId: participantId,
          assessmentSessionId,
          startNew: true,
        });
        return;
      }

      storeAssessmentRunId(scenario.id, data.runId);
      setSnapshot(data);
      if (startNew) {
        router.replace(
          assessmentPath(scenario.id, { sessionId: assessmentSessionId }),
        );
      }
    },
  });

  const submitResponse = api.assessmentRun.submitResponse.useMutation({
    onSuccess: (data) => {
      setSnapshot(data);
      if (data.status === "completed") {
        goToCompletion(data.runId);
      }
    },
  });

  const completeRun = api.assessmentRun.complete.useMutation({
    onSuccess: (data) => {
      setSnapshot(data);
      setFinishOpen(false);
      setQuestionsOpen(false);
      setOutcomeOpen(false);
      if (data.status === "completed") {
        goToCompletion(data.runId);
      }
    },
  });

  useEffect(() => {
    const requestNew = startNew && !consumedStartNew.current;
    if (startNew) {
      consumedStartNew.current = true;
    }

    startOrResume.mutate({
      scenarioId: scenario.id,
      anonymousParticipantId: participantId,
      assessmentSessionId,
      runId: requestNew ? undefined : getStoredAssessmentRunId(scenario.id),
      startNew: requestNew,
    });
    // Start/resume once per scenario load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario.id, participantId, assessmentSessionId]);

  useEffect(() => {
    if (
      snapshot?.status === "followup_available" &&
      snapshot.selectedQuestions.length > 0 &&
      openedQuestionsForStage.current !== snapshot.stageCount
    ) {
      setQuestionsOpen(true);
      openedQuestionsForStage.current = snapshot.stageCount;
    }

    if (snapshot?.status !== "followup_available") {
      setQuestionsOpen(false);
    }

    if (
      snapshot &&
      snapshot.status !== "completed" &&
      !showScenarioIntro &&
      snapshot.selectedQuestions.length === 0 &&
      snapshot.questionResolutions.length > 0 &&
      snapshot.status === "ready_to_complete" &&
      openedOutcomeForStage.current !== snapshot.stageCount
    ) {
      setOutcomeOpen(true);
      openedOutcomeForStage.current = snapshot.stageCount;
    }
  }, [snapshot, showScenarioIntro]);

  useEffect(() => {
    const scenarioEl = scenarioRef.current;
    const sidebarEl = sidebarRef.current;
    if (!scenarioEl || !sidebarEl) return;

    const GRID_GAP_PX = 24;
    const MIN_TRANSCRIPTION_HEIGHT = 280;

    const updateLayout = () => {
      const scenarioHeight = scenarioEl.getBoundingClientRect().height;
      const sidebarHeight = sidebarEl.getBoundingClientRect().height;
      const sidebarIsShorter = sidebarHeight <= scenarioHeight + 8;

      setTranscriptionFullWidth(sidebarIsShorter);

      if (sidebarIsShorter) {
        setTranscriptionFillHeight(null);
        return;
      }

      const fillHeight = Math.max(
        MIN_TRANSCRIPTION_HEIGHT,
        Math.round(sidebarHeight - scenarioHeight - GRID_GAP_PX),
      );
      setTranscriptionFillHeight(fillHeight);
    };

    const observer = new ResizeObserver(updateLayout);
    observer.observe(scenarioEl);
    observer.observe(sidebarEl);
    updateLayout();

    return () => observer.disconnect();
  }, [scenario.id, scenario.personas.length, snapshot?.status, snapshot?.stageCount]);

  const handleOpenHelp = () => {
    setShowScenarioIntro(false);
    setHighlightHelp(false);
    open();
  };

  const handleCloseScenarioIntro = () => {
    setShowScenarioIntro(false);
    setHighlightHelp(false);
  };

  const handleSubmitTranscript = (transcript: string) => {
    if (!snapshot) return;

    submitResponse.mutate({
      runId: snapshot.runId,
      scenarioId: scenario.id,
      anonymousParticipantId: participantId,
      segmentTranscript: transcript,
      assessmentSessionId,
    });
  };

  const submitCompletion = () => {
    if (!snapshot || completeRun.isPending) return;

    completeRun.mutate({
      runId: snapshot.runId,
      scenarioId: scenario.id,
      anonymousParticipantId: participantId,
    });
  };

  const requestFinish = () => {
    if (!snapshot) return;

    if (snapshot.needsFinishConfirmation) {
      setFinishOpen(true);
      return;
    }

    submitCompletion();
  };

  if (!snapshot || snapshot.status === "completed") {
    return (
      <div className="min-h-screen bg-slate-50">
        <AppHeader />
        <main className="mx-auto max-w-lg px-4 py-16 text-center">
          <p className="text-sm text-slate-600" role="status">
            {snapshot?.status === "completed"
              ? "Opening your completion summary…"
              : "Loading assessment…"}
          </p>
          {startOrResume.error?.message ? (
            <p className="mt-3 text-sm text-red-700">{startOrResume.error.message}</p>
          ) : null}
        </main>
      </div>
    );
  }

  const status = snapshot.status;
  const isProcessing = status === "processing" || submitResponse.isPending;
  const transcriptionMode =
    status === "ready_to_complete"
      ? "readonly"
      : status === "followup_available" ||
          (status === "processing" && snapshot.stageCount > 0)
        ? "clarification"
        : "initial";

  const priorSegments = snapshot.stages.map((stage) => ({
    label: STAGE_LABELS[stage.stageType],
    text: stage.segmentTranscript,
  }));

  const panelPriorSegments =
    transcriptionMode === "clarification" ? priorSegments : [];

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader
        onHelpClick={handleOpenHelp}
        highlightHelp={showScenarioIntro && highlightHelp}
      />

      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 ring-1 ring-slate-100">
            <AssessmentProgress
              status={status}
              stageCount={snapshot?.stageCount ?? 0}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <div ref={scenarioRef} className="min-w-0 lg:col-start-1 lg:row-start-1">
              <ScenarioViewer
                scenario={scenario}
                onShowDescription={() => setShowScenarioIntro(true)}
              />
            </div>

            <div
              ref={sidebarRef}
              className={cn(
                "flex min-w-0 flex-col gap-6 lg:col-start-2 lg:row-start-1",
                !transcriptionFullWidth && "lg:row-span-2",
              )}
            >
              <PersonaListeners
                personas={scenario.personas}
                isRecording={isRecording}
                isEvaluating={isProcessing}
                personaFeedback={feedbackState.data?.personaFeedback}
                highlightedPersonaIds={snapshot?.selectedQuestions.map(
                  (question) => question.personaId,
                )}
                unresolvedPersonaIds={snapshot?.questionResolutions
                  .filter((resolution) => !resolution.addressed)
                  .map((resolution) => resolution.personaId)}
                selectedQuestions={snapshot?.selectedQuestions}
                questionResolutions={snapshot?.questionResolutions}
                suppressGeneratedQuestions={
                  (snapshot?.stageCount ?? 0) >= 2 &&
                  (snapshot?.selectedQuestions.length ?? 0) === 0
                }
              />
              <TalkTipsChecklist />
            </div>

            <div
              className={cn(
                "min-w-0 lg:row-start-2",
                transcriptionFullWidth
                  ? "lg:col-span-2 lg:col-start-1"
                  : "lg:col-start-1",
              )}
              style={
                !transcriptionFullWidth && transcriptionFillHeight
                  ? { minHeight: transcriptionFillHeight }
                  : undefined
              }
            >
              <TranscriptionPanel
                key={`${status}-${snapshot?.stageCount ?? 0}`}
                className="h-full min-h-[280px]"
                mode={transcriptionMode}
                priorSegments={
                  transcriptionMode === "readonly" ? priorSegments : panelPriorSegments
                }
                initialTranscript={snapshot?.pendingSegmentTranscript ?? ""}
                isSubmitting={isProcessing}
                canSubmit={Boolean(snapshot?.canSubmit) && !isProcessing}
                submitLabel={
                  transcriptionMode === "clarification"
                    ? "Submit Clarification"
                    : "Submit Safety Talk"
                }
                title={
                  transcriptionMode === "clarification"
                    ? "Worker reply"
                    : transcriptionMode === "readonly"
                      ? "Communication record"
                      : "Live Transcription"
                }
                placeholder={
                  transcriptionMode === "clarification"
                    ? "Reply to the workers' questions. You do not need to repeat your original safety talk."
                    : "Your spoken hazard explanation will appear here. You can also type directly."
                }
                onRecordingChange={setIsRecording}
                onSubmit={handleSubmitTranscript}
              />
            </div>
          </div>

          {snapshot?.canComplete ? (
            <div className="flex flex-wrap items-center justify-end gap-3">
              {status === "followup_available" &&
              snapshot.selectedQuestions.length > 0 ? (
                <ButtonLink
                  label="Review worker questions"
                  onClick={() => setQuestionsOpen(true)}
                />
              ) : null}
              {snapshot.selectedQuestions.length === 0 &&
              snapshot.questionResolutions.length > 0 ? (
                <ButtonLink
                  label="Review worker update"
                  onClick={() => setOutcomeOpen(true)}
                />
              ) : null}
              <button
                type="button"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                disabled={completeRun.isPending}
                onClick={requestFinish}
              >
                {completeRun.isPending
                  ? "Submitting…"
                  : snapshot.needsFinishConfirmation
                    ? "Finish Assessment"
                    : "Submit Assessment"}
              </button>
            </div>
          ) : null}

          <FeedbackPreview
            feedback={feedbackState.data}
            isLoading={feedbackState.status === "loading"}
            error={
              submitResponse.error?.message ??
              startOrResume.error?.message ??
              completeRun.error?.message ??
              feedbackState.error
            }
          />
        </div>
      </main>

      <ScenarioIntroModal
        scenarioId={scenario.id}
        title={scenario.title}
        description={scenario.description}
        open={showScenarioIntro}
        onClose={handleCloseScenarioIntro}
        onOpenHelp={open}
      />
      <WorkerQuestionsDialog
        open={questionsOpen}
        questions={snapshot?.selectedQuestions ?? []}
        personas={scenario.personas}
        showFinish={Boolean(snapshot?.canComplete)}
        onClose={() => setQuestionsOpen(false)}
        onFinish={() => {
          setQuestionsOpen(false);
          requestFinish();
        }}
      />
      <ClarificationOutcomeDialog
        open={outcomeOpen}
        resolutions={snapshot?.questionResolutions ?? []}
        personas={scenario.personas}
        showFinish={Boolean(snapshot?.canComplete)}
        onClose={() => setOutcomeOpen(false)}
        onFinish={() => {
          setOutcomeOpen(false);
          requestFinish();
        }}
      />
      <FinishAssessmentDialog
        open={finishOpen}
        confirmNeeded={Boolean(snapshot?.needsFinishConfirmation)}
        isSubmitting={completeRun.isPending}
        onCancel={() => setFinishOpen(false)}
        onConfirm={submitCompletion}
      />
      <TutorialIntroModal />
      <TutorialSpotlight />
    </div>
  );
}

function ButtonLink({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="text-sm font-medium text-[#1e4a8c] hover:underline"
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export function AssessmentExperience({
  scenario,
  assessmentSessionId,
  startNew = false,
}: AssessmentExperienceProps) {
  return (
    <TutorialProvider>
      <AssessmentExperienceContent
        scenario={scenario}
        assessmentSessionId={assessmentSessionId}
        startNew={startNew}
      />
    </TutorialProvider>
  );
}
