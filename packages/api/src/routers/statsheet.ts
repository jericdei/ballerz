import { TRPCError } from "@trpc/server";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import {
  db,
  gameRosters,
  games,
  gameStatEvents,
  players,
  recordStatEventWithExecutor,
  reverseStatEvent,
} from "@repo/db";
import type { GamePeriod, GameStatEventType } from "@repo/shared";
import {
  GAME_PERIODS,
  GAME_STAT_EVENT_TYPES,
  GAME_STATUSES,
} from "@repo/shared";

import { assertGameOwner, auditInsert, auditUpdate } from "../lib/access";
import { loadStatsheetState } from "../lib/statsheet-state";
import { createTRPCRouter, protectedProcedure } from "../trpc";

const gameIdInput = z.object({
  gameId: z.number().int().positive(),
});

const pendingEventInput = z.object({
  eventType: z.enum(GAME_STAT_EVENT_TYPES),
  teamId: z.number().int().positive(),
  playerId: z.number().int().positive().optional(),
  period: z.enum(GAME_PERIODS),
  occurredAt: z.coerce.date(),
});

const syncInput = z.object({
  gameId: z.number().int().positive(),
  currentPeriod: z.enum(GAME_PERIODS).optional(),
  status: z.enum(GAME_STATUSES).optional(),
  events: z.array(pendingEventInput),
});

const reverseInput = z.object({
  gameId: z.number().int().positive(),
  eventId: z.number().int().positive(),
});

const addGuestPlayerInput = z.object({
  gameId: z.number().int().positive(),
  teamId: z.number().int().positive(),
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  number: z.number().int().min(0).max(99),
  position: z.string().trim().optional(),
});

const activeGameStatuses = new Set(["in_progress", "halftime"]);

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

export const statsheetRouter = createTRPCRouter({
  getState: protectedProcedure
    .input(gameIdInput)
    .query(async ({ ctx, input }) => {
      await assertGameOwner(input.gameId, ctx.session.user.id);

      const state = await loadStatsheetState(input.gameId);

      if (!state) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found",
        });
      }

      return state;
    }),

  sync: protectedProcedure.input(syncInput).mutation(async ({ ctx, input }) => {
    const game = await assertGameOwner(input.gameId, ctx.session.user.id);

    if (input.events.length > 0 && !activeGameStatuses.has(game.status)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Stats can only be recorded for in-progress games",
      });
    }

    for (const event of input.events) {
      await validatePendingEvent(input.gameId, game, event);
    }

    await db.transaction(async (tx) => {
      if (input.currentPeriod != null || input.status != null) {
        await tx
          .update(games)
          .set({
            ...(input.currentPeriod != null
              ? { currentPeriod: input.currentPeriod }
              : {}),
            ...(input.status != null ? { status: input.status } : {}),
            ...auditUpdate(ctx.session.user.id),
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
          recordedBy: ctx.session.user.id,
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
  }),

  reverse: protectedProcedure
    .input(reverseInput)
    .mutation(async ({ ctx, input }) => {
      const game = await assertGameOwner(input.gameId, ctx.session.user.id);

      if (!activeGameStatuses.has(game.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Stats can only be reversed for in-progress games",
        });
      }

      const [event] = await db
        .select({
          id: gameStatEvents.id,
          gameId: gameStatEvents.gameId,
        })
        .from(gameStatEvents)
        .where(eq(gameStatEvents.id, input.eventId))
        .limit(1);

      if (!event || event.gameId !== input.gameId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Stat event not found",
        });
      }

      try {
        await reverseStatEvent(db, {
          eventId: input.eventId,
          recordedBy: ctx.session.user.id,
        });
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            error instanceof Error ? error.message : "Failed to reverse event",
        });
      }

      const state = await loadStatsheetState(input.gameId);

      if (!state) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found",
        });
      }

      return state;
    }),

  addGuestPlayer: protectedProcedure
    .input(addGuestPlayerInput)
    .mutation(async ({ ctx, input }) => {
      const game = await assertGameOwner(input.gameId, ctx.session.user.id);

      if (!activeGameStatuses.has(game.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Guest players can only be added during in-progress games",
        });
      }

      if (
        input.teamId !== game.firstTeamId &&
        input.teamId !== game.secondTeamId
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Team is not part of this game",
        });
      }

      const [existingJersey] = await db
        .select({ playerId: gameRosters.playerId })
        .from(gameRosters)
        .innerJoin(players, eq(gameRosters.playerId, players.id))
        .where(
          and(
            eq(gameRosters.gameId, input.gameId),
            eq(gameRosters.teamId, input.teamId),
            eq(players.number, input.number),
            isNull(gameRosters.deletedAt),
            isNull(players.deletedAt),
          ),
        )
        .limit(1);

      if (existingJersey) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Jersey number ${input.number} is already taken on this team for this game`,
        });
      }

      await db.transaction(async (tx) => {
        const [guest] = await tx
          .insert(players)
          .values({
            teamId: input.teamId,
            firstName: input.firstName,
            lastName: input.lastName,
            number: input.number,
            position: input.position ?? null,
            isCaptain: false,
            createdForGameId: input.gameId,
            ...auditInsert(ctx.session.user.id),
          })
          .returning({ id: players.id });

        if (!guest) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create guest player",
          });
        }

        await tx.insert(gameRosters).values({
          gameId: input.gameId,
          playerId: guest.id,
          teamId: input.teamId,
          isDnp: false,
          isStarter: false,
          ...auditInsert(ctx.session.user.id),
        });
      });

      const state = await loadStatsheetState(input.gameId);

      if (!state) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found",
        });
      }

      return state;
    }),
});
