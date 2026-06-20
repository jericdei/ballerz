import { TRPCError } from "@trpc/server";
import { and, count, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod";

import { db, leagues, players, teams } from "@repo/db";

import {
  assertLeagueOwner,
  auditDelete,
  auditInsert,
  auditUpdate,
} from "../lib/access";
import { MIN_TEAMS_PER_LEAGUE } from "../lib/constants";
import { loadLeagueLeaders } from "../lib/league-leaders";
import { createTRPCRouter, protectedProcedure } from "../trpc";

const createLeagueInput = z.object({
  name: z.string().trim().min(1, "League name is required"),
});

const leagueIdInput = z.object({
  id: z.number().int().positive(),
});

const updateLeagueInput = z.object({
  id: z.number().int().positive(),
  name: z.string().trim().min(1, "League name is required"),
});

export const leaguesRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const rows = await db
      .select({
        id: leagues.id,
        name: leagues.name,
        createdAt: leagues.createdAt,
        teamCount: count(teams.id),
      })
      .from(leagues)
      .leftJoin(
        teams,
        and(eq(teams.leagueId, leagues.id), isNull(teams.deletedAt)),
      )
      .where(
        and(
          eq(leagues.createdBy, ctx.session.user.id),
          isNull(leagues.deletedAt),
        ),
      )
      .groupBy(leagues.id);

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      createdAt: row.createdAt,
      teamCount: Number(row.teamCount),
      isReady: Number(row.teamCount) >= MIN_TEAMS_PER_LEAGUE,
    }));
  }),

  create: protectedProcedure
    .input(createLeagueInput)
    .mutation(async ({ ctx, input }) => {
      const [league] = await db
        .insert(leagues)
        .values({
          name: input.name,
          ...auditInsert(ctx.session.user.id),
        })
        .returning({
          id: leagues.id,
          name: leagues.name,
          createdAt: leagues.createdAt,
        });

      if (!league) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create league",
        });
      }

      return {
        ...league,
        teamCount: 0,
        isReady: false,
      };
    }),

  getById: protectedProcedure
    .input(leagueIdInput)
    .query(async ({ ctx, input }) => {
      const league = await assertLeagueOwner(input.id, ctx.session.user.id);

      const [result] = await db
        .select({ teamCount: count(teams.id) })
        .from(teams)
        .where(and(eq(teams.leagueId, input.id), isNull(teams.deletedAt)));

      const teamCount = Number(result?.teamCount ?? 0);

      return {
        ...league,
        teamCount,
        isReady: teamCount >= MIN_TEAMS_PER_LEAGUE,
      };
    }),

  leaders: protectedProcedure
    .input(leagueIdInput)
    .query(async ({ ctx, input }) => {
      await assertLeagueOwner(input.id, ctx.session.user.id);
      return loadLeagueLeaders(input.id);
    }),

  update: protectedProcedure
    .input(updateLeagueInput)
    .mutation(async ({ ctx, input }) => {
      await assertLeagueOwner(input.id, ctx.session.user.id);

      const [league] = await db
        .update(leagues)
        .set({
          name: input.name,
          ...auditUpdate(ctx.session.user.id),
        })
        .where(and(eq(leagues.id, input.id), isNull(leagues.deletedAt)))
        .returning({
          id: leagues.id,
          name: leagues.name,
          createdAt: leagues.createdAt,
        });

      if (!league) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "League not found",
        });
      }

      const [result] = await db
        .select({ teamCount: count(teams.id) })
        .from(teams)
        .where(and(eq(teams.leagueId, input.id), isNull(teams.deletedAt)));

      const teamCount = Number(result?.teamCount ?? 0);

      return {
        ...league,
        teamCount,
        isReady: teamCount >= MIN_TEAMS_PER_LEAGUE,
      };
    }),

  delete: protectedProcedure
    .input(leagueIdInput)
    .mutation(async ({ ctx, input }) => {
      await assertLeagueOwner(input.id, ctx.session.user.id);

      const deleteAudit = auditDelete(ctx.session.user.id);

      await db.transaction(async (tx) => {
        const teamRows = await tx
          .select({ id: teams.id })
          .from(teams)
          .where(and(eq(teams.leagueId, input.id), isNull(teams.deletedAt)));

        const teamIds = teamRows.map((row) => row.id);

        if (teamIds.length > 0) {
          await tx
            .update(players)
            .set(deleteAudit)
            .where(
              and(inArray(players.teamId, teamIds), isNull(players.deletedAt)),
            );

          await tx
            .update(teams)
            .set(deleteAudit)
            .where(and(eq(teams.leagueId, input.id), isNull(teams.deletedAt)));
        }

        await tx
          .update(leagues)
          .set(deleteAudit)
          .where(and(eq(leagues.id, input.id), isNull(leagues.deletedAt)));
      });

      return { id: input.id };
    }),
});
