import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { toPersonaEvaluationInserts } from "~/server/evaluation/persist-persona-evaluations";
import {
  evaluateSafetyTalk,
  SafetyTalkEvaluationError,
} from "~/server/openai/evaluate-safety-talk";
import { loadScenarioEvaluationContext } from "~/server/scenarios/load-evaluation-context";
import { resolveAssessmentSession } from "~/server/assessment-run/resolve-session";
import {
  assessmentAttemptPersonaEvaluations,
  assessmentAttempts,
  assessmentRuns,
} from "~/server/db/schema";
import type { SafetyTalkFeedback } from "~/types/feedback";
import { WORKFLOW_VERSION_LEGACY } from "~/types/assessment-run";

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

      // Persist as a completed single-stage run so leftover callers stay grouped.
      try {
        const session = await resolveAssessmentSession(
          ctx.db,
          input.scenarioId,
          input.assessmentSessionId,
        );

        await ctx.db.transaction(async (tx) => {
          const [run] = await tx
            .insert(assessmentRuns)
            .values({
              anonymousParticipantId: input.anonymousParticipantId,
              scenarioId: input.scenarioId,
              assessmentSessionId: session?.id ?? null,
              joinCode: session?.joinCode ?? null,
              status: "completed",
              stageCount: 1,
              workflowVersion: WORKFLOW_VERSION_LEGACY,
              completionReason: "legacy_single_shot",
              completedAt: new Date(),
            })
            .returning({ id: assessmentRuns.id });

          if (!run) {
            throw new Error("Assessment run insert did not return an id.");
          }

          const [attempt] = await tx
            .insert(assessmentAttempts)
            .values({
              anonymousParticipantId: input.anonymousParticipantId,
              scenarioId: input.scenarioId,
              assessmentSessionId: session?.id ?? null,
              runId: run.id,
              joinCode: session?.joinCode ?? null,
              stageType: "initial",
              stageIndex: 0,
              segmentTranscript: input.transcript,
              transcript: input.transcript,
              overallStars: feedback.overallStars,
              overallSummary: feedback.overallSummary,
              criteriaRatings: feedback.criteriaRatings,
              missedItems: feedback.missedItems,
              personaFeedback: feedback.personaFeedback ?? null,
              selectedFollowUpQuestions: [],
              evaluationStatus: "succeeded",
            })
            .returning({ id: assessmentAttempts.id });

          if (!attempt) {
            throw new Error("Assessment attempt insert did not return an id.");
          }

          const personaRows = toPersonaEvaluationInserts(
            attempt.id,
            feedback.personaFeedback ?? [],
            evaluationContext.personas,
          );

          if (personaRows.length > 0) {
            await tx
              .insert(assessmentAttemptPersonaEvaluations)
              .values(personaRows);
          }
        });
      } catch (error) {
        console.error("Failed to persist assessment attempt:", error);
      }

      return feedback;
    }),
});
