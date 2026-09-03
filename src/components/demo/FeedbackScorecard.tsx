/**
 * Rubric scorecard for one evaluated stage: overall stars, criterion ratings,
 * written summary, and missed hazards / controls / communication items.
 */
import {
  AlertCircle,
  ClipboardList,
  Loader2,
  Target,
} from "lucide-react";

import { StarRating } from "~/components/demo/StarRating";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { getRubricCriterion } from "~/lib/safety-rubric";
import type {
  MissedItem,
  MissedItemCategory,
  MissedItemSeverity,
  SafetyTalkFeedback,
} from "~/types/feedback";
import { cn } from "~/lib/utils";

type FeedbackScorecardProps = {
  feedback: SafetyTalkFeedback | null;
  isLoading?: boolean;
  error?: string | null;
};

const missedItemSeverityStyles: Record<
  MissedItemSeverity,
  { badge: string; dot: string }
> = {
  high: {
    badge: "border-red-600 bg-red-50 text-red-800",
    dot: "bg-red-600",
  },
  medium: {
    badge: "border-orange-500 bg-orange-50 text-orange-900",
    dot: "bg-orange-500",
  },
  info: {
    badge: "border-violet-600 bg-violet-50 text-violet-900",
    dot: "bg-violet-600",
  },
};

const missedItemCategoryLabels: Record<MissedItemCategory, string> = {
  hazard: "Hazard",
  control: "Control",
  communication: "Communication",
  procedure: "Procedure",
  engagement: "Engagement",
};

function ScorecardSkeleton() {
  return (
    <div className="space-y-4 animate-pulse" aria-hidden>
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 rounded bg-slate-200" />
          <div className="h-3 w-full rounded bg-slate-100" />
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2 rounded-lg bg-slate-50 p-3">
            <div className="h-3 w-40 rounded bg-slate-200" />
            <div className="h-3 w-full rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

function MissedItemCard({ item }: { item: MissedItem }) {
  const styles = missedItemSeverityStyles[item.severity];

  return (
    <li className="flex flex-col items-center rounded-lg border border-slate-100 bg-slate-50 px-3 py-3 text-center ring-1 ring-slate-100/80">
      <Badge
        variant="outline"
        className={cn(
          "border-l-4 px-2.5 py-0.5 text-[10px] font-semibold",
          styles.badge,
        )}
      >
        <span
          className={cn("mr-1 inline-block size-1.5 rounded-full", styles.dot)}
          aria-hidden
        />
        {missedItemCategoryLabels[item.category]}
      </Badge>
      <p className="mt-2.5 text-xs leading-relaxed text-slate-700">
        {item.description}
      </p>
    </li>
  );
}

function EmptyState() {
  return (
    <div className="flex gap-4 rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-4 py-6">
      <div
        className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#1e4a8c]/10 text-[#1e4a8c]"
        aria-hidden
      >
        <ClipboardList className="size-6" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-800">
          Safety Talk Scorecard
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Stop recording and submit your safety talk to receive star-rated
          rubric scores and pinpointed guidance on what was missed.
        </p>
      </div>
    </div>
  );
}

export function FeedbackScorecard({
  feedback,
  isLoading = false,
  error = null,
}: FeedbackScorecardProps) {
  return (
    <Card data-tour="scorecard" className="gap-0 py-0 ring-1 ring-slate-200">
      <CardHeader className="border-b border-slate-100 py-3 pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-800">
          <Target className="size-4 text-[#1e4a8c]" aria-hidden />
          Safety Talk Scorecard
        </CardTitle>
      </CardHeader>

      <CardContent className="px-4 py-4">
        {isLoading && (
          <div className="flex flex-col gap-4 py-2">
            <div className="flex items-center justify-center gap-2">
              <Loader2
                className="size-6 animate-spin text-[#1e4a8c]"
                aria-hidden
              />
              <p className="text-sm text-slate-500" role="status">
                Evaluating your hazard talk…
              </p>
            </div>
            <ScorecardSkeleton />
          </div>
        )}

        {!isLoading && error && (
          <div
            role="alert"
            className="flex gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-3"
          >
            <AlertCircle
              className="mt-0.5 size-4 shrink-0 text-red-600"
              aria-hidden
            />
            <div>
              <p className="text-sm font-medium text-red-800">
                Feedback unavailable
              </p>
              <p className="mt-1 text-xs leading-relaxed text-red-700">
                {error}
              </p>
            </div>
          </div>
        )}

        {!isLoading && !error && !feedback && <EmptyState />}

        {!isLoading && !error && feedback && (
          <div className="space-y-6">
            <div className="rounded-lg bg-[#1e4a8c]/5 px-4 py-4 ring-1 ring-[#1e4a8c]/10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#1e4a8c]">
                  Overall
                </p>
                <StarRating
                  value={feedback.overallStars}
                  label={`Overall score: ${feedback.overallStars} out of 5 stars`}
                />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-700 sm:text-base">
                {feedback.overallSummary}
              </p>
            </div>

            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Rubric scores
              </h3>
              <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {feedback.criteriaRatings.map((rating) => {
                  const criterion = getRubricCriterion(rating.criterionId);
                  const label = criterion?.label ?? rating.criterionId;

                  return (
                    <li
                      key={rating.criterionId}
                      className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium text-slate-800">
                          {label}
                        </p>
                        <StarRating
                          value={rating.stars}
                          size="sm"
                          label={`${label}: ${rating.stars} out of 5 stars`}
                        />
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                        {rating.summary}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                What was missed
              </h3>
              {feedback.missedItems.length > 0 ? (
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {feedback.missedItems.map((item, index) => (
                    <MissedItemCard
                      key={`${item.category}-${index}`}
                      item={item}
                    />
                  ))}
                </ul>
              ) : (
                <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-4 text-center text-xs leading-relaxed text-emerald-800 sm:text-sm">
                  No major gaps identified against the scenario answer key.
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
