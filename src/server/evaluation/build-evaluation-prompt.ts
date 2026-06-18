import { workerPersonas } from "~/lib/demo-data";
import { formatRubricForPrompt } from "~/lib/safety-rubric";
import {
  formatAnswerKeyForPrompt,
  type ScenarioAnswerKey,
} from "~/lib/scenario-answer-keys";

export type EvaluationPromptInput = {
  transcript: string;
  answerKey: ScenarioAnswerKey;
};

export type EvaluationPromptMessages = {
  system: string;
  user: string;
};

function formatPersonasForPrompt(): string {
  return workerPersonas
    .map(
      (persona) =>
        `- ${persona.name} (id: ${persona.id}): ${persona.description}`,
    )
    .join("\n");
}

export function buildEvaluationPrompt({
  transcript,
  answerKey,
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
    "- Provide brief personaFeedback for each worker persona listed below (one entry per persona id).",
    "- Do not invent hazards that are not supported by the scenario answer key.",
    "",
    "## Rubric criteria",
    formatRubricForPrompt(),
    "",
    "## Worker personas (for personaFeedback)",
    formatPersonasForPrompt(),
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
