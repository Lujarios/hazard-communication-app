import { relations } from "drizzle-orm";
import {
  index,
  pgTableCreator,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { type AdapterAccount } from "next-auth/adapters";

/**
 * Multi-project schema prefix for Drizzle ORM.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator(
  (name) => `hazard-communication-app_${name}`,
);

export const posts = createTable(
  "post",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    name: d.varchar({ length: 256 }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [index("name_idx").on(t.name)],
);

/**
 * Companies / tenants. Managers in an org can manage that org's scenarios.
 */
export const organizations = createTable(
  "organization",
  (d) => ({
    id: d
      .varchar({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: d.varchar({ length: 256 }).notNull(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [index("organization_name_idx").on(t.name)],
);

/**
 * Auth.js user + SafeTalk manager fields.
 * Assessment takers do not need accounts — only managers/admins who build scenarios.
 */
export const users = createTable("user", (d) => ({
  id: d
    .varchar({ length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: d.varchar({ length: 255 }),
  email: d.varchar({ length: 255 }).notNull(),
  emailVerified: d.timestamp({
    mode: "date",
    withTimezone: true,
  }),
  image: d.varchar({ length: 255 }),
  organizationId: d.varchar({ length: 255 }).references(() => organizations.id),
  /** manager = create/edit scenarios; admin = same for MVP (roles reserved for later) */
  role: d.varchar({ length: 32 }).notNull().default("manager"),
  /** Only used by local/dev Credentials login — not used for Cognito. */
  passwordHash: d.text(),
}));

export const accounts = createTable(
  "account",
  (d) => ({
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: d.varchar({ length: 255 }).$type<AdapterAccount["type"]>().notNull(),
    provider: d.varchar({ length: 255 }).notNull(),
    providerAccountId: d.varchar({ length: 255 }).notNull(),
    refresh_token: d.text(),
    access_token: d.text(),
    expires_at: d.integer(),
    token_type: d.varchar({ length: 255 }),
    scope: d.varchar({ length: 255 }),
    id_token: d.text(),
    session_state: d.varchar({ length: 255 }),
  }),
  (t) => [
    primaryKey({ columns: [t.provider, t.providerAccountId] }),
    index("account_user_id_idx").on(t.userId),
  ],
);

export const sessions = createTable(
  "session",
  (d) => ({
    sessionToken: d.varchar({ length: 255 }).notNull().primaryKey(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [index("session_user_id_idx").on(t.userId)],
);

export const verificationTokens = createTable(
  "verification_token",
  (d) => ({
    identifier: d.varchar({ length: 255 }).notNull(),
    token: d.varchar({ length: 255 }).notNull(),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

export const scenarios = createTable(
  "scenario",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    organizationId: d.varchar({ length: 255 }).references(() => organizations.id),
    title: d.varchar({ length: 256 }).notNull(),
    description: d.text().notNull(),
    imageFileName: d.varchar({ length: 256 }).notNull(),
    status: d.varchar({ length: 16 }).notNull().default("draft"),
    modelSummary: d.text(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("scenario_status_idx").on(t.status),
    index("scenario_organization_idx").on(t.organizationId),
  ],
);

export const scenarioHazards = createTable(
  "scenario_hazard",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    scenarioId: d
      .uuid()
      .notNull()
      .references(() => scenarios.id, { onDelete: "cascade" }),
    hazardTitle: d.varchar({ length: 256 }).notNull(),
    hazardDescription: d.text().notNull(),
    controlDescription: d.text().notNull(),
    locationNote: d.text(),
    overlayTop: d.varchar({ length: 16 }),
    overlayLeft: d.varchar({ length: 16 }),
    severity: d.varchar({ length: 16 }).default("medium"),
    isLifeThreatening: d.boolean().notNull().default(false),
    sortOrder: d.integer().notNull().default(0),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [index("scenario_hazard_scenario_idx").on(t.scenarioId)],
);

/**
 * Premade personas: isCustom=false, organizationId=null (global catalog).
 * Custom personas: isCustom=true, organizationId set to the creating manager's org.
 */
export const personas = createTable(
  "persona",
  (d) => ({
    id: d.varchar({ length: 64 }).primaryKey(),
    organizationId: d
      .varchar({ length: 255 })
      .references(() => organizations.id),
    isCustom: d.boolean().notNull().default(false),
    name: d.varchar({ length: 256 }).notNull(),
    roleDescription: d.text().notNull(),
    evaluationInstructions: d.text().notNull(),
    initials: d.varchar({ length: 8 }).notNull(),
    avatarColor: d.varchar({ length: 64 }).notNull(),
    imagePath: d.varchar({ length: 512 }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("persona_organization_idx").on(t.organizationId),
    index("persona_is_custom_idx").on(t.isCustom),
  ],
);

export const scenarioPersonas = createTable(
  "scenario_persona",
  (d) => ({
    scenarioId: d
      .uuid()
      .notNull()
      .references(() => scenarios.id, { onDelete: "cascade" }),
    personaId: d
      .varchar({ length: 64 })
      .notNull()
      .references(() => personas.id),
  }),
  (t) => [
    primaryKey({ columns: [t.scenarioId, t.personaId] }),
    index("scenario_persona_scenario_idx").on(t.scenarioId),
  ],
);

/**
 * Assessment sessions for trainee access via short join codes.
 * Managers generate a code instead of sharing a raw scenario UUID.
 * Auth.js `sessions` remain separate (manager login only).
 */
export const assessmentSessions = createTable(
  "assessment_session",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    scenarioId: d
      .uuid()
      .notNull()
      .references(() => scenarios.id, { onDelete: "cascade" }),
    /** 6-character shareable code, e.g. ABC123 */
    joinCode: d.varchar({ length: 6 }).notNull(),
    /** active = trainees can join; closed = code no longer accepted */
    status: d.varchar({ length: 16 }).notNull().default("active"),
    createdByUserId: d
      .varchar({ length: 255 })
      .references(() => users.id, { onDelete: "set null" }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    uniqueIndex("assessment_session_join_code_uidx").on(t.joinCode),
    index("assessment_session_scenario_idx").on(t.scenarioId),
    index("assessment_session_status_idx").on(t.status),
  ],
);

export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  scenarios: many(scenarios),
  personas: many(personas),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  accounts: many(accounts),
  sessions: many(sessions),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const scenariosRelations = relations(scenarios, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [scenarios.organizationId],
    references: [organizations.id],
  }),
  hazards: many(scenarioHazards),
  scenarioPersonas: many(scenarioPersonas),
  assessmentSessions: many(assessmentSessions),
}));

export const scenarioHazardsRelations = relations(scenarioHazards, ({ one }) => ({
  scenario: one(scenarios, {
    fields: [scenarioHazards.scenarioId],
    references: [scenarios.id],
  }),
}));

export const personasRelations = relations(personas, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [personas.organizationId],
    references: [organizations.id],
  }),
  scenarioPersonas: many(scenarioPersonas),
}));

export const scenarioPersonasRelations = relations(
  scenarioPersonas,
  ({ one }) => ({
    scenario: one(scenarios, {
      fields: [scenarioPersonas.scenarioId],
      references: [scenarios.id],
    }),
    persona: one(personas, {
      fields: [scenarioPersonas.personaId],
      references: [personas.id],
    }),
  }),
);

export const assessmentSessionsRelations = relations(
  assessmentSessions,
  ({ one }) => ({
    scenario: one(scenarios, {
      fields: [assessmentSessions.scenarioId],
      references: [scenarios.id],
    }),
    createdBy: one(users, {
      fields: [assessmentSessions.createdByUserId],
      references: [users.id],
    }),
  }),
);
