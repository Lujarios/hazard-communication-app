/**
 * Applies additive schema fixes when `db:migrate` cannot run because
 * tables were created earlier via `db:push`.
 *
 * Includes auth/org columns introduced for Cognito manager login,
 * org-scoped custom persona columns, persona characteristic fields,
 * anonymous assessment attempts, and per-persona evaluation rows.
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
  `CREATE TABLE IF NOT EXISTS "hazard-communication-app_assessment_attempt_persona_evaluation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assessmentAttemptId" uuid NOT NULL,
	"personaId" varchar(64) NOT NULL,
	"experienceLevel" varchar(32),
	"jobRole" varchar(32),
	"jobRoleOther" varchar(128),
	"englishLiteracy" varchar(32),
	"projectExperience" varchar(32),
	"clarityStars" integer NOT NULL,
	"completenessStars" integer NOT NULL,
	"understandabilityStars" integer NOT NULL,
	"actionabilityStars" integer NOT NULL,
	"overallStars" integer NOT NULL,
	"understood" boolean NOT NULL,
	"wouldKnowWhatActionToTake" boolean NOT NULL,
	"hadAmbiguousInformation" boolean NOT NULL,
	"shortFeedback" text NOT NULL,
	"understoodPoints" jsonb NOT NULL,
	"unclearPoints" jsonb NOT NULL,
	"missedCriticalInformation" jsonb NOT NULL,
	"followUpQuestionCandidates" jsonb NOT NULL,
	"createdAt" timestamp with time zone NOT NULL
)`,
  `DO $$ BEGIN
 ALTER TABLE "hazard-communication-app_assessment_attempt_persona_evaluation" ADD CONSTRAINT "hazard-communication-app_assessment_attempt_persona_evaluation_assessmentAttemptId_hazard-communication-app_assessment_attempt_id_fk" FOREIGN KEY ("assessmentAttemptId") REFERENCES "public"."hazard-communication-app_assessment_attempt"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$`,
  `DO $$ BEGIN
 ALTER TABLE "hazard-communication-app_assessment_attempt_persona_evaluation" ADD CONSTRAINT "hazard-communication-app_assessment_attempt_persona_evaluation_personaId_hazard-communication-app_persona_id_fk" FOREIGN KEY ("personaId") REFERENCES "public"."hazard-communication-app_persona"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "attempt_persona_eval_attempt_persona_uidx" ON "hazard-communication-app_assessment_attempt_persona_evaluation" USING btree ("assessmentAttemptId","personaId")`,
  `CREATE INDEX IF NOT EXISTS "attempt_persona_eval_attempt_idx" ON "hazard-communication-app_assessment_attempt_persona_evaluation" USING btree ("assessmentAttemptId")`,
  `CREATE INDEX IF NOT EXISTS "attempt_persona_eval_persona_idx" ON "hazard-communication-app_assessment_attempt_persona_evaluation" USING btree ("personaId")`,
  `CREATE INDEX IF NOT EXISTS "attempt_persona_eval_literacy_idx" ON "hazard-communication-app_assessment_attempt_persona_evaluation" USING btree ("englishLiteracy")`,
  `CREATE INDEX IF NOT EXISTS "attempt_persona_eval_experience_idx" ON "hazard-communication-app_assessment_attempt_persona_evaluation" USING btree ("experienceLevel")`,
  `CREATE INDEX IF NOT EXISTS "attempt_persona_eval_job_role_idx" ON "hazard-communication-app_assessment_attempt_persona_evaluation" USING btree ("jobRole")`,
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
