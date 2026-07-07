ALTER TABLE "hazard-communication-app_scenario_hazard" ADD COLUMN "overlayTop" varchar(16);--> statement-breakpoint
ALTER TABLE "hazard-communication-app_scenario_hazard" ADD COLUMN "overlayLeft" varchar(16);--> statement-breakpoint
ALTER TABLE "hazard-communication-app_scenario_hazard" ADD COLUMN "severity" varchar(16) DEFAULT 'medium';--> statement-breakpoint
ALTER TABLE "hazard-communication-app_scenario_hazard" ADD COLUMN "isLifeThreatening" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "hazard-communication-app_scenario" ADD COLUMN "modelSummary" text;