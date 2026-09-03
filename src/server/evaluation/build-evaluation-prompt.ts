/**
 * Assemble the system/user prompt for OpenAI: rubric, answer key, personas,
 * and the trainee's cumulative conversation.
 */
import { formatConversationForEvaluation } from "~/lib/assessment-run-state";
import { formatPersonaCommunicationRubricForPrompt } from "~/lib/persona-communication-rubric";
import { formatRubricForPrompt } from "~/lib/safety-rubric";
import {
  formatAnswerKeyForPrompt,
  type ScenarioAnswerKey,
} from "~/lib/scenario-answer-keys";
import { formatPersonaForEvaluationPrompt } from "~/server/evaluation/persona-interpretation";
import type { EvaluationPersona } from "~/server/scenarios/load-evaluation-context";
import type { ConversationSegment } from "~/types/assessment-run";

export type EvaluationPromptInput = {
  transcript: string;
  answerKey: ScenarioAnswerKey;
  personas: EvaluationPersona[];
  conversation?: ConversationSegment[];
  followUpBudget?: 0 | 1 | 2;
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
  conversation,
  followUpBudget = 2,
}: EvaluationPromptInput): EvaluationPromptMessages {
  const system = [
    "You are evaluating a trainee's spoken pre-job hazard communication for a construction safety training tool.",
    "Return two layers of evaluation in structured JSON:",
    "1. Objective scenario performance — how completely and accurately the talk covers the answer key, using the safety rubric.",
    "2. Persona-specific communication — how effectively the same talk would communicate to each assigned worker, using that worker's characteristics.",
    "",
    "Be fair but rigorous. Credit partial coverage and differently worded but equivalent points. Call out specific gaps.",
    "Use plain language suitable for a trainee scorecard.",
    "If the communication includes an initial safety talk plus later clarifications, evaluate the CUMULATIVE record. Credit information from any stage. Do not penalize the speaker for not repeating the initial talk when answering a worker question.",
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
    "- These may be shown to the trainee as worker clarification questions. Generate only genuine candidates; do not redesign a conversation.",
    "- Each question must arise from something still missing, ambiguous, or poorly communicated for THAT worker after everything said so far.",
    "- Each question must be answerable by the trainee, concise, and in the assigned persona's voice.",
    "- Do not ask for information the trainee already clearly provided in the initial talk or a later clarification.",
    "- Do not repeat worker questions that already appear in the conversation history.",
    "- Do not generate overlapping questions across personas. If several workers share the same gap, only the worker who most needs that detail should ask; the others should use an empty candidate list for that gap.",
    "- Prefer distinct topics. Two questions about standing location, exclusion zones, or the same hazard count as duplicates.",
    "- Judge each previously asked worker question on its own. If a clarification directly answered that question, do not treat it as still open even if other unrelated hazards remain missing.",
    "- Avoid vague questions such as \"Can you tell me more?\" or \"Can you clarify the hazards?\"",
    "- Good examples: \"As the new worker on this crew, I'm not sure where you want me to stand while the lift is operating. Can you clarify?\" / \"You mentioned fall protection, but when exactly are we required to tie off?\"",
    followUpBudget === 0
      ? "- This is the final clarification. Do NOT invent new follow-up questions. Use empty followUpQuestionCandidates arrays. Judge whether earlier worker questions were answered."
      : followUpBudget === 1
        ? "- At most ONE remaining useful question may be asked across all workers. Prefer a distinct unanswered gap, including a different detail about a hazard already discussed. Use empty arrays only when no worker still needs a useful clarification."
        : "- Across all workers combined, there should be at most two distinct question topics. Empty arrays are better than similar questions from multiple workers.",
    "- Use an empty followUpQuestionCandidates array when this worker needs no clarification. Empty is better than a filler question.",
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

  const communicationBlock =
    conversation && conversation.length > 0
      ? formatConversationForEvaluation(conversation)
      : ["## Trainee transcript", transcript.trim()].join("\n");

  const user = [
    "## Scenario answer key",
    formatAnswerKeyForPrompt(answerKey),
    "",
    communicationBlock,
    "",
    "Evaluate the communication. Return structured JSON with objective rubric scores plus one personaEvaluations entry per worker persona.",
  ].join("\n");

  return { system, user };
}
