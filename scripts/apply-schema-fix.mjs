/**
 * Applies additive schema fixes when `db:migrate` cannot run because
 * tables were created earlier via `db:push`.
 *
 * Includes auth/org columns introduced for Cognito manager login,
 * org-scoped custom persona columns, persona characteristic fields,
 * and anonymous assessment attempts.
 */
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const sql = postgres(connectionString, { max: 1 });

const statements = [
  `ALTER TABLE "hazard-communication-app_scenario_hazard" ADD COLUMN IF NOT EXISTS "overlayTop" varchar(16)`,
  `ALTER TABLE "hazard-communication-app_scenario_hazard" ADD COLUMN IF NOT EXISTS "overlayLeft" varchar(16)`,
  `ALTER TABLE "hazard-communication-app_scenario_hazard" ADD COLUMN IF NOT EXISTS "severity" varchar(16) DEFAULT 'medium'`,
  `ALTER TABLE "hazard-communication-app_scenario_hazard" ADD COLUMN IF NOT EXISTS "isLifeThreatening" boolean DEFAULT false NOT NULL`,
  `ALTER TABLE "hazard-communication-app_scenario" ADD COLUMN IF NOT EXISTS "modelSummary" text`,
  `ALTER TABLE "hazard-communication-app_scenario" ADD COLUMN IF NOT EXISTS "organizationId" varchar(255)`,
  `CREATE INDEX IF NOT EXISTS "scenario_organization_idx" ON "hazard-communication-app_scenario" ("organizationId")`,
  `ALTER TABLE "hazard-communication-app_persona" ADD COLUMN IF NOT EXISTS "organizationId" varchar(255)`,
  `ALTER TABLE "hazard-communication-app_persona" ADD COLUMN IF NOT EXISTS "isCustom" boolean DEFAULT false NOT NULL`,
  `CREATE INDEX IF NOT EXISTS "persona_organization_idx" ON "hazard-communication-app_persona" ("organizationId")`,
  `CREATE INDEX IF NOT EXISTS "persona_is_custom_idx" ON "hazard-communication-app_persona" ("isCustom")`,
  `CREATE TABLE IF NOT EXISTS "hazard-communication-app_assessment_attempt" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"anonymousParticipantId" varchar(36) NOT NULL,
	"scenarioId" uuid NOT NULL,
	"assessmentSessionId" uuid,
	"joinCode" varchar(6),
	"transcript" text NOT NULL,
	"overallStars" integer NOT NULL,
	"overallSummary" text NOT NULL,
	"criteriaRatings" jsonb NOT NULL,
	"missedItems" jsonb NOT NULL,
	"personaFeedback" jsonb,
	"createdAt" timestamp with time zone NOT NULL
)`,
  `DO $$ BEGIN
 ALTER TABLE "hazard-communication-app_assessment_attempt" ADD CONSTRAINT "hazard-communication-app_assessment_attempt_scenarioId_hazard-communication-app_scenario_id_fk" FOREIGN KEY ("scenarioId") REFERENCES "public"."hazard-communication-app_scenario"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$`,
  `DO $$ BEGIN
 ALTER TABLE "hazard-communication-app_assessment_attempt" ADD CONSTRAINT "hazard-communication-app_assessment_attempt_assessmentSessionId_hazard-communication-app_assessment_session_id_fk" FOREIGN KEY ("assessmentSessionId") REFERENCES "public"."hazard-communication-app_assessment_session"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$`,
  `CREATE INDEX IF NOT EXISTS "assessment_attempt_participant_idx" ON "hazard-communication-app_assessment_attempt" USING btree ("anonymousParticipantId")`,
  `CREATE INDEX IF NOT EXISTS "assessment_attempt_scenario_idx" ON "hazard-communication-app_assessment_attempt" USING btree ("scenarioId")`,
  `CREATE INDEX IF NOT EXISTS "assessment_attempt_session_idx" ON "hazard-communication-app_assessment_attempt" USING btree ("assessmentSessionId")`,
  `CREATE INDEX IF NOT EXISTS "assessment_attempt_participant_scenario_idx" ON "hazard-communication-app_assessment_attempt" USING btree ("anonymousParticipantId","scenarioId")`,
  `ALTER TABLE "hazard-communication-app_persona" ADD COLUMN IF NOT EXISTS "experienceLevel" varchar(32)`,
  `ALTER TABLE "hazard-communication-app_persona" ADD COLUMN IF NOT EXISTS "jobRole" varchar(32)`,
  `ALTER TABLE "hazard-communication-app_persona" ADD COLUMN IF NOT EXISTS "jobRoleOther" varchar(128)`,
  `ALTER TABLE "hazard-communication-app_persona" ADD COLUMN IF NOT EXISTS "englishLiteracy" varchar(32)`,
  `ALTER TABLE "hazard-communication-app_persona" ADD COLUMN IF NOT EXISTS "projectExperience" varchar(32)`,
];

try {
  for (const statement of statements) {
    await sql.unsafe(statement);
    console.log(`Applied: ${statement.slice(0, 80)}…`);
  }

  console.log("Schema fix complete.");
} catch (error) {
  console.error("Schema fix failed:", error);
  process.exit(1);
} finally {
  await sql.end();
}
