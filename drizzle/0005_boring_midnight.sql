CREATE TABLE "hazard-communication-app_assessment_attempt" (
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
);
--> statement-breakpoint
ALTER TABLE "hazard-communication-app_assessment_attempt" ADD CONSTRAINT "hazard-communication-app_assessment_attempt_scenarioId_hazard-communication-app_scenario_id_fk" FOREIGN KEY ("scenarioId") REFERENCES "public"."hazard-communication-app_scenario"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hazard-communication-app_assessment_attempt" ADD CONSTRAINT "hazard-communication-app_assessment_attempt_assessmentSessionId_hazard-communication-app_assessment_session_id_fk" FOREIGN KEY ("assessmentSessionId") REFERENCES "public"."hazard-communication-app_assessment_session"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assessment_attempt_participant_idx" ON "hazard-communication-app_assessment_attempt" USING btree ("anonymousParticipantId");--> statement-breakpoint
CREATE INDEX "assessment_attempt_scenario_idx" ON "hazard-communication-app_assessment_attempt" USING btree ("scenarioId");--> statement-breakpoint
CREATE INDEX "assessment_attempt_session_idx" ON "hazard-communication-app_assessment_attempt" USING btree ("assessmentSessionId");--> statement-breakpoint
CREATE INDEX "assessment_attempt_participant_scenario_idx" ON "hazard-communication-app_assessment_attempt" USING btree ("anonymousParticipantId","scenarioId");