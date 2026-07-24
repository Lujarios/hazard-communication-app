CREATE TABLE "hazard-communication-app_account" (
	"userId" varchar(255) NOT NULL,
	"type" varchar(255) NOT NULL,
	"provider" varchar(255) NOT NULL,
	"providerAccountId" varchar(255) NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" varchar(255),
	"scope" varchar(255),
	"id_token" text,
	"session_state" varchar(255),
	CONSTRAINT "hazard-communication-app_account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "hazard-communication-app_organization" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "hazard-communication-app_session" (
	"sessionToken" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hazard-communication-app_user" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"email" varchar(255) NOT NULL,
	"emailVerified" timestamp with time zone,
	"image" varchar(255),
	"organizationId" varchar(255),
	"role" varchar(32) DEFAULT 'manager' NOT NULL,
	"passwordHash" text
);
--> statement-breakpoint
CREATE TABLE "hazard-communication-app_verification_token" (
	"identifier" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "hazard-communication-app_verification_token_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "hazard-communication-app_scenario" ADD COLUMN "organizationId" varchar(255);--> statement-breakpoint
ALTER TABLE "hazard-communication-app_account" ADD CONSTRAINT "hazard-communication-app_account_userId_hazard-communication-app_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."hazard-communication-app_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hazard-communication-app_session" ADD CONSTRAINT "hazard-communication-app_session_userId_hazard-communication-app_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."hazard-communication-app_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hazard-communication-app_user" ADD CONSTRAINT "hazard-communication-app_user_organizationId_hazard-communication-app_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."hazard-communication-app_organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "hazard-communication-app_account" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "organization_name_idx" ON "hazard-communication-app_organization" USING btree ("name");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "hazard-communication-app_session" USING btree ("userId");--> statement-breakpoint
ALTER TABLE "hazard-communication-app_scenario" ADD CONSTRAINT "hazard-communication-app_scenario_organizationId_hazard-communication-app_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."hazard-communication-app_organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "scenario_organization_idx" ON "hazard-communication-app_scenario" USING btree ("organizationId");