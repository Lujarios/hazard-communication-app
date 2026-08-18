import type { PersonaFeedback } from "~/types/feedback";
import type { EvaluationPersona } from "~/server/scenarios/load-evaluation-context";

export type PersonaEvaluationInsert = {
  assessmentAttemptId: string;
  personaId: string;
  experienceLevel: string | null;
  jobRole: string | null;
  jobRoleOther: string | null;
  englishLiteracy: string | null;
  projectExperience: string | null;
  clarityStars: number;
  completenessStars: number;
  understandabilityStars: number;
  actionabilityStars: number;
  overallStars: number;
  understood: boolean;
  wouldKnowWhatActionToTake: boolean;
  hadAmbiguousInformation: boolean;
  shortFeedback: string;
  understoodPoints: string[];
  unclearPoints: string[];
  missedCriticalInformation: PersonaFeedback["missedCriticalInformation"];
  followUpQuestionCandidates: PersonaFeedback["followUpQuestionCandidates"];
};

export function toPersonaEvaluationInserts(
  assessmentAttemptId: string,
  personaFeedback: PersonaFeedback[],
  personas: EvaluationPersona[],
): PersonaEvaluationInsert[] {
  const personasById = new Map(
    personas.map((persona) => [persona.id, persona]),
  );

  return personaFeedback.map((feedback) => {
    const persona = personasById.get(feedback.personaId);

    return {
      assessmentAttemptId,
      personaId: feedback.personaId,
      experienceLevel: persona?.experienceLevel ?? null,
      jobRole: persona?.jobRole ?? null,
      jobRoleOther: persona?.jobRoleOther ?? null,
      englishLiteracy: persona?.englishLiteracy ?? null,
      projectExperience: persona?.projectExperience ?? null,
      clarityStars: feedback.scores.clarity,
      completenessStars: feedback.scores.completeness,
      understandabilityStars: feedback.scores.understandability,
      actionabilityStars: feedback.scores.actionability,
      overallStars: feedback.overallStars,
      understood: feedback.understood,
      wouldKnowWhatActionToTake: feedback.wouldKnowWhatActionToTake,
      hadAmbiguousInformation: feedback.hadAmbiguousInformation,
      shortFeedback: feedback.shortFeedback,
      understoodPoints: feedback.understoodPoints,
      unclearPoints: feedback.unclearPoints,
      missedCriticalInformation: feedback.missedCriticalInformation,
      followUpQuestionCandidates: feedback.followUpQuestionCandidates,
    };
  });
}
