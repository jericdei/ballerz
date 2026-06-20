import type { GameStatus } from "@repo/shared";

const ACTIVE_GAME_STATUSES = new Set<GameStatus>(["in_progress", "halftime"]);

export function isActiveGameStatus(status: GameStatus) {
  return ACTIVE_GAME_STATUSES.has(status);
}
