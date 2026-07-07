/**
 * Applies drizzle/0001_new_ares.sql when `db:migrate` cannot run because
 * tables were created earlier via `db:push`.
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
