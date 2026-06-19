import { TRPCError } from "@trpc/server";
import { and, count, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import { db, leagues, teams } from "@repo/db";

import { assertLeagueOwner, auditInsert } from "../lib/access";
import { MIN_TEAMS_PER_LEAGUE } from "../lib/constants";
import { createTRPCRouter, protectedProcedure } from "../trpc";

const createLeagueInput = z.object({
  name: z.string().trim().min(1, "League name is required"),
});

const leagueIdInput = z.object({
  id: z.number().int().positive(),
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
});
