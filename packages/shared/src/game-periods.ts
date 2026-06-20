import { GAME_PERIODS, type GamePeriod } from "./stat-enums";

const REGULATION_PERIOD_COUNT = 4;
const OT1_INDEX = REGULATION_PERIOD_COUNT;

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

export function getVisibleGamePeriods(
  currentPeriod: GamePeriod,
  nextPeriod: GamePeriod | null = getNextGamePeriod(currentPeriod),
): GamePeriod[] {
  const regulation = GAME_PERIODS.slice(0, REGULATION_PERIOD_COUNT);
  const currentIndex = getGamePeriodIndex(currentPeriod);

  if (currentIndex >= OT1_INDEX) {
    const lastOtIndex =
      nextPeriod != null && getGamePeriodIndex(nextPeriod) >= OT1_INDEX
        ? getGamePeriodIndex(nextPeriod)
        : currentIndex;
    return [...regulation, ...GAME_PERIODS.slice(OT1_INDEX, lastOtIndex + 1)];
  }

  if (nextPeriod != null && getGamePeriodIndex(nextPeriod) >= OT1_INDEX) {
    return [...regulation, nextPeriod];
  }

  return [...regulation];
}

export function isFinishableGamePeriod(period: GamePeriod): boolean {
  return getGamePeriodIndex(period) >= REGULATION_PERIOD_COUNT - 1;
}
