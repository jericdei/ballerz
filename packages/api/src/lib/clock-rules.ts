import type { GameStatEventType } from "@repo/shared";
import {
  getPeriodDurationSeconds,
  shouldTickShotClock,
  type GamePeriod,
} from "@repo/shared";

import type { ClockUpdateInput } from "./clock-state";

const SCORING_EVENTS = new Set<GameStatEventType>([
  "fg2_made",
  "fg3_made",
  "ft_made",
]);

const FOUL_EVENTS = new Set<GameStatEventType>([
  "personal_foul",
  "technical_foul",
]);

function getSuppressedShotClockUpdates(
  gameClockMs: number,
  shotClockMs: number,
): ClockUpdateInput {
  if (!shouldTickShotClock(gameClockMs, shotClockMs)) {
    return { shotClockRunning: false };
  }

  return {};
}

export function getClockUpdatesForStatEvent(
  eventType: GameStatEventType,
  shotClockSeconds: number,
  gameClockMs: number,
  shotClockMs: number,
): ClockUpdateInput {
  if (eventType === "timeout") {
    return {
      gameClockRunning: false,
      ...getSuppressedShotClockUpdates(gameClockMs, shotClockMs),
    };
  }

  if (FOUL_EVENTS.has(eventType)) {
    return {
      gameClockRunning: false,
      shotClockRunning: false,
    };
  }

  if (SCORING_EVENTS.has(eventType)) {
    const nextShotClockMs = shotClockSeconds * 1000;

    return {
      shotClockMs: nextShotClockMs,
      ...getSuppressedShotClockUpdates(gameClockMs, nextShotClockMs),
    };
  }

  return {};
}

export function getClockUpdatesForShotClockExpiry(
  shotClockSeconds: number,
  gameClockMs: number,
): ClockUpdateInput {
  return {
    gameClockMs,
    gameClockRunning: false,
    shotClockMs: shotClockSeconds * 1000,
    shotClockRunning: false,
  };
}

export function getClockUpdatesForPeriodAdvance(
  period: GamePeriod,
  quarterDurationSeconds: number,
  shotClockSeconds: number,
  overtimeDurationSeconds: number,
): ClockUpdateInput {
  return {
    gameClockMs:
      getPeriodDurationSeconds(
        period,
        quarterDurationSeconds,
        overtimeDurationSeconds,
      ) * 1000,
    shotClockMs: shotClockSeconds * 1000,
    gameClockRunning: false,
    shotClockRunning: false,
    periodStarted: false,
  };
}

export function getClockUpdatesForGameFinish(): ClockUpdateInput {
  return {
    gameClockRunning: false,
    shotClockRunning: false,
  };
}
