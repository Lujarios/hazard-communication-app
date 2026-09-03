/**
 * Public trainee API for a multi-stage assessment run: start/resume, submit
 * a speech segment, and complete. This is the primary evaluation path.
 */
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, ne } from "drizzle-orm";
import { z } from "zod";

import {
  buildAssessmentProgression,
  toParticipantCompletionSummary,
} from "~/lib/assessment-progression";
import {
  buildCumulativeTranscript,
  canCompleteRun,
  canSubmitResponse,
  completionReasonForFinish,
  conversationFromStages,
  isAssessmentRunStatus,
  maxFollowUpQuestionsAfterStage,
  nextStatusAfterEvaluation,
  shouldAutoCompleteAfterEvaluation,
  stageTypeForIndex,
  statusAfterFailedSubmit,
} from "~/lib/assessment-run-state";
import { resolveAssessmentSession } from "~/server/assessment-run/resolve-session";
import {
  asSelectedFollowUpQuestions,
  toRunSnapshot,
  type AssessmentStageRow,
} from "~/server/assessment-run/to-snapshot";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { toPersonaEvaluationInserts } from "~/server/evaluation/persist-persona-evaluations";
import { selectFollowUpQuestions } from "~/server/evaluation/select-follow-up-questions";
import {
  evaluateSafetyTalk,
  SafetyTalkEvaluationError,
} from "~/server/openai/evaluate-safety-talk";
import { loadScenarioEvaluationContext } from "~/server/scenarios/load-evaluation-context";
import {
  assessmentAttemptPersonaEvaluations,
  assessmentAttempts,
  assessmentRuns,
} from "~/server/db/schema";
import type { db } from "~/server/db";
import { WORKFLOW_VERSION_CLARIFICATION } from "~/types/assessment-run";
import type { SelectedFollowUpQuestion } from "~/types/assessment-run";

const uuidInput = z.string().uuid();

const runLookupInput = z.object({
  scenarioId: uuidInput,
  anonymousParticipantId: uuidInput,
  assessmentSessionId: uuidInput.optional(),
  runId: uuidInput.optional(),
  startNew: z.boolean().optional(),
});

const submitInput = z.object({
  runId: uuidInput,
  scenarioId: uuidInput,
  anonymousParticipantId: uuidInput,
  segmentTranscript: z
    .string()
    .trim()
    .min(10, "Response must be at least 10 characters."),
  assessmentSessionId: uuidInput.optional(),
});

const completeInput = z.object({
  runId: uuidInput,
  scenarioId: uuidInput,
  anonymousParticipantId: uuidInput,
});

function parseRunStatus(status: string) {
  if (isAssessmentRunStatus(status)) {
    return status;
  }

  return "awaiting_initial" as const;
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
}

async function loadStages(
  database: typeof db,
  runId: string,
): Promise<AssessmentStageRow[]> {
  const rows = await database.query.assessmentAttempts.findMany({
    where: eq(assessmentAttempts.runId, runId),
    orderBy: [asc(assessmentAttempts.stageIndex)],
  });

  return rows.map((row) => ({
    id: row.id,
    stageType: row.stageType,
    stageIndex: row.stageIndex,
    segmentTranscript: row.segmentTranscript,
    transcript: row.transcript,
    overallStars: row.overallStars,
    overallSummary: row.overallSummary,
    criteriaRatings: row.criteriaRatings,
    missedItems: row.missedItems,
    personaFeedback: row.personaFeedback,
    selectedFollowUpQuestions: row.selectedFollowUpQuestions,
    participantFinishedAfterStage: row.participantFinishedAfterStage,
    createdAt: row.createdAt,
  }));
}

async function loadSnapshot(database: typeof db, runId: string) {
  const run = await database.query.assessmentRuns.findFirst({
    where: eq(assessmentRuns.id, runId),
  });

  if (!run) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Assessment not found.",
    });
  }

  const stages = await loadStages(database, runId);
  return toRunSnapshot(run, stages);
}

async function assertRunOwner(
  run: { anonymousParticipantId: string; scenarioId: string },
  input: { anonymousParticipantId: string; scenarioId: string },
) {
  if (
    run.anonymousParticipantId !== input.anonymousParticipantId ||
    run.scenarioId !== input.scenarioId
  ) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "This assessment does not belong to the current participant.",
    });
  }
}

async function createRun(
  database: typeof db,
  input: {
    anonymousParticipantId: string;
    scenarioId: string;
    assessmentSessionId: string | null;
    joinCode: string | null;
  },
) {
  try {
    const [created] = await database
      .insert(assessmentRuns)
      .values({
        anonymousParticipantId: input.anonymousParticipantId,
        scenarioId: input.scenarioId,
        assessmentSessionId: input.assessmentSessionId,
        joinCode: input.joinCode,
        status: "awaiting_initial",
        stageCount: 0,
        workflowVersion: WORKFLOW_VERSION_CLARIFICATION,
      })
      .returning();

    if (!created) {
      throw new Error("Failed to create assessment run.");
    }

    return created;
  } catch (error) {
    if (!isUniqueViolation(error)) {
      throw error;
    }

    const existing = await database.query.assessmentRuns.findFirst({
      where: and(
        eq(assessmentRuns.anonymousParticipantId, input.anonymousParticipantId),
        eq(assessmentRuns.scenarioId, input.scenarioId),
        ne(assessmentRuns.status, "completed"),
      ),
      orderBy: [desc(assessmentRuns.createdAt)],
    });

    if (!existing) {
      throw error;
    }

    return existing;
  }
}

export const assessmentRunRouter = createTRPCRouter({
  startOrResume: publicProcedure
    .input(runLookupInput)
    .mutation(async ({ ctx, input }) => {
      const session = await resolveAssessmentSession(
        ctx.db,
        input.scenarioId,
        input.assessmentSessionId,
      );

      if (input.runId && !input.startNew) {
        const existingById = await ctx.db.query.assessmentRuns.findFirst({
          where: eq(assessmentRuns.id, input.runId),
        });

        if (existingById) {
          await assertRunOwner(existingById, input);

          if (existingById.status !== "completed") {
            return loadSnapshot(ctx.db, existingById.id);
          }
        }
      }

      const inProgress = await ctx.db.query.assessmentRuns.findFirst({
        where: and(
          eq(assessmentRuns.anonymousParticipantId, input.anonymousParticipantId),
          eq(assessmentRuns.scenarioId, input.scenarioId),
          ne(assessmentRuns.status, "completed"),
        ),
        orderBy: [desc(assessmentRuns.createdAt)],
      });

      if (inProgress && !input.startNew) {
        return loadSnapshot(ctx.db, inProgress.id);
      }

      const created = await createRun(ctx.db, {
        anonymousParticipantId: input.anonymousParticipantId,
        scenarioId: input.scenarioId,
        assessmentSessionId: session?.id ?? null,
        joinCode: session?.joinCode ?? null,
      });

      return loadSnapshot(ctx.db, created.id);
    }),

  submitResponse: publicProcedure
    .input(submitInput)
    .mutation(async ({ ctx, input }) => {
      const run = await ctx.db.query.assessmentRuns.findFirst({
        where: eq(assessmentRuns.id, input.runId),
      });

      if (!run) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Assessment not found.",
        });
      }

      await assertRunOwner(run, input);

      const stages = await loadStages(ctx.db, run.id);
      const retryingProcessing = run.status === "processing";
      const runStatus = parseRunStatus(run.status);

      if (!retryingProcessing && !canSubmitResponse(runStatus, run.stageCount)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            run.status === "completed"
              ? "This assessment is already complete."
              : "A new response cannot be submitted in the current assessment state.",
        });
      }

      const stageIndex = retryingProcessing ? run.stageCount : run.stageCount;
      const existingStage = stages.find((stage) => stage.stageIndex === stageIndex);

      if (existingStage) {
        await ctx.db
          .update(assessmentRuns)
          .set({
            pendingSegmentTranscript: null,
            lastError: null,
          })
          .where(eq(assessmentRuns.id, run.id));

        return loadSnapshot(ctx.db, run.id);
      }

      let stageType;
      try {
        stageType = stageTypeForIndex(stageIndex);
      } catch {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No more clarification rounds are available.",
        });
      }

      const session = await resolveAssessmentSession(
        ctx.db,
        input.scenarioId,
        input.assessmentSessionId ?? undefined,
      );

      await ctx.db
        .update(assessmentRuns)
        .set({
          status: "processing",
          pendingSegmentTranscript: input.segmentTranscript,
          lastError: null,
          assessmentSessionId: session?.id ?? run.assessmentSessionId,
          joinCode: session?.joinCode ?? run.joinCode,
        })
        .where(eq(assessmentRuns.id, run.id));

      const evaluationContext = await loadScenarioEvaluationContext(
        ctx.db,
        input.scenarioId,
      );

      if (!evaluationContext) {
        await ctx.db
          .update(assessmentRuns)
          .set({
            status: statusAfterFailedSubmit(run.stageCount),
            lastError: `No answer key found for scenario "${input.scenarioId}".`,
          })
          .where(eq(assessmentRuns.id, run.id));

        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No answer key found for scenario "${input.scenarioId}".`,
        });
      }

      const conversation = conversationFromStages([
        ...stages.map((stage) => ({
          stageType: stageTypeForIndex(stage.stageIndex),
          segmentTranscript: stage.segmentTranscript ?? stage.transcript,
          selectedFollowUpQuestions: asSelectedFollowUpQuestions(
            stage.selectedFollowUpQuestions,
          ),
        })),
        {
          stageType,
          segmentTranscript: input.segmentTranscript,
          selectedFollowUpQuestions: [],
        },
      ]);

      const cumulativeTranscript = buildCumulativeTranscript([
        ...stages.map((stage) => ({
          segmentTranscript: stage.segmentTranscript ?? stage.transcript,
        })),
        { segmentTranscript: input.segmentTranscript },
      ]);

      const followUpBudget = maxFollowUpQuestionsAfterStage(stageType);

      let feedback;
      try {
        feedback = await evaluateSafetyTalk({
          transcript: cumulativeTranscript,
          answerKey: evaluationContext.answerKey,
          personas: evaluationContext.personas,
          conversation,
          followUpBudget,
        });
      } catch (error) {
        const message =
          error instanceof SafetyTalkEvaluationError
            ? error.message
            : "Failed to evaluate the safety talk. Please try again.";

        await ctx.db
          .update(assessmentRuns)
          .set({
            status: statusAfterFailedSubmit(run.stageCount),
            lastError: message,
          })
          .where(eq(assessmentRuns.id, run.id));

        if (error instanceof SafetyTalkEvaluationError) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
            cause: error.cause,
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message,
        });
      }

      const previouslyShown = stages.flatMap((stage) =>
        asSelectedFollowUpQuestions(stage.selectedFollowUpQuestions),
      );

      let selectedQuestions: SelectedFollowUpQuestion[] = [];
      try {
        selectedQuestions = selectFollowUpQuestions(
          feedback.personaFeedback ?? [],
          evaluationContext.personas,
          { previouslyShown, max: followUpBudget },
        );
      } catch (error) {
        console.error("Follow-up question selection failed:", error);
        selectedQuestions = [];
      }

      const next = nextStatusAfterEvaluation({
        succeededStageCount: run.stageCount + 1,
        selectedQuestionCount: selectedQuestions.length,
      });
      const autoComplete = shouldAutoCompleteAfterEvaluation(
        next.status,
        next.completionReason,
      );

      try {
        await ctx.db.transaction(async (tx) => {
          const [attempt] = await tx
            .insert(assessmentAttempts)
            .values({
              anonymousParticipantId: input.anonymousParticipantId,
              scenarioId: input.scenarioId,
              assessmentSessionId: session?.id ?? run.assessmentSessionId,
              runId: run.id,
              joinCode: session?.joinCode ?? run.joinCode,
              stageType,
              stageIndex,
              segmentTranscript: input.segmentTranscript,
              transcript: cumulativeTranscript,
              overallStars: feedback.overallStars,
              overallSummary: feedback.overallSummary,
              criteriaRatings: feedback.criteriaRatings,
              missedItems: feedback.missedItems,
              personaFeedback: feedback.personaFeedback ?? null,
              selectedFollowUpQuestions: selectedQuestions,
              evaluationStatus: "succeeded",
              participantFinishedAfterStage: autoComplete,
            })
            .returning({ id: assessmentAttempts.id });

          if (!attempt) {
            throw new Error("Assessment stage insert did not return an id.");
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

          await tx
            .update(assessmentRuns)
            .set({
              status: autoComplete ? "completed" : next.status,
              stageCount: run.stageCount + 1,
              completionReason: next.completionReason,
              pendingSegmentTranscript: null,
              lastError: null,
              ...(autoComplete ? { completedAt: new Date() } : {}),
            })
            .where(eq(assessmentRuns.id, run.id));
        });
      } catch (error) {
        if (isUniqueViolation(error)) {
          return loadSnapshot(ctx.db, run.id);
        }

        console.error("Failed to persist assessment stage:", error);

        await ctx.db
          .update(assessmentRuns)
          .set({
            status: statusAfterFailedSubmit(run.stageCount),
            lastError:
              "The talk was evaluated, but saving the result failed. Please try again.",
          })
          .where(eq(assessmentRuns.id, run.id));

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "The talk was evaluated, but saving the result failed. Please try again.",
        });
      }

      return loadSnapshot(ctx.db, run.id);
    }),

  complete: publicProcedure
    .input(completeInput)
    .mutation(async ({ ctx, input }) => {
      const run = await ctx.db.query.assessmentRuns.findFirst({
        where: eq(assessmentRuns.id, input.runId),
      });

      if (!run) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Assessment not found.",
        });
      }

      await assertRunOwner(run, input);

      if (run.status === "completed") {
        return loadSnapshot(ctx.db, run.id);
      }

      if (!canCompleteRun(parseRunStatus(run.status), run.stageCount)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Finish the current response before submitting the assessment.",
        });
      }

      const stages = await loadStages(ctx.db, run.id);
      const latest = stages[stages.length - 1];
      const reason = completionReasonForFinish({
        status: parseRunStatus(run.status),
        existingReason: run.completionReason as
          | "early_finish"
          | "no_followups"
          | "max_rounds"
          | "legacy_single_shot"
          | null,
      });

      await ctx.db.transaction(async (tx) => {
        const [updated] = await tx
          .update(assessmentRuns)
          .set({
            status: "completed",
            completionReason: reason,
            pendingSegmentTranscript: null,
            lastError: null,
            completedAt: new Date(),
          })
          .where(
            and(
              eq(assessmentRuns.id, run.id),
              ne(assessmentRuns.status, "completed"),
            ),
          )
          .returning({ id: assessmentRuns.id });

        if (!updated) {
          return;
        }

        if (latest) {
          await tx
            .update(assessmentAttempts)
            .set({ participantFinishedAfterStage: true })
            .where(eq(assessmentAttempts.id, latest.id));
        }
      });

      return loadSnapshot(ctx.db, run.id);
    }),

  getCompletion: publicProcedure
    .input(completeInput)
    .query(async ({ ctx, input }) => {
      const run = await ctx.db.query.assessmentRuns.findFirst({
        where: eq(assessmentRuns.id, input.runId),
      });

      if (!run) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Assessment not found.",
        });
      }

      await assertRunOwner(run, input);

      if (run.status !== "completed") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This assessment is not complete yet.",
        });
      }

      const snapshot = await loadSnapshot(ctx.db, run.id);
      const progression = buildAssessmentProgression(snapshot);

      return {
        snapshot,
        progression,
        summary: toParticipantCompletionSummary(progression),
      };
    }),
});
