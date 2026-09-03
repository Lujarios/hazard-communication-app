CREATE TABLE "hazard-communication-app_assessment_run" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"anonymousParticipantId" varchar(36) NOT NULL,
	"scenarioId" uuid NOT NULL,
	"assessmentSessionId" uuid,
	"joinCode" varchar(6),
	"status" varchar(32) DEFAULT 'awaiting_initial' NOT NULL,
	"stageCount" integer DEFAULT 0 NOT NULL,
	"workflowVersion" integer DEFAULT 2 NOT NULL,
	"completionReason" varchar(32),
	"pendingSegmentTranscript" text,
	"lastError" text,
	"completedAt" timestamp with time zone,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "hazard-communication-app_assessment_attempt" ADD COLUMN "runId" uuid;--> statement-breakpoint
ALTER TABLE "hazard-communication-app_assessment_attempt" ADD COLUMN "stageType" varchar(32) DEFAULT 'initial' NOT NULL;--> statement-breakpoint
ALTER TABLE "hazard-communication-app_assessment_attempt" ADD COLUMN "stageIndex" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "hazard-communication-app_assessment_attempt" ADD COLUMN "segmentTranscript" text;--> statement-breakpoint
ALTER TABLE "hazard-communication-app_assessment_attempt" ADD COLUMN "selectedFollowUpQuestions" jsonb;--> statement-breakpoint
ALTER TABLE "hazard-communication-app_assessment_attempt" ADD COLUMN "evaluationStatus" varchar(16) DEFAULT 'succeeded' NOT NULL;--> statement-breakpoint
ALTER TABLE "hazard-communication-app_assessment_attempt" ADD COLUMN "participantFinishedAfterStage" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "hazard-communication-app_assessment_run" ADD CONSTRAINT "hazard-communication-app_assessment_run_scenarioId_hazard-communication-app_scenario_id_fk" FOREIGN KEY ("scenarioId") REFERENCES "public"."hazard-communication-app_scenario"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hazard-communication-app_assessment_run" ADD CONSTRAINT "hazard-communication-app_assessment_run_assessmentSessionId_hazard-communication-app_assessment_session_id_fk" FOREIGN KEY ("assessmentSessionId") REFERENCES "public"."hazard-communication-app_assessment_session"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assessment_run_participant_idx" ON "hazard-communication-app_assessment_run" USING btree ("anonymousParticipantId");--> statement-breakpoint
CREATE INDEX "assessment_run_scenario_idx" ON "hazard-communication-app_assessment_run" USING btree ("scenarioId");--> statement-breakpoint
CREATE INDEX "assessment_run_session_idx" ON "hazard-communication-app_assessment_run" USING btree ("assessmentSessionId");--> statement-breakpoint
CREATE INDEX "assessment_run_status_idx" ON "hazard-communication-app_assessment_run" USING btree ("status");--> statement-breakpoint
CREATE INDEX "assessment_run_participant_scenario_idx" ON "hazard-communication-app_assessment_run" USING btree ("anonymousParticipantId","scenarioId");--> statement-breakpoint
ALTER TABLE "hazard-communication-app_assessment_attempt" ADD CONSTRAINT "hazard-communication-app_assessment_attempt_runId_hazard-communication-app_assessment_run_id_fk" FOREIGN KEY ("runId") REFERENCES "public"."hazard-communication-app_assessment_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assessment_attempt_run_idx" ON "hazard-communication-app_assessment_attempt" USING btree ("runId");--> statement-breakpoint
CREATE UNIQUE INDEX "assessment_attempt_run_stage_uidx" ON "hazard-communication-app_assessment_attempt" USING btree ("runId","stageIndex");
--> statement-breakpoint
INSERT INTO "hazard-communication-app_assessment_run" (
	"id", "anonymousParticipantId", "scenarioId", "assessmentSessionId", "joinCode",
	"status", "stageCount", "workflowVersion", "completionReason", "completedAt", "createdAt"
)
SELECT
	a."id", a."anonymousParticipantId", a."scenarioId", a."assessmentSessionId", a."joinCode",
	'completed', 1, 1, 'legacy_single_shot', a."createdAt", a."createdAt"
FROM "hazard-communication-app_assessment_attempt" a
WHERE a."runId" IS NULL;
--> statement-breakpoint
UPDATE "hazard-communication-app_assessment_attempt"
SET "runId" = "id",
	"stageType" = COALESCE("stageType", 'initial'),
	"stageIndex" = COALESCE("stageIndex", 0),
	"segmentTranscript" = COALESCE("segmentTranscript", "transcript"),
	"evaluationStatus" = COALESCE("evaluationStatus", 'succeeded')
WHERE "runId" IS NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX "assessment_run_active_participant_scenario_uidx" ON "hazard-communication-app_assessment_run" ("anonymousParticipantId","scenarioId") WHERE status <> 'completed';