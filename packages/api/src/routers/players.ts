import { TRPCError } from "@trpc/server";
import { and, count, eq, isNull, ne } from "drizzle-orm";
import { z } from "zod";

import { db, players } from "@repo/db";

import {
  assertPlayerOwner,
  assertTeamOwner,
  auditDelete,
  auditInsert,
  auditUpdate,
} from "../lib/access";
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

const playerIdInput = z.object({
  id: z.number().int().positive(),
});

const updatePlayerInput = z.object({
  id: z.number().int().positive(),
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
        .where(
          and(
            eq(players.teamId, input.teamId),
            isNull(players.deletedAt),
            isNull(players.createdForGameId),
          ),
        )
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
          and(
            eq(players.teamId, input.teamId),
            isNull(players.deletedAt),
            isNull(players.createdForGameId),
          ),
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
            isNull(players.createdForGameId),
          ),
        )
        .limit(1);

      if (existingNumber) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Jersey number ${input.number} is already taken on this team`,
        });
      }

      const [player] = await db.transaction(async (tx) => {
        if (input.isCaptain) {
          await tx
            .update(players)
            .set({
              isCaptain: false,
              ...auditUpdate(ctx.session.user.id),
            })
            .where(
              and(
                eq(players.teamId, input.teamId),
                eq(players.isCaptain, true),
                isNull(players.deletedAt),
                isNull(players.createdForGameId),
              ),
            );
        }

        return tx
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
      });

      if (!player) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create player",
        });
      }

      return player;
    }),

  update: protectedProcedure
    .input(updatePlayerInput)
    .mutation(async ({ ctx, input }) => {
      const player = await assertPlayerOwner(input.id, ctx.session.user.id);

      if (player.teamId == null) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Player not found",
        });
      }

      const teamId = player.teamId;

      const [existingNumber] = await db
        .select({ id: players.id })
        .from(players)
        .where(
          and(
            eq(players.teamId, teamId),
            eq(players.number, input.number),
            isNull(players.deletedAt),
            isNull(players.createdForGameId),
            ne(players.id, input.id),
          ),
        )
        .limit(1);

      if (existingNumber) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Jersey number ${input.number} is already taken on this team`,
        });
      }

      const [updated] = await db.transaction(async (tx) => {
        if (input.isCaptain) {
          await tx
            .update(players)
            .set({
              isCaptain: false,
              ...auditUpdate(ctx.session.user.id),
            })
            .where(
              and(
                eq(players.teamId, teamId),
                eq(players.isCaptain, true),
                isNull(players.deletedAt),
                isNull(players.createdForGameId),
                ne(players.id, input.id),
              ),
            );
        }

        return tx
          .update(players)
          .set({
            firstName: input.firstName,
            lastName: input.lastName,
            number: input.number,
            position: input.position ?? null,
            isCaptain: input.isCaptain,
            ...auditUpdate(ctx.session.user.id),
          })
          .where(and(eq(players.id, input.id), isNull(players.deletedAt)))
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
      });

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Player not found",
        });
      }

      return updated;
    }),

  delete: protectedProcedure
    .input(playerIdInput)
    .mutation(async ({ ctx, input }) => {
      await assertPlayerOwner(input.id, ctx.session.user.id);

      const [deleted] = await db
        .update(players)
        .set(auditDelete(ctx.session.user.id))
        .where(and(eq(players.id, input.id), isNull(players.deletedAt)))
        .returning({ id: players.id });

      if (!deleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Player not found",
        });
      }

      return deleted;
    }),
});
