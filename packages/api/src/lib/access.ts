import { TRPCError } from "@trpc/server";
import { and, eq, isNull } from "drizzle-orm";

import { db, leagues, players, teams } from "@repo/db";

export function auditInsert(userId: number) {
  return {
    createdBy: userId,
    updatedBy: userId,
  };
}

export function auditUpdate(userId: number) {
  return {
    updatedBy: userId,
  };
}

export function auditDelete(userId: number) {
  const now = new Date();
  return {
    deletedAt: now,
    deletedBy: userId,
    updatedBy: userId,
  };
}

export async function assertLeagueOwner(leagueId: number, userId: number) {
  const [league] = await db
    .select({
      id: leagues.id,
      name: leagues.name,
    })
    .from(leagues)
    .where(
      and(
        eq(leagues.id, leagueId),
        eq(leagues.createdBy, userId),
        isNull(leagues.deletedAt),
      ),
    )
    .limit(1);

  if (!league) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "League not found",
    });
  }

  return league;
}

export async function assertTeamOwner(teamId: number, userId: number) {
  const [team] = await db
    .select({
      id: teams.id,
      name: teams.name,
      leagueId: teams.leagueId,
    })
    .from(teams)
    .innerJoin(leagues, eq(teams.leagueId, leagues.id))
    .where(
      and(
        eq(teams.id, teamId),
        eq(leagues.createdBy, userId),
        isNull(teams.deletedAt),
        isNull(leagues.deletedAt),
      ),
    )
    .limit(1);

  if (!team) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Team not found",
    });
  }

  return team;
}

export async function assertPlayerOwner(playerId: number, userId: number) {
  const [player] = await db
    .select({
      id: players.id,
      teamId: players.teamId,
      firstName: players.firstName,
      lastName: players.lastName,
      number: players.number,
      position: players.position,
      isCaptain: players.isCaptain,
    })
    .from(players)
    .innerJoin(teams, eq(players.teamId, teams.id))
    .innerJoin(leagues, eq(teams.leagueId, leagues.id))
    .where(
      and(
        eq(players.id, playerId),
        eq(leagues.createdBy, userId),
        isNull(players.deletedAt),
        isNull(teams.deletedAt),
        isNull(leagues.deletedAt),
      ),
    )
    .limit(1);

  if (!player) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Player not found",
    });
  }

  return player;
}
