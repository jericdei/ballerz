import { and, eq, isNull, sql, sum } from "drizzle-orm";

import { db, gamePlayerStats, games, players, teams } from "@repo/db";

export type LeagueLeaderRow = {
  playerId: number;
  firstName: string;
  lastName: string;
  number: number;
  position: string | null;
  teamId: number;
  teamName: string | null;
  teamColor: string;
  gamesPlayed: number;
  pointsPerGame: number;
  reboundsPerGame: number;
  assistsPerGame: number;
  stealsPerGame: number;
  blocksPerGame: number;
  turnoversPerGame: number;
  fieldGoalPct: number | null;
};

function roundAverage(total: number, games: number) {
  if (games === 0) return 0;
  return Math.round((total / games) * 10) / 10;
}

function roundPct(made: number, attempted: number) {
  if (attempted === 0) return null;
  return Math.round((made / attempted) * 1000) / 10;
}

export async function loadLeagueLeaders(
  leagueId: number,
): Promise<LeagueLeaderRow[]> {
  const rows = await db
    .select({
      playerId: players.id,
      firstName: players.firstName,
      lastName: players.lastName,
      number: players.number,
      position: players.position,
      teamId: teams.id,
      teamName: teams.name,
      teamColor: teams.color,
      gamesPlayed:
        sql<number>`count(distinct ${gamePlayerStats.gameId})`.mapWith(Number),
      totalPoints: sum(gamePlayerStats.points),
      totalAssists: sum(gamePlayerStats.assists),
      totalSteals: sum(gamePlayerStats.steals),
      totalBlocks: sum(gamePlayerStats.blocks),
      totalTurnovers: sum(gamePlayerStats.turnovers),
      totalOffensiveRebounds: sum(gamePlayerStats.offensiveRebounds),
      totalDefensiveRebounds: sum(gamePlayerStats.defensiveRebounds),
      totalFg2Made: sum(gamePlayerStats.fg2Made),
      totalFg3Made: sum(gamePlayerStats.fg3Made),
      totalFg2Attempted: sum(gamePlayerStats.fg2Attempted),
      totalFg3Attempted: sum(gamePlayerStats.fg3Attempted),
    })
    .from(gamePlayerStats)
    .innerJoin(games, eq(gamePlayerStats.gameId, games.id))
    .innerJoin(players, eq(gamePlayerStats.playerId, players.id))
    .innerJoin(teams, eq(players.teamId, teams.id))
    .where(
      and(
        eq(games.leagueId, leagueId),
        eq(games.status, "final"),
        isNull(games.deletedAt),
        isNull(players.deletedAt),
        isNull(players.createdForGameId),
        isNull(teams.deletedAt),
      ),
    )
    .groupBy(
      players.id,
      players.firstName,
      players.lastName,
      players.number,
      players.position,
      teams.id,
      teams.name,
      teams.color,
    );

  return rows
    .map((row) => {
      const gamesPlayed = row.gamesPlayed;
      const totalRebounds =
        Number(row.totalOffensiveRebounds ?? 0) +
        Number(row.totalDefensiveRebounds ?? 0);
      const fgMade =
        Number(row.totalFg2Made ?? 0) + Number(row.totalFg3Made ?? 0);
      const fgAttempted =
        Number(row.totalFg2Attempted ?? 0) + Number(row.totalFg3Attempted ?? 0);

      return {
        playerId: row.playerId,
        firstName: row.firstName,
        lastName: row.lastName,
        number: row.number,
        position: row.position,
        teamId: row.teamId,
        teamName: row.teamName,
        teamColor: row.teamColor,
        gamesPlayed,
        pointsPerGame: roundAverage(Number(row.totalPoints ?? 0), gamesPlayed),
        reboundsPerGame: roundAverage(totalRebounds, gamesPlayed),
        assistsPerGame: roundAverage(
          Number(row.totalAssists ?? 0),
          gamesPlayed,
        ),
        stealsPerGame: roundAverage(Number(row.totalSteals ?? 0), gamesPlayed),
        blocksPerGame: roundAverage(Number(row.totalBlocks ?? 0), gamesPlayed),
        turnoversPerGame: roundAverage(
          Number(row.totalTurnovers ?? 0),
          gamesPlayed,
        ),
        fieldGoalPct: roundPct(fgMade, fgAttempted),
      };
    })
    .filter((row) => row.gamesPlayed > 0)
    .sort((a, b) => b.pointsPerGame - a.pointsPerGame);
}
