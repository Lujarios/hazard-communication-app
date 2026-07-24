/**
 * Applies additive schema fixes when `db:migrate` cannot run because
 * tables were created earlier via `db:push`.
 *
 * Includes auth/org columns introduced for Cognito manager login,
 * plus org-scoped custom persona columns.
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
];

try {
  for (const statement of statements) {
    await sql.unsafe(statement);
    console.log(`Applied: ${statement}`);
  }

  console.log("Schema fix complete.");
} catch (error) {
  console.error("Schema fix failed:", error);
  process.exit(1);
} finally {
  await sql.end();
}
