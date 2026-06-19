import { TRPCError } from "@trpc/server";
import { and, count, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import { db, players } from "@repo/db";

import { assertTeamOwner, auditInsert } from "../lib/access";
import { MAX_PLAYERS_PER_TEAM } from "../lib/constants";
import { createTRPCRouter, protectedProcedure } from "../trpc";

const teamIdInput = z.object({
  teamId: z.number().int().positive(),
});

const createPlayerInput = z.object({
  teamId: z.number().int().positive(),
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  number: z.number().int().min(0).max(99),
  position: z.string().trim().optional(),
  isCaptain: z.boolean().optional().default(false),
});

export const playersRouter = createTRPCRouter({
  listByTeam: protectedProcedure
    .input(teamIdInput)
    .query(async ({ ctx, input }) => {
      await assertTeamOwner(input.teamId, ctx.session.user.id);

      return db
        .select({
          id: players.id,
          teamId: players.teamId,
          firstName: players.firstName,
          lastName: players.lastName,
          number: players.number,
          position: players.position,
          isCaptain: players.isCaptain,
          createdAt: players.createdAt,
        })
        .from(players)
        .where(and(eq(players.teamId, input.teamId), isNull(players.deletedAt)))
        .orderBy(players.number);
    }),

  create: protectedProcedure
    .input(createPlayerInput)
    .mutation(async ({ ctx, input }) => {
      await assertTeamOwner(input.teamId, ctx.session.user.id);

      const [playerCountResult] = await db
        .select({ count: count(players.id) })
        .from(players)
        .where(
          and(eq(players.teamId, input.teamId), isNull(players.deletedAt)),
        );

      const playerCount = Number(playerCountResult?.count ?? 0);

      if (playerCount >= MAX_PLAYERS_PER_TEAM) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `A team can have at most ${MAX_PLAYERS_PER_TEAM} players`,
        });
      }

      const [existingNumber] = await db
        .select({ id: players.id })
        .from(players)
        .where(
          and(
            eq(players.teamId, input.teamId),
            eq(players.number, input.number),
            isNull(players.deletedAt),
          ),
        )
        .limit(1);

      if (existingNumber) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Jersey number ${input.number} is already taken on this team`,
        });
      }

      const [player] = await db
        .insert(players)
        .values({
          teamId: input.teamId,
          firstName: input.firstName,
          lastName: input.lastName,
          number: input.number,
          position: input.position ?? null,
          isCaptain: input.isCaptain,
          ...auditInsert(ctx.session.user.id),
        })
        .returning({
          id: players.id,
          teamId: players.teamId,
          firstName: players.firstName,
          lastName: players.lastName,
          number: players.number,
          position: players.position,
          isCaptain: players.isCaptain,
          createdAt: players.createdAt,
        });

      if (!player) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create player",
        });
      }

      return player;
    }),
});
