"use client";

import type { GamePeriod } from "@repo/shared";

import { formatGameStatus } from "@/components/games/game-labels";
import { formatPeriodLabel } from "@/components/statsheet/statsheet-labels";
import { Badge } from "@/components/ui/badge";
import { getTeamTheme, withAlpha } from "@/lib/team-colors";

type GameScoreSummaryProps = {
  firstTeamName: string | null;
  secondTeamName: string | null;
  firstTeamColor: string;
  secondTeamColor: string;
  firstTeamScore: number;
  secondTeamScore: number;
  currentPeriod: GamePeriod | null;
  endedAt: Date | null;
};

export function GameScoreSummary({
  firstTeamName,
  secondTeamName,
  firstTeamColor,
  secondTeamColor,
  firstTeamScore,
  secondTeamScore,
  currentPeriod,
  endedAt,
}: GameScoreSummaryProps) {
  const firstTheme = getTeamTheme(firstTeamColor);
  const secondTheme = getTeamTheme(secondTeamColor);

  return (
    <section
      className="rounded-xl border px-4 py-4 md:px-6"
      style={{
        background: `linear-gradient(to right, ${withAlpha(firstTheme.color, 0.06)} 0%, transparent 50%, ${withAlpha(secondTheme.color, 0.06)} 100%)`,
      }}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Badge className="bg-violet-500/15 text-violet-700 dark:text-violet-300">
            {formatGameStatus("final")}
          </Badge>
          {currentPeriod ? (
            <Badge variant="secondary">
              Ended {formatPeriodLabel(currentPeriod)}
            </Badge>
          ) : null}
          {endedAt ? (
            <span className="text-xs text-muted-foreground">
              {endedAt.toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          ) : null}
        </div>

        <div className="grid items-center gap-4 lg:grid-cols-[1fr_auto_1fr]">
          <div className="text-right">
            <p
              className="text-xs font-medium uppercase tracking-wider"
              style={{ color: firstTheme.color }}
            >
              Away
            </p>
            <p className="truncate text-lg font-semibold md:text-xl">
              {firstTeamName ?? "Team 1"}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 md:gap-5">
            <span
              className="min-w-[3ch] text-center text-4xl font-bold tabular-nums md:text-5xl"
              style={{ color: firstTheme.color }}
            >
              {firstTeamScore}
            </span>
            <span className="text-2xl font-light text-muted-foreground">–</span>
            <span
              className="min-w-[3ch] text-center text-4xl font-bold tabular-nums md:text-5xl"
              style={{ color: secondTheme.color }}
            >
              {secondTeamScore}
            </span>
          </div>

          <div>
            <p
              className="text-xs font-medium uppercase tracking-wider"
              style={{ color: secondTheme.color }}
            >
              Home
            </p>
            <p className="truncate text-lg font-semibold md:text-xl">
              {secondTeamName ?? "Team 2"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
