"use client";

import { useEffect, useRef, useState } from "react";

import { AppHeader } from "~/components/demo/AppHeader";
import { FeedbackPreview } from "~/components/demo/FeedbackPreview";
import { PersonaListeners } from "~/components/demo/PersonaListeners";
import { ScenarioIntroModal } from "~/components/demo/ScenarioIntroModal";
import { ScenarioViewer } from "~/components/demo/ScenarioViewer";
import { TalkTipsChecklist } from "~/components/demo/TalkTipsChecklist";
import { TranscriptionPanel } from "~/components/demo/TranscriptionPanel";
import { TutorialIntroModal } from "~/components/tutorial/TutorialIntroModal";
import { TutorialProvider } from "~/components/tutorial/TutorialProvider";
import { TutorialSpotlight } from "~/components/tutorial/TutorialSpotlight";
import { useTutorial } from "~/hooks/use-tutorial";
import type { AssessmentScenario } from "~/types/assessment";
import { initialFeedbackState } from "~/types/feedback";
import { cn } from "~/lib/utils";

type AssessmentExperienceProps = {
  scenario: AssessmentScenario;
};

function AssessmentExperienceContent({ scenario }: AssessmentExperienceProps) {
  const { open } = useTutorial();
  const [isRecording, setIsRecording] = useState(false);
  const [feedbackState, setFeedbackState] = useState(initialFeedbackState);
  const [showScenarioIntro, setShowScenarioIntro] = useState(true);
  const [highlightHelp, setHighlightHelp] = useState(true);
  const [transcriptionFullWidth, setTranscriptionFullWidth] = useState(
    scenario.personas.length < 4,
  );
  const [transcriptionFillHeight, setTranscriptionFillHeight] = useState<
    number | null
  >(null);

  const scenarioRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scenarioEl = scenarioRef.current;
    const sidebarEl = sidebarRef.current;
    if (!scenarioEl || !sidebarEl) return;

    const GRID_GAP_PX = 24; // matches gap-6
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

      // Fill the leftover space under the image so bottoms align with the sidebar.
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
  }, [scenario.id, scenario.personas.length, feedbackState.data]);

  const handleOpenHelp = () => {
    setShowScenarioIntro(false);
    setHighlightHelp(false);
    open();
  };

  const handleCloseScenarioIntro = () => {
    setShowScenarioIntro(false);
    setHighlightHelp(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader
        onHelpClick={handleOpenHelp}
        highlightHelp={showScenarioIntro && highlightHelp}
      />

      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex flex-col gap-6">
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
                isEvaluating={feedbackState.status === "loading"}
                personaFeedback={feedbackState.data?.personaFeedback}
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
                className="h-full min-h-[280px]"
                scenarioId={scenario.id}
                onRecordingChange={setIsRecording}
                onFeedbackStateChange={setFeedbackState}
              />
            </div>
          </div>

          <FeedbackPreview
            feedback={feedbackState.data}
            isLoading={feedbackState.status === "loading"}
            error={feedbackState.error}
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
      <TutorialIntroModal />
      <TutorialSpotlight />
    </div>
  );
}

export function AssessmentExperience({ scenario }: AssessmentExperienceProps) {
  return (
    <TutorialProvider>
      <AssessmentExperienceContent scenario={scenario} />
    </TutorialProvider>
  );
}
