"use client";

import { Clock } from "lucide-react";

import { GAME_PERIODS } from "@repo/shared";

import { formatPeriodLabel } from "@/components/statsheet/statsheet-labels";
import { useStatsheetMutations } from "@/components/statsheet/statsheet-mutations-context";
import { isActiveGameStatus } from "@/lib/statsheet-utils";
import { getTeamTheme, withAlpha } from "@/lib/team-colors";
import { cn } from "@/lib/utils";
import { useStatsheetStore } from "@/stores/use-statsheet-store";

export function StatsheetScoreboard() {
  const game = useStatsheetStore((state) => state.game);
  const currentPeriod = useStatsheetStore((state) => state.currentPeriod);
  const status = useStatsheetStore((state) => state.status);
  const setPeriod = useStatsheetStore((state) => state.setPeriod);
  const firstTeamScore = useStatsheetStore((state) => state.firstTeamScore);
  const secondTeamScore = useStatsheetStore((state) => state.secondTeamScore);
  const { isBusy } = useStatsheetMutations();
  const canEditPeriod = isActiveGameStatus(status) && !isBusy;

  if (!game?.firstTeamId || !game.secondTeamId) {
    return null;
  }

  const firstTheme = getTeamTheme(game.firstTeamColor);
  const secondTheme = getTeamTheme(game.secondTeamColor);

  return (
    <section
      className="shrink-0 border-b px-4 py-4 md:px-6"
      style={{
        background: `linear-gradient(to right, ${withAlpha(firstTheme.color, 0.06)} 0%, transparent 50%, ${withAlpha(secondTheme.color, 0.06)} 100%)`,
      }}
    >
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
        <div className="grid items-center gap-4 lg:grid-cols-[1fr_auto_1fr]">
          <div className="text-right">
            <p
              className="text-xs font-medium uppercase tracking-wider"
              style={{ color: firstTheme.color }}
            >
              Away
            </p>
            <p className="truncate text-lg font-semibold md:text-xl">
              {game.firstTeamName ?? "Team 1"}
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
              {game.secondTeamName ?? "Team 2"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className="flex items-center gap-1 rounded-full border bg-card p-1 shadow-sm">
            <Clock className="mx-2 size-4 text-muted-foreground" />
            {GAME_PERIODS.map((period) => (
              <button
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                  currentPeriod === period
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  isBusy && "pointer-events-none opacity-50",
                  !canEditPeriod && "pointer-events-none opacity-50",
                )}
                disabled={!canEditPeriod}
                key={period}
                onClick={() => setPeriod(period)}
                type="button"
              >
                {formatPeriodLabel(period)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
