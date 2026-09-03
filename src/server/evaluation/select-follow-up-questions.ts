/**
 * Rank and pick the follow-up questions shown to the trainee after a stage
 * (at most two, preferring concrete, non-overlapping worker questions).
 */
import { isVagueFollowUpQuestion } from "~/server/evaluation/feedback-schema";
import type {
  MissedItemSeverity,
  PersonaFeedback,
} from "~/types/feedback";
import {
  MAX_SHOWN_FOLLOW_UP_QUESTIONS,
  type FollowUpQuestionResolution,
  type SelectedFollowUpQuestion,
} from "~/types/assessment-run";

export type FollowUpPersonaLookup = {
  id: string;
  name: string;
  experienceLevel: string | null;
  englishLiteracy: string | null;
};

type RankedCandidate = {
  personaId: string;
  personaName: string;
  question: string;
  reason: string;
  relatedHazardId: string | null;
  topicKey: string;
  score: number;
  tokens: Set<string>;
};

const STOP_WORDS = new Set([
  "about",
  "should",
  "would",
  "could",
  "please",
  "where",
  "while",
  "during",
  "that",
  "this",
  "with",
  "from",
  "have",
  "what",
  "when",
  "your",
  "you",
  "the",
  "and",
  "for",
  "are",
  "was",
  "operating",
  "exactly",
  "needed",
]);

const TOPIC_PATTERNS: Array<{ key: string; pattern: RegExp }> = [
  { key: "location", pattern: /\b(stand|standing|where|location|exclusion|zone|clear|barricad|walkway)\b/ },
  {
    key: "ppe",
    pattern:
      /\b(ppe|safety gear|hard hat|helmet|glasses|gloves|boots|vest|protection|protective equipment)\b/,
  },
  { key: "fall", pattern: /\b(tie[- ]?off|fall protection|anchor|lanyard)\b/ },
  { key: "signal", pattern: /\b(signal|spotter|banksman|who is running)\b/ },
  { key: "ladder", pattern: /\b(ladder|climbing|three points)\b/ },
  {
    key: "stop-work",
    pattern:
      /\b(stop[- ]?work|stop work|emergency|evacuate|unsafe|see a hazard|something unsafe)\b/,
  },
];

const TOPIC_COVERAGE_PATTERNS: Record<string, RegExp> = {
  location:
    /\b(stand|standing|where to|exclusion zone|barricad|walkway|keep clear)\b/,
  ppe: /\b(ppe|safety gear|hard hat|helmet|safety glasses|gloves|boots|high[- ]vis|high visibility|hearing protection|respirat|fall.?protect|harness|protective equipment)\b/,
  fall: /\b(tie[- ]?off|fall protection|anchor|lanyard|harness)\b/,
  signal: /\b(signal|spotter|banksman)\b/,
  ladder: /\b(ladder|three points)\b/,
  "stop-work":
    /\b(stop(?:ping)?(?:\s+the)?\s+work|stop[- ]?work|unsafe|report(?: it)?|supervisor|person in charge|don'?t ignore)\b/,
};

const SEVERITY_POINTS: Record<MissedItemSeverity, number> = {
  high: 5,
  medium: 3,
  info: 1,
};

function normalizeQuestion(question: string): string {
  return question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(question: string): Set<string> {
  return new Set(
    normalizeQuestion(question)
      .split(" ")
      .filter((token) => token.length > 3 && !STOP_WORDS.has(token)),
  );
}

function contentTopic(question: string): string | null {
  const normalized = normalizeQuestion(question);
  for (const topic of TOPIC_PATTERNS) {
    if (topic.pattern.test(normalized)) {
      return topic.key;
    }
  }

  return null;
}

function topicKey(question: string, relatedHazardId: string | null): string {
  const content = contentTopic(question);
  if (content) {
    return `topic:${content}`;
  }

  if (relatedHazardId) {
    return `hazard:${relatedHazardId}`;
  }

  return `text:${[...tokenize(question)].sort().slice(0, 4).join("-")}`;
}

function tokenCoverage(question: string, responseText: string): number {
  const questionTokens = tokenize(question);
  if (questionTokens.size === 0) {
    return 0;
  }

  const responseTokens = tokenize(responseText);
  let hits = 0;
  for (const token of questionTokens) {
    if (responseTokens.has(token)) {
      hits += 1;
    }
  }

  return hits / questionTokens.size;
}

export function responseCoversQuestion(
  question: string,
  responseText: string,
): boolean {
  const response = normalizeQuestion(responseText);
  if (!response) {
    return false;
  }

  const topic = contentTopic(question);
  if (topic) {
    const coverage = TOPIC_COVERAGE_PATTERNS[topic];
    if (coverage?.test(response)) {
      return true;
    }
  }

  const coverage = tokenCoverage(question, responseText);
  const questionTokens = tokenize(question);
  if (questionTokens.size <= 2) {
    return coverage >= 1;
  }

  return coverage >= 0.5;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) {
    return 1;
  }

  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) {
      intersection += 1;
    }
  }

  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function toComparable(question: {
  question: string;
  relatedHazardId?: string | null;
  topicKey?: string;
}): RankedCandidate {
  const relatedHazardId = question.relatedHazardId ?? null;
  return {
    personaId: "",
    personaName: "",
    question: question.question,
    reason: "",
    relatedHazardId,
    topicKey: question.topicKey ?? topicKey(question.question, relatedHazardId),
    score: 0,
    tokens: tokenize(question.question),
  };
}

export function areNearDuplicateQuestions(
  left: { question: string; relatedHazardId?: string | null },
  right: { question: string; relatedHazardId?: string | null },
): boolean {
  return areNearDuplicates(toComparable(left), toComparable(right));
}

function areNearDuplicates(
  left: RankedCandidate,
  right: RankedCandidate,
): boolean {
  if (left.topicKey && left.topicKey === right.topicKey) {
    return true;
  }

  const leftContent = contentTopic(left.question);
  const rightContent = contentTopic(right.question);
  if (leftContent && leftContent === rightContent) {
    return true;
  }

  const sameHazard =
    Boolean(left.relatedHazardId) &&
    left.relatedHazardId === right.relatedHazardId;
  const overlap = jaccard(left.tokens, right.tokens);

  if (normalizeQuestion(left.question) === normalizeQuestion(right.question)) {
    return true;
  }

  if (sameHazard) {
    return true;
  }

  return overlap >= 0.35;
}

function wasAlreadyAsked(
  candidate: RankedCandidate,
  previouslyShown: SelectedFollowUpQuestion[],
): boolean {
  return previouslyShown.some((previous) => {
    const prior = toComparable(previous);
    if (normalizeQuestion(candidate.question) === normalizeQuestion(prior.question)) {
      return true;
    }

    const candidateTopic = contentTopic(candidate.question);
    const priorTopic = contentTopic(prior.question);
    if (candidateTopic && candidateTopic === priorTopic) {
      return true;
    }

    return jaccard(candidate.tokens, prior.tokens) >= 0.35;
  });
}

function rankCandidate(
  feedback: PersonaFeedback,
  candidate: PersonaFeedback["followUpQuestionCandidates"][number],
  persona: FollowUpPersonaLookup | undefined,
): number {
  let score = 1;

  if (candidate.relatedHazardId) {
    score += 2;
  }

  for (const missed of feedback.missedCriticalInformation) {
    const related =
      !candidate.relatedHazardId ||
      missed.relatedHazardId === candidate.relatedHazardId;
    if (related) {
      score += SEVERITY_POINTS[missed.severity];
    }
  }

  if (!feedback.understood) {
    score += 2;
  }

  if (!feedback.wouldKnowWhatActionToTake) {
    score += 3;
  }

  if (feedback.hadAmbiguousInformation) {
    score += 2;
  }

  if (persona?.englishLiteracy === "limited") {
    score += 1;
  }

  if (persona?.experienceLevel === "entry") {
    score += 1;
  }

  return score;
}

export function selectFollowUpQuestions(
  personaFeedback: PersonaFeedback[],
  personas: FollowUpPersonaLookup[],
  options?: {
    previouslyShown?: SelectedFollowUpQuestion[];
    max?: number;
  },
): SelectedFollowUpQuestion[] {
  const max = options?.max ?? MAX_SHOWN_FOLLOW_UP_QUESTIONS;
  if (max <= 0) {
    return [];
  }

  const previouslyShown = options?.previouslyShown ?? [];
  const personasById = new Map(personas.map((persona) => [persona.id, persona]));

  const ranked: RankedCandidate[] = [];

  for (const feedback of personaFeedback) {
    const persona = personasById.get(feedback.personaId);
    const personaName = persona?.name ?? feedback.personaId;

    for (const candidate of feedback.followUpQuestionCandidates) {
      const question = candidate.question.trim();
      if (!question || isVagueFollowUpQuestion(question)) {
        continue;
      }

      const relatedHazardId = candidate.relatedHazardId ?? null;
      ranked.push({
        personaId: feedback.personaId,
        personaName,
        question,
        reason: candidate.reason.trim(),
        relatedHazardId,
        topicKey: topicKey(question, relatedHazardId),
        score: rankCandidate(feedback, candidate, persona),
        tokens: tokenize(question),
      });
    }
  }

  ranked.sort((left, right) => right.score - left.score);

  const selected: SelectedFollowUpQuestion[] = [];
  const usedPersonaIds = new Set<string>();

  for (const candidate of ranked) {
    if (wasAlreadyAsked(candidate, previouslyShown)) {
      continue;
    }

    if (usedPersonaIds.has(candidate.personaId)) {
      continue;
    }

    const duplicateOf = selected.find((item) =>
      areNearDuplicates(candidate, toComparable(item)),
    );

    if (duplicateOf) {
      if (!duplicateOf.mergedFromPersonaIds.includes(candidate.personaId)) {
        duplicateOf.mergedFromPersonaIds.push(candidate.personaId);
      }
      continue;
    }

    selected.push({
      personaId: candidate.personaId,
      personaName: candidate.personaName,
      question: candidate.question,
      reason: candidate.reason,
      relatedHazardId: candidate.relatedHazardId,
      mergedFromPersonaIds: [],
    });
    usedPersonaIds.add(candidate.personaId);

    if (selected.length >= max) {
      break;
    }
  }

  return selected;
}

function involvedPersonaIds(question: SelectedFollowUpQuestion): string[] {
  return [question.personaId, ...question.mergedFromPersonaIds];
}

export type PreviousQuestionToResolve = SelectedFollowUpQuestion & {
  /** Clarification text recorded after this question was shown. */
  responseText?: string;
};

export function resolvePreviousQuestions(
  previouslyShown: PreviousQuestionToResolve[],
  personaFeedback: PersonaFeedback[],
  personas: FollowUpPersonaLookup[] = [],
): FollowUpQuestionResolution[] {
  const feedbackById = new Map(
    personaFeedback.map((entry) => [entry.personaId, entry]),
  );
  const personasById = new Map(personas.map((persona) => [persona.id, persona]));
  const resolutions: FollowUpQuestionResolution[] = [];

  for (const question of previouslyShown) {
    for (const personaId of involvedPersonaIds(question)) {
      const feedback = feedbackById.get(personaId);
      const understood = feedback?.understood ?? false;
      const knowsAction = feedback?.wouldKnowWhatActionToTake ?? false;
      const stillAskingSimilar = (feedback?.followUpQuestionCandidates ?? []).some(
        (candidate) =>
          areNearDuplicateQuestions(question, {
            question: candidate.question,
            relatedHazardId: candidate.relatedHazardId,
          }),
      );
      const coveredByResponse = question.responseText
        ? responseCoversQuestion(question.question, question.responseText)
        : false;

      const addressed = coveredByResponse
        ? true
        : stillAskingSimilar
          ? false
          : !question.responseText && understood && knowsAction;

      resolutions.push({
        personaId,
        personaName:
          personasById.get(personaId)?.name ??
          (personaId === question.personaId ? question.personaName : personaId),
        question: question.question,
        reason: question.reason,
        relatedHazardId: question.relatedHazardId,
        addressed,
        understood,
      });
    }
  }

  return resolutions;
}
