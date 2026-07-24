import { eq } from "drizzle-orm";

import {
  SEED_DEV_PASSWORD,
  SEED_ORG_ACME_ID,
  SEED_ORG_BEACON_ID,
  SEED_USER_ACME_ADMIN_ID,
  SEED_USER_ACME_MANAGER_ID,
  SEED_USER_BEACON_MANAGER_ID,
} from "~/lib/auth-constants";
import { hashPassword } from "~/server/auth/password";
import { db } from "~/server/db";
import { organizations, users } from "~/server/db/schema";

const seedOrganizations = [
  { id: SEED_ORG_ACME_ID, name: "Acme Construction" },
  { id: SEED_ORG_BEACON_ID, name: "Beacon Safety Co" },
] as const;

const seedUsers = [
  {
    id: SEED_USER_ACME_ADMIN_ID,
    name: "Alex Admin",
    email: "admin@acme.local",
    organizationId: SEED_ORG_ACME_ID,
    role: "admin" as const,
  },
  {
    id: SEED_USER_ACME_MANAGER_ID,
    name: "Morgan Manager",
    email: "manager@acme.local",
    organizationId: SEED_ORG_ACME_ID,
    role: "manager" as const,
  },
  {
    id: SEED_USER_BEACON_MANAGER_ID,
    name: "Blake Builder",
    email: "manager@beacon.local",
    organizationId: SEED_ORG_BEACON_ID,
    role: "manager",
  },
] as const;

/**
 * Idempotent seed for local/dev orgs + manager users (Credentials login).
 * Cognito users with the same email can link via allowDangerousEmailAccountLinking.
 */
export async function ensureAuthSeeded(): Promise<void> {
  for (const org of seedOrganizations) {
    const existing = await db.query.organizations.findFirst({
      where: eq(organizations.id, org.id),
      columns: { id: true },
    });

    if (!existing) {
      await db.insert(organizations).values(org);
    }
  }

  const passwordHash = hashPassword(SEED_DEV_PASSWORD);

  for (const user of seedUsers) {
    const existing = await db.query.users.findFirst({
      where: eq(users.email, user.email),
      columns: { id: true },
    });

    if (!existing) {
      await db.insert(users).values({
        ...user,
        passwordHash,
        emailVerified: new Date(),
      });
    } else {
      // Keep local Credentials password in sync with SEED_DEV_PASSWORD.
      await db
        .update(users)
        .set({ passwordHash })
        .where(eq(users.id, existing.id));
    }
  }
}
