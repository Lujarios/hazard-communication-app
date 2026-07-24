import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import {
  evaluateSafetyTalk,
  SafetyTalkEvaluationError,
} from "~/server/openai/evaluate-safety-talk";
import { loadScenarioEvaluationContext } from "~/server/scenarios/load-evaluation-context";
import {
  assessmentAttempts,
  assessmentSessions,
} from "~/server/db/schema";
import type { SafetyTalkFeedback } from "~/types/feedback";

const uuidInput = z.string().uuid();

export const feedbackRouter = createTRPCRouter({
  evaluate: publicProcedure
    .input(
      z.object({
        scenarioId: uuidInput,
        transcript: z
          .string()
          .trim()
          .min(
            10,
            "Transcript must be at least 10 characters to evaluate.",
          ),
        /** Client-generated anonymous id (localStorage). Required for attempt analytics. */
        anonymousParticipantId: uuidInput,
        /** Join-session id when the trainee arrived via a share code. */
        assessmentSessionId: uuidInput.optional(),
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

      let feedback: SafetyTalkFeedback;
      try {
        feedback = await evaluateSafetyTalk({
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

      // Persist attempt after scoring succeeds. Fail soft so the UI still gets feedback.
      try {
        let joinCode: string | null = null;
        let assessmentSessionId: string | null = null;

        if (input.assessmentSessionId) {
          const session = await ctx.db.query.assessmentSessions.findFirst({
            where: and(
              eq(assessmentSessions.id, input.assessmentSessionId),
              eq(assessmentSessions.scenarioId, input.scenarioId),
            ),
            columns: { id: true, joinCode: true },
          });

          if (session) {
            assessmentSessionId = session.id;
            joinCode = session.joinCode;
          }
        }

        await ctx.db.insert(assessmentAttempts).values({
          anonymousParticipantId: input.anonymousParticipantId,
          scenarioId: input.scenarioId,
          assessmentSessionId,
          joinCode,
          transcript: input.transcript,
          overallStars: feedback.overallStars,
          overallSummary: feedback.overallSummary,
          criteriaRatings: feedback.criteriaRatings,
          missedItems: feedback.missedItems,
          personaFeedback: feedback.personaFeedback ?? null,
        });
      } catch (error) {
        console.error("Failed to persist assessment attempt:", error);
      }

      return feedback;
    }),
});
