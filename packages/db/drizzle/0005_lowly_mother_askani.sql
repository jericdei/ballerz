ALTER TABLE "players" ADD COLUMN "created_for_game_id" integer;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_created_for_game_id_games_id_fk" FOREIGN KEY ("created_for_game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "players_created_for_game_id_idx" ON "players" USING btree ("created_for_game_id");