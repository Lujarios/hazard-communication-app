import { relations } from "drizzle-orm";
import { index, pgTableCreator, primaryKey } from "drizzle-orm/pg-core";

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

export const scenarios = createTable(
  "scenario",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    title: d.varchar({ length: 256 }).notNull(),
    description: d.text().notNull(),
    imageFileName: d.varchar({ length: 256 }).notNull(),
    status: d.varchar({ length: 16 }).notNull().default("draft"),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [index("scenario_status_idx").on(t.status)],
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
    sortOrder: d.integer().notNull().default(0),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [index("scenario_hazard_scenario_idx").on(t.scenarioId)],
);

export const personas = createTable("persona", (d) => ({
  id: d.varchar({ length: 64 }).primaryKey(),
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
}));

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

export const scenariosRelations = relations(scenarios, ({ many }) => ({
  hazards: many(scenarioHazards),
  scenarioPersonas: many(scenarioPersonas),
}));

export const scenarioHazardsRelations = relations(scenarioHazards, ({ one }) => ({
  scenario: one(scenarios, {
    fields: [scenarioHazards.scenarioId],
    references: [scenarios.id],
  }),
}));

export const personasRelations = relations(personas, ({ many }) => ({
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
