import { z } from "zod";

import {
  computePersonaCommunicationStars,
} from "~/lib/persona-communication-rubric";
import { safetyRubricCriteria } from "~/lib/safety-rubric";
import type {
  CriterionRating,
  FollowUpQuestionCandidate,
  MissedItem,
  PersonaFeedback,
  PersonaMissedCriticalInformation,
  SafetyTalkFeedback,
  StarRating,
} from "~/types/feedback";

export const rubricCriterionIds = safetyRubricCriteria.map((c) => c.id);

const rubricCriterionIdSchema = z.enum(
  rubricCriterionIds as [string, ...string[]],
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
  /** Nullable required for OpenAI structured output (use null when not applicable). */
  relatedHazardId: z.string().nullable(),
});

const personaMissedCriticalInformationResponseSchema = z.object({
  description: z.string().min(1),
  severity: z.enum(["high", "medium", "info"]),
  relatedHazardId: z.string().nullable(),
});

const followUpQuestionCandidateResponseSchema = z.object({
  question: z.string().min(1),
  reason: z.string().min(1),
  relatedHazardId: z.string().nullable(),
});

const personaCommunicationScoresResponseSchema = z.object({
  clarity: starRatingSchema,
  completeness: starRatingSchema,
  understandability: starRatingSchema,
  actionability: starRatingSchema,
});

export const MAX_FOLLOW_UP_QUESTIONS_PER_PERSONA = 3;

const VAGUE_FOLLOW_UP_PATTERNS = [
  /^can you (please )?tell me more\??$/i,
  /^can you (please )?clarify\??$/i,
  /^can you (please )?clarify the hazards\??$/i,
  /^what (else )?should i know\??$/i,
  /^any (more )?details\??$/i,
];

export function createSafetyTalkEvaluationResponseSchema(
  personaIds: string[],
) {
  if (personaIds.length === 0) {
    throw new Error("At least one persona is required for evaluation.");
  }

  const workerPersonaIdSchema = z.enum(
    personaIds as [string, ...string[]],
  );

  const personaEvaluationResponseSchema = z.object({
    personaId: workerPersonaIdSchema,
    scores: personaCommunicationScoresResponseSchema,
    understood: z.boolean(),
    hadAmbiguousInformation: z.boolean(),
    understoodPoints: z.array(z.string().min(1)),
    unclearPoints: z.array(z.string().min(1)),
    missedCriticalInformation: z.array(
      personaMissedCriticalInformationResponseSchema,
    ),
    followUpQuestionCandidates: z.array(
      followUpQuestionCandidateResponseSchema,
    ),
    shortFeedback: z.string().min(1),
  });

  return z.object({
    criteriaRatings: z.array(criterionRatingResponseSchema),
    missedItems: z.array(missedItemResponseSchema),
    overallSummary: z.string().min(1),
    personaEvaluations: z.array(personaEvaluationResponseSchema),
  });
}

export type SafetyTalkEvaluationResponse = z.infer<
  ReturnType<typeof createSafetyTalkEvaluationResponseSchema>
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

export function isVagueFollowUpQuestion(question: string): boolean {
  const normalized = question.trim();
  if (normalized.length < 12) {
    return true;
  }

  return VAGUE_FOLLOW_UP_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function normalizeFollowUpQuestionCandidates(
  candidates: FollowUpQuestionCandidate[],
): FollowUpQuestionCandidate[] {
  const seen = new Set<string>();
  const normalized: FollowUpQuestionCandidate[] = [];

  for (const candidate of candidates) {
    const question = candidate.question.trim();
    if (!question || isVagueFollowUpQuestion(question)) {
      continue;
    }

    const key = question.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    normalized.push({
      question,
      reason: candidate.reason.trim(),
      relatedHazardId: candidate.relatedHazardId ?? null,
    });

    if (normalized.length >= MAX_FOLLOW_UP_QUESTIONS_PER_PERSONA) {
      break;
    }
  }

  return normalized;
}

export function toSafetyTalkFeedback(
  response: SafetyTalkEvaluationResponse,
  expectedPersonaIds: string[],
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
    relatedHazardId: item.relatedHazardId ?? undefined,
  }));

  const returnedPersonaIds = new Set(
    response.personaEvaluations.map((item) => item.personaId),
  );
  const missingPersonas = expectedPersonaIds.filter(
    (id) => !returnedPersonaIds.has(id),
  );

  if (missingPersonas.length > 0) {
    throw new Error(
      `Evaluation response missing persona feedback: ${missingPersonas.join(", ")}`,
    );
  }

  const extraPersonas = [...returnedPersonaIds].filter(
    (id) => !expectedPersonaIds.includes(id),
  );
  if (extraPersonas.length > 0) {
    throw new Error(
      `Evaluation response included unexpected personas: ${extraPersonas.join(", ")}`,
    );
  }

  const personaFeedback: PersonaFeedback[] = expectedPersonaIds.map((personaId) => {
    const item = response.personaEvaluations.find(
      (evaluation) => evaluation.personaId === personaId,
    );

    if (!item) {
      throw new Error(`Evaluation response missing persona feedback: ${personaId}`);
    }

    return toPersonaFeedback(item);
  });

  return {
    criteriaRatings,
    missedItems,
    overallSummary: response.overallSummary,
    overallStars: computeOverallStars(criteriaRatings),
    personaFeedback,
  };
}

function toPersonaFeedback(
  item: SafetyTalkEvaluationResponse["personaEvaluations"][number],
): PersonaFeedback {
  const scores = {
    clarity: item.scores.clarity,
    completeness: item.scores.completeness,
    understandability: item.scores.understandability,
    actionability: item.scores.actionability,
  };

  const missedCriticalInformation: PersonaMissedCriticalInformation[] =
    item.missedCriticalInformation.map((entry) => ({
      description: entry.description.trim(),
      severity: entry.severity,
      relatedHazardId: entry.relatedHazardId ?? undefined,
    }));

  const followUpQuestionCandidates = normalizeFollowUpQuestionCandidates(
    item.followUpQuestionCandidates.map((candidate) => ({
      question: candidate.question,
      reason: candidate.reason,
      relatedHazardId: candidate.relatedHazardId,
    })),
  );

  const shortFeedback = item.shortFeedback.trim();

  return {
    personaId: item.personaId,
    reaction: shortFeedback,
    shortFeedback,
    understood: item.understood,
    wouldKnowWhatActionToTake: scores.actionability >= 4,
    hadAmbiguousInformation: item.hadAmbiguousInformation,
    scores,
    overallStars: computePersonaCommunicationStars(scores),
    understoodPoints: item.understoodPoints.map((point) => point.trim()).filter(Boolean),
    unclearPoints: item.unclearPoints.map((point) => point.trim()).filter(Boolean),
    missedCriticalInformation,
    followUpQuestionCandidates,
    question: followUpQuestionCandidates[0]?.question ?? null,
  };
}

