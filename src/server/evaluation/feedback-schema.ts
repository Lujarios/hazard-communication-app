import { z } from "zod";

import { workerPersonas } from "~/lib/demo-data";
import { safetyRubricCriteria } from "~/lib/safety-rubric";
import type {
  CriterionRating,
  MissedItem,
  PersonaFeedback,
  SafetyTalkFeedback,
  StarRating,
} from "~/types/feedback";

export const rubricCriterionIds = safetyRubricCriteria.map((c) => c.id);
export const workerPersonaIds = workerPersonas.map((persona) => persona.id);

const rubricCriterionIdSchema = z.enum(
  rubricCriterionIds as [string, ...string[]],
);

const workerPersonaIdSchema = z.enum(
  workerPersonaIds as [string, ...string[]],
);

export const starRatingSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);

export const criterionRatingResponseSchema = z.object({
  criterionId: rubricCriterionIdSchema,
  stars: starRatingSchema,
  summary: z.string().min(1),
});

export const missedItemResponseSchema = z.object({
  category: z.enum(["hazard", "control", "communication", "procedure", "engagement"]),
  description: z.string().min(1),
  severity: z.enum(["high", "medium", "info"]),
  relatedHazardId: z.string().optional(),
});

export const personaFeedbackResponseSchema = z.object({
  personaId: workerPersonaIdSchema,
  reaction: z.string().min(1),
  understood: z.boolean(),
});

export const safetyTalkEvaluationResponseSchema = z.object({
  criteriaRatings: z.array(criterionRatingResponseSchema),
  missedItems: z.array(missedItemResponseSchema),
  overallSummary: z.string().min(1),
  personaFeedback: z.array(personaFeedbackResponseSchema),
});

export type SafetyTalkEvaluationResponse = z.infer<
  typeof safetyTalkEvaluationResponseSchema
>;

export function computeOverallStars(ratings: CriterionRating[]): StarRating {
  if (ratings.length === 0) {
    return 1;
  }

  const mean =
    ratings.reduce((sum, rating) => sum + rating.stars, 0) / ratings.length;
  const rounded = Math.round(mean);

  return Math.min(5, Math.max(1, rounded)) as StarRating;
}

export function toSafetyTalkFeedback(
  response: SafetyTalkEvaluationResponse,
): SafetyTalkFeedback {
  const criteriaRatings: CriterionRating[] = response.criteriaRatings.map(
    (rating) => ({
      criterionId: rating.criterionId,
      stars: rating.stars,
      summary: rating.summary,
    }),
  );

  const returnedIds = new Set(criteriaRatings.map((r) => r.criterionId));
  const missingCriteria = rubricCriterionIds.filter((id) => !returnedIds.has(id));

  if (missingCriteria.length > 0) {
    throw new Error(
      `Evaluation response missing rubric criteria: ${missingCriteria.join(", ")}`,
    );
  }

  const missedItems: MissedItem[] = response.missedItems.map((item) => ({
    category: item.category,
    description: item.description,
    severity: item.severity,
    relatedHazardId: item.relatedHazardId,
  }));

  const returnedPersonaIds = new Set(
    response.personaFeedback.map((item) => item.personaId),
  );
  const missingPersonas = workerPersonaIds.filter(
    (id) => !returnedPersonaIds.has(id),
  );

  if (missingPersonas.length > 0) {
    throw new Error(
      `Evaluation response missing persona feedback: ${missingPersonas.join(", ")}`,
    );
  }

  const personaFeedback: PersonaFeedback[] = response.personaFeedback.map(
    (item) => ({
      personaId: item.personaId,
      reaction: item.reaction,
      understood: item.understood,
    }),
  );

  return {
    criteriaRatings,
    missedItems,
    overallSummary: response.overallSummary,
    overallStars: computeOverallStars(criteriaRatings),
    personaFeedback,
  };
}
