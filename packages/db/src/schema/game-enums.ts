import { pgEnum } from "drizzle-orm/pg-core";

export const gameStatusEnum = pgEnum("game_status", [
  "scheduled",
  "in_progress",
  "halftime",
  "final",
  "cancelled",
]);

export const gamePeriodEnum = pgEnum("game_period", [
  "q1",
  "q2",
  "q3",
  "q4",
  "ot1",
  "ot2",
  "ot3",
  "ot4",
  "ot5",
]);

export const gameStatEventTypeEnum = pgEnum("game_stat_event_type", [
  "fg2_made",
  "fg2_missed",
  "fg3_made",
  "fg3_missed",
  "ft_made",
  "ft_missed",
  "assist",
  "turnover",
  "offensive_rebound",
  "defensive_rebound",
  "personal_foul",
  "technical_foul",
  "timeout",
  "dnp_marked",
]);

export type GameStatus = (typeof gameStatusEnum.enumValues)[number];
export type GamePeriod = (typeof gamePeriodEnum.enumValues)[number];
export type GameStatEventType =
  (typeof gameStatEventTypeEnum.enumValues)[number];
