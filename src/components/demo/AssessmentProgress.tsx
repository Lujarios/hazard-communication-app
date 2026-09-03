/**
 * Step indicator for the assessment: initial talk, clarifications, complete.
 */
import { Check } from "lucide-react";

import type { AssessmentRunStatus } from "~/types/assessment-run";
import { cn } from "~/lib/utils";

const STEPS = [
  { id: "initial", label: "Initial Talk" },
  { id: "clarification_1", label: "Clarification 1" },
  { id: "clarification_2", label: "Clarification 2" },
  { id: "complete", label: "Complete" },
] as const;

type AssessmentProgressProps = {
  status: AssessmentRunStatus;
  stageCount: number;
};

function currentStepIndex(status: AssessmentRunStatus, stageCount: number): number {
  if (status === "completed" || status === "ready_to_complete") {
    return 3;
  }

  if (stageCount <= 0) {
    return 0;
  }

  return Math.min(stageCount, 2);
}

function isStepComplete(
  index: number,
  status: AssessmentRunStatus,
  stageCount: number,
): boolean {
  if (index === 3) {
    return status === "completed";
  }

  return index < stageCount;
}

export function AssessmentProgress({
  status,
  stageCount,
}: AssessmentProgressProps) {
  const current = currentStepIndex(status, stageCount);

  return (
    <nav aria-label="Assessment progress" className="w-full">
      <ol className="flex items-center gap-2">
        {STEPS.map((step, index) => {
          const complete = isStepComplete(index, status, stageCount);
          const active = index === current && status !== "completed";

          return (
            <li key={step.id} className="flex min-w-0 flex-1 items-center gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                    complete && !active
                      ? "bg-emerald-600 text-white"
                      : active
                        ? "bg-[#1e4a8c] text-white"
                        : "bg-slate-200 text-slate-600",
                  )}
                  aria-current={active ? "step" : undefined}
                >
                  {complete && !active ? (
                    <Check className="size-3.5" aria-hidden />
                  ) : (
                    index + 1
                  )}
                </span>
                <span
                  className={cn(
                    "truncate text-xs font-medium",
                    active
                      ? "text-[#1e4a8c]"
                      : complete
                        ? "text-slate-700"
                        : "text-slate-500",
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < STEPS.length - 1 ? (
                <span
                  className={cn(
                    "h-px min-w-4 flex-1",
                    complete ? "bg-emerald-500" : "bg-slate-200",
                  )}
                  aria-hidden
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
