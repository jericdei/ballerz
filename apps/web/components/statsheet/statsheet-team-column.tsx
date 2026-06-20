"use client";

import { Timer, Users } from "lucide-react";

import { getRemainingTimeouts, zeroPlayerStatDeltas } from "@repo/shared";

import { AddGuestPlayerDialog } from "@/components/statsheet/add-guest-player-dialog";
import { useStatsheetMutations } from "@/components/statsheet/statsheet-mutations-context";
import { StatsheetPlayerCard } from "@/components/statsheet/statsheet-player-card";
import { TeamPeriodIndicators } from "@/components/statsheet/statsheet-team-period-indicators";
import { Button } from "@/components/ui/button";
import { isActiveGameStatus } from "@/lib/statsheet-utils";
import { getTeamTheme } from "@/lib/team-colors";
import { cn } from "@/lib/utils";
import { useStatsheetStore } from "@/stores/use-statsheet-store";

type StatsheetTeamColumnProps = {
  gameId: number;
  teamId: number;
  teamName: string;
  teamColor: string;
  sideLabel: "Away" | "Home";
  score: number;
};

export function StatsheetTeamColumn({
  gameId,
  teamId,
  teamName,
  teamColor,
  sideLabel,
  score,
}: StatsheetTeamColumnProps) {
  const rosters = useStatsheetStore((state) => state.rosters);
  const game = useStatsheetStore((state) => state.game);
  const playerStats = useStatsheetStore((state) => state.playerStats);
  const teamPeriodStats = useStatsheetStore((state) => state.teamPeriodStats);
  const currentPeriod = useStatsheetStore((state) => state.currentPeriod);
  const status = useStatsheetStore((state) => state.status);
  const applyTimeout = useStatsheetStore((state) => state.applyTimeout);
  const { isBusy } = useStatsheetMutations();
  const canEditGame = isActiveGameStatus(status) && !isBusy;

  const theme = getTeamTheme(teamColor);
  const teamPlayers = rosters.filter(
    (row) => row.teamId === teamId && !row.isDnp,
  );
  const periodKey = `${teamId}:${currentPeriod}`;
  const periodStats = teamPeriodStats[periodKey] ?? {
    timeoutsUsed: 0,
    teamFouls: 0,
  };
  const timeoutsPerQuarter = game?.timeoutsPerQuarter ?? 2;
  const remainingTimeouts = getRemainingTimeouts(
    periodStats.timeoutsUsed,
    timeoutsPerQuarter,
  );
  const canCallTimeout = canEditGame && remainingTimeouts > 0;

  return (
    <div
      className={cn(
        "flex shrink-0 flex-col overflow-hidden rounded-2xl border-2 bg-card shadow-sm",
        "md:h-full md:min-h-0",
      )}
      style={{ borderColor: theme.borderColor }}
    >
      <div
        className="shrink-0 border-b p-3 sm:p-4"
        style={{ backgroundColor: theme.headerBackground }}
      >
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="min-w-0">
            <span
              className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              style={{
                backgroundColor: theme.badgeBackground,
                color: theme.color,
              }}
            >
              {sideLabel}
            </span>
            <h2 className="mt-1 truncate text-base font-semibold sm:text-lg">
              {teamName}
            </h2>
          </div>
          <p
            className="text-3xl font-bold tabular-nums leading-none sm:text-4xl"
            style={{ color: theme.color }}
          >
            {score}
          </p>
        </div>

        <div className="mt-2 flex items-center gap-2 sm:mt-3 sm:gap-3">
          <TeamPeriodIndicators teamColor={teamColor} teamId={teamId} />
          <Button
            className="ml-auto h-7 gap-1 px-2 text-xs"
            disabled={!canCallTimeout}
            onClick={() => applyTimeout(teamId)}
            size="sm"
            type="button"
            title={
              remainingTimeouts === 0
                ? "No timeouts remaining this quarter"
                : undefined
            }
            variant="outline"
          >
            <Timer className="size-3" />
            TO
          </Button>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between border-b px-3 py-2 sm:px-4">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Users className="size-3.5" />
          {teamPlayers.length} active
        </div>
        <AddGuestPlayerDialog
          disabled={!canEditGame}
          gameId={gameId}
          teamId={teamId}
        />
      </div>

      <div className="grid auto-rows-min grid-cols-1 gap-2 p-2 sm:grid-cols-2 sm:p-3 md:min-h-0 md:flex-1 md:overflow-y-auto md:content-start">
        {teamPlayers.map((player) => (
          <StatsheetPlayerCard
            key={player.playerId}
            name={`${player.firstName} ${player.lastName}`}
            number={player.number}
            playerId={player.playerId}
            stats={playerStats[player.playerId] ?? zeroPlayerStatDeltas()}
            teamColor={teamColor}
            isGuest={player.isGuest}
          />
        ))}
      </div>
    </div>
  );
}
