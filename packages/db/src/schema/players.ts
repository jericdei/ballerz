import { pgTable } from "drizzle-orm/pg-core";

import { auditColumns, createAuditRelations } from "./audit";
import { idColumn, timestamps } from "./columns";
import { teams } from "./teams";
import type { InferSelectModel } from "./types";

const playersTable = "players";

export const players = pgTable(playersTable, ({ text, integer, boolean }) => ({
  ...idColumn,
  teamId: integer("team_id").references(() => teams.id, {
    onDelete: "cascade",
  }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  number: integer("number").notNull(),
  position: text("position"),
  isCaptain: boolean("is_captain").notNull().default(false),
  ...timestamps,
  ...auditColumns,
}));

export const playersRelations = createAuditRelations(
  players,
  playersTable,
  ({ one }) => ({
    team: one(teams, {
      fields: [players.teamId],
      references: [teams.id],
    }),
  }),
);

export type Player = InferSelectModel<typeof players>;
