ALTER TABLE "games"
ADD COLUMN "timeouts_per_quarter" integer DEFAULT 2 NOT NULL;
--> statement-breakpoint
ALTER TABLE "games"
ADD COLUMN "fouls_before_bonus" integer DEFAULT 5 NOT NULL;
