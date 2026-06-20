import { GAME_PERIODS, type GamePeriod } from "./stat-enums";

const REGULATION_PERIOD_COUNT = 4;
const OT1_INDEX = REGULATION_PERIOD_COUNT;

export const DEFAULT_OVERTIME_DURATION_SECONDS = 300;

export function isOvertimePeriod(period: GamePeriod): boolean {
  return getGamePeriodIndex(period) >= OT1_INDEX;
}

export function getPeriodDurationSeconds(
  period: GamePeriod,
  quarterDurationSeconds: number,
  overtimeDurationSeconds = DEFAULT_OVERTIME_DURATION_SECONDS,
): number {
  return isOvertimePeriod(period)
    ? overtimeDurationSeconds
    : quarterDurationSeconds;
}

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

export function getAutoAdvancePeriod(
  currentPeriod: GamePeriod,
  firstTeamScore: number,
  secondTeamScore: number,
): GamePeriod | null {
  const index = getGamePeriodIndex(currentPeriod);
  if (index === -1) {
    return null;
  }

  const isTied = firstTeamScore === secondTeamScore;

  if (index < REGULATION_PERIOD_COUNT - 1) {
    return getNextGamePeriod(currentPeriod);
  }

  if (isTied) {
    return getNextGamePeriod(currentPeriod);
  }

  return null;
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
