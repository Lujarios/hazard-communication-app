"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, HelpCircle, MessageCircle, X } from "lucide-react";

import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
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
import type { FollowUpQuestionResolution } from "~/types/assessment-run";
import { cn, DIALOG_BACKDROP_CLASS } from "~/lib/utils";

type ClarificationOutcomeDialogProps = {
  open: boolean;
  resolutions: FollowUpQuestionResolution[];
  personas: AssessmentPersona[];
  onClose: () => void;
  onFinish: () => void;
  showFinish?: boolean;
};

export function ClarificationOutcomeDialog({
  open,
  resolutions,
  personas,
  onClose,
  onFinish,
  showFinish = true,
}: ClarificationOutcomeDialogProps) {
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
  useFocusTrap(dialogRef, open, resolutions.map((item) => item.personaId).join("|"));

  if (!mounted || !open || resolutions.length === 0) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className={DIALOG_BACKDROP_CLASS}
        aria-label="Close worker update"
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
                Crew update
              </p>
              <CardTitle id={titleId} className="text-lg font-semibold text-slate-900">
                Workers heard your clarification
              </CardTitle>
              <p className="text-sm leading-relaxed text-slate-600">
                There are no more follow-up questions. Here is whether the
                workers who asked earlier now understand.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0 text-slate-500 hover:text-slate-900"
              onClick={onClose}
              aria-label="Close worker update"
            >
              <X className="size-4" />
            </Button>
          </CardHeader>

          <CardContent className="space-y-3 py-4">
            <ul className="space-y-3">
              {resolutions.map((resolution) => {
                const persona = personasById.get(resolution.personaId);

                return (
                  <li
                    key={`${resolution.personaId}-${resolution.question}`}
                    className={cn(
                      "rounded-xl border p-3",
                      resolution.addressed
                        ? "border-emerald-200 bg-emerald-50/70"
                        : "border-amber-200 bg-amber-50/70",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar size="lg" className="shrink-0">
                        <AvatarFallback
                          className={cn(
                            "text-xs font-semibold",
                            persona?.avatarColor ?? "bg-slate-200 text-slate-700",
                          )}
                        >
                          {persona?.initials ?? resolution.personaName.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900">
                            {persona?.name ?? resolution.personaName}
                          </p>
                          <Badge
                            variant="outline"
                            className={cn(
                              "gap-1 px-2 py-0.5 text-[10px] font-semibold",
                              resolution.addressed
                                ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                                : "border-amber-600 bg-amber-50 text-amber-900",
                            )}
                          >
                            {resolution.addressed ? (
                              <CheckCircle2 className="size-3" aria-hidden />
                            ) : (
                              <HelpCircle className="size-3" aria-hidden />
                            )}
                            {resolution.addressed
                              ? "Now understands"
                              : "Still unclear"}
                          </Badge>
                        </div>
                        <blockquote className="mt-2 text-sm leading-relaxed text-slate-800">
                          <MessageCircle
                            className="mb-1 mr-1 inline size-3.5 text-[#1e4a8c]"
                            aria-hidden
                          />
                          {resolution.question}
                        </blockquote>
                        {!resolution.addressed ? (
                          <p className="mt-1 text-xs text-amber-900">
                            This earlier question was not fully addressed.
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>

          <CardFooter className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/80 py-4">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Review scorecard
            </Button>
            {showFinish ? (
              <Button
                type="button"
                size="sm"
                className="bg-[#1e4a8c] hover:bg-[#163a6e]"
                onClick={onFinish}
              >
                Submit Assessment
              </Button>
            ) : null}
          </CardFooter>
        </Card>
      </div>
    </div>,
    document.body,
  );
}
