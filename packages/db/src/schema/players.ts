import { index, pgTable } from "drizzle-orm/pg-core";

import { auditColumns, createAuditRelations } from "./audit";
import { idColumn, timestamps } from "./columns";
import { games } from "./games";
import { teams } from "./teams";
import type { InferSelectModel } from "./types";

const playersTable = "players";

export const players = pgTable(
  playersTable,
  ({ text, integer, boolean }) => ({
    ...idColumn,
    teamId: integer("team_id").references(() => teams.id, {
      onDelete: "cascade",
    }),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    number: integer("number").notNull(),
    position: text("position"),
    isCaptain: boolean("is_captain").notNull().default(false),
    createdForGameId: integer("created_for_game_id").references(() => games.id, {
      onDelete: "cascade",
    }),
    ...timestamps,
    ...auditColumns,
  }),
  (table) => [
    index("players_created_for_game_id_idx").on(table.createdForGameId),
  ],
);

export const playersRelations = createAuditRelations(
  players,
  playersTable,
  ({ one }) => ({
    team: one(teams, {
      fields: [players.teamId],
      references: [teams.id],
    }),
    createdForGame: one(games, {
      fields: [players.createdForGameId],
      references: [games.id],
    }),
  }),
);

export type Player = InferSelectModel<typeof players>;
