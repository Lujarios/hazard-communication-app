import { formatRubricForPrompt } from "~/lib/safety-rubric";
import {
  formatAnswerKeyForPrompt,
  type ScenarioAnswerKey,
} from "~/lib/scenario-answer-keys";
import type { EvaluationPersona } from "~/server/scenarios/load-evaluation-context";
import { formatPersonaCharacteristicsForPrompt } from "~/types/persona";

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
    .map((persona) => {
      const characteristics = formatPersonaCharacteristicsForPrompt(persona);
      const header = characteristics
        ? `- ${persona.name} (id: ${persona.id}): ${characteristics}`
        : `- ${persona.name} (id: ${persona.id})`;

      return [
        header,
        `  Role: ${persona.description}`,
        `  Evaluation instructions: ${persona.evaluationInstructions}`,
      ].join("\n");
    })
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
    "- Write each reaction in 1–2 sentences from that persona's perspective, using their job role, experience level, English literacy, and project experience.",
    "- Set understood to true only if the talk was clear enough for that persona; use simpler wording in reactions for entry-level, limited-English, and developing-literacy personas when the talk was unclear.",
    "- Persona questions: most personas must set question to null. Across ALL personas combined, include at most TWO questions, and prefer ONE when there is a single important gap.",
    "- Do not give each persona a unique question. The trainee must not be flooded with follow-ups.",
    "- If missedItems is empty or the talk covered the key hazards and controls, set every question to null.",
    "- A question is only allowed when that persona would realistically be confused or at risk because of a specific missed item. Prefer the persona whose characteristics make the gap most relevant (for example a new hire or limited-English worker asking for a simpler missing control, or a supervisor asking about a missing lift plan or accountability step).",
    "- When question is not null, it must be one short in-character question that points the trainee to a concrete missed hazard, control, or procedure from missedItems.",
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
