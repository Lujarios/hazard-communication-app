import { formatPersonaCommunicationRubricForPrompt } from "~/lib/persona-communication-rubric";
import { formatRubricForPrompt } from "~/lib/safety-rubric";
import {
  formatAnswerKeyForPrompt,
  type ScenarioAnswerKey,
} from "~/lib/scenario-answer-keys";
import { formatPersonaForEvaluationPrompt } from "~/server/evaluation/persona-interpretation";
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
  return personas.map((persona) => formatPersonaForEvaluationPrompt(persona)).join("\n");
}

export function buildEvaluationPrompt({
  transcript,
  answerKey,
  personas,
}: EvaluationPromptInput): EvaluationPromptMessages {
  const system = [
    "You are evaluating a trainee's spoken pre-job hazard communication for a construction safety training tool.",
    "Return two layers of evaluation in structured JSON:",
    "1. Objective scenario performance — how completely and accurately the talk covers the answer key, using the safety rubric.",
    "2. Persona-specific communication — how effectively the same talk would communicate to each assigned worker, using that worker's characteristics.",
    "",
    "Be fair but rigorous. Credit partial coverage and differently worded but equivalent points. Call out specific gaps.",
    "Use plain language suitable for a trainee scorecard.",
    "",
    "Objective evaluation rules:",
    "- Assign exactly one rating (1–5 stars) for every rubric criterion listed below.",
    "- Compare the transcript to each scenario hazard and expected control in the answer key.",
    "- List specific missed hazards, controls, communication gaps, or procedural items in missedItems.",
    "- Set relatedHazardId when a missed item maps to a scenario hazard id; otherwise null.",
    "- Emphasize life-threatening hazards (falls, suspended loads) when scoring life-threatening-emphasis.",
    "- Do not invent hazards that are not reasonably present in the scenario answer key.",
    "- Do not treat a natural spoken restatement as a miss when the same meaning is clearly there.",
    "- Do not punish filler words, restarts, or informal speech unless they actually hid a required point.",
    "",
    "Persona evaluation rules:",
    "- Provide personaEvaluations with exactly one entry for every worker persona id listed below.",
    "- Adopt that worker's perspective. Job role, experience level, English literacy, project experience, role description, and evaluation instructions must materially affect the scores and feedback.",
    "- Differences between personas must be explainable from those characteristics plus a specific gap or strength in the transcript. Do not make personas randomly disagree for variety.",
    "- An experienced foreman may understand shorthand that a new labourer would not.",
    "- A worker with limited English needs simpler, more direct instructions; a fluent engineer may focus on technical accuracy.",
    "- A new worker or someone with little project-type experience needs hazards and controls explained more explicitly.",
    "- Someone with extensive experience on this type of project may understand context another worker would need explained.",
    "- Score the four persona communication criteria (clarity, completeness, understandability, actionability) from THAT worker's perspective.",
    "- Completeness for a persona is not a second copy of the objective hazard checklist. It asks whether THIS worker received the explanations they personally needed.",
    "- Set understood true only if this worker grasped the talk well enough to work from it. They may still have follow-up questions about missing critical details.",
    "- Set hadAmbiguousInformation true when something important was said unclearly, not merely omitted.",
    "- understoodPoints: concrete things this worker clearly got. unclearPoints: things this worker heard but did not understand. missedCriticalInformation: important hazards/controls/actions this worker still would not know, with relatedHazardId when it maps to the answer key.",
    "- shortFeedback: 1–2 sentences in that worker's voice. Make it specific and actionable for the trainee.",
    "",
    "Follow-up question candidates:",
    "- These will be used later for clarification attempts. Generate only genuine candidates; do not redesign a conversation.",
    "- Each question must arise from something missing, ambiguous, or poorly communicated for THAT worker.",
    "- Each question must be answerable by the trainee, concise, and in the assigned persona's voice.",
    "- Do not ask for information the trainee already clearly provided.",
    "- Avoid vague questions such as \"Can you tell me more?\" or \"Can you clarify the hazards?\"",
    "- Good examples: \"As the new worker on this crew, I'm not sure where you want me to stand while the lift is operating. Can you clarify?\" / \"You mentioned fall protection, but when exactly are we required to tie off?\"",
    "- Use an empty followUpQuestionCandidates array when this worker needs no clarification.",
    "- Include at most three candidates per persona. Prefer one strong question over several weak ones.",
    "",
    "## Objective rubric criteria",
    formatRubricForPrompt(),
    "",
    "## Persona communication criteria",
    formatPersonaCommunicationRubricForPrompt(),
    "",
    "## Worker personas",
    formatPersonasForPrompt(personas),
  ].join("\n");

  const user = [
    "## Scenario answer key",
    formatAnswerKeyForPrompt(answerKey),
    "",
    "## Trainee transcript",
    transcript.trim(),
    "",
    "Evaluate the transcript. Return structured JSON with objective rubric scores plus one personaEvaluations entry per worker persona.",
  ].join("\n");

  return { system, user };
}
