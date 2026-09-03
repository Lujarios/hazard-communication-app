"use client";

/**
 * Confirm that the trainee wants to finish before using every clarification round.
 */
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

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

type FinishAssessmentDialogProps = {
  open: boolean;
  confirmNeeded: boolean;
  isSubmitting?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function FinishAssessmentDialog({
  open,
  confirmNeeded,
  isSubmitting = false,
  onCancel,
  onConfirm,
}: FinishAssessmentDialogProps) {
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

  useEscapeKey(onCancel, open);
  useFocusTrap(dialogRef, open, String(open));

  if (!mounted || !open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className={DIALOG_BACKDROP_CLASS}
        aria-label="Cancel finishing the assessment"
        onClick={onCancel}
      />

      <div ref={dialogRef} className="relative z-10 w-full max-w-md">
        <Card
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          className="gap-0 py-0 ring-1 ring-slate-200"
        >
          <CardHeader className="border-b border-slate-100 py-4">
            <CardTitle id={titleId} className="text-lg font-semibold text-slate-900">
              Submit assessment?
            </CardTitle>
          </CardHeader>
          <CardContent className="py-4">
            <p id={descriptionId} className="text-sm leading-relaxed text-slate-600">
              {confirmNeeded
                ? "You still have an opportunity to respond to worker questions. Submitting now will end this assessment session and you will not be able to record additional replies for this attempt."
                : "This will submit your assessment, end this session, and take you to a completion page. You will not be able to record additional responses for this attempt."}
            </p>
          </CardContent>
          <CardFooter className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/80 py-4">
            <Button type="button" variant="outline" size="sm" onClick={onCancel}>
              Continue assessment
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-[#1e4a8c] hover:bg-[#163a6e]"
              disabled={isSubmitting}
              onClick={onConfirm}
            >
              {isSubmitting ? "Submitting…" : "Submit Assessment"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>,
    document.body,
  );
}
