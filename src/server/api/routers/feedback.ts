import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import {
  evaluateSafetyTalk,
  SafetyTalkEvaluationError,
} from "~/server/openai/evaluate-safety-talk";
import { loadScenarioEvaluationContext } from "~/server/scenarios/load-evaluation-context";

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
    .mutation(async ({ ctx, input }) => {
      const evaluationContext = await loadScenarioEvaluationContext(
        ctx.db,
        input.scenarioId,
      );

      if (!evaluationContext) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No answer key found for scenario "${input.scenarioId}".`,
        });
      }

      try {
        return await evaluateSafetyTalk({
          transcript: input.transcript,
          answerKey: evaluationContext.answerKey,
          personas: evaluationContext.personas,
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
