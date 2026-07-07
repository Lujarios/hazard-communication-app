"use client";

import { useState } from "react";

import { AppHeader } from "~/components/demo/AppHeader";
import { FeedbackPreview } from "~/components/demo/FeedbackPreview";
import { PersonaListeners } from "~/components/demo/PersonaListeners";
import { ScenarioViewer } from "~/components/demo/ScenarioViewer";
import { TranscriptionPanel } from "~/components/demo/TranscriptionPanel";
import { TutorialIntroModal } from "~/components/tutorial/TutorialIntroModal";
import { TutorialProvider } from "~/components/tutorial/TutorialProvider";
import { TutorialSpotlight } from "~/components/tutorial/TutorialSpotlight";
import { useTutorial } from "~/hooks/use-tutorial";
import type { AssessmentScenario } from "~/types/assessment";
import { initialFeedbackState } from "~/types/feedback";

type AssessmentExperienceProps = {
  scenario: AssessmentScenario;
};

function AssessmentExperienceContent({ scenario }: AssessmentExperienceProps) {
  const { open } = useTutorial();
  const [isRecording, setIsRecording] = useState(false);
  const [feedbackState, setFeedbackState] = useState(initialFeedbackState);

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader onHelpClick={open} />

      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex flex-col gap-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:grid-rows-[auto_minmax(280px,1fr)] lg:items-stretch">
            <ScenarioViewer
              className="min-w-0 lg:col-start-1 lg:row-start-1"
              scenario={scenario}
              hazardLabels={scenario.hazardLabels}
            />

            <TranscriptionPanel
              className="min-h-[280px] min-w-0 lg:col-start-1 lg:row-start-2 lg:h-full lg:min-h-0"
              scenarioId={scenario.id}
              onRecordingChange={setIsRecording}
              onFeedbackStateChange={setFeedbackState}
            />

            <PersonaListeners
              className="min-w-0 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:h-full"
              personas={scenario.personas}
              isRecording={isRecording}
              isEvaluating={feedbackState.status === "loading"}
              personaFeedback={feedbackState.data?.personaFeedback}
            />
          </div>

          <FeedbackPreview
            feedback={feedbackState.data}
            isLoading={feedbackState.status === "loading"}
            error={feedbackState.error}
          />
        </div>
      </main>

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
