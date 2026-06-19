import { pgTable, uniqueIndex } from "drizzle-orm/pg-core";

import { auditColumns, createAuditRelations } from "./audit";
import { idColumn } from "./columns";
import { games } from "./games";
import { players } from "./players";
import { teams } from "./teams";
import type { InferSelectModel } from "./types";

const gameRostersTable = "game_rosters";

export const gameRosters = pgTable(
  gameRostersTable,
  ({ integer, boolean: booleanCol }) => ({
    ...idColumn,
    gameId: integer("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    playerId: integer("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    teamId: integer("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    isDnp: booleanCol("is_dnp").notNull().default(false),
    isStarter: booleanCol("is_starter").notNull().default(false),
    ...auditColumns,
  }),
  (table) => [
    uniqueIndex("game_rosters_game_id_player_id_unique").on(
      table.gameId,
      table.playerId,
    ),
  ],
);

export const gameRostersRelations = createAuditRelations(
  gameRosters,
  gameRostersTable,
  ({ one }) => ({
    game: one(games, {
      fields: [gameRosters.gameId],
      references: [games.id],
    }),
    player: one(players, {
      fields: [gameRosters.playerId],
      references: [players.id],
    }),
    team: one(teams, {
      fields: [gameRosters.teamId],
      references: [teams.id],
    }),
  }),
);

export type GameRoster = InferSelectModel<typeof gameRosters>;
