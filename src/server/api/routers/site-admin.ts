import { TRPCError } from "@trpc/server";
import { asc, count, eq } from "drizzle-orm";
import { z } from "zod";

import { USER_ROLES } from "~/lib/roles";
import { hashPassword } from "~/server/auth/password";
import { createTRPCRouter, siteAdminProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { organizations, scenarios, users } from "~/server/db/schema";

const roleSchema = z.enum(USER_ROLES);

const createOrganizationInput = z.object({
  name: z.string().trim().min(1, "Organization name is required").max(256),
});

const updateOrganizationInput = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, "Organization name is required").max(256),
});

const createUserInput = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(255),
    email: z.string().trim().email("Valid email is required").max(255),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: roleSchema,
    organizationId: z.string().min(1).nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.role === "manager" && !value.organizationId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Managers must be assigned to an organization",
        path: ["organizationId"],
      });
    }
  });

const updateUserInput = z
  .object({
    id: z.string().min(1),
    name: z.string().trim().min(1, "Name is required").max(255),
    role: roleSchema,
    organizationId: z.string().min(1).nullable(),
    password: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.role === "manager" && !value.organizationId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Managers must be assigned to an organization",
        path: ["organizationId"],
      });
    }
    if (value.password && value.password.length > 0 && value.password.length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password must be at least 8 characters",
        path: ["password"],
      });
    }
  });

async function assertOrganizationExists(
  database: typeof db,
  organizationId: string | null,
) {
  if (!organizationId) {
    return;
  }

  const org = await database.query.organizations.findFirst({
    where: eq(organizations.id, organizationId),
    columns: { id: true },
  });

  if (!org) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Organization not found",
    });
  }
}

export const siteAdminRouter = createTRPCRouter({
  listOrganizations: siteAdminProcedure.query(async ({ ctx }) => {
    const orgs = await ctx.db.query.organizations.findMany({
      orderBy: [asc(organizations.name)],
      columns: {
        id: true,
        name: true,
        createdAt: true,
      },
    });

    const userCounts = await ctx.db
      .select({
        organizationId: users.organizationId,
        value: count(),
      })
      .from(users)
      .groupBy(users.organizationId);

    const scenarioCounts = await ctx.db
      .select({
        organizationId: scenarios.organizationId,
        value: count(),
      })
      .from(scenarios)
      .groupBy(scenarios.organizationId);

    const userCountByOrg = new Map(
      userCounts
        .filter((row) => row.organizationId)
        .map((row) => [row.organizationId!, row.value]),
    );
    const scenarioCountByOrg = new Map(
      scenarioCounts
        .filter((row) => row.organizationId)
        .map((row) => [row.organizationId!, row.value]),
    );

    return orgs.map((org) => ({
      ...org,
      userCount: userCountByOrg.get(org.id) ?? 0,
      scenarioCount: scenarioCountByOrg.get(org.id) ?? 0,
    }));
  }),

  createOrganization: siteAdminProcedure
    .input(createOrganizationInput)
    .mutation(async ({ ctx, input }) => {
      const [created] = await ctx.db
        .insert(organizations)
        .values({ name: input.name })
        .returning({
          id: organizations.id,
          name: organizations.name,
          createdAt: organizations.createdAt,
        });

      if (!created) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create organization",
        });
      }

      return created;
    }),

  updateOrganization: siteAdminProcedure
    .input(updateOrganizationInput)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.organizations.findFirst({
        where: eq(organizations.id, input.id),
        columns: { id: true },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization not found",
        });
      }

      const [updated] = await ctx.db
        .update(organizations)
        .set({ name: input.name })
        .where(eq(organizations.id, input.id))
        .returning({
          id: organizations.id,
          name: organizations.name,
          createdAt: organizations.createdAt,
        });

      if (!updated) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update organization",
        });
      }

      return updated;
    }),

  listUsers: siteAdminProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.query.users.findMany({
      orderBy: [asc(users.email)],
      columns: {
        id: true,
        name: true,
        email: true,
        role: true,
        organizationId: true,
      },
      with: {
        organization: {
          columns: { id: true, name: true },
        },
      },
    });

    return rows.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      organizationName: user.organization?.name ?? null,
    }));
  }),

  createUser: siteAdminProcedure
    .input(createUserInput)
    .mutation(async ({ ctx, input }) => {
      const email = input.email.toLowerCase();
      await assertOrganizationExists(ctx.db, input.organizationId);

      const existing = await ctx.db.query.users.findFirst({
        where: eq(users.email, email),
        columns: { id: true },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A user with that email already exists",
        });
      }

      const [created] = await ctx.db
        .insert(users)
        .values({
          name: input.name,
          email,
          role: input.role,
          organizationId: input.organizationId,
          passwordHash: hashPassword(input.password),
          emailVerified: new Date(),
        })
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          organizationId: users.organizationId,
        });

      if (!created) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create user",
        });
      }

      return created;
    }),

  updateUser: siteAdminProcedure
    .input(updateUserInput)
    .mutation(async ({ ctx, input }) => {
      await assertOrganizationExists(ctx.db, input.organizationId);

      const existing = await ctx.db.query.users.findFirst({
        where: eq(users.id, input.id),
        columns: { id: true, role: true },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const demotingSelf =
        existing.id === ctx.session.user.id &&
        existing.role === "admin" &&
        input.role !== "admin";

      if (demotingSelf) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot demote your own Site Admin account",
        });
      }

      if (existing.role === "admin" && input.role !== "admin") {
        const adminCountRows = await ctx.db
          .select({ value: count() })
          .from(users)
          .where(eq(users.role, "admin"));
        const adminCount = adminCountRows[0]?.value ?? 0;

        if (adminCount <= 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot remove the last Site Admin",
          });
        }
      }

      const password = input.password?.trim();
      const [updated] = await ctx.db
        .update(users)
        .set({
          name: input.name,
          role: input.role,
          organizationId: input.organizationId,
          ...(password ? { passwordHash: hashPassword(password) } : {}),
        })
        .where(eq(users.id, input.id))
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          organizationId: users.organizationId,
        });

      if (!updated) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update user",
        });
      }

      return updated;
    }),
});
