import { and, asc, eq, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import {
  db,
  gamePlayerStats,
  gameRosters,
  games,
  gameStatEvents,
  gameTeamPeriodStats,
  players,
  teams,
} from "@repo/db";

const firstTeam = alias(teams, "statsheet_first_team");
const secondTeam = alias(teams, "statsheet_second_team");

export async function loadStatsheetState(gameId: number) {
  const [game] = await db
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
    })
    .from(games)
    .innerJoin(firstTeam, eq(games.firstTeamId, firstTeam.id))
    .innerJoin(secondTeam, eq(games.secondTeamId, secondTeam.id))
    .where(and(eq(games.id, gameId), isNull(games.deletedAt)))
    .limit(1);

  if (!game) {
    return null;
  }

  const rosters = await db
    .select({
      id: gameRosters.id,
      gameId: gameRosters.gameId,
      playerId: gameRosters.playerId,
      teamId: gameRosters.teamId,
      isDnp: gameRosters.isDnp,
      isStarter: gameRosters.isStarter,
      firstName: players.firstName,
      lastName: players.lastName,
      number: players.number,
      position: players.position,
      isGuest: players.createdForGameId,
    })
    .from(gameRosters)
    .innerJoin(players, eq(gameRosters.playerId, players.id))
    .where(and(eq(gameRosters.gameId, gameId), isNull(gameRosters.deletedAt)))
    .orderBy(asc(players.number));

  const playerStats = await db
    .select()
    .from(gamePlayerStats)
    .where(eq(gamePlayerStats.gameId, gameId));

  const teamPeriodStats = await db
    .select()
    .from(gameTeamPeriodStats)
    .where(eq(gameTeamPeriodStats.gameId, gameId));

  const events = await db
    .select({
      id: gameStatEvents.id,
      sequence: gameStatEvents.sequence,
      period: gameStatEvents.period,
      eventType: gameStatEvents.eventType,
      playerId: gameStatEvents.playerId,
      teamId: gameStatEvents.teamId,
      occurredAt: gameStatEvents.occurredAt,
      reversesEventId: gameStatEvents.reversesEventId,
      firstName: players.firstName,
      lastName: players.lastName,
    })
    .from(gameStatEvents)
    .leftJoin(players, eq(gameStatEvents.playerId, players.id))
    .where(eq(gameStatEvents.gameId, gameId))
    .orderBy(asc(gameStatEvents.sequence));

  return {
    game,
    rosters: rosters.map((row) => ({
      id: row.id,
      gameId: row.gameId,
      playerId: row.playerId,
      teamId: row.teamId,
      isDnp: row.isDnp,
      isStarter: row.isStarter,
      firstName: row.firstName,
      lastName: row.lastName,
      number: row.number,
      position: row.position,
      isGuest: row.isGuest != null,
    })),
    playerStats,
    teamPeriodStats,
    events,
  };
}
