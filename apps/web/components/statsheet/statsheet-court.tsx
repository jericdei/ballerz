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
    <section className="grid h-full min-h-0 gap-4 overflow-hidden p-4 md:grid-cols-2 md:p-6">
      <StatsheetTeamColumn
        accent="away"
        gameId={game.id}
        score={firstTeamScore}
        teamId={game.firstTeamId}
        teamName={game.firstTeamName ?? "Team 1"}
      />
      <StatsheetTeamColumn
        accent="home"
        gameId={game.id}
        score={secondTeamScore}
        teamId={game.secondTeamId}
        teamName={game.secondTeamName ?? "Team 2"}
      />
    </section>
  );
}
