import { TRPCError } from "@trpc/server";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import { db, games, recordStatEventWithExecutor } from "@repo/db";
import type { GamePeriod, GameStatEventType, GameStatus } from "@repo/shared";
import {
  GAME_PERIODS,
  GAME_STAT_EVENT_TYPES,
  GAME_STATUSES,
} from "@repo/shared";

import { assertGameOwner, auditUpdate } from "./access";
import { loadStatsheetState } from "./statsheet-state";

export const pendingEventInput = z.object({
  eventType: z.enum(GAME_STAT_EVENT_TYPES),
  teamId: z.number().int().positive(),
  playerId: z.number().int().positive().optional(),
  period: z.enum(GAME_PERIODS),
  occurredAt: z.coerce.date(),
});

export const statsheetSyncInput = z.object({
  gameId: z.number().int().positive(),
  currentPeriod: z.enum(GAME_PERIODS).optional(),
  status: z.enum(GAME_STATUSES).optional(),
  events: z.array(pendingEventInput),
});

export type StatsheetSyncInput = z.infer<typeof statsheetSyncInput>;

export const activeGameStatuses = new Set<GameStatus>([
  "in_progress",
  "halftime",
]);

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

export async function applyStatsheetSync(
  userId: number,
  input: StatsheetSyncInput,
) {
  const game = await assertGameOwner(input.gameId, userId);

  if (input.status === "final" && !activeGameStatuses.has(game.status)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Only in-progress games can be finished",
    });
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

  const now = new Date();

  await db.transaction(async (tx) => {
    if (input.currentPeriod != null || input.status != null) {
      await tx
        .update(games)
        .set({
          ...(input.currentPeriod != null
            ? { currentPeriod: input.currentPeriod }
            : {}),
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
      });
    }
  });

  const state = await loadStatsheetState(input.gameId);

  if (!state) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Game not found",
    });
  }

  return state;
}
