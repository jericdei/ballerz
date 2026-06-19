import { pgEnum, pgTable, timestamp } from "drizzle-orm/pg-core";

import { auditColumns, createAuditRelations } from "./audit";
import { idColumn, timestamps } from "./columns";
import { gamePeriodEnum, gameStatusEnum } from "./game-enums";
import { gameRosters } from "./game-rosters";
import { gameStatEvents } from "./game-stat-events";
import { leagues } from "./leagues";
import { teams } from "./teams";
import type { InferSelectModel } from "./types";

const gamesTable = "games";

export const gameTypesEnum = pgEnum("game_types", [
  "regular",
  "playoffs",
  "exhibition",
  "finals",
]);

export const games = pgTable(gamesTable, ({ integer }) => ({
  ...idColumn,
  leagueId: integer("league_id").references(() => leagues.id, {
    onDelete: "cascade",
  }),
  firstTeamId: integer("first_team_id").references(() => teams.id, {
    onDelete: "cascade",
  }),
  secondTeamId: integer("second_team_id").references(() => teams.id, {
    onDelete: "cascade",
  }),
  type: gameTypesEnum("type").notNull().default("regular"),
  status: gameStatusEnum("status").notNull().default("scheduled"),
  currentPeriod: gamePeriodEnum("current_period"),
  firstTeamScore: integer("first_team_score").notNull().default(0),
  secondTeamScore: integer("second_team_score").notNull().default(0),
  startedAt: timestamp("started_at", { withTimezone: true }),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  ...timestamps,
  ...auditColumns,
}));

export const gamesRelations = createAuditRelations(
  games,
  gamesTable,
  ({ one, many }) => ({
    league: one(leagues, {
      fields: [games.leagueId],
      references: [leagues.id],
    }),
    firstTeam: one(teams, {
      fields: [games.firstTeamId],
      references: [teams.id],
      relationName: "game_first_team",
    }),
    secondTeam: one(teams, {
      fields: [games.secondTeamId],
      references: [teams.id],
      relationName: "game_second_team",
    }),
    rosters: many(gameRosters),
    statEvents: many(gameStatEvents),
  }),
);

export type Game = InferSelectModel<typeof games>;
export type GameType = (typeof gameTypesEnum.enumValues)[number];
