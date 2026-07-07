import { formatRubricForPrompt } from "~/lib/safety-rubric";
import {
  formatAnswerKeyForPrompt,
  type ScenarioAnswerKey,
} from "~/lib/scenario-answer-keys";
import type { EvaluationPersona } from "~/server/scenarios/load-evaluation-context";

export type EvaluationPromptInput = {
  transcript: string;
  answerKey: ScenarioAnswerKey;
  personas: EvaluationPersona[];
};

export type EvaluationPromptMessages = {
  system: string;
  user: string;
};

function formatPersonasForPrompt(personas: EvaluationPersona[]): string {
  return personas
    .map(
      (persona) =>
        `- ${persona.name} (id: ${persona.id}): ${persona.description}. ${persona.evaluationInstructions}`,
    )
    .join("\n");
}

export function buildEvaluationPrompt({
  transcript,
  answerKey,
  personas,
}: EvaluationPromptInput): EvaluationPromptMessages {
  const system = [
    "You are an expert construction safety trainer evaluating a trainee's spoken pre-job hazard communication.",
    "Score the transcript against the rubric and scenario answer key.",
    "Be fair but rigorous: credit partial coverage, and call out specific gaps.",
    "Use plain language suitable for a trainee scorecard.",
    "",
    "Rules:",
    "- Assign exactly one rating (1–5 stars) for every rubric criterion listed below.",
    "- Compare the transcript to each scenario hazard and expected control in the answer key.",
    "- List specific missed hazards, controls, communication gaps, or procedural items in missedItems.",
    "- Set relatedHazardId when a missed item maps to a scenario hazard id.",
    "- Emphasize life-threatening hazards (falls, suspended loads) when scoring life-threatening-emphasis.",
    "- Provide personaFeedback with exactly one entry for every worker persona id listed below.",
    "- Write each reaction in 1–2 sentences from that persona's perspective (experience level, language, literacy, or supervisor role).",
    "- Set understood to true only if the talk was clear enough for that persona; use simpler wording in reactions for new hires, limited-English, and low-literacy personas when the talk was unclear.",
    "- Do not invent hazards that are not supported by the scenario answer key.",
    "",
    "## Rubric criteria",
    formatRubricForPrompt(),
    "",
    "## Worker personas (for personaFeedback)",
    formatPersonasForPrompt(personas),
  ].join("\n");

  const user = [
    "## Scenario answer key",
    formatAnswerKeyForPrompt(answerKey),
    "",
    "## Trainee transcript",
    transcript.trim(),
    "",
    "Evaluate the transcript and return structured JSON matching the required schema.",
  ].join("\n");

  return { system, user };
}
