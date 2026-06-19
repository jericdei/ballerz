"use client";

import type { PlayerStatDeltas } from "@repo/shared";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useStatsheetStore } from "@/stores/use-statsheet-store";

type TeamAccent = "away" | "home";

type StatsheetPlayerCardProps = {
  playerId: number;
  number: number;
  name: string;
  stats: PlayerStatDeltas;
  isGuest?: boolean;
  accent: TeamAccent;
};

const accentRing: Record<TeamAccent, string> = {
  away: "ring-blue-500 border-blue-500",
  home: "ring-orange-500 border-orange-500",
};

const accentJersey: Record<TeamAccent, string> = {
  away: "bg-blue-600 text-white dark:bg-blue-500",
  home: "bg-orange-600 text-white dark:bg-orange-500",
};

export function StatsheetPlayerCard({
  playerId,
  number,
  name,
  stats,
  isGuest = false,
  accent,
}: StatsheetPlayerCardProps) {
  const selectedPlayerId = useStatsheetStore((state) => state.selectedPlayerId);
  const selectPlayer = useStatsheetStore((state) => state.selectPlayer);
  const isSelected = selectedPlayerId === playerId;
  const totalRebounds = stats.offensiveRebounds + stats.defensiveRebounds;

  return (
    <button
      className={cn(
        "flex w-full flex-col rounded-xl border bg-background p-3 text-left transition-all",
        "hover:bg-muted/40 hover:shadow-sm",
        isSelected
          ? cn("ring-2 shadow-md", accentRing[accent])
          : "border-border/80",
      )}
      onClick={() => selectPlayer(isSelected ? null : playerId)}
      type="button"
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold",
            accentJersey[accent],
          )}
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
