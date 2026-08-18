import {
  STAR_RATINGS,
  type RubricCriterion,
  type StarRating,
} from "~/types/feedback";

/**
 * Communication scores given from one assigned worker persona's perspective.
 * Distinct from the objective 8-criterion safety rubric on the attempt.
 */
export const personaCommunicationCriteria = [
  {
    id: "clarity",
    label: "Clarity",
    description:
      "From this worker's perspective, was the language, structure, and wording of the talk easy to follow?",
    evaluationGuidance:
      "Score based on this persona's English literacy, experience, and role. Limited-English and developing-literacy workers need shorter, more direct sentences. Experienced fluent workers can follow normal jobsite language. Do not punish natural spoken delivery (ums, restarts) unless it actually obscured meaning for this worker.",
    starAnchors: {
      1: "Confusing, too fast, or too technical for this worker to follow.",
      2: "Mostly hard to follow; key phrases would be lost on this worker.",
      3: "Partially clear; some parts would land, others would need repeating.",
      4: "Clear enough for this worker with only minor wording issues.",
      5: "Plain, well-paced, and easy for this specific worker to follow.",
    },
  },
  {
    id: "completeness",
    label: "Completeness for this worker",
    description:
      "Did the talk include the level of explanation this worker needs, given their role, experience, and familiarity with this kind of project?",
    evaluationGuidance:
      "A new hire or someone with little project experience needs hazards, controls, locations, and timing stated explicitly. An experienced foreman or supervisor can infer some context from shorthand, but still needs job-specific controls. Completeness is relative to this listener, not a copy of the objective hazard checklist.",
    starAnchors: {
      1: "This worker is missing most of the information they would need to work safely.",
      2: "Major gaps for this worker; only fragments of what they need were said.",
      3: "Some of what this worker needs was covered; important details were left implicit.",
      4: "Most information this worker needs was covered, with one or two thin spots.",
      5: "This worker received the explanations they personally need for this job.",
    },
  },
  {
    id: "understandability",
    label: "Understandability",
    description:
      "Would this worker actually understand the safety message that was delivered?",
    evaluationGuidance:
      "Credit meaning that this persona would grasp, including differently worded but equivalent points. Do not treat a synonym or plain-language restatement as a miss. Limited-English workers may not understand idioms, stacked clauses, or unexplained jargon. Engineers may focus on whether technical terms were used accurately.",
    starAnchors: {
      1: "This worker would not understand the talk.",
      2: "This worker would catch only isolated words or one idea.",
      3: "This worker would understand the gist but miss important details.",
      4: "This worker would understand nearly all of the talk.",
      5: "This worker would clearly understand the safety message.",
    },
  },
  {
    id: "actionability",
    label: "Knows what action to take",
    description:
      "After this talk, would this worker know what they personally should do?",
    evaluationGuidance:
      "Consider this persona's job role. A labourer needs where to stand, what PPE to wear, and when to stop. A supervisor needs who is accountable and how the crew will be checked. An operator needs signals, exclusion zones, and their machine-related duties. Vague 'be careful' language is not actionable.",
    starAnchors: {
      1: "This worker would not know what to do.",
      2: "This worker would have only a vague sense of one action.",
      3: "This worker would know some next steps but still be unsure about important ones.",
      4: "This worker would know most of what to do, with a small uncertainty.",
      5: "This worker would know the concrete actions expected of them.",
    },
  },
] as const satisfies ReadonlyArray<
  Omit<RubricCriterion, "sourceReferences" | "weight">
>;

export const personaCommunicationCriterionIds = [
  "clarity",
  "completeness",
  "understandability",
  "actionability",
] as const;

export type PersonaCommunicationCriterionId =
  (typeof personaCommunicationCriterionIds)[number];

export function formatPersonaCommunicationRubricForPrompt(): string {
  return personaCommunicationCriteria
    .map((criterion) => {
      const anchors = STAR_RATINGS.map(
        (stars) => `  ${stars}★: ${criterion.starAnchors[stars]}`,
      ).join("\n");

      return [
        `### ${criterion.label} (id: ${criterion.id})`,
        criterion.description,
        `Evaluation guidance: ${criterion.evaluationGuidance}`,
        "Star anchors:",
        anchors,
      ].join("\n");
    })
    .join("\n\n");
}

export function computePersonaCommunicationStars(
  scores: Record<PersonaCommunicationCriterionId, StarRating>,
): StarRating {
  const values = personaCommunicationCriterionIds.map((id) => scores[id]);
  const mean = values.reduce((sum, stars) => sum + stars, 0) / values.length;
  const rounded = Math.round(mean);

  return Math.min(5, Math.max(1, rounded)) as StarRating;
}
