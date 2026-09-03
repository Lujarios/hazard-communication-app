/**
 * Org-scoped (and site-admin platform) aggregates over assessment attempts.
 */
import { TRPCError } from "@trpc/server";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { isSiteAdmin } from "~/lib/roles";
import { getRubricCriterion } from "~/lib/safety-rubric";
import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import type { createTRPCContext } from "~/server/api/trpc";
import {
  assessmentAttempts,
  organizations,
  scenarioHazards,
  scenarios,
} from "~/server/db/schema";
import type {
  CriterionRating,
  MissedItem,
  MissedItemCategory,
  MissedItemSeverity,
} from "~/types/feedback";

type AnalyticsContext = Awaited<ReturnType<typeof createTRPCContext>> & {
  session: {
    user: { id: string; role: string; organizationId: string | null };
  };
};

function requireOrganizationId(organizationId: string | null | undefined) {
  if (!organizationId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "Your account is not assigned to an organization. Ask an admin to link your user before viewing analytics.",
    });
  }

  return organizationId;
}

async function listAccessibleScenarios(
  ctx: AnalyticsContext,
  organizationIdFilter?: string | null,
) {
  const admin = isSiteAdmin(ctx.session.user.role);
  if (!admin) {
    requireOrganizationId(ctx.session.user.organizationId);
  }

  if (organizationIdFilter && !admin) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only Site Admins can filter analytics by organization",
    });
  }

  const where = admin
    ? organizationIdFilter
      ? eq(scenarios.organizationId, organizationIdFilter)
      : undefined
    : eq(scenarios.organizationId, ctx.session.user.organizationId!);

  return ctx.db.query.scenarios.findMany({
    where,
    columns: {
      id: true,
      title: true,
      status: true,
      organizationId: true,
    },
    orderBy: [desc(scenarios.updatedAt), desc(scenarios.createdAt)],
  });
}

async function assertCanViewScenario(ctx: AnalyticsContext, scenarioId: string) {
  const admin = isSiteAdmin(ctx.session.user.role);
  const scenario = await ctx.db.query.scenarios.findFirst({
    where: eq(scenarios.id, scenarioId),
    columns: { id: true, title: true, status: true, organizationId: true },
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

function asCriterionRatings(value: unknown): CriterionRating[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is CriterionRating => {
    if (!item || typeof item !== "object") {
      return false;
    }
    const row = item as Partial<CriterionRating>;
    return (
      typeof row.criterionId === "string" &&
      typeof row.stars === "number" &&
      row.stars >= 1 &&
      row.stars <= 5
    );
  });
}

function asMissedItems(value: unknown): MissedItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const categories = new Set<MissedItemCategory>([
    "hazard",
    "control",
    "communication",
    "procedure",
    "engagement",
  ]);
  const severities = new Set<MissedItemSeverity>(["high", "medium", "info"]);

  return value.filter((item): item is MissedItem => {
    if (!item || typeof item !== "object") {
      return false;
    }
    const row = item as Partial<MissedItem>;
    return (
      typeof row.description === "string" &&
      typeof row.category === "string" &&
      categories.has(row.category) &&
      typeof row.severity === "string" &&
      severities.has(row.severity)
    );
  });
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  return round1(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function clampStarBucket(stars: number): 1 | 2 | 3 | 4 | 5 {
  const rounded = Math.round(stars);
  if (rounded <= 1) return 1;
  if (rounded >= 5) return 5;
  return rounded as 2 | 3 | 4;
}

type AttemptSummaryRow = {
  anonymousParticipantId: string;
  overallStars: number;
};

type AttemptRow = AttemptSummaryRow & {
  criteriaRatings: unknown;
  missedItems: unknown;
  createdAt: Date;
};

function latestStagePerRun<
  T extends {
    id: string;
    runId: string | null;
    stageIndex: number;
    createdAt: Date;
  },
>(rows: T[]): T[] {
  const byRun = new Map<string, T>();

  for (const row of rows) {
    const key = row.runId ?? row.id;
    const existing = byRun.get(key);
    if (
      !existing ||
      row.stageIndex > existing.stageIndex ||
      (row.stageIndex === existing.stageIndex &&
        row.createdAt.getTime() > existing.createdAt.getTime())
    ) {
      byRun.set(key, row);
    }
  }

  return [...byRun.values()];
}

function summarizeAttempts(attempts: AttemptSummaryRow[]) {
  const attemptCount = attempts.length;
  const uniqueParticipants = new Set(
    attempts.map((attempt) => attempt.anonymousParticipantId),
  ).size;
  const averageOverallStars = average(
    attempts.map((attempt) => attempt.overallStars),
  );

  return { attemptCount, uniqueParticipants, averageOverallStars };
}

function buildScoreDistribution(attempts: AttemptRow[]) {
  const counts: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  for (const attempt of attempts) {
    counts[clampStarBucket(attempt.overallStars)] += 1;
  }

  return ([1, 2, 3, 4, 5] as const).map((stars) => ({
    stars,
    count: counts[stars],
  }));
}

function buildCriteriaAverages(attempts: AttemptRow[]) {
  const totals = new Map<string, { sum: number; count: number }>();

  for (const attempt of attempts) {
    for (const rating of asCriterionRatings(attempt.criteriaRatings)) {
      const current = totals.get(rating.criterionId) ?? { sum: 0, count: 0 };
      current.sum += rating.stars;
      current.count += 1;
      totals.set(rating.criterionId, current);
    }
  }

  return [...totals.entries()]
    .map(([criterionId, { sum, count }]) => ({
      criterionId,
      label: getRubricCriterion(criterionId)?.label ?? criterionId,
      averageStars: round1(sum / count),
      ratingCount: count,
    }))
    .sort((a, b) => a.averageStars - b.averageStars);
}

function buildImprovement(attempts: AttemptRow[]) {
  const byParticipant = new Map<string, AttemptRow[]>();

  for (const attempt of attempts) {
    const list = byParticipant.get(attempt.anonymousParticipantId) ?? [];
    list.push(attempt);
    byParticipant.set(attempt.anonymousParticipantId, list);
  }

  const samples: Array<{
    label: string;
    attemptCount: number;
    firstStars: number;
    latestStars: number;
    delta: number;
  }> = [];

  let improvedCount = 0;
  let declinedCount = 0;
  let unchangedCount = 0;
  const deltas: number[] = [];

  let index = 0;
  for (const participantAttempts of byParticipant.values()) {
    if (participantAttempts.length < 2) {
      continue;
    }

    const ordered = [...participantAttempts].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );
    const first = ordered[0]!;
    const latest = ordered[ordered.length - 1]!;
    const delta = latest.overallStars - first.overallStars;

    deltas.push(delta);
    if (delta > 0) improvedCount += 1;
    else if (delta < 0) declinedCount += 1;
    else unchangedCount += 1;

    index += 1;
    samples.push({
      label: `Participant ${index}`,
      attemptCount: ordered.length,
      firstStars: first.overallStars,
      latestStars: latest.overallStars,
      delta,
    });
  }

  samples.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  return {
    repeatParticipantCount: samples.length,
    improvedCount,
    declinedCount,
    unchangedCount,
    averageDelta: average(deltas),
    samples: samples.slice(0, 20),
  };
}

async function buildTopMissed(
  ctx: AnalyticsContext,
  scenarioId: string,
  attempts: AttemptRow[],
) {
  const hazards = await ctx.db.query.scenarioHazards.findMany({
    where: eq(scenarioHazards.scenarioId, scenarioId),
    columns: { id: true, hazardTitle: true },
  });
  const hazardTitleById = new Map(
    hazards.map((hazard) => [hazard.id, hazard.hazardTitle]),
  );

  const aggregates = new Map<
    string,
    {
      label: string;
      category: MissedItemCategory;
      count: number;
      highSeverityCount: number;
    }
  >();

  for (const attempt of attempts) {
    for (const item of asMissedItems(attempt.missedItems)) {
      const hazardTitle = item.relatedHazardId
        ? hazardTitleById.get(item.relatedHazardId)
        : undefined;
      const key = hazardTitle
        ? `hazard:${item.relatedHazardId}`
        : `text:${item.category}:${item.description.trim().toLowerCase()}`;
      const label = hazardTitle ?? item.description.trim();
      if (!label) {
        continue;
      }

      const current = aggregates.get(key) ?? {
        label,
        category: item.category,
        count: 0,
        highSeverityCount: 0,
      };
      current.count += 1;
      if (item.severity === "high") {
        current.highSeverityCount += 1;
      }
      aggregates.set(key, current);
    }
  }

  return [...aggregates.values()]
    .sort((a, b) => b.count - a.count || b.highSeverityCount - a.highSeverityCount)
    .slice(0, 10);
}

export const analyticsRouter = createTRPCRouter({
  /**
   * Org-scoped scenario list with aggregate attempt stats (no PII).
   * Site Admins see all scenarios (optional org filter); managers see their org only.
   */
  overview: protectedProcedure
    .input(
      z
        .object({
          organizationId: z.string().min(1).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const organizationIdFilter = input?.organizationId;
      const accessible = await listAccessibleScenarios(
        ctx,
        organizationIdFilter,
      );
      if (accessible.length === 0) {
        return {
          scenarios: [],
          totals: {
            attemptCount: 0,
            uniqueParticipants: 0,
            averageOverallStars: null as number | null,
          },
        };
      }

      const orgIds = [
        ...new Set(
          accessible
            .map((scenario) => scenario.organizationId)
            .filter((id): id is string => Boolean(id)),
        ),
      ];
      const orgRows =
        orgIds.length > 0
          ? await ctx.db.query.organizations.findMany({
              where: inArray(organizations.id, orgIds),
              columns: { id: true, name: true },
            })
          : [];
      const orgNameById = new Map(orgRows.map((org) => [org.id, org.name]));

      const scenarioIds = accessible.map((scenario) => scenario.id);
      const attempts = await ctx.db.query.assessmentAttempts.findMany({
        where: inArray(assessmentAttempts.scenarioId, scenarioIds),
        columns: {
          id: true,
          runId: true,
          stageIndex: true,
          scenarioId: true,
          anonymousParticipantId: true,
          overallStars: true,
          createdAt: true,
        },
      });
      const runRows = latestStagePerRun(attempts);

      const byScenario = new Map<string, typeof runRows>();
      for (const attempt of runRows) {
        const list = byScenario.get(attempt.scenarioId) ?? [];
        list.push(attempt);
        byScenario.set(attempt.scenarioId, list);
      }

      const allParticipantIds = new Set(
        runRows.map((attempt) => attempt.anonymousParticipantId),
      );

      return {
        scenarios: accessible.map((scenario) => {
          const scenarioAttempts = byScenario.get(scenario.id) ?? [];
          return {
            id: scenario.id,
            title: scenario.title,
            status: scenario.status,
            organizationId: scenario.organizationId,
            organizationName: scenario.organizationId
              ? (orgNameById.get(scenario.organizationId) ?? "Unknown org")
              : "Unassigned",
            ...summarizeAttempts(scenarioAttempts),
          };
        }),
        totals: {
          attemptCount: runRows.length,
          uniqueParticipants: allParticipantIds.size,
          averageOverallStars: average(
            runRows.map((attempt) => attempt.overallStars),
          ),
        },
      };
    }),

  /**
   * Detailed anonymous analytics for one scenario the manager can access.
   */
  scenarioDetail: protectedProcedure
    .input(z.object({ scenarioId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const scenario = await assertCanViewScenario(ctx, input.scenarioId);

      const attempts = latestStagePerRun(
        await ctx.db.query.assessmentAttempts.findMany({
          where: eq(assessmentAttempts.scenarioId, input.scenarioId),
          columns: {
            id: true,
            runId: true,
            stageIndex: true,
            anonymousParticipantId: true,
            overallStars: true,
            criteriaRatings: true,
            missedItems: true,
            createdAt: true,
          },
          orderBy: [asc(assessmentAttempts.createdAt)],
        }),
      );

      return {
        scenario: {
          id: scenario.id,
          title: scenario.title,
          status: scenario.status,
        },
        summary: summarizeAttempts(attempts),
        scoreDistribution: buildScoreDistribution(attempts),
        criteriaAverages: buildCriteriaAverages(attempts),
        improvement: buildImprovement(attempts),
        topMissed: await buildTopMissed(ctx, input.scenarioId, attempts),
      };
    }),
});
