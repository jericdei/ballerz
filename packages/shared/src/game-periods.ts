import { GAME_PERIODS, type GamePeriod } from "./stat-enums";

export function getGamePeriodIndex(period: GamePeriod) {
  return GAME_PERIODS.indexOf(period);
}

export function getNextGamePeriod(period: GamePeriod): GamePeriod | null {
  const index = getGamePeriodIndex(period);
  if (index === -1 || index >= GAME_PERIODS.length - 1) {
    return null;
  }
  return GAME_PERIODS[index + 1] ?? null;
}
