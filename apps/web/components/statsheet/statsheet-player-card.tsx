"use client";

import type { PlayerStatDeltas } from "@repo/shared";

import { useStatsheetMutations } from "@/components/statsheet/statsheet-mutations-context";
import { Badge } from "@/components/ui/badge";
import { getTeamTheme } from "@/lib/team-colors";
import { cn } from "@/lib/utils";
import { useStatsheetStore } from "@/stores/use-statsheet-store";

type StatsheetPlayerCardProps = {
  playerId: number;
  number: number;
  name: string;
  stats: PlayerStatDeltas;
  isGuest?: boolean;
  teamColor: string;
};

export function StatsheetPlayerCard({
  playerId,
  number,
  name,
  stats,
  isGuest = false,
  teamColor,
}: StatsheetPlayerCardProps) {
  const selectedPlayerId = useStatsheetStore((state) => state.selectedPlayerId);
  const selectPlayer = useStatsheetStore((state) => state.selectPlayer);
  const { isBusy } = useStatsheetMutations();
  const isSelected = selectedPlayerId === playerId;
  const totalRebounds = stats.offensiveRebounds + stats.defensiveRebounds;
  const theme = getTeamTheme(teamColor);

  return (
    <button
      className={cn(
        "flex w-full flex-col rounded-xl border bg-background p-3 text-left transition-all",
        "hover:bg-muted/40 hover:shadow-sm",
        isSelected ? "shadow-md" : "border-border/80",
        isBusy && "pointer-events-none opacity-60",
      )}
      disabled={isBusy}
      onClick={() => selectPlayer(isSelected ? null : playerId)}
      style={
        isSelected
          ? {
              borderColor: theme.color,
              boxShadow: `0 0 0 2px ${theme.color}`,
            }
          : undefined
      }
      type="button"
    >
      <div className="flex items-center gap-3">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: theme.color }}
        >
          {number}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold">{name}</p>
            {isGuest ? (
              <Badge className="shrink-0 text-[10px]" variant="secondary">
                Guest
              </Badge>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.points} PTS · {totalRebounds} REB · {stats.assists} AST
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold tabular-nums leading-none">
            {stats.points}
          </p>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            pts
          </p>
        </div>
      </div>

      {isSelected ? (
        <div className="mt-3 grid grid-cols-4 gap-1 border-t pt-3 text-center text-[10px]">
          {[
            {
              label: "FG",
              value: `${stats.fg2Made + stats.fg3Made}/${stats.fg2Attempted + stats.fg3Attempted}`,
            },
            { label: "FT", value: `${stats.ftMade}/${stats.ftAttempted}` },
            { label: "STL", value: stats.steals },
            { label: "BLK", value: stats.blocks },
            { label: "TO", value: stats.turnovers },
            { label: "PF", value: stats.personalFouls },
            { label: "OREB", value: stats.offensiveRebounds },
            { label: "DREB", value: stats.defensiveRebounds },
          ].map((item) => (
            <div
              className="rounded-md bg-muted/50 px-1 py-1.5"
              key={item.label}
            >
              <p className="font-bold tabular-nums">{item.value}</p>
              <p className="text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>
      ) : null}
    </button>
  );
}
