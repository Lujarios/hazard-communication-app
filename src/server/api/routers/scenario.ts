import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { ensurePersonasSeeded } from "~/server/db/seed-personas";
import {
  scenarioHazards,
  scenarioPersonas,
  scenarios,
} from "~/server/db/schema";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const hazardInputSchema = z.object({
  hazardTitle: z.string().trim().min(1, "Hazard title is required"),
  hazardDescription: z.string().trim().min(1, "Hazard description is required"),
  controlDescription: z
    .string()
    .trim()
    .min(1, "Control description is required"),
  locationNote: z.string().trim().optional(),
});

const createScenarioInputSchema = z.object({
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

export const scenarioRouter = createTRPCRouter({
  listPersonas: publicProcedure.query(async ({ ctx }) => {
    await ensurePersonasSeeded();

    return ctx.db.query.personas.findMany({
      orderBy: (personaTable, { asc }) => [asc(personaTable.name)],
    });
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
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
    .input(createScenarioInputSchema)
    .mutation(async ({ ctx, input }) => {
      await ensurePersonasSeeded();

      const availablePersonas = await ctx.db.query.personas.findMany({
        columns: { id: true },
      });
      const availablePersonaIds = new Set(
        availablePersonas.map((persona) => persona.id),
      );
      const invalidPersonaIds = input.personaIds.filter(
        (personaId) => !availablePersonaIds.has(personaId),
      );

      if (invalidPersonaIds.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Unknown persona IDs: ${invalidPersonaIds.join(", ")}`,
        });
      }

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

      await ctx.db.insert(scenarioHazards).values(
        input.hazards.map((hazard, index) => ({
          scenarioId: createdScenario.id,
          hazardTitle: hazard.hazardTitle,
          hazardDescription: hazard.hazardDescription,
          controlDescription: hazard.controlDescription,
          locationNote: hazard.locationNote ?? null,
          sortOrder: index,
        })),
      );

      await ctx.db.insert(scenarioPersonas).values(
        input.personaIds.map((personaId) => ({
          scenarioId: createdScenario.id,
          personaId,
        })),
      );

      return createdScenario;
    }),
});
