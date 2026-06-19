import { TRPCError } from "@trpc/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { z } from "zod";

import { db, games, teams } from "@repo/db";

import {
  assertDistinctTeamsInLeague,
  assertGameOwner,
  assertLeagueOwner,
  auditDelete,
  auditInsert,
  auditUpdate,
} from "../lib/access";
import {
  GAME_PERIODS,
  GAME_STATUSES,
  GAME_TYPES,
  MIN_TEAMS_PER_LEAGUE,
} from "../lib/constants";
import { bootstrapGameRosters } from "../lib/game-rosters";
import { createTRPCRouter, protectedProcedure } from "../trpc";

const firstTeam = alias(teams, "first_team");
const secondTeam = alias(teams, "second_team");

const leagueIdInput = z.object({
  leagueId: z.number().int().positive(),
});

const gameIdInput = z.object({
  id: z.number().int().positive(),
});

const gameTypeSchema = z.enum(GAME_TYPES);
const gameStatusSchema = z.enum(GAME_STATUSES);

const createGameInput = z.object({
  leagueId: z.number().int().positive(),
  firstTeamId: z.number().int().positive(),
  secondTeamId: z.number().int().positive(),
  type: gameTypeSchema.optional().default("regular"),
  scheduledAt: z.coerce.date({
    required_error: "Scheduled date and time are required",
    invalid_type_error: "Scheduled date and time are required",
  }),
});

const updateGameInput = z.object({
  id: z.number().int().positive(),
  firstTeamId: z.number().int().positive(),
  secondTeamId: z.number().int().positive(),
  type: gameTypeSchema,
  status: gameStatusSchema,
  scheduledAt: z.coerce.date({
    required_error: "Scheduled date and time are required",
    invalid_type_error: "Scheduled date and time are required",
  }),
});

const editableTeamStatuses = new Set(["scheduled", "cancelled"]);

const quickStartInput = z.object({
  leagueId: z.number().int().positive(),
  firstTeamId: z.number().int().positive(),
  secondTeamId: z.number().int().positive(),
  type: gameTypeSchema.optional().default("regular"),
});

function mapGameDetail(row: {
  id: number;
  leagueId: number | null;
  firstTeamId: number | null;
  secondTeamId: number | null;
  firstTeamName: string | null;
  secondTeamName: string | null;
  type: (typeof GAME_TYPES)[number];
  status: (typeof GAME_STATUSES)[number];
  currentPeriod: (typeof GAME_PERIODS)[number] | null;
  firstTeamScore: number;
  secondTeamScore: number;
  scheduledAt: Date | null;
  startedAt: Date | null;
  endedAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: row.id,
    leagueId: row.leagueId,
    firstTeamId: row.firstTeamId,
    secondTeamId: row.secondTeamId,
    firstTeamName: row.firstTeamName,
    secondTeamName: row.secondTeamName,
    type: row.type,
    status: row.status,
    currentPeriod: row.currentPeriod,
    firstTeamScore: row.firstTeamScore,
    secondTeamScore: row.secondTeamScore,
    scheduledAt: row.scheduledAt,
    startedAt: row.startedAt,
    endedAt: row.endedAt,
    createdAt: row.createdAt,
  };
}

async function startGame(gameId: number, userId: number) {
  const game = await assertGameOwner(gameId, userId);

  if (game.status !== "scheduled" && game.status !== "cancelled") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Only scheduled games can be started",
    });
  }

  if (game.firstTeamId == null || game.secondTeamId == null) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Game teams are missing",
    });
  }

  await bootstrapGameRosters(
    gameId,
    game.firstTeamId,
    game.secondTeamId,
    userId,
  );

  const now = new Date();

  await db
    .update(games)
    .set({
      status: "in_progress",
      currentPeriod: "q1",
      startedAt: now,
      ...auditUpdate(userId),
    })
    .where(and(eq(games.id, gameId), isNull(games.deletedAt)));

  return { id: gameId };
}

function mapGameRow(row: {
  id: number;
  leagueId: number | null;
  firstTeamId: number | null;
  secondTeamId: number | null;
  firstTeamName: string | null;
  secondTeamName: string | null;
  type: (typeof GAME_TYPES)[number];
  status: (typeof GAME_STATUSES)[number];
  firstTeamScore: number;
  secondTeamScore: number;
  scheduledAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: row.id,
    leagueId: row.leagueId,
    firstTeamId: row.firstTeamId,
    secondTeamId: row.secondTeamId,
    firstTeamName: row.firstTeamName,
    secondTeamName: row.secondTeamName,
    type: row.type,
    status: row.status,
    firstTeamScore: row.firstTeamScore,
    secondTeamScore: row.secondTeamScore,
    scheduledAt: row.scheduledAt,
    createdAt: row.createdAt,
  };
}

async function fetchGameDetail(gameId: number) {
  const [row] = await db
    .select({
      id: games.id,
      leagueId: games.leagueId,
      firstTeamId: games.firstTeamId,
      secondTeamId: games.secondTeamId,
      firstTeamName: firstTeam.name,
      secondTeamName: secondTeam.name,
      type: games.type,
      status: games.status,
      currentPeriod: games.currentPeriod,
      firstTeamScore: games.firstTeamScore,
      secondTeamScore: games.secondTeamScore,
      scheduledAt: games.scheduledAt,
      startedAt: games.startedAt,
      endedAt: games.endedAt,
      createdAt: games.createdAt,
    })
    .from(games)
    .innerJoin(firstTeam, eq(games.firstTeamId, firstTeam.id))
    .innerJoin(secondTeam, eq(games.secondTeamId, secondTeam.id))
    .where(and(eq(games.id, gameId), isNull(games.deletedAt)))
    .limit(1);

  return row ? mapGameDetail(row) : null;
}

export const gamesRouter = createTRPCRouter({
  listByLeague: protectedProcedure
    .input(leagueIdInput)
    .query(async ({ ctx, input }) => {
      await assertLeagueOwner(input.leagueId, ctx.session.user.id);

      const rows = await db
        .select({
          id: games.id,
          leagueId: games.leagueId,
          firstTeamId: games.firstTeamId,
          secondTeamId: games.secondTeamId,
          firstTeamName: firstTeam.name,
          secondTeamName: secondTeam.name,
          type: games.type,
          status: games.status,
          firstTeamScore: games.firstTeamScore,
          secondTeamScore: games.secondTeamScore,
          scheduledAt: games.scheduledAt,
          createdAt: games.createdAt,
        })
        .from(games)
        .innerJoin(firstTeam, eq(games.firstTeamId, firstTeam.id))
        .innerJoin(secondTeam, eq(games.secondTeamId, secondTeam.id))
        .where(and(eq(games.leagueId, input.leagueId), isNull(games.deletedAt)))
        .orderBy(desc(games.scheduledAt), desc(games.createdAt));

      return rows.map(mapGameRow);
    }),

  create: protectedProcedure
    .input(createGameInput)
    .mutation(async ({ ctx, input }) => {
      await assertLeagueOwner(input.leagueId, ctx.session.user.id);
      await assertDistinctTeamsInLeague(
        input.leagueId,
        input.firstTeamId,
        input.secondTeamId,
      );

      const leagueTeams = await db
        .select({ id: teams.id })
        .from(teams)
        .where(
          and(eq(teams.leagueId, input.leagueId), isNull(teams.deletedAt)),
        );

      if (leagueTeams.length < MIN_TEAMS_PER_LEAGUE) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Add at least ${MIN_TEAMS_PER_LEAGUE} teams before scheduling games`,
        });
      }

      const [game] = await db
        .insert(games)
        .values({
          leagueId: input.leagueId,
          firstTeamId: input.firstTeamId,
          secondTeamId: input.secondTeamId,
          type: input.type,
          scheduledAt: input.scheduledAt,
          ...auditInsert(ctx.session.user.id),
        })
        .returning({
          id: games.id,
          leagueId: games.leagueId,
          firstTeamId: games.firstTeamId,
          secondTeamId: games.secondTeamId,
          type: games.type,
          status: games.status,
          firstTeamScore: games.firstTeamScore,
          secondTeamScore: games.secondTeamScore,
          scheduledAt: games.scheduledAt,
          createdAt: games.createdAt,
        });

      if (!game) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create game",
        });
      }

      const [first] = await db
        .select({ name: teams.name })
        .from(teams)
        .where(eq(teams.id, game.firstTeamId!))
        .limit(1);
      const [second] = await db
        .select({ name: teams.name })
        .from(teams)
        .where(eq(teams.id, game.secondTeamId!))
        .limit(1);

      return mapGameRow({
        ...game,
        firstTeamName: first?.name ?? null,
        secondTeamName: second?.name ?? null,
      });
    }),

  update: protectedProcedure
    .input(updateGameInput)
    .mutation(async ({ ctx, input }) => {
      const game = await assertGameOwner(input.id, ctx.session.user.id);

      if (game.leagueId == null) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found",
        });
      }

      const teamsChanged =
        input.firstTeamId !== game.firstTeamId ||
        input.secondTeamId !== game.secondTeamId;

      if (teamsChanged && !editableTeamStatuses.has(game.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Teams can only be changed for scheduled or cancelled games",
        });
      }

      if (teamsChanged) {
        await assertDistinctTeamsInLeague(
          game.leagueId,
          input.firstTeamId,
          input.secondTeamId,
        );
      }

      const [updated] = await db
        .update(games)
        .set({
          firstTeamId: input.firstTeamId,
          secondTeamId: input.secondTeamId,
          type: input.type,
          status: input.status,
          scheduledAt: input.scheduledAt,
          ...auditUpdate(ctx.session.user.id),
        })
        .where(and(eq(games.id, input.id), isNull(games.deletedAt)))
        .returning({
          id: games.id,
          leagueId: games.leagueId,
          firstTeamId: games.firstTeamId,
          secondTeamId: games.secondTeamId,
          type: games.type,
          status: games.status,
          firstTeamScore: games.firstTeamScore,
          secondTeamScore: games.secondTeamScore,
          scheduledAt: games.scheduledAt,
          createdAt: games.createdAt,
        });

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found",
        });
      }

      const [row] = await db
        .select({
          id: games.id,
          leagueId: games.leagueId,
          firstTeamId: games.firstTeamId,
          secondTeamId: games.secondTeamId,
          firstTeamName: firstTeam.name,
          secondTeamName: secondTeam.name,
          type: games.type,
          status: games.status,
          firstTeamScore: games.firstTeamScore,
          secondTeamScore: games.secondTeamScore,
          scheduledAt: games.scheduledAt,
          createdAt: games.createdAt,
        })
        .from(games)
        .innerJoin(firstTeam, eq(games.firstTeamId, firstTeam.id))
        .innerJoin(secondTeam, eq(games.secondTeamId, secondTeam.id))
        .where(eq(games.id, input.id))
        .limit(1);

      if (!row) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found",
        });
      }

      return mapGameRow(row);
    }),

  getById: protectedProcedure
    .input(gameIdInput)
    .query(async ({ ctx, input }) => {
      await assertGameOwner(input.id, ctx.session.user.id);

      const game = await fetchGameDetail(input.id);

      if (!game) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found",
        });
      }

      return game;
    }),

  start: protectedProcedure
    .input(gameIdInput)
    .mutation(async ({ ctx, input }) => {
      return startGame(input.id, ctx.session.user.id);
    }),

  quickStart: protectedProcedure
    .input(quickStartInput)
    .mutation(async ({ ctx, input }) => {
      await assertLeagueOwner(input.leagueId, ctx.session.user.id);
      await assertDistinctTeamsInLeague(
        input.leagueId,
        input.firstTeamId,
        input.secondTeamId,
      );

      const [game] = await db
        .insert(games)
        .values({
          leagueId: input.leagueId,
          firstTeamId: input.firstTeamId,
          secondTeamId: input.secondTeamId,
          type: input.type,
          scheduledAt: new Date(),
          ...auditInsert(ctx.session.user.id),
        })
        .returning({ id: games.id });

      if (!game) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create game",
        });
      }

      await startGame(game.id, ctx.session.user.id);

      return { id: game.id, leagueId: input.leagueId };
    }),

  delete: protectedProcedure
    .input(gameIdInput)
    .mutation(async ({ ctx, input }) => {
      await assertGameOwner(input.id, ctx.session.user.id);

      const [deleted] = await db
        .update(games)
        .set(auditDelete(ctx.session.user.id))
        .where(and(eq(games.id, input.id), isNull(games.deletedAt)))
        .returning({ id: games.id });

      if (!deleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found",
        });
      }

      return deleted;
    }),
});
