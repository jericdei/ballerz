"use client";

import { StatsheetTeamColumn } from "@/components/statsheet/statsheet-team-column";
import { useStatsheetStore } from "@/stores/use-statsheet-store";

export function StatsheetCourt() {
  const game = useStatsheetStore((state) => state.game);
  const firstTeamScore = useStatsheetStore((state) => state.firstTeamScore);
  const secondTeamScore = useStatsheetStore((state) => state.secondTeamScore);

  if (!game?.firstTeamId || !game.secondTeamId) {
    return null;
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 sm:gap-4 sm:p-4 md:grid md:h-full md:grid-cols-2 md:gap-4 md:overflow-hidden md:p-6">
      <StatsheetTeamColumn
        gameId={game.id}
        score={firstTeamScore}
        sideLabel="Away"
        teamColor={game.firstTeamColor}
        teamId={game.firstTeamId}
        teamName={game.firstTeamName ?? "Team 1"}
      />
      <StatsheetTeamColumn
        gameId={game.id}
        score={secondTeamScore}
        sideLabel="Home"
        teamColor={game.secondTeamColor}
        teamId={game.secondTeamId}
        teamName={game.secondTeamName ?? "Team 2"}
      />
    </section>
  );
}
