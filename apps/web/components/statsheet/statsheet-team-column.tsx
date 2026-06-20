"use client";

import { Flag, Timer, Users } from "lucide-react";

import { zeroPlayerStatDeltas } from "@repo/shared";

import { AddGuestPlayerDialog } from "@/components/statsheet/add-guest-player-dialog";
import { useStatsheetMutations } from "@/components/statsheet/statsheet-mutations-context";
import { StatsheetPlayerCard } from "@/components/statsheet/statsheet-player-card";
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

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border-2 bg-card shadow-sm",
      )}
      style={{ borderColor: theme.borderColor }}
    >
      <div
        className="shrink-0 border-b p-4"
        style={{ backgroundColor: theme.headerBackground }}
      >
        <div className="flex items-start justify-between gap-3">
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
            <h2 className="mt-1 truncate text-lg font-semibold">{teamName}</h2>
          </div>
          <p
            className="text-4xl font-bold tabular-nums leading-none"
            style={{ color: theme.color }}
          >
            {score}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border bg-background/80 px-2.5 py-1.5 text-xs">
            <Timer className="size-3.5 text-amber-600 dark:text-amber-400" />
            <span className="font-medium">{periodStats.timeoutsUsed}</span>
            <span className="text-muted-foreground">timeouts</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border bg-background/80 px-2.5 py-1.5 text-xs">
            <Flag className="size-3.5 text-orange-600 dark:text-orange-400" />
            <span className="font-medium">{periodStats.teamFouls}</span>
            <span className="text-muted-foreground">fouls</span>
          </div>
          <Button
            className="ml-auto h-8 gap-1.5"
            disabled={!canEditGame}
            onClick={() => applyTimeout(teamId)}
            size="sm"
            type="button"
            variant="outline"
          >
            <Timer className="size-3.5" />
            Timeout
          </Button>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between border-b px-4 py-2">
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

      <div className="grid min-h-0 flex-1 gap-2 overflow-y-auto p-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
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
