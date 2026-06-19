ALTER TYPE "public"."game_stat_event_type" ADD VALUE 'steal' BEFORE 'timeout';--> statement-breakpoint
ALTER TYPE "public"."game_stat_event_type" ADD VALUE 'block' BEFORE 'timeout';--> statement-breakpoint
ALTER TABLE "game_player_stats" ADD COLUMN "steals" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "game_player_stats" ADD COLUMN "blocks" integer DEFAULT 0 NOT NULL;