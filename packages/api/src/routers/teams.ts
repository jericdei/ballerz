import { TRPCError } from "@trpc/server";
import { and, count, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import { db, players, teams } from "@repo/db";

import {
  assertLeagueOwner,
  assertTeamOwner,
  auditDelete,
  auditInsert,
  auditUpdate,
} from "../lib/access";
import { createTRPCRouter, protectedProcedure } from "../trpc";

const leagueIdInput = z.object({
  leagueId: z.number().int().positive(),
});

const createTeamInput = z.object({
  leagueId: z.number().int().positive(),
  name: z.string().trim().min(1, "Team name is required"),
});

const teamIdInput = z.object({
  id: z.number().int().positive(),
});

const updateTeamInput = z.object({
  id: z.number().int().positive(),
  name: z.string().trim().min(1, "Team name is required"),
});

export const teamsRouter = createTRPCRouter({
  listByLeague: protectedProcedure
    .input(leagueIdInput)
    .query(async ({ ctx, input }) => {
      await assertLeagueOwner(input.leagueId, ctx.session.user.id);

      const rows = await db
        .select({
          id: teams.id,
          name: teams.name,
          leagueId: teams.leagueId,
          createdAt: teams.createdAt,
          playerCount: count(players.id),
        })
        .from(teams)
        .leftJoin(
          players,
          and(
            eq(players.teamId, teams.id),
            isNull(players.deletedAt),
            isNull(players.createdForGameId),
          ),
        )
        .where(and(eq(teams.leagueId, input.leagueId), isNull(teams.deletedAt)))
        .groupBy(teams.id);

      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        leagueId: row.leagueId,
        createdAt: row.createdAt,
        playerCount: Number(row.playerCount),
      }));
    }),

  create: protectedProcedure
    .input(createTeamInput)
    .mutation(async ({ ctx, input }) => {
      await assertLeagueOwner(input.leagueId, ctx.session.user.id);

      const [team] = await db
        .insert(teams)
        .values({
          leagueId: input.leagueId,
          name: input.name,
          ...auditInsert(ctx.session.user.id),
        })
        .returning({
          id: teams.id,
          name: teams.name,
          leagueId: teams.leagueId,
          createdAt: teams.createdAt,
        });

      if (!team) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create team",
        });
      }

      return {
        ...team,
        playerCount: 0,
      };
    }),

  update: protectedProcedure
    .input(updateTeamInput)
    .mutation(async ({ ctx, input }) => {
      const team = await assertTeamOwner(input.id, ctx.session.user.id);

      const [updated] = await db
        .update(teams)
        .set({
          name: input.name,
          ...auditUpdate(ctx.session.user.id),
        })
        .where(and(eq(teams.id, input.id), isNull(teams.deletedAt)))
        .returning({
          id: teams.id,
          name: teams.name,
          leagueId: teams.leagueId,
          createdAt: teams.createdAt,
        });

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Team not found",
        });
      }

      const [result] = await db
        .select({ playerCount: count(players.id) })
        .from(players)
        .where(
          and(
            eq(players.teamId, input.id),
            isNull(players.deletedAt),
            isNull(players.createdForGameId),
          ),
        );

      return {
        ...updated,
        playerCount: Number(result?.playerCount ?? 0),
        leagueId: team.leagueId,
      };
    }),

  delete: protectedProcedure
    .input(teamIdInput)
    .mutation(async ({ ctx, input }) => {
      await assertTeamOwner(input.id, ctx.session.user.id);

      const deleteAudit = auditDelete(ctx.session.user.id);

      await db.transaction(async (tx) => {
        await tx
          .update(players)
          .set(deleteAudit)
          .where(and(eq(players.teamId, input.id), isNull(players.deletedAt)));

        await tx
          .update(teams)
          .set(deleteAudit)
          .where(and(eq(teams.id, input.id), isNull(teams.deletedAt)));
      });

      return { id: input.id };
    }),
});
