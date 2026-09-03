"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageSquare, Mic, Square } from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { Textarea } from "~/components/ui/textarea";
import { useSpeechRecognition } from "~/hooks/use-speech-recognition";
import { cn } from "~/lib/utils";

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function SignalBars() {
  const heights = ["h-1.5", "h-2.5", "h-3.5", "h-2", "h-4"];

  return (
    <div className="flex items-end gap-0.5" aria-hidden>
      {heights.map((h, i) => (
        <div key={i} className={cn("w-1 rounded-sm bg-emerald-500", h)} />
      ))}
    </div>
  );
}

export type TranscriptionPanelMode = "initial" | "clarification" | "readonly";

type TranscriptionPanelProps = {
  className?: string;
  mode: TranscriptionPanelMode;
  priorSegments?: Array<{ label: string; text: string }>;
  initialTranscript?: string;
  isSubmitting?: boolean;
  submitLabel: string;
  submittingLabel?: string;
  title?: string;
  placeholder?: string;
  helperText?: string;
  canSubmit?: boolean;
  onRecordingChange?: (isRecording: boolean) => void;
  onSubmit: (transcript: string) => void;
};

export function TranscriptionPanel({
  className,
  mode,
  priorSegments = [],
  initialTranscript = "",
  isSubmitting = false,
  submitLabel,
  submittingLabel = "Evaluating…",
  title = "Live Transcription",
  placeholder = "Your spoken hazard explanation will appear here. You can also type directly.",
  helperText,
  canSubmit = true,
  onRecordingChange,
  onSubmit,
}: TranscriptionPanelProps) {
  const [transcript, setTranscript] = useState(initialTranscript);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const {
    isSupported,
    isListening,
    interimTranscript,
    error: speechError,
    start,
    stop: stopSpeech,
  } = useSpeechRecognition();

  useEffect(() => {
    setTranscript(initialTranscript);
  }, [initialTranscript]);

  const displayValue =
    isListening && interimTranscript && !transcript.includes(interimTranscript)
      ? `${transcript}${transcript ? " " : ""}${interimTranscript}`
      : transcript;

  const isReadonly = mode === "readonly";
  const hasTranscript = transcript.trim().length > 0;
  const canGetFeedback =
    hasTranscript &&
    !isRecording &&
    !isSubmitting &&
    canSubmit &&
    !isReadonly;

  useEffect(() => {
    if (!isRecording) return;

    const id = window.setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);

    return () => window.clearInterval(id);
  }, [isRecording]);

  useEffect(() => {
    onRecordingChange?.(isRecording);
  }, [isRecording, onRecordingChange]);

  const handleFinalResult = useCallback((text: string) => {
    setTranscript((prev) => {
      const separator = prev.trim() ? " " : "";
      return `${prev}${separator}${text}`.trim();
    });
  }, []);

  const handleStart = () => {
    setIsRecording(true);
    setElapsedSeconds(0);
    start(handleFinalResult);
  };

  const handleStop = () => {
    setIsRecording(false);
    stopSpeech();
  };

  return (
    <Card
      data-tour="transcription"
      className={cn("flex h-full flex-col gap-0 py-0 ring-1 ring-slate-200", className)}
    >
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 border-b border-slate-100 py-3 pb-3">
        <CardTitle className="text-base font-semibold text-slate-800">
          {title}
        </CardTitle>
        {isRecording && (
          <Badge
            variant="outline"
            className="gap-1.5 border-red-200 bg-red-50 text-red-700"
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-red-600" />
            </span>
            Recording in progress
          </Badge>
        )}
      </CardHeader>

      <CardContent className="flex flex-1 flex-col space-y-4 px-4 pb-4 pt-4">
        {priorSegments.length > 0 ? (
          <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Already communicated
            </p>
            {priorSegments.map((segment) => (
              <div key={segment.label}>
                <p className="text-xs font-medium text-slate-600">{segment.label}</p>
                <p className="text-sm leading-relaxed text-slate-700">
                  {segment.text}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {!isSupported && !isReadonly && (
          <p
            role="status"
            className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
          >
            Speech recognition is unavailable in this browser. You can type your
            transcript below.
          </p>
        )}

        {speechError && isSupported && (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          >
            {speechError}
          </p>
        )}

        <div className="flex min-h-[280px] flex-1 flex-col gap-4 lg:min-h-0 lg:flex-row lg:items-stretch">
          <div className="flex shrink-0 flex-col items-center justify-center gap-2 self-center text-center lg:w-28">
            <div
              className={cn(
                "flex size-16 items-center justify-center rounded-full",
                isRecording
                  ? "bg-[#1e4a8c] text-white shadow-lg shadow-blue-900/20"
                  : "bg-slate-100 text-slate-400",
              )}
            >
              <Mic className="size-8" aria-hidden />
            </div>
            {isRecording ? (
              <>
                <p className="text-sm font-medium text-[#1e4a8c]">Listening…</p>
                <p className="text-xs text-slate-500">Speak clearly</p>
              </>
            ) : (
              <p className="text-xs text-slate-500">
                {isReadonly ? "Recording closed" : "Ready to record"}
              </p>
            )}
          </div>

          <div className="flex min-h-[240px] min-w-0 flex-1 self-stretch lg:min-h-0">
            <Textarea
              value={isReadonly ? priorSegments.map((segment) => segment.text).join("\n\n") || displayValue : displayValue}
              onChange={(event) => setTranscript(event.target.value)}
              placeholder={placeholder}
              readOnly={isReadonly}
              className="field-sizing-fixed size-full min-h-0 resize-none overflow-y-auto text-sm leading-relaxed"
              aria-label={mode === "clarification" ? "Clarification transcript" : "Transcript"}
            />
          </div>

          <div className="flex shrink-0 flex-col items-stretch gap-3 sm:min-w-[140px]">
            <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
              <span className="font-mono text-lg font-semibold tabular-nums text-slate-800">
                {formatElapsed(elapsedSeconds)}
              </span>
              <SignalBars />
            </div>

            <Button
              type="button"
              className="bg-[#1e4a8c] hover:bg-[#163a6e]"
              onClick={handleStart}
              disabled={!isSupported || isRecording || isReadonly || isSubmitting}
            >
              <Mic className="size-4" />
              Start Talking
            </Button>

            <Button
              type="button"
              variant="destructive"
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={handleStop}
              disabled={!isRecording}
            >
              <Square className="size-3.5 fill-current" />
              Stop
            </Button>

            <Separator />

            {!isReadonly ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="border-[#1e4a8c] text-[#1e4a8c] hover:bg-[#1e4a8c]/5"
                  disabled={!canGetFeedback}
                  onClick={() => onSubmit(transcript.trim())}
                >
                  <MessageSquare className="size-4" />
                  {isSubmitting ? submittingLabel : submitLabel}
                </Button>
                <p className="text-center text-[10px] text-slate-400">
                  {helperText ??
                    (isRecording
                      ? "Stop recording before submitting"
                      : "Available after you stop recording")}
                </p>
              </>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
