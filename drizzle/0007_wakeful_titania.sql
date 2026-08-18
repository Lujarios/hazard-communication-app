CREATE TABLE "hazard-communication-app_assessment_attempt_persona_evaluation" (
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
);
--> statement-breakpoint
ALTER TABLE "hazard-communication-app_assessment_attempt_persona_evaluation" ADD CONSTRAINT "hazard-communication-app_assessment_attempt_persona_evaluation_assessmentAttemptId_hazard-communication-app_assessment_attempt_id_fk" FOREIGN KEY ("assessmentAttemptId") REFERENCES "public"."hazard-communication-app_assessment_attempt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hazard-communication-app_assessment_attempt_persona_evaluation" ADD CONSTRAINT "hazard-communication-app_assessment_attempt_persona_evaluation_personaId_hazard-communication-app_persona_id_fk" FOREIGN KEY ("personaId") REFERENCES "public"."hazard-communication-app_persona"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "attempt_persona_eval_attempt_persona_uidx" ON "hazard-communication-app_assessment_attempt_persona_evaluation" USING btree ("assessmentAttemptId","personaId");--> statement-breakpoint
CREATE INDEX "attempt_persona_eval_attempt_idx" ON "hazard-communication-app_assessment_attempt_persona_evaluation" USING btree ("assessmentAttemptId");--> statement-breakpoint
CREATE INDEX "attempt_persona_eval_persona_idx" ON "hazard-communication-app_assessment_attempt_persona_evaluation" USING btree ("personaId");--> statement-breakpoint
CREATE INDEX "attempt_persona_eval_literacy_idx" ON "hazard-communication-app_assessment_attempt_persona_evaluation" USING btree ("englishLiteracy");--> statement-breakpoint
CREATE INDEX "attempt_persona_eval_experience_idx" ON "hazard-communication-app_assessment_attempt_persona_evaluation" USING btree ("experienceLevel");--> statement-breakpoint
CREATE INDEX "attempt_persona_eval_job_role_idx" ON "hazard-communication-app_assessment_attempt_persona_evaluation" USING btree ("jobRole");