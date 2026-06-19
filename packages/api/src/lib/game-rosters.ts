import { and, count, eq, inArray, isNull } from "drizzle-orm";

import { db, gameRosters, players } from "@repo/db";

import { auditInsert } from "./access";

export async function bootstrapGameRosters(
  gameId: number,
  firstTeamId: number,
  secondTeamId: number,
  userId: number,
) {
  const [existing] = await db
    .select({ count: count(gameRosters.id) })
    .from(gameRosters)
    .where(and(eq(gameRosters.gameId, gameId), isNull(gameRosters.deletedAt)));

  if (Number(existing?.count ?? 0) > 0) {
    return;
  }

  const rosterPlayers = await db
    .select({
      id: players.id,
      teamId: players.teamId,
    })
    .from(players)
    .where(
      and(
        inArray(players.teamId, [firstTeamId, secondTeamId]),
        isNull(players.deletedAt),
        isNull(players.createdForGameId),
      ),
    );

  if (rosterPlayers.length === 0) {
    return;
  }

  await db.insert(gameRosters).values(
    rosterPlayers.map((player) => ({
      gameId,
      playerId: player.id,
      teamId: player.teamId!,
      isDnp: false,
      isStarter: false,
      ...auditInsert(userId),
    })),
  );
}
