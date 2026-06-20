import { TRPCError } from "@trpc/server";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import {
  db,
  gameRosters,
  gameStatEvents,
  games,
  players,
  reverseStatEvent,
} from "@repo/db";
import {
  GAME_PERIODS,
  getPeriodDurationSeconds,
  type GamePeriod,
} from "@repo/shared";

import { assertGameOwner, auditInsert, auditUpdate } from "../lib/access";
import { loadCanEditClockConfigs } from "../lib/clock-state";
import { activeGameStatuses } from "../lib/constants";
import { loadStatsheetState } from "../lib/statsheet-state";
import {
  publishClockState,
  publishStatsheetUpdate,
} from "../lib/realtime-publish";
import {
  applyStatsheetSync,
  pendingEventInput,
  statsheetSyncInput,
} from "../lib/statsheet-sync";
import { createTRPCRouter, protectedProcedure } from "../trpc";

const gameIdInput = z.object({
  gameId: z.number().int().positive(),
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

const finishInput = z.object({
  gameId: z.number().int().positive(),
  currentPeriod: z.enum(GAME_PERIODS).optional(),
  events: z.array(pendingEventInput),
});

const updateRulesInput = z.object({
  gameId: z.number().int().positive(),
  timeoutsPerQuarter: z.number().int().min(0).max(10).optional(),
  foulsBeforeBonus: z.number().int().min(1).max(15).optional(),
  quarterDurationSeconds: z.number().int().min(60).max(3600).optional(),
  overtimeDurationSeconds: z.number().int().min(60).max(3600).optional(),
});

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

  sync: protectedProcedure
    .input(statsheetSyncInput)
    .mutation(async ({ ctx, input }) => {
      const { sourceId, ...syncInput } = input;
      return applyStatsheetSync(ctx.session.user.id, syncInput, sourceId);
    }),

  finish: protectedProcedure
    .input(finishInput.extend({ sourceId: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { sourceId, ...finishPayload } = input;
      return applyStatsheetSync(
        ctx.session.user.id,
        {
          ...finishPayload,
          status: "final",
        },
        sourceId,
      );
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

      await publishStatsheetUpdate(input.gameId);

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

      await publishStatsheetUpdate(input.gameId);

      return state;
    }),

  updateRules: protectedProcedure
    .input(updateRulesInput)
    .mutation(async ({ ctx, input }) => {
      await assertGameOwner(input.gameId, ctx.session.user.id);

      if (!(await loadCanEditClockConfigs(input.gameId))) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Game settings can only be changed at the start of a quarter with clocks stopped",
        });
      }

      if (
        input.timeoutsPerQuarter == null &&
        input.foulsBeforeBonus == null &&
        input.quarterDurationSeconds == null &&
        input.overtimeDurationSeconds == null
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No rule changes provided",
        });
      }

      const [game] = await db
        .select({
          currentPeriod: games.currentPeriod,
          quarterDurationSeconds: games.quarterDurationSeconds,
          overtimeDurationSeconds: games.overtimeDurationSeconds,
        })
        .from(games)
        .where(and(eq(games.id, input.gameId), isNull(games.deletedAt)))
        .limit(1);

      if (!game) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found",
        });
      }

      const quarterDurationSeconds =
        input.quarterDurationSeconds ?? game.quarterDurationSeconds;
      const overtimeDurationSeconds =
        input.overtimeDurationSeconds ?? game.overtimeDurationSeconds;
      const period = (game.currentPeriod ?? "q1") as GamePeriod;
      const gameClockMs =
        getPeriodDurationSeconds(
          period,
          quarterDurationSeconds,
          overtimeDurationSeconds,
        ) * 1000;
      const now = new Date();

      await db
        .update(games)
        .set({
          ...(input.quarterDurationSeconds != null
            ? { quarterDurationSeconds: input.quarterDurationSeconds }
            : {}),
          ...(input.overtimeDurationSeconds != null
            ? { overtimeDurationSeconds: input.overtimeDurationSeconds }
            : {}),
          ...(input.timeoutsPerQuarter != null
            ? { timeoutsPerQuarter: input.timeoutsPerQuarter }
            : {}),
          ...(input.foulsBeforeBonus != null
            ? { foulsBeforeBonus: input.foulsBeforeBonus }
            : {}),
          gameClockMs,
          gameClockRunning: false,
          shotClockRunning: false,
          clockUpdatedAt: now,
          ...auditUpdate(ctx.session.user.id),
        })
        .where(and(eq(games.id, input.gameId), isNull(games.deletedAt)));

      const state = await loadStatsheetState(input.gameId);

      if (!state) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found",
        });
      }

      await publishStatsheetUpdate(input.gameId);
      await publishClockState(input.gameId);

      return state;
    }),
});
