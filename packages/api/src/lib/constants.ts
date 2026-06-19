export const MIN_TEAMS_PER_LEAGUE = 2;
export const MAX_PLAYERS_PER_TEAM = 15;

export {
  DEFAULT_TEAM_COLOR,
  TEAM_COLOR_PRESETS,
  teamColorSchema,
} from "./team-colors";
export {
  GAME_PERIODS,
  GAME_STAT_EVENT_TYPES,
  GAME_STATUSES,
  type GamePeriod,
  type GameStatEventType,
  type GameStatus,
} from "@repo/shared";

export const GAME_TYPES = [
  "regular",
  "playoffs",
  "exhibition",
  "finals",
] as const;

export type GameType = (typeof GAME_TYPES)[number];
