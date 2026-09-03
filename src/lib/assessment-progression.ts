/**
 * Compare the first and last evaluated stages of a run: score deltas,
 * resolved missed items, and a short participant-facing completion summary.
 */
import { getRubricCriterion } from "~/lib/safety-rubric";
import type {
  AssessmentCompletionReason,
  AssessmentRunSnapshot,
  AssessmentStageSnapshot,
  AssessmentStageType,
  FollowUpQuestionResolution,
} from "~/types/assessment-run";
import type { MissedItem, PersonaFeedback, StarRating } from "~/types/feedback";

export type ScoreDelta = {
  initial: number;
  final: number;
  delta: number;
};

export type CriterionScoreDelta = ScoreDelta & {
  criterionId: string;
  label: string;
};

export type PersonaScoreDelta = ScoreDelta & {
  personaId: string;
  personaName: string;
  initiallyUnderstood: boolean;
  finallyUnderstood: boolean;
};

export type AssessmentRoundRecord = {
  stageType: AssessmentStageType;
  stageIndex: number;
  overallStars: number;
  personaScores: Array<{
    personaId: string;
    personaName: string;
    overallStars: number;
    understood: boolean;
  }>;
  questionsShown: Array<{
    personaId: string;
    personaName: string;
    question: string;
  }>;
  missedItemCount: number;
};

export type AssessmentProgression = {
  completionStage: AssessmentStageType | null;
  clarificationRoundsUsed: number;
  finishedEarly: boolean;
  reachedRoundLimit: boolean;
  completionReason: AssessmentCompletionReason | null;
  overallStars: ScoreDelta | null;
  criteria: CriterionScoreDelta[];
  personas: PersonaScoreDelta[];
  resolvedMissedItems: MissedItem[];
  remainingMissedItems: MissedItem[];
  resolvedMisunderstandings: FollowUpQuestionResolution[];
  remainingMisunderstandings: FollowUpQuestionResolution[];
  rounds: AssessmentRoundRecord[];
};

export type ParticipantCompletionSummary = {
  clarificationRoundsUsed: number;
  completionStageLabel: string;
  finishedEarly: boolean;
  reachedRoundLimit: boolean;
  overallStars: ScoreDelta | null;
  strengths: string[];
  improvedAreas: string[];
};

const COMPLETION_STAGE_LABELS: Record<AssessmentStageType, string> = {
  initial: "Completed after the initial safety talk",
  clarification_1: "Completed after 1 clarification round",
  clarification_2: "Completed after 2 clarification rounds",
};

export function clarificationRoundsUsed(stageCount: number): number {
  return Math.max(0, stageCount - 1);
}

export function finishedEarly(
  reason: AssessmentCompletionReason | null,
): boolean {
  return reason === "early_finish";
}

export function completionStageFromStages(
  stages: AssessmentStageSnapshot[],
): AssessmentStageType | null {
  return stages[stages.length - 1]?.stageType ?? null;
}

export function missedItemKey(item: MissedItem): string {
  const hazard = item.relatedHazardId?.trim();
  if (hazard) {
    return `${item.category}:${hazard}`;
  }

  return `${item.category}:${normalizeText(item.description)}`;
}

export function buildAssessmentProgression(
  snapshot: Pick<
    AssessmentRunSnapshot,
    "stageCount" | "completionReason" | "questionResolutions" | "stages"
  >,
): AssessmentProgression {
  const stages = [...snapshot.stages].sort(
    (left, right) => left.stageIndex - right.stageIndex,
  );
  const initial = stages[0];
  const latest = stages[stages.length - 1];
  const initialFeedback = initial?.feedback;
  const finalFeedback = latest?.feedback;
  const reason = snapshot.completionReason;

  return {
    completionStage: completionStageFromStages(stages),
    clarificationRoundsUsed: clarificationRoundsUsed(snapshot.stageCount),
    finishedEarly: finishedEarly(reason),
    reachedRoundLimit: reason === "max_rounds",
    completionReason: reason,
    overallStars: scoreDelta(
      initialFeedback?.overallStars,
      finalFeedback?.overallStars,
    ),
    criteria: criterionDeltas(initialFeedback?.criteriaRatings, finalFeedback?.criteriaRatings),
    personas: personaDeltas(
      initialFeedback?.personaFeedback,
      finalFeedback?.personaFeedback,
    ),
    resolvedMissedItems: resolvedMissedItems(
      initialFeedback?.missedItems ?? [],
      finalFeedback?.missedItems ?? [],
    ),
    remainingMissedItems: finalFeedback?.missedItems ?? [],
    resolvedMisunderstandings: snapshot.questionResolutions.filter(
      (resolution) => resolution.addressed,
    ),
    remainingMisunderstandings: snapshot.questionResolutions.filter(
      (resolution) => !resolution.addressed,
    ),
    rounds: stages.map((stage) => toRoundRecord(stage)),
  };
}

export function toParticipantCompletionSummary(
  progression: AssessmentProgression,
): ParticipantCompletionSummary {
  const stageLabel = progression.completionStage
    ? COMPLETION_STAGE_LABELS[progression.completionStage]
    : "Assessment submitted";

  return {
    clarificationRoundsUsed: progression.clarificationRoundsUsed,
    completionStageLabel: stageLabel,
    finishedEarly: progression.finishedEarly,
    reachedRoundLimit: progression.reachedRoundLimit,
    overallStars: progression.overallStars,
    strengths: participantStrengths(progression),
    improvedAreas: participantImprovedAreas(progression),
  };
}

function toRoundRecord(stage: AssessmentStageSnapshot): AssessmentRoundRecord {
  const personas = stage.feedback?.personaFeedback ?? [];

  return {
    stageType: stage.stageType,
    stageIndex: stage.stageIndex,
    overallStars: stage.feedback?.overallStars ?? 0,
    personaScores: personas.map((persona) => ({
      personaId: persona.personaId,
      personaName: personaName(persona),
      overallStars: persona.overallStars,
      understood: persona.understood,
    })),
    questionsShown: stage.selectedFollowUpQuestions.map((question) => ({
      personaId: question.personaId,
      personaName: question.personaName,
      question: question.question,
    })),
    missedItemCount: stage.feedback?.missedItems.length ?? 0,
  };
}

function criterionDeltas(
  initialRatings: Array<{ criterionId: string; stars: StarRating }> | undefined,
  finalRatings: Array<{ criterionId: string; stars: StarRating }> | undefined,
): CriterionScoreDelta[] {
  const initialById = new Map(
    (initialRatings ?? []).map((rating) => [rating.criterionId, rating.stars]),
  );
  const ids = new Set([
    ...(initialRatings ?? []).map((rating) => rating.criterionId),
    ...(finalRatings ?? []).map((rating) => rating.criterionId),
  ]);

  return [...ids].flatMap((criterionId) => {
    const delta = scoreDelta(
      initialById.get(criterionId),
      (finalRatings ?? []).find((rating) => rating.criterionId === criterionId)
        ?.stars,
    );
    if (!delta) {
      return [];
    }

    return [
      {
        criterionId,
        label: getRubricCriterion(criterionId)?.label ?? criterionId,
        ...delta,
      },
    ];
  });
}

function personaDeltas(
  initialPersonas: PersonaFeedback[] | undefined,
  finalPersonas: PersonaFeedback[] | undefined,
): PersonaScoreDelta[] {
  const initialById = new Map(
    (initialPersonas ?? []).map((persona) => [persona.personaId, persona]),
  );
  const ids = new Set([
    ...(initialPersonas ?? []).map((persona) => persona.personaId),
    ...(finalPersonas ?? []).map((persona) => persona.personaId),
  ]);

  return [...ids].flatMap((personaId) => {
    const initial = initialById.get(personaId);
    const latest = (finalPersonas ?? []).find(
      (persona) => persona.personaId === personaId,
    );
    const delta = scoreDelta(initial?.overallStars, latest?.overallStars);
    if (!delta) {
      return [];
    }

    return [
      {
        personaId,
        personaName: personaName(latest ?? initial),
        initiallyUnderstood: initial?.understood ?? false,
        finallyUnderstood: latest?.understood ?? false,
        ...delta,
      },
    ];
  });
}

function resolvedMissedItems(
  initialItems: MissedItem[],
  finalItems: MissedItem[],
): MissedItem[] {
  const remaining = new Set(finalItems.map(missedItemKey));
  return initialItems.filter((item) => !remaining.has(missedItemKey(item)));
}

function scoreDelta(
  initial: number | undefined,
  latest: number | undefined,
): ScoreDelta | null {
  if (typeof initial !== "number" || typeof latest !== "number") {
    return null;
  }

  return {
    initial,
    final: latest,
    delta: latest - initial,
  };
}

function participantStrengths(progression: AssessmentProgression): string[] {
  const strengths = progression.criteria
    .filter((criterion) => criterion.final >= 4)
    .sort((left, right) => right.final - left.final)
    .map((criterion) => criterion.label);

  if (strengths.length === 0 && (progression.overallStars?.final ?? 0) >= 4) {
    strengths.push("Clear overall hazard communication");
  }

  const understoodCount = progression.personas.filter(
    (persona) => persona.finallyUnderstood,
  ).length;
  if (
    strengths.length < 3 &&
    understoodCount > 0 &&
    understoodCount >= Math.ceil(progression.personas.length / 2)
  ) {
    strengths.push("Workers understood the main instructions");
  }

  return uniqueStrings(strengths).slice(0, 3);
}

function participantImprovedAreas(progression: AssessmentProgression): string[] {
  if (progression.clarificationRoundsUsed <= 0) {
    return [];
  }

  const areas: string[] = [];
  const improvedCriteria = progression.criteria
    .filter((criterion) => criterion.delta > 0)
    .sort((left, right) => right.delta - left.delta)
    .map((criterion) => `${criterion.label} improved after clarification`);

  areas.push(...improvedCriteria.slice(0, 2));

  if (
    areas.length === 0 &&
    progression.overallStars &&
    progression.overallStars.delta > 0
  ) {
    areas.push("Your overall communication rating improved after clarification");
  }

  const resolvedHazardOrControl = progression.resolvedMissedItems.some(
    (item) => item.category === "hazard" || item.category === "control",
  );
  if (resolvedHazardOrControl) {
    areas.push("Additional hazards or controls were covered in your clarification");
  }

  if (progression.resolvedMisunderstandings.length > 0) {
    areas.push("Worker follow-up questions were addressed");
  }

  const newlyUnderstood = progression.personas.filter(
    (persona) => !persona.initiallyUnderstood && persona.finallyUnderstood,
  );
  if (newlyUnderstood.length > 0) {
    areas.push("More of the crew understood what to do");
  }

  return uniqueStrings(areas).slice(0, 3);
}

function personaName(persona: PersonaFeedback | undefined): string {
  return persona?.personaId ?? "Worker";
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)];
}
