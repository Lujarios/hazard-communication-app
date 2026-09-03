"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { MessageCircle, X } from "lucide-react";

import { PersonaCharacteristicTags } from "~/components/admin/PersonaCharacteristicTags";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { useEscapeKey, useFocusTrap } from "~/hooks/use-tutorial-a11y";
import type { AssessmentPersona } from "~/types/assessment";
import type { SelectedFollowUpQuestion } from "~/types/assessment-run";
import { cn, DIALOG_BACKDROP_CLASS } from "~/lib/utils";

type WorkerQuestionsDialogProps = {
  open: boolean;
  questions: SelectedFollowUpQuestion[];
  personas: AssessmentPersona[];
  onClose: () => void;
  onFinish: () => void;
  showFinish: boolean;
  children?: ReactNode;
};

export function WorkerQuestionsDialog({
  open,
  questions,
  personas,
  onClose,
  onFinish,
  showFinish,
  children,
}: WorkerQuestionsDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const personasById = new Map(personas.map((persona) => [persona.id, persona]));

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEscapeKey(onClose, open);
  useFocusTrap(dialogRef, open, questions.map((item) => item.question).join("|"));

  if (!mounted || !open || questions.length === 0) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className={DIALOG_BACKDROP_CLASS}
        aria-label="Close worker questions"
        onClick={onClose}
      />

      <div ref={dialogRef} className="relative z-10 w-full max-w-2xl">
        <Card
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="max-h-[90vh] gap-0 overflow-y-auto py-0 ring-1 ring-slate-200"
        >
          <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-slate-100 py-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#1e4a8c]">
                Crew questions
              </p>
              <CardTitle id={titleId} className="text-lg font-semibold text-slate-900">
                Workers have a follow-up
              </CardTitle>
              <p className="text-sm leading-relaxed text-slate-600">
                Answer only what they are asking. You do not need to repeat your
                whole safety talk.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0 text-slate-500 hover:text-slate-900"
              onClick={onClose}
              aria-label="Close worker questions"
            >
              <X className="size-4" />
            </Button>
          </CardHeader>

          <CardContent className="space-y-4 py-4">
            <ul className="space-y-3">
              {questions.map((question) => {
                const persona = personasById.get(question.personaId);

                return (
                  <li
                    key={`${question.personaId}-${question.question}`}
                    className="rounded-xl border border-amber-200 bg-amber-50/70 p-3"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar size="lg" className="shrink-0">
                        <AvatarFallback
                          className={cn(
                            "text-xs font-semibold",
                            persona?.avatarColor ?? "bg-slate-200 text-slate-700",
                          )}
                        >
                          {persona?.initials ?? question.personaName.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900">
                          {persona?.name ?? question.personaName}
                        </p>
                        {persona ? (
                          <p className="text-xs text-slate-600">
                            {persona.description}
                          </p>
                        ) : null}
                        {persona ? (
                          <PersonaCharacteristicTags persona={persona} />
                        ) : null}
                        <blockquote className="mt-2 text-sm leading-relaxed text-slate-800">
                          <MessageCircle
                            className="mb-1 mr-1 inline size-3.5 text-[#1e4a8c]"
                            aria-hidden
                          />
                          {question.question}
                        </blockquote>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            {children}
          </CardContent>

          <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/80 py-4">
            {showFinish ? (
              <Button type="button" variant="outline" size="sm" onClick={onFinish}>
                Finish Assessment
              </Button>
            ) : (
              <span />
            )}
            <Button
              type="button"
              size="sm"
              className="bg-[#1e4a8c] hover:bg-[#163a6e]"
              onClick={onClose}
            >
              Record a reply
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>,
    document.body,
  );
}
