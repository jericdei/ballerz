import { relations } from "drizzle-orm";
import { index, pgTable, uniqueIndex } from "drizzle-orm/pg-core";

import { idColumn, timestamps } from "./columns";
import { games } from "./games";
import { players } from "./players";
import type { InferSelectModel } from "./types";

const gamePlayerStatsTable = "game_player_stats";

export const gamePlayerStats = pgTable(
  gamePlayerStatsTable,
  ({ integer: intCol }) => ({
    ...idColumn,
    gameId: intCol("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    playerId: intCol("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    fg2Made: intCol("fg2_made").notNull().default(0),
    fg2Attempted: intCol("fg2_attempted").notNull().default(0),
    fg3Made: intCol("fg3_made").notNull().default(0),
    fg3Attempted: intCol("fg3_attempted").notNull().default(0),
    ftMade: intCol("ft_made").notNull().default(0),
    ftAttempted: intCol("ft_attempted").notNull().default(0),
    assists: intCol("assists").notNull().default(0),
    turnovers: intCol("turnovers").notNull().default(0),
    offensiveRebounds: intCol("offensive_rebounds").notNull().default(0),
    defensiveRebounds: intCol("defensive_rebounds").notNull().default(0),
    personalFouls: intCol("personal_fouls").notNull().default(0),
    technicalFouls: intCol("technical_fouls").notNull().default(0),
    points: intCol("points").notNull().default(0),
    ...timestamps,
  }),
  (table) => [
    uniqueIndex("game_player_stats_game_id_player_id_unique").on(
      table.gameId,
      table.playerId,
    ),
    index("game_player_stats_game_id_idx").on(table.gameId),
  ],
);

export const gamePlayerStatsRelations = relations(
  gamePlayerStats,
  ({ one }) => ({
    game: one(games, {
      fields: [gamePlayerStats.gameId],
      references: [games.id],
    }),
    player: one(players, {
      fields: [gamePlayerStats.playerId],
      references: [players.id],
    }),
  }),
);

export type GamePlayerStats = InferSelectModel<typeof gamePlayerStats>;
