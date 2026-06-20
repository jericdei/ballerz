ALTER TABLE "games"
ADD COLUMN "quarter_duration_seconds" integer DEFAULT 600 NOT NULL;
--> statement-breakpoint
ALTER TABLE "games"
ADD COLUMN "shot_clock_seconds" integer DEFAULT 24 NOT NULL;
--> statement-breakpoint
ALTER TABLE "games"
ADD COLUMN "game_clock_ms" integer DEFAULT 600000 NOT NULL;
--> statement-breakpoint
ALTER TABLE "games"
ADD COLUMN "shot_clock_ms" integer DEFAULT 24000 NOT NULL;
--> statement-breakpoint
ALTER TABLE "games"
ADD COLUMN "game_clock_running" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "games"
ADD COLUMN "shot_clock_running" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "games"
ADD COLUMN "clock_updated_at" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "game_stat_events"
ADD COLUMN "client_id" text;
--> statement-breakpoint
CREATE UNIQUE INDEX "game_stat_events_game_id_client_id_unique" ON "game_stat_events" USING btree ("game_id", "client_id");
