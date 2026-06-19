import { pgEnum, pgTable } from "drizzle-orm/pg-core";

import { auditColumns, createAuditRelations } from "./audit";
import { idColumn, timestamps } from "./columns";
import { leagues } from "./leagues";
import { teams } from "./teams";
import { InferSelectModel } from "./types";

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
  firstTeamScore: integer("first_team_score").notNull(),
  secondTeamScore: integer("second_team_score").notNull(),
  ...timestamps,
  ...auditColumns,
}));

export const gamesRelations = createAuditRelations(
  games,
  gamesTable,
  ({ one }) => ({
    league: one(leagues, {
      fields: [games.leagueId],
      references: [leagues.id],
    }),
    firstTeam: one(teams, {
      fields: [games.firstTeamId],
      references: [teams.id],
    }),
    secondTeam: one(teams, {
      fields: [games.secondTeamId],
      references: [teams.id],
    }),
  }),
);

export type Game = InferSelectModel<typeof games>;
export type GameType = (typeof gameTypesEnum.enumValues)[number];
