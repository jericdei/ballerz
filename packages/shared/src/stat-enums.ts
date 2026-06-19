export const GAME_STATUSES = [
  "scheduled",
  "in_progress",
  "halftime",
  "final",
  "cancelled",
] as const;

export const GAME_PERIODS = [
  "q1",
  "q2",
  "q3",
  "q4",
  "ot1",
  "ot2",
  "ot3",
  "ot4",
  "ot5",
] as const;

export const GAME_STAT_EVENT_TYPES = [
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
  "steal",
  "block",
  "timeout",
  "dnp_marked",
] as const;

export type GameStatus = (typeof GAME_STATUSES)[number];
export type GamePeriod = (typeof GAME_PERIODS)[number];
export type GameStatEventType = (typeof GAME_STAT_EVENT_TYPES)[number];
