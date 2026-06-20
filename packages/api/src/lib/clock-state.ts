import { and, eq, isNull } from "drizzle-orm";

import { db, games } from "@repo/db";
import type { ClockState, GamePeriod } from "@repo/shared";
import {
  canEditClockConfigs,
  getAutoAdvancePeriod,
  getPeriodDurationSeconds,
  shouldTickShotClock,
} from "@repo/shared";

import { auditUpdate } from "./access";
import {
  getClockUpdatesForPeriodAdvance,
  getClockUpdatesForShotClockExpiry,
} from "./clock-rules";
import {
  publishClockState,
  publishBuzzer,
  publishStatsheetUpdate,
} from "./realtime-publish";
import { activeGameStatuses } from "./constants";

export function mapClockState(row: {
  quarterDurationSeconds: number;
  overtimeDurationSeconds: number;
  shotClockSeconds: number;
  gameClockMs: number;
  shotClockMs: number;
  gameClockRunning: boolean;
  shotClockRunning: boolean;
  periodStarted: boolean;
  clockUpdatedAt: Date;
}): ClockState {
  return {
    quarterDurationSeconds: row.quarterDurationSeconds,
    overtimeDurationSeconds: row.overtimeDurationSeconds,
    shotClockSeconds: row.shotClockSeconds,
    gameClockMs: row.gameClockMs,
    shotClockMs: row.shotClockMs,
    gameClockRunning: row.gameClockRunning,
    shotClockRunning: row.shotClockRunning,
    periodStarted: row.periodStarted,
    updatedAt: row.clockUpdatedAt.toISOString(),
  };
}

export async function loadClockState(
  gameId: number,
): Promise<ClockState | null> {
  const [game] = await db
    .select({
      quarterDurationSeconds: games.quarterDurationSeconds,
      overtimeDurationSeconds: games.overtimeDurationSeconds,
      shotClockSeconds: games.shotClockSeconds,
      gameClockMs: games.gameClockMs,
      shotClockMs: games.shotClockMs,
      gameClockRunning: games.gameClockRunning,
      shotClockRunning: games.shotClockRunning,
      periodStarted: games.periodStarted,
      clockUpdatedAt: games.clockUpdatedAt,
    })
    .from(games)
    .where(and(eq(games.id, gameId), isNull(games.deletedAt)))
    .limit(1);

  if (!game) {
    return null;
  }

  return mapClockState(game);
}

export async function loadCanEditClockConfigs(
  gameId: number,
): Promise<boolean> {
  const [game] = await db
    .select({
      currentPeriod: games.currentPeriod,
      quarterDurationSeconds: games.quarterDurationSeconds,
      overtimeDurationSeconds: games.overtimeDurationSeconds,
      shotClockSeconds: games.shotClockSeconds,
      gameClockMs: games.gameClockMs,
      shotClockMs: games.shotClockMs,
      gameClockRunning: games.gameClockRunning,
      shotClockRunning: games.shotClockRunning,
      periodStarted: games.periodStarted,
      clockUpdatedAt: games.clockUpdatedAt,
    })
    .from(games)
    .where(and(eq(games.id, gameId), isNull(games.deletedAt)))
    .limit(1);

  if (!game) {
    return false;
  }

  const period = (game.currentPeriod ?? "q1") as GamePeriod;

  return canEditClockConfigs(period, mapClockState(game));
}

export type ClockUpdateInput = Partial<{
  quarterDurationSeconds: number;
  overtimeDurationSeconds: number;
  shotClockSeconds: number;
  gameClockMs: number;
  shotClockMs: number;
  gameClockRunning: boolean;
  shotClockRunning: boolean;
  periodStarted: boolean;
}>;

export async function updateClockState(
  gameId: number,
  input: ClockUpdateInput,
): Promise<ClockState | null> {
  const now = new Date();

  await db
    .update(games)
    .set({
      ...input,
      clockUpdatedAt: now,
    })
    .where(and(eq(games.id, gameId), isNull(games.deletedAt)));

  return loadClockState(gameId);
}

export async function advancePeriodFromExpiredClock(
  gameId: number,
): Promise<boolean> {
  const [game] = await db
    .select({
      currentPeriod: games.currentPeriod,
      status: games.status,
      firstTeamScore: games.firstTeamScore,
      secondTeamScore: games.secondTeamScore,
      quarterDurationSeconds: games.quarterDurationSeconds,
      overtimeDurationSeconds: games.overtimeDurationSeconds,
      shotClockSeconds: games.shotClockSeconds,
      updatedBy: games.updatedBy,
    })
    .from(games)
    .where(and(eq(games.id, gameId), isNull(games.deletedAt)))
    .limit(1);

  if (!game || !activeGameStatuses.has(game.status)) {
    return false;
  }

  const currentPeriod = (game.currentPeriod ?? "q1") as GamePeriod;
  const nextPeriod = getAutoAdvancePeriod(
    currentPeriod,
    game.firstTeamScore,
    game.secondTeamScore,
  );
  if (!nextPeriod) {
    return false;
  }

  await db
    .update(games)
    .set({
      currentPeriod: nextPeriod,
      ...(game.updatedBy != null ? auditUpdate(game.updatedBy) : {}),
    })
    .where(and(eq(games.id, gameId), isNull(games.deletedAt)));

  await updateClockState(
    gameId,
    getClockUpdatesForPeriodAdvance(
      nextPeriod,
      game.quarterDurationSeconds,
      game.shotClockSeconds,
      game.overtimeDurationSeconds,
    ),
  );

  await publishStatsheetUpdate(gameId, "clock-expiry");
  await publishClockState(gameId);

  return true;
}

export async function getResetGameClockMs(
  gameId: number,
): Promise<number | null> {
  const [game] = await db
    .select({
      currentPeriod: games.currentPeriod,
      quarterDurationSeconds: games.quarterDurationSeconds,
      overtimeDurationSeconds: games.overtimeDurationSeconds,
    })
    .from(games)
    .where(and(eq(games.id, gameId), isNull(games.deletedAt)))
    .limit(1);

  if (!game) {
    return null;
  }

  const period = (game.currentPeriod ?? "q1") as GamePeriod;

  return (
    getPeriodDurationSeconds(
      period,
      game.quarterDurationSeconds,
      game.overtimeDurationSeconds,
    ) * 1000
  );
}

export async function applyClockTick(
  gameId: number,
  deltaMs: number,
): Promise<ClockState | null> {
  const [game] = await db
    .select({
      gameClockMs: games.gameClockMs,
      shotClockMs: games.shotClockMs,
      shotClockSeconds: games.shotClockSeconds,
      gameClockRunning: games.gameClockRunning,
      shotClockRunning: games.shotClockRunning,
    })
    .from(games)
    .where(and(eq(games.id, gameId), isNull(games.deletedAt)))
    .limit(1);

  if (!game) {
    return null;
  }

  if (!game.gameClockRunning && !game.shotClockRunning) {
    return loadClockState(gameId);
  }

  const nextGameClockMs = game.gameClockRunning
    ? Math.max(0, game.gameClockMs - deltaMs)
    : game.gameClockMs;

  const shouldRunShotClock =
    game.shotClockRunning &&
    shouldTickShotClock(
      nextGameClockMs,
      game.shotClockRunning
        ? Math.max(0, game.shotClockMs - deltaMs)
        : game.shotClockMs,
    );

  const nextShotClockMs = shouldRunShotClock
    ? Math.max(0, game.shotClockMs - deltaMs)
    : game.shotClockMs;

  const gameClockExpired = game.gameClockRunning && nextGameClockMs === 0;
  const shotClockExpired = shouldRunShotClock && nextShotClockMs === 0;

  if (shotClockExpired) {
    await updateClockState(
      gameId,
      getClockUpdatesForShotClockExpiry(game.shotClockSeconds, nextGameClockMs),
    );
    if (!gameClockExpired) {
      await publishBuzzer(gameId, "shot_clock");
    }
  } else {
    const gameClockRunning =
      game.gameClockRunning && nextGameClockMs > 0 ? true : false;
    const shotClockRunning = shouldRunShotClock && nextShotClockMs > 0;

    await updateClockState(gameId, {
      gameClockMs: nextGameClockMs,
      shotClockMs: nextShotClockMs,
      gameClockRunning,
      shotClockRunning,
    });
  }

  if (gameClockExpired) {
    await publishBuzzer(gameId, "game_clock");
    await advancePeriodFromExpiredClock(gameId);
  }

  return loadClockState(gameId);
}
