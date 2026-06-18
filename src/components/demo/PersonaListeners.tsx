"use client";

import {
  CheckCircle2,
  Headphones,
  HelpCircle,
  Info,
  Loader2,
  MessageCircle,
} from "lucide-react";

import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { workerPersonas } from "~/lib/demo-data";
import type { PersonaFeedback } from "~/types/feedback";
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

type PersonaListenersProps = {
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
      <div className="mt-2 flex items-center gap-2 text-xs text-emerald-700">
        <Headphones className="size-3.5 shrink-0" aria-hidden />
        <span className="font-medium">Listening</span>
        <AudioBars active />
      </div>
    );
  }

  if (isEvaluating) {
    return (
      <div className="mt-2 flex items-center gap-2 text-xs text-[#1e4a8c]">
        <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
        <span className="font-medium">Reviewing your talk…</span>
      </div>
    );
  }

  if (feedback) {
    return (
      <div className="mt-2 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
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
        </div>
        <blockquote className="border-l-2 border-[#1e4a8c]/30 pl-2.5 text-xs leading-relaxed text-slate-700">
          <MessageCircle
            className="mb-1 inline size-3 text-[#1e4a8c]/70"
            aria-hidden
          />{" "}
          {feedback.reaction}
        </blockquote>
      </div>
    );
  }

  return (
    <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
      <Headphones className="size-3.5 shrink-0" aria-hidden />
      <span>Ready to listen</span>
      <AudioBars active={false} />
    </div>
  );
}

export function PersonaListeners({
  isRecording = false,
  isEvaluating = false,
  personaFeedback,
}: PersonaListenersProps) {
  return (
    <Card className="h-fit w-full gap-0 py-0 ring-1 ring-slate-200">
      <CardHeader className="flex justify-center border-b border-slate-100 py-3 pb-3">
        <CardTitle className="flex items-center justify-center gap-2 text-base font-semibold text-slate-800">
          AI Worker Listeners
          <Info className="size-4 text-slate-400" aria-hidden />
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        <ul className="m-0 divide-y divide-slate-100 p-0">
          {workerPersonas.map((persona) => {
            const feedback = getPersonaFeedback(persona.id, personaFeedback);

            return (
              <li
                key={persona.id}
                className="flex items-start gap-3 px-4 py-3.5"
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
                  <p className="text-xs text-slate-500">{persona.description}</p>
                  <PersonaStatus
                    isRecording={isRecording}
                    isEvaluating={isEvaluating}
                    feedback={feedback}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
