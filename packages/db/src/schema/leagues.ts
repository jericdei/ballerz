import { pgTable } from "drizzle-orm/pg-core";

import { auditColumns, createAuditRelations } from "./audit";
import { idColumn, timestamps } from "./columns";
import { teams } from "./teams";
import type { InferSelectModel } from "./types";

const leaguesTable = "leagues";

export const leagues = pgTable(leaguesTable, ({ text }) => ({
  ...idColumn,
  name: text("name"),
  ...timestamps,
  ...auditColumns,
}));

export const leaguesRelations = createAuditRelations(
  leagues,
  leaguesTable,
  ({ many }) => ({
    teams: many(teams),
  }),
);

export type League = InferSelectModel<typeof leagues>;
