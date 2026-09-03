import "server-only";

import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";

import { env } from "~/env";
import type { ScenarioAnswerKey } from "~/lib/scenario-answer-keys";
import type { SafetyTalkFeedback } from "~/types/feedback";

import { buildEvaluationPrompt } from "~/server/evaluation/build-evaluation-prompt";
import {
  createSafetyTalkEvaluationResponseSchema,
  toSafetyTalkFeedback,
} from "~/server/evaluation/feedback-schema";
import type { EvaluationPersona } from "~/server/scenarios/load-evaluation-context";
import type { ConversationSegment } from "~/types/assessment-run";

const EVALUATION_MODEL = "gpt-4o-mini";

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  openaiClient ??= new OpenAI({ apiKey: env.OPENAI_API_KEY });
  return openaiClient;
}

export type EvaluateSafetyTalkInput = {
  transcript: string;
  answerKey: ScenarioAnswerKey;
  personas: EvaluationPersona[];
  conversation?: ConversationSegment[];
  followUpBudget?: 0 | 1 | 2;
};

export class SafetyTalkEvaluationError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "SafetyTalkEvaluationError";
  }
}

export async function evaluateSafetyTalk({
  transcript,
  answerKey,
  personas,
  conversation,
  followUpBudget,
}: EvaluateSafetyTalkInput): Promise<SafetyTalkFeedback> {
  const trimmedTranscript = transcript.trim();

  if (trimmedTranscript.length < 10) {
    throw new SafetyTalkEvaluationError(
      "Transcript is too short to evaluate. Please record or type a longer hazard explanation.",
    );
  }

  if (personas.length === 0) {
    throw new SafetyTalkEvaluationError(
      "This scenario has no AI personas configured for evaluation.",
    );
  }

  const responseSchema = createSafetyTalkEvaluationResponseSchema(
    personas.map((persona) => persona.id),
  );

  const { system, user } = buildEvaluationPrompt({
    transcript: trimmedTranscript,
    answerKey,
    personas,
    conversation,
    followUpBudget,
  });

  try {
    const completion = await getOpenAIClient().chat.completions.parse({
      model: EVALUATION_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: zodResponseFormat(
        responseSchema,
        "safety_talk_evaluation",
      ),
    });

    const parsed = completion.choices[0]?.message.parsed;

    if (!parsed) {
      const refusal = completion.choices[0]?.message.refusal;
      throw new SafetyTalkEvaluationError(
        refusal
          ? `Evaluation was refused: ${refusal}`
          : "Evaluation returned an empty response from the AI model.",
      );
    }

    return toSafetyTalkFeedback(
      parsed,
      personas.map((persona) => persona.id),
    );
  } catch (error) {
    if (error instanceof SafetyTalkEvaluationError) {
      throw error;
    }

    const detail =
      error instanceof Error ? error.message : "Unknown evaluation error";

    throw new SafetyTalkEvaluationError(
      process.env.NODE_ENV === "development"
        ? detail
        : "Failed to evaluate the safety talk. Please try again.",
      error,
    );
  }
}
