"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CircleHelp, X } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { useEscapeKey, useFocusTrap } from "~/hooks/use-tutorial-a11y";
import { DIALOG_BACKDROP_CLASS } from "~/lib/utils";

type ScenarioIntroModalProps = {
  scenarioId: string;
  title: string;
  description: string;
  open: boolean;
  onClose: () => void;
  onOpenHelp: () => void;
};

export function ScenarioIntroModal({
  scenarioId,
  title,
  description,
  open,
  onClose,
  onOpenHelp,
}: ScenarioIntroModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const [mounted, setMounted] = useState(false);

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
  useFocusTrap(dialogRef, open, scenarioId);

  if (!mounted || !open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className={DIALOG_BACKDROP_CLASS}
        aria-label="Close scenario introduction"
        onClick={onClose}
      />

      <div ref={dialogRef} className="relative z-10 w-full max-w-lg">
        <Card
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          className="gap-0 py-0 ring-1 ring-slate-200"
        >
          <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-slate-100 py-4 pb-4">
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-[#1e4a8c]">
                Scenario brief
              </p>
              <CardTitle
                id={titleId}
                className="text-lg font-semibold text-slate-900"
              >
                {title}
              </CardTitle>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0 text-slate-500 hover:text-slate-900"
              onClick={onClose}
              aria-label="Close scenario introduction"
            >
              <X className="size-4" />
            </Button>
          </CardHeader>

          <CardContent className="space-y-4 py-4">
            <p
              id={descriptionId}
              className="text-sm leading-relaxed text-slate-600"
            >
              {description}
            </p>

            <div className="flex items-start gap-3 rounded-xl border border-[#1e4a8c]/20 bg-[#1e4a8c]/5 px-3 py-3">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#1e4a8c] text-white shadow-sm">
                <CircleHelp className="size-4" aria-hidden />
              </span>
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-semibold text-[#1e4a8c]">
                  Need a full walkthrough?
                </p>
                <p className="text-xs leading-relaxed text-slate-600">
                  Click the highlighted{" "}
                  <span className="font-semibold text-[#1e4a8c]">Help</span>{" "}
                  button in the top right for a guided tour of how SafeTalk
                  works.
                </p>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/80 py-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                onOpenHelp();
              }}
            >
              <CircleHelp className="size-4" aria-hidden />
              Open Help tour
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-[#1e4a8c] hover:bg-[#163a6e]"
              onClick={onClose}
            >
              Start assessment
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>,
    document.body,
  );
}
