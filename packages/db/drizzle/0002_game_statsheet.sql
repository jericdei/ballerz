CREATE TYPE "public"."game_period" AS ENUM('q1', 'q2', 'q3', 'q4', 'ot1', 'ot2', 'ot3', 'ot4', 'ot5');--> statement-breakpoint
CREATE TYPE "public"."game_stat_event_type" AS ENUM('fg2_made', 'fg2_missed', 'fg3_made', 'fg3_missed', 'ft_made', 'ft_missed', 'assist', 'turnover', 'offensive_rebound', 'defensive_rebound', 'personal_foul', 'technical_foul', 'timeout', 'dnp_marked');--> statement-breakpoint
CREATE TYPE "public"."game_status" AS ENUM('scheduled', 'in_progress', 'halftime', 'final', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."game_types" AS ENUM('regular', 'playoffs', 'exhibition', 'finals');--> statement-breakpoint
CREATE TABLE "game_player_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	"fg2_made" integer DEFAULT 0 NOT NULL,
	"fg2_attempted" integer DEFAULT 0 NOT NULL,
	"fg3_made" integer DEFAULT 0 NOT NULL,
	"fg3_attempted" integer DEFAULT 0 NOT NULL,
	"ft_made" integer DEFAULT 0 NOT NULL,
	"ft_attempted" integer DEFAULT 0 NOT NULL,
	"assists" integer DEFAULT 0 NOT NULL,
	"turnovers" integer DEFAULT 0 NOT NULL,
	"offensive_rebounds" integer DEFAULT 0 NOT NULL,
	"defensive_rebounds" integer DEFAULT 0 NOT NULL,
	"personal_fouls" integer DEFAULT 0 NOT NULL,
	"technical_fouls" integer DEFAULT 0 NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_rosters" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"is_dnp" boolean DEFAULT false NOT NULL,
	"is_starter" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_by" integer,
	"deleted_by" integer,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "game_stat_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" integer NOT NULL,
	"sequence" integer NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"period" "game_period" NOT NULL,
	"event_type" "game_stat_event_type" NOT NULL,
	"player_id" integer,
	"team_id" integer NOT NULL,
	"reverses_event_id" integer,
	"related_event_id" integer,
	"recorded_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_team_period_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"period" "game_period" NOT NULL,
	"timeouts_used" integer DEFAULT 0 NOT NULL,
	"team_fouls" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" serial PRIMARY KEY NOT NULL,
	"league_id" integer,
	"first_team_id" integer,
	"second_team_id" integer,
	"type" "game_types" DEFAULT 'regular' NOT NULL,
	"status" "game_status" DEFAULT 'scheduled' NOT NULL,
	"current_period" "game_period",
	"first_team_score" integer DEFAULT 0 NOT NULL,
	"second_team_score" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_by" integer,
	"deleted_by" integer,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "leagues" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_by" integer,
	"deleted_by" integer,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"number" integer NOT NULL,
	"position" text,
	"is_captain" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_by" integer,
	"deleted_by" integer,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"league_id" integer,
	"name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_by" integer,
	"deleted_by" integer,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password" text NOT NULL;--> statement-breakpoint
ALTER TABLE "game_player_stats" ADD CONSTRAINT "game_player_stats_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_player_stats" ADD CONSTRAINT "game_player_stats_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_rosters" ADD CONSTRAINT "game_rosters_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_rosters" ADD CONSTRAINT "game_rosters_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_rosters" ADD CONSTRAINT "game_rosters_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_rosters" ADD CONSTRAINT "game_rosters_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_rosters" ADD CONSTRAINT "game_rosters_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_rosters" ADD CONSTRAINT "game_rosters_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_stat_events" ADD CONSTRAINT "game_stat_events_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_stat_events" ADD CONSTRAINT "game_stat_events_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_stat_events" ADD CONSTRAINT "game_stat_events_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_stat_events" ADD CONSTRAINT "game_stat_events_reverses_event_id_game_stat_events_id_fk" FOREIGN KEY ("reverses_event_id") REFERENCES "public"."game_stat_events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_stat_events" ADD CONSTRAINT "game_stat_events_related_event_id_game_stat_events_id_fk" FOREIGN KEY ("related_event_id") REFERENCES "public"."game_stat_events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_stat_events" ADD CONSTRAINT "game_stat_events_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_team_period_stats" ADD CONSTRAINT "game_team_period_stats_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_team_period_stats" ADD CONSTRAINT "game_team_period_stats_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_first_team_id_teams_id_fk" FOREIGN KEY ("first_team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_second_team_id_teams_id_fk" FOREIGN KEY ("second_team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leagues" ADD CONSTRAINT "leagues_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leagues" ADD CONSTRAINT "leagues_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leagues" ADD CONSTRAINT "leagues_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "game_player_stats_game_id_player_id_unique" ON "game_player_stats" USING btree ("game_id","player_id");--> statement-breakpoint
CREATE INDEX "game_player_stats_game_id_idx" ON "game_player_stats" USING btree ("game_id");--> statement-breakpoint
CREATE UNIQUE INDEX "game_rosters_game_id_player_id_unique" ON "game_rosters" USING btree ("game_id","player_id");--> statement-breakpoint
CREATE UNIQUE INDEX "game_stat_events_game_id_sequence_unique" ON "game_stat_events" USING btree ("game_id","sequence");--> statement-breakpoint
CREATE INDEX "game_stat_events_game_id_period_idx" ON "game_stat_events" USING btree ("game_id","period");--> statement-breakpoint
CREATE INDEX "game_stat_events_reverses_event_id_idx" ON "game_stat_events" USING btree ("reverses_event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "game_team_period_stats_game_team_period_unique" ON "game_team_period_stats" USING btree ("game_id","team_id","period");--> statement-breakpoint
CREATE INDEX "game_team_period_stats_game_id_idx" ON "game_team_period_stats" USING btree ("game_id");