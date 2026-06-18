import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { getScenarioAnswerKey } from "~/lib/scenario-answer-keys";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import {
  evaluateSafetyTalk,
  SafetyTalkEvaluationError,
} from "~/server/openai/evaluate-safety-talk";

export const feedbackRouter = createTRPCRouter({
  evaluate: publicProcedure
    .input(
      z.object({
        scenarioId: z.string().min(1),
        transcript: z
          .string()
          .trim()
          .min(
            10,
            "Transcript must be at least 10 characters to evaluate.",
          ),
      }),
    )
    .mutation(async ({ input }) => {
      const answerKey = getScenarioAnswerKey(input.scenarioId);

      if (!answerKey) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No answer key found for scenario "${input.scenarioId}".`,
        });
      }

      try {
        return await evaluateSafetyTalk({
          transcript: input.transcript,
          answerKey,
        });
      } catch (error) {
        if (error instanceof SafetyTalkEvaluationError) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
            cause: error.cause,
          });
        }

        throw error;
      }
    }),
});
