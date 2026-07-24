CREATE TABLE "hazard-communication-app_assessment_session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scenarioId" uuid NOT NULL,
	"joinCode" varchar(6) NOT NULL,
	"status" varchar(16) DEFAULT 'active' NOT NULL,
	"createdByUserId" varchar(255),
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "hazard-communication-app_assessment_session" ADD CONSTRAINT "hazard-communication-app_assessment_session_scenarioId_hazard-communication-app_scenario_id_fk" FOREIGN KEY ("scenarioId") REFERENCES "public"."hazard-communication-app_scenario"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hazard-communication-app_assessment_session" ADD CONSTRAINT "hazard-communication-app_assessment_session_createdByUserId_hazard-communication-app_user_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."hazard-communication-app_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "assessment_session_join_code_uidx" ON "hazard-communication-app_assessment_session" USING btree ("joinCode");--> statement-breakpoint
CREATE INDEX "assessment_session_scenario_idx" ON "hazard-communication-app_assessment_session" USING btree ("scenarioId");--> statement-breakpoint
CREATE INDEX "assessment_session_status_idx" ON "hazard-communication-app_assessment_session" USING btree ("status");