export const MIN_TEAMS_PER_LEAGUE = 2;
export const MAX_PLAYERS_PER_TEAM = 15;

export const GAME_TYPES = [
  "regular",
  "playoffs",
  "exhibition",
  "finals",
] as const;

export const GAME_STATUSES = [
  "scheduled",
  "in_progress",
  "halftime",
  "final",
  "cancelled",
] as const;

export type GameType = (typeof GAME_TYPES)[number];
export type GameStatus = (typeof GAME_STATUSES)[number];
