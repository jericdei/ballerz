"use client";

import { Check, Clock } from "lucide-react";

import {
  getAutoAdvancePeriod,
  getGamePeriodIndex,
  getVisibleGamePeriods,
} from "@repo/shared";

import { formatPeriodLabel } from "@/components/statsheet/statsheet-labels";
import { StatsheetClockPanel } from "@/components/statsheet/statsheet-clock-panel";
import { getTeamTheme, withAlpha } from "@/lib/team-colors";
import { cn } from "@/lib/utils";
import { useStatsheetStore } from "@/stores/use-statsheet-store";

export function StatsheetScoreboard({
  hideCompactClock = false,
}: {
  hideCompactClock?: boolean;
}) {
  const game = useStatsheetStore((state) => state.game);
  const currentPeriod = useStatsheetStore((state) => state.currentPeriod);
  const firstTeamScore = useStatsheetStore((state) => state.firstTeamScore);
  const secondTeamScore = useStatsheetStore((state) => state.secondTeamScore);

  const currentIndex = getGamePeriodIndex(currentPeriod);
  const nextPeriod = getAutoAdvancePeriod(
    currentPeriod,
    firstTeamScore,
    secondTeamScore,
  );
  const visiblePeriods = getVisibleGamePeriods(currentPeriod, nextPeriod);

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

        <div className="flex flex-col items-center gap-3">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <div
              aria-label={`Current period: ${formatPeriodLabel(currentPeriod)}`}
              className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm"
            >
              {formatPeriodLabel(currentPeriod)}
            </div>

            {hideCompactClock ? null : <StatsheetClockPanel compact />}

            <div className="flex items-center gap-1 rounded-full border bg-card p-1 shadow-sm">
              <Clock className="mx-2 size-4 text-muted-foreground" />
              {visiblePeriods.map((period) => {
                const index = getGamePeriodIndex(period);
                const isPast = index < currentIndex;
                const isCurrent = period === currentPeriod;
                const isFuture = index > currentIndex;

                return (
                  <div
                    aria-current={isCurrent ? "step" : undefined}
                    className={cn(
                      "flex items-center gap-1 rounded-full px-2 py-1.5 text-xs font-semibold",
                      isCurrent &&
                        "bg-primary text-primary-foreground shadow-sm",
                      isPast && "text-muted-foreground",
                      isFuture && "text-muted-foreground/40",
                    )}
                    key={period}
                  >
                    {isPast ? <Check aria-hidden className="size-3" /> : null}
                    {formatPeriodLabel(period)}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
