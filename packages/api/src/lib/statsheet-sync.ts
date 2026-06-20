import { TRPCError } from "@trpc/server";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import { db, games, recordStatEventWithExecutor } from "@repo/db";
import type { GamePeriod, GameStatEventType, GameStatus } from "@repo/shared";
import {
  GAME_PERIODS,
  GAME_STAT_EVENT_TYPES,
  GAME_STATUSES,
  getGamePeriodIndex,
  isFinishableGamePeriod,
} from "@repo/shared";

import { assertGameOwner, auditUpdate } from "./access";
import { activeGameStatuses } from "./constants";
import {
  getClockUpdatesForGameFinish,
  getClockUpdatesForPeriodAdvance,
  getClockUpdatesForStatEvent,
} from "./clock-rules";
import { updateClockState } from "./clock-state";
import { loadStatsheetState } from "./statsheet-state";
import {
  publishBuzzer,
  publishClockState,
  publishStatsheetUpdate,
} from "./realtime-publish";

export const pendingEventInput = z.object({
  clientId: z.string().uuid(),
  eventType: z.enum(GAME_STAT_EVENT_TYPES),
  teamId: z.number().int().positive(),
  playerId: z.number().int().positive().optional(),
  period: z.enum(GAME_PERIODS),
  occurredAt: z.coerce.date(),
  gameClockMs: z.number().int().min(0),
});

export const statsheetSyncInput = z.object({
  gameId: z.number().int().positive(),
  currentPeriod: z.enum(GAME_PERIODS).optional(),
  status: z.enum(GAME_STATUSES).optional(),
  events: z.array(pendingEventInput),
  sourceId: z.string().optional(),
});

export type StatsheetSyncInput = z.infer<typeof statsheetSyncInput>;

async function validatePendingEvent(
  gameId: number,
  game: {
    firstTeamId: number | null;
    secondTeamId: number | null;
  },
  event: z.infer<typeof pendingEventInput>,
) {
  if (event.teamId !== game.firstTeamId && event.teamId !== game.secondTeamId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Team is not part of this game",
    });
  }

  if (event.eventType === "timeout") {
    return;
  }

  if (event.playerId == null) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Player is required for ${event.eventType}`,
    });
  }

  const state = await loadStatsheetState(gameId);
  const rosterPlayer = state?.rosters.find(
    (row) => row.playerId === event.playerId,
  );

  if (!rosterPlayer) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Player is not on the game roster",
    });
  }

  if (rosterPlayer.isDnp) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Player is marked DNP for this game",
    });
  }

  if (rosterPlayer.teamId !== event.teamId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Player is not on the selected team",
    });
  }
}

async function validateTimeoutLimits(
  gameId: number,
  events: z.infer<typeof pendingEventInput>[],
) {
  const timeoutEvents = events.filter((event) => event.eventType === "timeout");
  if (timeoutEvents.length === 0) {
    return;
  }

  const state = await loadStatsheetState(gameId);
  if (!state) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Game not found",
    });
  }

  const counts = new Map<string, number>();
  for (const row of state.teamPeriodStats) {
    counts.set(`${row.teamId}:${row.period}`, row.timeoutsUsed);
  }

  for (const event of timeoutEvents) {
    const key = `${event.teamId}:${event.period}`;
    const nextCount = (counts.get(key) ?? 0) + 1;
    if (nextCount > state.game.timeoutsPerQuarter) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Team has already used all ${state.game.timeoutsPerQuarter} timeouts this quarter`,
      });
    }
    counts.set(key, nextCount);
  }
}

export async function applyStatsheetSync(
  userId: number,
  input: StatsheetSyncInput,
  sourceId?: string,
) {
  const game = await assertGameOwner(input.gameId, userId);

  if (input.status === "final" && !activeGameStatuses.has(game.status)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Only in-progress games can be finished",
    });
  }

  if (input.status === "final") {
    const finishPeriod = (input.currentPeriod ??
      game.currentPeriod ??
      "q1") as GamePeriod;

    if (!isFinishableGamePeriod(finishPeriod)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Game can only be finished in the 4th quarter or overtime",
      });
    }
  }

  if (input.events.length > 0 && !activeGameStatuses.has(game.status)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Stats can only be recorded for in-progress games",
    });
  }

  for (const event of input.events) {
    await validatePendingEvent(input.gameId, game, event);
  }

  await validateTimeoutLimits(input.gameId, input.events);

  if (input.currentPeriod != null) {
    const savedPeriod = (game.currentPeriod ?? "q1") as GamePeriod;
    const savedIndex = getGamePeriodIndex(savedPeriod);
    const nextIndex = getGamePeriodIndex(input.currentPeriod);

    if (nextIndex < savedIndex) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cannot go back to a previous period",
      });
    }

    if (nextIndex > savedIndex + 1) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Can only advance one period at a time",
      });
    }
  }

  const savedPeriod = (game.currentPeriod ?? "q1") as GamePeriod;
  const periodAdvanced =
    input.currentPeriod != null && input.currentPeriod !== savedPeriod;

  const now = new Date();
  let clockUpdatesApplied = false;

  await db.transaction(async (tx) => {
    if (periodAdvanced || input.status != null) {
      await tx
        .update(games)
        .set({
          ...(periodAdvanced ? { currentPeriod: input.currentPeriod } : {}),
          ...(input.status != null ? { status: input.status } : {}),
          ...(input.status === "final" ? { endedAt: now } : {}),
          ...auditUpdate(userId),
        })
        .where(and(eq(games.id, input.gameId), isNull(games.deletedAt)));
    }

    for (const event of input.events) {
      await recordStatEventWithExecutor(tx, {
        gameId: input.gameId,
        period: event.period as GamePeriod,
        eventType: event.eventType as GameStatEventType,
        teamId: event.teamId,
        playerId: event.playerId ?? null,
        recordedBy: userId,
        occurredAt: event.occurredAt,
        gameClockMs: event.gameClockMs,
        clientId: event.clientId,
      });
    }
  });

  const [clockRow] = await db
    .select({
      quarterDurationSeconds: games.quarterDurationSeconds,
      overtimeDurationSeconds: games.overtimeDurationSeconds,
      shotClockSeconds: games.shotClockSeconds,
      gameClockMs: games.gameClockMs,
      shotClockMs: games.shotClockMs,
    })
    .from(games)
    .where(and(eq(games.id, input.gameId), isNull(games.deletedAt)))
    .limit(1);

  if (clockRow) {
    let clockPatch = {};

    if (input.status === "final") {
      clockPatch = getClockUpdatesForGameFinish();
      clockUpdatesApplied = true;
    } else if (periodAdvanced && input.currentPeriod != null) {
      clockPatch = getClockUpdatesForPeriodAdvance(
        input.currentPeriod,
        clockRow.quarterDurationSeconds,
        clockRow.shotClockSeconds,
        clockRow.overtimeDurationSeconds,
      );
      clockUpdatesApplied = true;
    }

    for (const event of input.events) {
      const eventClockPatch = getClockUpdatesForStatEvent(
        event.eventType as GameStatEventType,
        clockRow.shotClockSeconds,
        clockRow.gameClockMs,
        clockRow.shotClockMs,
      );
      if (Object.keys(eventClockPatch).length > 0) {
        clockPatch = { ...clockPatch, ...eventClockPatch };
        clockUpdatesApplied = true;
      }
    }

    if (Object.keys(clockPatch).length > 0) {
      await updateClockState(input.gameId, clockPatch);
    }
  }

  const state = await loadStatsheetState(input.gameId);

  if (!state) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Game not found",
    });
  }

  await publishStatsheetUpdate(input.gameId, sourceId);
  if (clockUpdatesApplied) {
    await publishClockState(input.gameId);
  }

  if (input.events.some((event) => event.eventType === "timeout")) {
    await publishBuzzer(input.gameId, "timeout");
  }

  return state;
}
