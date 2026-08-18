import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import {
  generateJoinCode,
  isValidJoinCodeFormat,
  JOIN_CODE_LENGTH,
  normalizeJoinCode,
} from "~/lib/join-code";
import { isSiteAdmin } from "~/lib/roles";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { db } from "~/server/db";
import { assessmentSessions, scenarios } from "~/server/db/schema";

const scenarioIdInput = z.object({
  scenarioId: z.string().uuid(),
});

const joinCodeInput = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Join code is required")
    .transform(normalizeJoinCode)
    .refine(
      (code) => code.length === JOIN_CODE_LENGTH && isValidJoinCodeFormat(code),
      `Enter a ${JOIN_CODE_LENGTH}-character join code`,
    ),
});

async function assertCanManageScenario(
  ctx: {
    db: typeof db;
    session: {
      user: { id: string; role: string; organizationId: string | null };
    };
  },
  scenarioId: string,
) {
  const admin = isSiteAdmin(ctx.session.user.role);
  const scenario = await ctx.db.query.scenarios.findFirst({
    where: eq(scenarios.id, scenarioId),
    columns: { id: true, organizationId: true, title: true },
  });

  if (!scenario) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Scenario not found",
    });
  }

  if (!admin && scenario.organizationId !== ctx.session.user.organizationId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have access to this scenario",
    });
  }

  return scenario;
}

async function createUniqueJoinCode(maxAttempts = 8): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const joinCode = generateJoinCode();
    const existing = await db.query.assessmentSessions.findFirst({
      where: eq(assessmentSessions.joinCode, joinCode),
      columns: { id: true },
    });
    if (!existing) {
      return joinCode;
    }
  }

  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Could not generate a unique join code. Try again.",
  });
}

export const assessmentSessionRouter = createTRPCRouter({
  /** Managers: current active join code for a scenario, if any. */
  getActiveForScenario: protectedProcedure
    .input(scenarioIdInput)
    .query(async ({ ctx, input }) => {
      await assertCanManageScenario(ctx, input.scenarioId);

      const session = await ctx.db.query.assessmentSessions.findFirst({
        where: and(
          eq(assessmentSessions.scenarioId, input.scenarioId),
          eq(assessmentSessions.status, "active"),
        ),
        orderBy: [desc(assessmentSessions.createdAt)],
      });

      return session ?? null;
    }),

  /**
   * Managers: create a new active join code for a scenario.
   * Closes any previous active sessions for that scenario.
   */
  generateForScenario: protectedProcedure
    .input(scenarioIdInput)
    .mutation(async ({ ctx, input }) => {
      await assertCanManageScenario(ctx, input.scenarioId);

      await ctx.db
        .update(assessmentSessions)
        .set({ status: "closed" })
        .where(
          and(
            eq(assessmentSessions.scenarioId, input.scenarioId),
            eq(assessmentSessions.status, "active"),
          ),
        );

      const joinCode = await createUniqueJoinCode();

      const [created] = await ctx.db
        .insert(assessmentSessions)
        .values({
          scenarioId: input.scenarioId,
          joinCode,
          status: "active",
          createdByUserId: ctx.session.user.id,
        })
        .returning();

      if (!created) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create assessment session",
        });
      }

      return created;
    }),

  /**
   * Public: resolve a join code to its scenario (no Cognito / login required).
   */
  resolveByCode: publicProcedure
    .input(joinCodeInput)
    .query(async ({ ctx, input }) => {
      const session = await ctx.db.query.assessmentSessions.findFirst({
        where: and(
          eq(assessmentSessions.joinCode, input.code),
          eq(assessmentSessions.status, "active"),
        ),
        with: {
          scenario: {
            columns: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
      });

      if (!session?.scenario) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid or expired join code",
        });
      }

      return {
        sessionId: session.id,
        joinCode: session.joinCode,
        scenarioId: session.scenario.id,
        scenarioTitle: session.scenario.title,
      };
    }),
});
