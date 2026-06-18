"use client";

import { useState } from "react";

import { AppHeader } from "~/components/demo/AppHeader";
import { FeedbackPreview } from "~/components/demo/FeedbackPreview";
import { PersonaListeners } from "~/components/demo/PersonaListeners";
import { ScenarioViewer } from "~/components/demo/ScenarioViewer";
import { TranscriptionPanel } from "~/components/demo/TranscriptionPanel";
import { initialFeedbackState } from "~/types/feedback";

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [feedbackState] = useState(initialFeedbackState);

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />

      <main className="mx-auto max-w-7xl px-4 py-6">
        <h1 className="mb-6 text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
          Hazard Communication Assessment
        </h1>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="flex min-w-0 flex-col gap-4">
            <ScenarioViewer />
            <TranscriptionPanel onRecordingChange={setIsRecording} />
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            <PersonaListeners isRecording={isRecording} />
            <FeedbackPreview
              feedback={feedbackState.data}
              isLoading={feedbackState.status === "loading"}
              error={feedbackState.error}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
