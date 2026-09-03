/**
 * Scenario CRUD plus public get-by-id for the assessment page.
 * Create/update are login-protected and org-scoped (site admins see all).
 */
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, or } from "drizzle-orm";
import { z } from "zod";

import { isSiteAdmin } from "~/lib/roles";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import type { createTRPCContext } from "~/server/api/trpc";
import {
  personas,
  scenarioHazards,
  scenarioPersonas,
  scenarios,
} from "~/server/db/schema";
import { ensureAppSeeded } from "~/server/db/seed-construction-demo";
import { ensurePersonasSeeded } from "~/server/db/seed-personas";
import {
  ENGLISH_LITERACY_VALUES,
  EXPERIENCE_LEVEL_VALUES,
  JOB_ROLE_VALUES,
  PERSONA_AVATAR_COLORS,
  PROJECT_EXPERIENCE_VALUES,
  derivePersonaInitials,
} from "~/types/persona";

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

const avatarColorValues = PERSONA_AVATAR_COLORS.map((color) => color.value) as [
  (typeof PERSONA_AVATAR_COLORS)[number]["value"],
  ...(typeof PERSONA_AVATAR_COLORS)[number]["value"][],
];

const personaWritableSchema = z.object({
  name: z.string().trim().min(1, "Persona name is required").max(256),
  roleDescription: z
    .string()
    .trim()
    .min(1, "Role / description is required"),
  evaluationInstructions: z
    .string()
    .trim()
    .min(1, "Evaluation instructions are required"),
  initials: z
    .string()
    .trim()
    .max(8)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  avatarColor: z.enum(avatarColorValues).optional(),
  experienceLevel: z.enum(EXPERIENCE_LEVEL_VALUES),
  jobRole: z.enum(JOB_ROLE_VALUES),
  jobRoleOther: z
    .string()
    .trim()
    .max(128)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  englishLiteracy: z.enum(ENGLISH_LITERACY_VALUES),
  projectExperience: z.enum(PROJECT_EXPERIENCE_VALUES),
});

function refineJobRoleOther(
  value: { jobRole: string; jobRoleOther?: string },
  ctx: z.RefinementCtx,
) {
  if (value.jobRole === "other" && !value.jobRoleOther) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Enter a job / role",
      path: ["jobRoleOther"],
    });
  }
}

const createPersonaInputSchema = personaWritableSchema
  .extend({
    organizationId: z.string().min(1).optional(),
  })
  .superRefine(refineJobRoleOther);

const updatePersonaInputSchema = personaWritableSchema
  .extend({
    id: z.string().min(1),
  })
  .superRefine(refineJobRoleOther);

function personaCharacteristicValues(
  input: z.infer<typeof createPersonaInputSchema> | z.infer<typeof updatePersonaInputSchema>,
) {
  return {
    experienceLevel: input.experienceLevel,
    jobRole: input.jobRole,
    jobRoleOther:
      input.jobRole === "other" ? (input.jobRoleOther ?? null) : null,
    englishLiteracy: input.englishLiteracy,
    projectExperience: input.projectExperience,
  };
}

function requireOrganizationId(organizationId: string | null | undefined) {
  if (!organizationId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "Your account is not assigned to an organization. Ask an admin to link your user before managing scenarios.",
    });
  }

  return organizationId;
}

/** Premade (global) personas plus custom personas for the given org. */
function personasAvailableToOrganization(organizationId: string | null) {
  if (!organizationId) {
    return eq(personas.isCustom, false);
  }

  return or(
    eq(personas.isCustom, false),
    and(
      eq(personas.isCustom, true),
      eq(personas.organizationId, organizationId),
    ),
  );
}

async function validatePersonaIds(
  ctx: ScenarioRouterContext,
  personaIds: string[],
  organizationId: string | null,
) {
  await ensurePersonasSeeded();

  const availablePersonas = await ctx.db.query.personas.findMany({
    where: personasAvailableToOrganization(organizationId),
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
      message: `Unknown or unavailable persona IDs: ${invalidPersonaIds.join(", ")}`,
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
  /**
   * Managers see scenarios for their organization.
   * Admins see all scenarios (including any not yet assigned to an org).
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    await ensureAppSeeded();

    const admin = isSiteAdmin(ctx.session.user.role);
    if (!admin) {
      requireOrganizationId(ctx.session.user.organizationId);
    }

    return ctx.db.query.scenarios.findMany({
      where: admin
        ? undefined
        : eq(scenarios.organizationId, ctx.session.user.organizationId!),
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

  listPersonas: protectedProcedure
    .input(
      z
        .object({
          organizationId: z.string().min(1).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      await ensurePersonasSeeded();

      const admin = isSiteAdmin(ctx.session.user.role);
      const organizationId = admin
        ? (input?.organizationId ?? ctx.session.user.organizationId ?? null)
        : (ctx.session.user.organizationId ?? null);

      return ctx.db.query.personas.findMany({
        where: personasAvailableToOrganization(organizationId),
        orderBy: [asc(personas.isCustom), asc(personas.name)],
      });
    }),

  /**
   * Create an org-scoped custom persona for use in scenario building.
   * Premade catalog personas remain global (organizationId null, isCustom false).
   */
  createPersona: protectedProcedure
    .input(createPersonaInputSchema)
    .mutation(async ({ ctx, input }) => {
      const admin = isSiteAdmin(ctx.session.user.role);
      const organizationId = requireOrganizationId(
        admin
          ? (input.organizationId ?? ctx.session.user.organizationId)
          : ctx.session.user.organizationId,
      );

      const initials =
        input.initials?.toUpperCase() ?? derivePersonaInitials(input.name);
      const avatarColor =
        input.avatarColor ?? PERSONA_AVATAR_COLORS[0].value;

      const [createdPersona] = await ctx.db
        .insert(personas)
        .values({
          id: crypto.randomUUID(),
          organizationId,
          isCustom: true,
          name: input.name,
          roleDescription: input.roleDescription,
          evaluationInstructions: input.evaluationInstructions,
          initials,
          avatarColor,
          imagePath: null,
          ...personaCharacteristicValues(input),
        })
        .returning();

      if (!createdPersona) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create persona",
        });
      }

      return createdPersona;
    }),

  /** Update an org-scoped custom persona. Premade catalog personas stay read-only. */
  updatePersona: protectedProcedure
    .input(updatePersonaInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existingPersona = await ctx.db.query.personas.findFirst({
        where: eq(personas.id, input.id),
      });

      if (!existingPersona) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Persona not found",
        });
      }

      if (!existingPersona.isCustom) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Premade personas cannot be edited.",
        });
      }

      const admin = isSiteAdmin(ctx.session.user.role);
      if (
        !admin &&
        existingPersona.organizationId !== ctx.session.user.organizationId
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only edit personas for your organization.",
        });
      }

      const initials =
        input.initials?.toUpperCase() ?? derivePersonaInitials(input.name);
      const avatarColor =
        input.avatarColor ?? existingPersona.avatarColor;

      const [updatedPersona] = await ctx.db
        .update(personas)
        .set({
          name: input.name,
          roleDescription: input.roleDescription,
          evaluationInstructions: input.evaluationInstructions,
          initials,
          avatarColor,
          ...personaCharacteristicValues(input),
        })
        .where(eq(personas.id, input.id))
        .returning();

      if (!updatedPersona) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update persona",
        });
      }

      return updatedPersona;
    }),

  /** Public: assessment takers open scenarios by share link without login. */
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await ensureAppSeeded();

      const scenario = await ctx.db.query.scenarios.findFirst({
        where: (scenarioTable, { eq: equals }) =>
          equals(scenarioTable.id, input.id),
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

  create: protectedProcedure
    .input(scenarioInputSchema)
    .mutation(async ({ ctx, input }) => {
      const organizationId = requireOrganizationId(
        ctx.session.user.organizationId,
      );
      await validatePersonaIds(ctx, input.personaIds, organizationId);

      const [createdScenario] = await ctx.db
        .insert(scenarios)
        .values({
          organizationId,
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

  update: protectedProcedure
    .input(updateScenarioInputSchema)
    .mutation(async ({ ctx, input }) => {
      const admin = isSiteAdmin(ctx.session.user.role);
      const organizationId = admin
        ? ctx.session.user.organizationId
        : requireOrganizationId(ctx.session.user.organizationId);

      const existingScenario = await ctx.db.query.scenarios.findFirst({
        where: admin
          ? eq(scenarios.id, input.id)
          : and(
              eq(scenarios.id, input.id),
              eq(scenarios.organizationId, organizationId!),
            ),
        columns: { id: true, organizationId: true },
      });

      if (!existingScenario) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Scenario not found",
        });
      }

      // Validate against the scenario's org so admins editing another org's
      // scenario can only attach that org's custom personas (+ premade).
      const personaOrgId =
        existingScenario.organizationId ?? organizationId ?? null;
      await validatePersonaIds(ctx, input.personaIds, personaOrgId);

      const [updatedScenario] = await ctx.db
        .update(scenarios)
        .set({
          title: input.title,
          description: input.description,
          imageFileName: input.imageFileName,
          status: input.status,
          // Claim orphaned (pre-auth) scenarios onto the admin's org when edited.
          ...(admin &&
          !existingScenario.organizationId &&
          organizationId
            ? { organizationId }
            : {}),
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
