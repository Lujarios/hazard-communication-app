"use client";

import {
  CheckCircle2,
  Headphones,
  HelpCircle,
  Info,
  Loader2,
  MessageCircle,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { PersonaCharacteristicTags } from "~/components/admin/PersonaCharacteristicTags";
import { StarRating } from "~/components/demo/StarRating";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { personaCommunicationCriteria } from "~/lib/persona-communication-rubric";
import type { AssessmentPersona } from "~/types/assessment";
import type { FollowUpQuestionCandidate, PersonaFeedback } from "~/types/feedback";
import { cn } from "~/lib/utils";

function AudioBars({ active }: { active: boolean }) {
  const heights = ["h-2", "h-4", "h-3", "h-5", "h-2", "h-4", "h-3"];

  return (
    <div className="flex items-end gap-0.5" aria-hidden>
      {heights.map((height, i) => (
        <div
          key={i}
          className={cn(
            "w-1 rounded-full bg-emerald-500",
            height,
            active && "animate-pulse",
          )}
          style={active ? { animationDelay: `${i * 80}ms` } : undefined}
        />
      ))}
    </div>
  );
}

function getPersonaFeedback(
  personaId: string,
  personaFeedback?: PersonaFeedback[],
): PersonaFeedback | undefined {
  return personaFeedback?.find((entry) => entry.personaId === personaId);
}

function getPersonaFollowUpQuestions(
  feedback?: PersonaFeedback,
): FollowUpQuestionCandidate[] {
  if (feedback?.followUpQuestionCandidates?.length) {
    return feedback.followUpQuestionCandidates.filter((candidate) =>
      candidate.question.trim(),
    );
  }

  const legacyQuestion = feedback?.question?.trim();
  if (legacyQuestion) {
    return [{ question: legacyQuestion, reason: "" }];
  }

  return [];
}

function hasPersonaQuestion(feedback?: PersonaFeedback): boolean {
  return getPersonaFollowUpQuestions(feedback).length > 0;
}

type PersonaListenersProps = {
  className?: string;
  personas: AssessmentPersona[];
  isRecording?: boolean;
  isEvaluating?: boolean;
  personaFeedback?: PersonaFeedback[];
};

function PersonaStatus({
  isRecording,
  isEvaluating,
  feedback,
}: {
  isRecording: boolean;
  isEvaluating: boolean;
  feedback?: PersonaFeedback;
}) {
  if (isRecording) {
    return (
      <div className="mt-1.5 flex items-center gap-2 text-xs text-emerald-700">
        <Headphones className="size-3.5 shrink-0" aria-hidden />
        <span className="font-medium">Listening</span>
        <AudioBars active />
      </div>
    );
  }

  if (isEvaluating) {
    return (
      <div className="mt-1.5 flex items-center gap-2 text-xs text-[#1e4a8c]">
        <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
        <span className="font-medium">Reviewing…</span>
      </div>
    );
  }

  if (hasPersonaQuestion(feedback)) {
    return (
      <div className="mt-1.5">
        <Badge
          variant="outline"
          className="gap-1 border-amber-600 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-900"
        >
          <HelpCircle className="size-3" aria-hidden />
          Has a question
        </Badge>
      </div>
    );
  }

  if (feedback) {
    return (
      <div className="mt-1.5">
        <Badge
          variant="outline"
          className={cn(
            "gap-1 px-2 py-0.5 text-[10px] font-semibold",
            feedback.understood
              ? "border-emerald-600 bg-emerald-50 text-emerald-800"
              : "border-slate-300 bg-slate-50 text-slate-700",
          )}
        >
          {feedback.understood ? (
            <CheckCircle2 className="size-3" aria-hidden />
          ) : (
            <HelpCircle className="size-3" aria-hidden />
          )}
          {feedback.understood ? "Understood" : "Needs clarification"}
        </Badge>
      </div>
    );
  }

  return (
    <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500">
      <Headphones className="size-3.5 shrink-0" aria-hidden />
      <span>Ready to listen</span>
      <AudioBars active={false} />
    </div>
  );
}

function PersonaDetailsDialog({
  persona,
  feedback,
  onClose,
}: {
  persona: AssessmentPersona;
  feedback?: PersonaFeedback;
  onClose: () => void;
}) {
  const questions = getPersonaFollowUpQuestions(feedback);
  const communicationScores = feedback?.scores;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`persona-details-${persona.id}`}
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <Avatar size="lg" className="shrink-0">
            <AvatarFallback
              className={cn("text-xs font-semibold", persona.avatarColor)}
            >
              {persona.initials}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <h2
              id={`persona-details-${persona.id}`}
              className="text-base font-semibold text-slate-900"
            >
              {persona.name}
            </h2>
            <p className="text-sm text-slate-600">{persona.description}</p>
            <PersonaCharacteristicTags persona={persona} />
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close persona details"
          >
            <X className="size-4" aria-hidden />
          </Button>
        </div>

        {feedback ? (
          <div className="mt-4 space-y-3">
            <Badge
              variant="outline"
              className={cn(
                "gap-1 px-2 py-0.5 text-[10px] font-semibold",
                feedback.understood
                  ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                  : "border-amber-600 bg-amber-50 text-amber-900",
              )}
            >
              {feedback.understood ? (
                <CheckCircle2 className="size-3" aria-hidden />
              ) : (
                <HelpCircle className="size-3" aria-hidden />
              )}
              {feedback.understood ? "Understood" : "Needs clarification"}
            </Badge>

            <blockquote className="border-l-2 border-[#1e4a8c]/30 pl-2.5 text-sm leading-relaxed text-slate-700">
              <MessageCircle
                className="mb-1 inline size-3.5 text-[#1e4a8c]/70"
                aria-hidden
              />{" "}
              {feedback.shortFeedback ?? feedback.reaction}
            </blockquote>

            {communicationScores ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                  Communication from this worker&apos;s view
                </p>
                <ul className="mt-2 space-y-1.5">
                  {personaCommunicationCriteria.map((criterion) => {
                    const value = communicationScores[criterion.id];

                    return (
                      <li
                        key={criterion.id}
                        className="flex items-center justify-between gap-2"
                      >
                        <span className="text-xs text-slate-700">
                          {criterion.label}
                        </span>
                        <StarRating
                          value={value}
                          size="sm"
                          label={`${criterion.label}: ${value} out of 5 stars`}
                        />
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}

            {feedback.understoodPoints?.length ? (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
                  What this worker understood
                </p>
                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm text-slate-700">
                  {feedback.understoodPoints.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {feedback.unclearPoints?.length ? (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                  What was unclear
                </p>
                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm text-slate-700">
                  {feedback.unclearPoints.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {feedback.missedCriticalInformation?.length ? (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-red-800">
                  Still missing for this worker
                </p>
                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm text-slate-700">
                  {feedback.missedCriticalInformation.map((item) => (
                    <li key={item.description}>{item.description}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {questions.length > 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                  {questions.length === 1
                    ? "Question for you"
                    : "Questions for you"}
                </p>
                <ul className="mt-1 space-y-2">
                  {questions.map((candidate) => (
                    <li key={candidate.question}>
                      <p className="text-sm leading-relaxed text-amber-950">
                        {candidate.question}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
            This worker will listen to your safety talk. After you get feedback,
            open this card again to see their reaction and any question they
            may have.
          </p>
        )}
      </div>
    </div>
  );
}

export function PersonaListeners({
  className,
  personas,
  isRecording = false,
  isEvaluating = false,
  personaFeedback,
}: PersonaListenersProps) {
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(
    null,
  );
  const selectedPersona = personas.find(
    (persona) => persona.id === selectedPersonaId,
  );

  return (
    <Card
      data-tour="personas"
      className={cn("flex w-full flex-col gap-0 py-0 ring-1 ring-slate-200", className)}
    >
      <CardHeader className="flex justify-center border-b border-slate-100 py-3 pb-3">
        <CardTitle className="flex items-center justify-center gap-2 text-base font-semibold text-slate-800">
          AI Worker Listeners
          <Info className="size-4 text-slate-400" aria-hidden />
        </CardTitle>
      </CardHeader>

      <CardContent className="p-2">
        <ul className="m-0 flex flex-col gap-1.5 p-0">
          {personas.map((persona) => {
            const feedback = getPersonaFeedback(persona.id, personaFeedback);
            const waitingOnQuestion = hasPersonaQuestion(feedback);

            return (
              <li key={persona.id}>
                <button
                  type="button"
                  aria-haspopup="dialog"
                  aria-expanded={selectedPersonaId === persona.id}
                  onClick={() => setSelectedPersonaId(persona.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left ring-1 transition-colors",
                    waitingOnQuestion
                      ? "border-amber-200 bg-amber-50/80 ring-amber-100 hover:border-amber-300"
                      : "border-slate-100/80 bg-slate-50/60 ring-slate-100/50 hover:border-slate-200 hover:bg-slate-50",
                  )}
                >
                  <Avatar size="lg" className="shrink-0">
                    <AvatarFallback
                      className={cn("text-xs font-semibold", persona.avatarColor)}
                    >
                      {persona.initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800">
                      {persona.name}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {persona.description}
                    </p>
                    <PersonaStatus
                      isRecording={isRecording}
                      isEvaluating={isEvaluating}
                      feedback={feedback}
                    />
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 px-1 text-[11px] text-slate-500">
          Click a worker to see their background
          {personaFeedback?.length
            ? " and any follow-up question."
            : "."}
        </p>
      </CardContent>

      {selectedPersona ? (
        <PersonaDetailsDialog
          persona={selectedPersona}
          feedback={getPersonaFeedback(selectedPersona.id, personaFeedback)}
          onClose={() => setSelectedPersonaId(null)}
        />
      ) : null}
    </Card>
  );
}
