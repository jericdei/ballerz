import { pgTable } from "drizzle-orm/pg-core";

import { auditColumns, createAuditRelations } from "./audit";
import { idColumn, timestamps } from "./columns";
import { leagues } from "./leagues";
import { players } from "./players";
import type { InferSelectModel } from "./types";

const teamsTable = "teams";

export const teams = pgTable(teamsTable, ({ text, integer }) => ({
  ...idColumn,
  leagueId: integer("league_id").references(() => leagues.id, {
    onDelete: "cascade",
  }),
  name: text("name"),
  color: text("color").notNull().default("#2563eb"),
  ...timestamps,
  ...auditColumns,
}));

export const teamsRelations = createAuditRelations(
  teams,
  teamsTable,
  ({ one, many }) => ({
    league: one(leagues, {
      fields: [teams.leagueId],
      references: [leagues.id],
    }),
    players: many(players),
  }),
);

export type Team = InferSelectModel<typeof teams>;
