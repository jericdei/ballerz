import { and, eq, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import {
  addPlayerStats,
  getStatEventEffects,
  type PlayerStatDeltas,
  type ScoreDelta,
  type TeamPeriodDeltas,
} from "@repo/shared";

import type { GamePeriod, GameStatEventType } from "../schema/game-enums";
import { gamePlayerStats } from "../schema/game-player-stats";
import { gameRosters } from "../schema/game-rosters";
import { gameStatEvents } from "../schema/game-stat-events";
import { gameTeamPeriodStats } from "../schema/game-team-period-stats";
import { games } from "../schema/games";
import type * as schema from "../schema/index";

type DbClient = PostgresJsDatabase<typeof schema>;
type DbTransaction = Parameters<Parameters<DbClient["transaction"]>[0]>[0];
type DbExecutor = DbClient | DbTransaction;

export type RecordStatEventInput = {
  gameId: number;
  period: GamePeriod;
  eventType: GameStatEventType;
  teamId: number;
  playerId?: number | null;
  relatedEventId?: number | null;
  recordedBy?: number | null;
  occurredAt?: Date;
  gameClockMs?: number | null;
  clientId?: string | null;
};

export type ReverseStatEventInput = {
  eventId: number;
  recordedBy?: number | null;
  occurredAt?: Date;
};

async function getNextSequence(
  tx: DbExecutor,
  gameId: number,
): Promise<number> {
  const [result] = await tx
    .select({
      nextSequence: sql<number>`coalesce(max(${gameStatEvents.sequence}), 0) + 1`,
    })
    .from(gameStatEvents)
    .where(eq(gameStatEvents.gameId, gameId));

  return Number(result?.nextSequence ?? 1);
}

async function getGameTeamContext(
  tx: DbExecutor,
  gameId: number,
  teamId: number,
) {
  const [game] = await tx
    .select({
      firstTeamId: games.firstTeamId,
      secondTeamId: games.secondTeamId,
    })
    .from(games)
    .where(eq(games.id, gameId))
    .limit(1);

  if (!game) {
    throw new Error(`Game ${gameId} not found`);
  }

  if (teamId !== game.firstTeamId && teamId !== game.secondTeamId) {
    throw new Error(`Team ${teamId} is not part of game ${gameId}`);
  }

  return {
    ...game,
    isFirstTeam: teamId === game.firstTeamId,
  };
}

async function applyPlayerStatDeltas(
  tx: DbExecutor,
  gameId: number,
  playerId: number,
  delta: PlayerStatDeltas,
) {
  await tx
    .insert(gamePlayerStats)
    .values({
      gameId,
      playerId,
      fg2Made: delta.fg2Made,
      fg2Attempted: delta.fg2Attempted,
      fg3Made: delta.fg3Made,
      fg3Attempted: delta.fg3Attempted,
      ftMade: delta.ftMade,
      ftAttempted: delta.ftAttempted,
      assists: delta.assists,
      turnovers: delta.turnovers,
      offensiveRebounds: delta.offensiveRebounds,
      defensiveRebounds: delta.defensiveRebounds,
      personalFouls: delta.personalFouls,
      technicalFouls: delta.technicalFouls,
      steals: delta.steals,
      blocks: delta.blocks,
      points: delta.points,
    })
    .onConflictDoUpdate({
      target: [gamePlayerStats.gameId, gamePlayerStats.playerId],
      set: {
        fg2Made: sql`${gamePlayerStats.fg2Made} + ${delta.fg2Made}`,
        fg2Attempted: sql`${gamePlayerStats.fg2Attempted} + ${delta.fg2Attempted}`,
        fg3Made: sql`${gamePlayerStats.fg3Made} + ${delta.fg3Made}`,
        fg3Attempted: sql`${gamePlayerStats.fg3Attempted} + ${delta.fg3Attempted}`,
        ftMade: sql`${gamePlayerStats.ftMade} + ${delta.ftMade}`,
        ftAttempted: sql`${gamePlayerStats.ftAttempted} + ${delta.ftAttempted}`,
        assists: sql`${gamePlayerStats.assists} + ${delta.assists}`,
        turnovers: sql`${gamePlayerStats.turnovers} + ${delta.turnovers}`,
        offensiveRebounds: sql`${gamePlayerStats.offensiveRebounds} + ${delta.offensiveRebounds}`,
        defensiveRebounds: sql`${gamePlayerStats.defensiveRebounds} + ${delta.defensiveRebounds}`,
        personalFouls: sql`${gamePlayerStats.personalFouls} + ${delta.personalFouls}`,
        technicalFouls: sql`${gamePlayerStats.technicalFouls} + ${delta.technicalFouls}`,
        steals: sql`${gamePlayerStats.steals} + ${delta.steals}`,
        blocks: sql`${gamePlayerStats.blocks} + ${delta.blocks}`,
        points: sql`${gamePlayerStats.points} + ${delta.points}`,
        updatedAt: new Date(),
      },
    });
}

async function applyTeamPeriodDeltas(
  tx: DbExecutor,
  gameId: number,
  teamId: number,
  period: GamePeriod,
  delta: TeamPeriodDeltas,
) {
  await tx
    .insert(gameTeamPeriodStats)
    .values({
      gameId,
      teamId,
      period,
      timeoutsUsed: delta.timeoutsUsed,
      teamFouls: delta.teamFouls,
    })
    .onConflictDoUpdate({
      target: [
        gameTeamPeriodStats.gameId,
        gameTeamPeriodStats.teamId,
        gameTeamPeriodStats.period,
      ],
      set: {
        timeoutsUsed: sql`${gameTeamPeriodStats.timeoutsUsed} + ${delta.timeoutsUsed}`,
        teamFouls: sql`${gameTeamPeriodStats.teamFouls} + ${delta.teamFouls}`,
        updatedAt: new Date(),
      },
    });
}

async function applyScoreDelta(
  tx: DbExecutor,
  gameId: number,
  delta: ScoreDelta,
) {
  if (delta.firstTeam === 0 && delta.secondTeam === 0) {
    return;
  }

  await tx
    .update(games)
    .set({
      firstTeamScore: sql`${games.firstTeamScore} + ${delta.firstTeam}`,
      secondTeamScore: sql`${games.secondTeamScore} + ${delta.secondTeam}`,
    })
    .where(eq(games.id, gameId));
}

async function applyStatEventEffects(
  tx: DbExecutor,
  input: {
    gameId: number;
    period: GamePeriod;
    teamId: number;
    playerId: number | null;
    eventType: GameStatEventType;
    isFirstTeam: boolean;
    multiplier: number;
  },
) {
  const effects = getStatEventEffects(input.eventType, {
    isFirstTeam: input.isFirstTeam,
    multiplier: input.multiplier,
  });

  if (effects.playerStats && input.playerId) {
    await applyPlayerStatDeltas(
      tx,
      input.gameId,
      input.playerId,
      effects.playerStats,
    );
  }

  if (effects.teamPeriod) {
    await applyTeamPeriodDeltas(
      tx,
      input.gameId,
      input.teamId,
      input.period,
      effects.teamPeriod,
    );
  }

  if (effects.score) {
    await applyScoreDelta(tx, input.gameId, effects.score);
  }

  if (effects.marksDnp && input.playerId) {
    await tx
      .update(gameRosters)
      .set({ isDnp: input.multiplier > 0 })
      .where(
        and(
          eq(gameRosters.gameId, input.gameId),
          eq(gameRosters.playerId, input.playerId),
        ),
      );
  }
}

function assertPlayerRequired(
  eventType: GameStatEventType,
  playerId: number | null | undefined,
): asserts playerId is number {
  if (eventType === "timeout") {
    return;
  }

  if (playerId == null) {
    throw new Error(`Player is required for ${eventType} events`);
  }
}

export async function recordStatEventWithExecutor(
  tx: DbExecutor,
  input: RecordStatEventInput,
) {
  assertPlayerRequired(input.eventType, input.playerId);

  if (input.clientId) {
    const [existing] = await tx
      .select({ id: gameStatEvents.id })
      .from(gameStatEvents)
      .where(
        and(
          eq(gameStatEvents.gameId, input.gameId),
          eq(gameStatEvents.clientId, input.clientId),
        ),
      )
      .limit(1);

    if (existing) {
      return existing;
    }
  }

  const teamContext = await getGameTeamContext(tx, input.gameId, input.teamId);
  const sequence = await getNextSequence(tx, input.gameId);
  const playerId = input.playerId ?? null;

  const [event] = await tx
    .insert(gameStatEvents)
    .values({
      gameId: input.gameId,
      sequence,
      period: input.period,
      eventType: input.eventType,
      playerId,
      teamId: input.teamId,
      relatedEventId: input.relatedEventId ?? null,
      recordedBy: input.recordedBy ?? null,
      occurredAt: input.occurredAt ?? new Date(),
      gameClockMs: input.gameClockMs ?? null,
      clientId: input.clientId ?? null,
    })
    .returning();

  if (!event) {
    throw new Error("Failed to insert stat event");
  }

  await applyStatEventEffects(tx, {
    gameId: input.gameId,
    period: input.period,
    teamId: input.teamId,
    playerId,
    eventType: input.eventType,
    isFirstTeam: teamContext.isFirstTeam,
    multiplier: 1,
  });

  return event;
}

export async function recordStatEvent(
  db: DbClient,
  input: RecordStatEventInput,
) {
  return db.transaction(async (tx) => recordStatEventWithExecutor(tx, input));
}

export async function reverseStatEventWithExecutor(
  tx: DbExecutor,
  input: ReverseStatEventInput,
) {
  const [originalEvent] = await tx
    .select()
    .from(gameStatEvents)
    .where(eq(gameStatEvents.id, input.eventId))
    .limit(1);

  if (!originalEvent) {
    throw new Error(`Stat event ${input.eventId} not found`);
  }

  if (originalEvent.reversesEventId != null) {
    throw new Error(`Stat event ${input.eventId} is itself a reversal`);
  }

  const [existingReversal] = await tx
    .select({ id: gameStatEvents.id })
    .from(gameStatEvents)
    .where(eq(gameStatEvents.reversesEventId, originalEvent.id))
    .limit(1);

  if (existingReversal) {
    throw new Error(`Stat event ${input.eventId} has already been reversed`);
  }

  const teamContext = await getGameTeamContext(
    tx,
    originalEvent.gameId,
    originalEvent.teamId,
  );
  const sequence = await getNextSequence(tx, originalEvent.gameId);

  const [reversalEvent] = await tx
    .insert(gameStatEvents)
    .values({
      gameId: originalEvent.gameId,
      sequence,
      period: originalEvent.period,
      eventType: originalEvent.eventType,
      playerId: originalEvent.playerId,
      teamId: originalEvent.teamId,
      reversesEventId: originalEvent.id,
      relatedEventId: originalEvent.relatedEventId,
      recordedBy: input.recordedBy ?? null,
      occurredAt: input.occurredAt ?? new Date(),
    })
    .returning();

  if (!reversalEvent) {
    throw new Error("Failed to insert reversal event");
  }

  await applyStatEventEffects(tx, {
    gameId: originalEvent.gameId,
    period: originalEvent.period,
    teamId: originalEvent.teamId,
    playerId: originalEvent.playerId,
    eventType: originalEvent.eventType,
    isFirstTeam: teamContext.isFirstTeam,
    multiplier: -1,
  });

  return reversalEvent;
}

export async function reverseStatEvent(
  db: DbClient,
  input: ReverseStatEventInput,
) {
  return db.transaction(async (tx) => reverseStatEventWithExecutor(tx, input));
}

export { addPlayerStats, getStatEventEffects };
