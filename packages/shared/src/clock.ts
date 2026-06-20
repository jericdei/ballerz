import type { GamePeriod } from "./stat-enums";
import { getPeriodDurationSeconds } from "./game-periods";
import type { ClockState } from "./realtime";

export const SHOT_CLOCK_CUTOFF_MS = 24_000;

/** Game clock above 24s — shot clock presets/resets allowed. */
export function isShotClockEligible(gameClockMs: number): boolean {
  return gameClockMs > SHOT_CLOCK_CUTOFF_MS;
}

/**
 * While the shot clock is running:
 * - GC > 24s → keep ticking
 * - GC <= 24s and GC > SC → keep ticking (run out below 24)
 * - otherwise → stop without buzzer
 */
export function shouldTickShotClock(
  gameClockMs: number,
  shotClockMs: number,
): boolean {
  if (gameClockMs > SHOT_CLOCK_CUTOFF_MS) {
    return true;
  }

  return gameClockMs > shotClockMs;
}

/** @deprecated Use shouldTickShotClock — inverted for call-site compatibility. */
export function isShotClockSuppressed(
  gameClockMs: number,
  shotClockMs: number,
): boolean {
  return !shouldTickShotClock(gameClockMs, shotClockMs);
}

/** Whether the shot clock should be shown on screen. */
export function isShotClockDisplayed(clock: ClockState): boolean {
  if (clock.shotClockRunning) {
    return shouldTickShotClock(clock.gameClockMs, clock.shotClockMs);
  }

  // Stopped with GC <= 24 → off
  if (clock.gameClockMs <= SHOT_CLOCK_CUTOFF_MS) {
    return false;
  }

  return clock.gameClockMs > clock.shotClockMs;
}

/** Whether the shot clock may be started. */
export function canStartShotClock(clock: ClockState): boolean {
  if (clock.gameClockMs <= SHOT_CLOCK_CUTOFF_MS) {
    return false;
  }

  return clock.gameClockMs > clock.shotClockMs;
}

export function isPeriodAtStart(
  period: GamePeriod,
  clock: ClockState,
): boolean {
  const durationMs =
    getPeriodDurationSeconds(
      period,
      clock.quarterDurationSeconds,
      clock.overtimeDurationSeconds,
    ) * 1000;

  return (
    !clock.gameClockRunning &&
    !clock.shotClockRunning &&
    clock.gameClockMs === durationMs
  );
}

export function canEditClockConfigs(
  period: GamePeriod,
  clock: ClockState,
): boolean {
  return isPeriodAtStart(period, clock) && !clock.periodStarted;
}
