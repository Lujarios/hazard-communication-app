/** Star rating for a rubric criterion or overall safety talk quality (1 = poor, 5 = excellent). */
export type StarRating = 1 | 2 | 3 | 4 | 5;

export const STAR_RATINGS = [1, 2, 3, 4, 5] as const satisfies readonly StarRating[];

export type RubricCriterion = {
  id: string;
  label: string;
  description: string;
  /** Instructions for the AI evaluator when scoring this criterion. */
  evaluationGuidance: string;
  /** Plain-language anchors for each star level. */
  starAnchors: Record<StarRating, string>;
  /** Professor reference documents this criterion is derived from. */
  sourceReferences: string[];
  /** Relative importance from the EEI Pre-Job Scorecard (higher = more weight). */
  weight: number;
};

export type CriterionRating = {
  criterionId: string;
  stars: StarRating;
  summary: string;
};

export type MissedItemCategory =
  | "hazard"
  | "control"
  | "communication"
  | "procedure"
  | "engagement";

export type MissedItemSeverity = "high" | "medium" | "info";

export type MissedItem = {
  category: MissedItemCategory;
  description: string;
  severity: MissedItemSeverity;
  /** Links a missed item to a scenario hazard when applicable. */
  relatedHazardId?: string;
};

export type PersonaFeedback = {
  personaId: string;
  reaction: string;
  understood: boolean;
};

export type SafetyTalkFeedback = {
  criteriaRatings: CriterionRating[];
  missedItems: MissedItem[];
  overallSummary: string;
  /** Mean star rating across rubric criteria, rounded to nearest half-star for display. */
  overallStars: StarRating;
  personaFeedback?: PersonaFeedback[];
};

export type FeedbackStatus = "idle" | "loading" | "success" | "error";

export type FeedbackState = {
  status: FeedbackStatus;
  data: SafetyTalkFeedback | null;
  error: string | null;
};

export const initialFeedbackState: FeedbackState = {
  status: "idle",
  data: null,
  error: null,
};
