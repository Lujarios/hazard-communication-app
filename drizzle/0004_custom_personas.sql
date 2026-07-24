ALTER TABLE "hazard-communication-app_persona" ADD COLUMN "organizationId" varchar(255);--> statement-breakpoint
ALTER TABLE "hazard-communication-app_persona" ADD COLUMN "isCustom" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "hazard-communication-app_persona" ADD CONSTRAINT "hazard-communication-app_persona_organizationId_hazard-communication-app_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."hazard-communication-app_organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "persona_organization_idx" ON "hazard-communication-app_persona" USING btree ("organizationId");--> statement-breakpoint
CREATE INDEX "persona_is_custom_idx" ON "hazard-communication-app_persona" USING btree ("isCustom");