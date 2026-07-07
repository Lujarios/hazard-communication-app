import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import type { createTRPCContext } from "~/server/api/trpc";
import {
  scenarioHazards,
  scenarioPersonas,
  scenarios,
} from "~/server/db/schema";
import { ensureAppSeeded } from "~/server/db/seed-construction-demo";
import { ensurePersonasSeeded } from "~/server/db/seed-personas";

type ScenarioRouterContext = Awaited<ReturnType<typeof createTRPCContext>>;

const hazardInputSchema = z.object({
  hazardTitle: z.string().trim().min(1, "Hazard title is required"),
  hazardDescription: z.string().trim().min(1, "Hazard description is required"),
  controlDescription: z
    .string()
    .trim()
    .min(1, "Control description is required"),
  locationNote: z.string().trim().optional(),
});

const scenarioInputSchema = z.object({
  title: z.string().trim().min(1, "Scenario title is required"),
  description: z.string().trim().min(1, "Scenario description is required"),
  imageFileName: z.string().trim().min(1, "Image filename is required"),
  status: z.enum(["draft", "ready"]).default("ready"),
  hazards: z
    .array(hazardInputSchema)
    .min(1, "Add at least one hazard and control"),
  personaIds: z
    .array(z.string().min(1))
    .min(1, "Select at least one AI persona"),
});

const updateScenarioInputSchema = scenarioInputSchema.extend({
  id: z.string().uuid(),
});

async function validatePersonaIds(
  ctx: ScenarioRouterContext,
  personaIds: string[],
) {
  await ensurePersonasSeeded();

  const availablePersonas = await ctx.db.query.personas.findMany({
    columns: { id: true },
  });
  const availablePersonaIds = new Set(
    availablePersonas.map((persona) => persona.id),
  );
  const invalidPersonaIds = personaIds.filter(
    (personaId) => !availablePersonaIds.has(personaId),
  );

  if (invalidPersonaIds.length > 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Unknown persona IDs: ${invalidPersonaIds.join(", ")}`,
    });
  }
}

async function saveScenarioRelations(
  ctx: ScenarioRouterContext,
  scenarioId: string,
  input: z.infer<typeof scenarioInputSchema>,
) {
  await ctx.db
    .delete(scenarioHazards)
    .where(eq(scenarioHazards.scenarioId, scenarioId));
  await ctx.db
    .delete(scenarioPersonas)
    .where(eq(scenarioPersonas.scenarioId, scenarioId));

  await ctx.db.insert(scenarioHazards).values(
    input.hazards.map((hazard, index) => ({
      scenarioId,
      hazardTitle: hazard.hazardTitle,
      hazardDescription: hazard.hazardDescription,
      controlDescription: hazard.controlDescription,
      locationNote: hazard.locationNote ?? null,
      sortOrder: index,
    })),
  );

  await ctx.db.insert(scenarioPersonas).values(
    input.personaIds.map((personaId) => ({
      scenarioId,
      personaId,
    })),
  );
}

export const scenarioRouter = createTRPCRouter({
  list: publicProcedure.query(async ({ ctx }) => {
    await ensureAppSeeded();

    return ctx.db.query.scenarios.findMany({
      orderBy: [desc(scenarios.updatedAt), desc(scenarios.createdAt)],
      with: {
        hazards: {
          columns: { id: true },
        },
        scenarioPersonas: {
          columns: { personaId: true },
        },
      },
    });
  }),

  listPersonas: publicProcedure.query(async ({ ctx }) => {
    await ensurePersonasSeeded();

    return ctx.db.query.personas.findMany({
      orderBy: (personaTable, { asc }) => [asc(personaTable.name)],
    });
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await ensureAppSeeded();

      const scenario = await ctx.db.query.scenarios.findFirst({
        where: (scenarioTable, { eq }) => eq(scenarioTable.id, input.id),
        with: {
          hazards: {
            orderBy: (hazardTable, { asc }) => [asc(hazardTable.sortOrder)],
          },
          scenarioPersonas: {
            with: {
              persona: true,
            },
          },
        },
      });

      if (!scenario) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Scenario not found",
        });
      }

      return scenario;
    }),

  create: publicProcedure
    .input(scenarioInputSchema)
    .mutation(async ({ ctx, input }) => {
      await validatePersonaIds(ctx, input.personaIds);

      const [createdScenario] = await ctx.db
        .insert(scenarios)
        .values({
          title: input.title,
          description: input.description,
          imageFileName: input.imageFileName,
          status: input.status,
        })
        .returning();

      if (!createdScenario) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create scenario",
        });
      }

      await saveScenarioRelations(ctx, createdScenario.id, input);

      return createdScenario;
    }),

  update: publicProcedure
    .input(updateScenarioInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existingScenario = await ctx.db.query.scenarios.findFirst({
        where: eq(scenarios.id, input.id),
        columns: { id: true },
      });

      if (!existingScenario) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Scenario not found",
        });
      }

      await validatePersonaIds(ctx, input.personaIds);

      const [updatedScenario] = await ctx.db
        .update(scenarios)
        .set({
          title: input.title,
          description: input.description,
          imageFileName: input.imageFileName,
          status: input.status,
        })
        .where(eq(scenarios.id, input.id))
        .returning();

      if (!updatedScenario) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update scenario",
        });
      }

      await saveScenarioRelations(ctx, updatedScenario.id, input);

      return updatedScenario;
    }),
});
