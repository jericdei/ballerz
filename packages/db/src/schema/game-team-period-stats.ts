import { index, integer, pgTable, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

import { idColumn, timestamps } from "./columns";
import { gamePeriodEnum } from "./game-enums";
import { games } from "./games";
import { teams } from "./teams";
import type { InferSelectModel } from "./types";

const gameTeamPeriodStatsTable = "game_team_period_stats";

export const gameTeamPeriodStats = pgTable(
  gameTeamPeriodStatsTable,
  ({ integer: intCol }) => ({
    ...idColumn,
    gameId: intCol("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    teamId: intCol("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    period: gamePeriodEnum("period").notNull(),
    timeoutsUsed: intCol("timeouts_used").notNull().default(0),
    teamFouls: intCol("team_fouls").notNull().default(0),
    ...timestamps,
  }),
  (table) => [
    uniqueIndex("game_team_period_stats_game_team_period_unique").on(
      table.gameId,
      table.teamId,
      table.period,
    ),
    index("game_team_period_stats_game_id_idx").on(table.gameId),
  ],
);

export const gameTeamPeriodStatsRelations = relations(
  gameTeamPeriodStats,
  ({ one }) => ({
    game: one(games, {
      fields: [gameTeamPeriodStats.gameId],
      references: [games.id],
    }),
    team: one(teams, {
      fields: [gameTeamPeriodStats.teamId],
      references: [teams.id],
    }),
  }),
);

export type GameTeamPeriodStats = InferSelectModel<typeof gameTeamPeriodStats>;
