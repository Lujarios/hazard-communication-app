import { Star } from "lucide-react";

import { STAR_RATINGS, type StarRating as StarRatingValue } from "~/types/feedback";
import { cn } from "~/lib/utils";

type StarRatingProps = {
  value: StarRatingValue;
  /** Accessible description, e.g. "Hazard Identification: 4 out of 5 stars". */
  label?: string;
  size?: "sm" | "md";
  className?: string;
};

export function StarRating({
  value,
  label,
  size = "md",
  className,
}: StarRatingProps) {
  const ariaLabel = label ?? `${value} out of 5 stars`;
  const iconSize = size === "sm" ? "size-3.5" : "size-4";

  return (
    <div
      className={cn("inline-flex items-center gap-0.5", className)}
      role="img"
      aria-label={ariaLabel}
    >
      {STAR_RATINGS.map((star) => {
        const filled = star <= value;

        return (
          <Star
            key={star}
            className={cn(
              iconSize,
              filled
                ? "fill-amber-400 text-amber-400"
                : "fill-none text-slate-300",
            )}
            aria-hidden
          />
        );
      })}
    </div>
  );
}
