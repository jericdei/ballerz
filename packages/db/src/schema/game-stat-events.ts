import { relations } from "drizzle-orm";
import {
  type AnyPgColumn,
  index,
  pgTable,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { idColumn } from "./columns";
import { gamePeriodEnum, gameStatEventTypeEnum } from "./game-enums";
import { games } from "./games";
import { players } from "./players";
import { teams } from "./teams";
import type { InferSelectModel } from "./types";
import { users } from "./users";

const gameStatEventsTable = "game_stat_events";

export const gameStatEvents = pgTable(
  gameStatEventsTable,
  ({ integer: intCol }) => ({
    ...idColumn,
    gameId: intCol("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    sequence: intCol("sequence").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    period: gamePeriodEnum("period").notNull(),
    eventType: gameStatEventTypeEnum("event_type").notNull(),
    playerId: intCol("player_id").references(() => players.id, {
      onDelete: "set null",
    }),
    teamId: intCol("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    reversesEventId: intCol("reverses_event_id").references(
      (): AnyPgColumn => gameStatEvents.id,
      { onDelete: "set null" },
    ),
    relatedEventId: intCol("related_event_id").references(
      (): AnyPgColumn => gameStatEvents.id,
      { onDelete: "set null" },
    ),
    recordedBy: intCol("recorded_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  }),
  (table) => [
    uniqueIndex("game_stat_events_game_id_sequence_unique").on(
      table.gameId,
      table.sequence,
    ),
    index("game_stat_events_game_id_period_idx").on(table.gameId, table.period),
    index("game_stat_events_reverses_event_id_idx").on(table.reversesEventId),
  ],
);

export const gameStatEventsRelations = relations(gameStatEvents, ({ one }) => ({
  game: one(games, {
    fields: [gameStatEvents.gameId],
    references: [games.id],
  }),
  player: one(players, {
    fields: [gameStatEvents.playerId],
    references: [players.id],
  }),
  team: one(teams, {
    fields: [gameStatEvents.teamId],
    references: [teams.id],
  }),
  reversesEvent: one(gameStatEvents, {
    fields: [gameStatEvents.reversesEventId],
    references: [gameStatEvents.id],
    relationName: "stat_event_reversal",
  }),
  relatedEvent: one(gameStatEvents, {
    fields: [gameStatEvents.relatedEventId],
    references: [gameStatEvents.id],
    relationName: "stat_event_related",
  }),
  recorder: one(users, {
    fields: [gameStatEvents.recordedBy],
    references: [users.id],
  }),
}));

export type GameStatEvent = InferSelectModel<typeof gameStatEvents>;
