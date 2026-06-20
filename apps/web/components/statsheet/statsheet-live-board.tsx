"use client";

import { useCallback, useEffect, useState } from "react";
import { Maximize, Minimize } from "lucide-react";

import {
  formatClockMs,
  formatShotClockMs,
  isShotClockDisplayed,
} from "@repo/shared";

import { formatPeriodLabel } from "@/components/statsheet/statsheet-labels";
import { StatsheetBuzzerButton } from "@/components/statsheet/statsheet-buzzer-button";
import { TeamPeriodIndicators } from "@/components/statsheet/statsheet-team-period-indicators";
import { TransitionLink } from "@/components/transition-link";
import { Button } from "@/components/ui/button";
import { getTeamTheme } from "@/lib/team-colors";
import { cn } from "@/lib/utils";
import { useStatsheetStore } from "@/stores/use-statsheet-store";

type StatsheetLiveBoardProps = {
  leagueId: number;
  gameId: number;
};

export function StatsheetLiveBoard({
  leagueId,
  gameId,
}: StatsheetLiveBoardProps) {
  const game = useStatsheetStore((state) => state.game);
  const currentPeriod = useStatsheetStore((state) => state.currentPeriod);
  const firstTeamScore = useStatsheetStore((state) => state.firstTeamScore);
  const secondTeamScore = useStatsheetStore((state) => state.secondTeamScore);
  const clock = useStatsheetStore((state) => state.clock);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const syncFullscreen = useCallback(() => {
    setIsFullscreen(document.fullscreenElement != null);
  }, []);

  useEffect(() => {
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () =>
      document.removeEventListener("fullscreenchange", syncFullscreen);
  }, [syncFullscreen]);

  async function toggleFullscreen() {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    await document.documentElement.requestFullscreen();
  }

  if (!game?.firstTeamId || !game.secondTeamId) {
    return null;
  }

  const firstTheme = getTeamTheme(game.firstTeamColor);
  const secondTheme = getTeamTheme(game.secondTeamColor);
  const isClockRunning =
    clock?.gameClockRunning === true || clock?.shotClockRunning === true;

  return (
    <div className="relative flex min-h-svh w-full flex-col bg-black text-white">
      <div className="absolute right-4 top-4 z-10 flex items-center gap-2 opacity-60 transition-opacity hover:opacity-100">
        <StatsheetBuzzerButton
          className="border-white/20 bg-black/40 text-white hover:bg-white/10 hover:text-white"
          variant="outline"
        />
        <Button
          className="border-white/20 bg-black/40 text-white hover:bg-white/10 hover:text-white"
          onClick={() => void toggleFullscreen()}
          size="sm"
          type="button"
          variant="outline"
        >
          {isFullscreen ? (
            <>
              <Minimize className="size-4" />
              Exit fullscreen
            </>
          ) : (
            <>
              <Maximize className="size-4" />
              Fullscreen
            </>
          )}
        </Button>
        <Button
          asChild
          className="border-white/20 bg-black/40 text-white hover:bg-white/10 hover:text-white"
          size="sm"
          variant="outline"
        >
          <TransitionLink
            href={`/leagues/${leagueId}/games/${gameId}?view=stats`}
          >
            Exit live
          </TransitionLink>
        </Button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 md:px-12">
        <div className="grid w-full max-w-7xl grid-cols-[1fr_auto_1fr] items-end gap-6 md:gap-10">
          <div className="text-right">
            <p
              className="text-sm font-semibold uppercase tracking-[0.2em] md:text-lg"
              style={{ color: firstTheme.color }}
            >
              Away
            </p>
            <p className="mt-2 truncate text-2xl font-bold md:text-4xl lg:text-5xl">
              {game.firstTeamName ?? "Team 1"}
            </p>
            <p
              className="mt-4 font-mono text-7xl font-bold tabular-nums leading-none md:text-8xl lg:text-9xl"
              style={{ color: firstTheme.color }}
            >
              {firstTeamScore}
            </p>
            <TeamPeriodIndicators
              align="end"
              className="mt-6 md:mt-8"
              size="lg"
              teamColor={game.firstTeamColor}
              teamId={game.firstTeamId}
            />
          </div>

          <div className="flex flex-col items-center gap-3 pb-4">
            <span className="rounded-full bg-white/10 px-5 py-2 text-lg font-bold uppercase tracking-wider md:text-2xl">
              {formatPeriodLabel(currentPeriod)}
            </span>
            {isClockRunning ? (
              <span className="size-3 animate-pulse rounded-full bg-emerald-400 md:size-4" />
            ) : null}
          </div>

          <div>
            <p
              className="text-sm font-semibold uppercase tracking-[0.2em] md:text-lg"
              style={{ color: secondTheme.color }}
            >
              Home
            </p>
            <p className="mt-2 truncate text-2xl font-bold md:text-4xl lg:text-5xl">
              {game.secondTeamName ?? "Team 2"}
            </p>
            <p
              className="mt-4 font-mono text-7xl font-bold tabular-nums leading-none md:text-8xl lg:text-9xl"
              style={{ color: secondTheme.color }}
            >
              {secondTeamScore}
            </p>
            <TeamPeriodIndicators
              className="mt-6 md:mt-8"
              size="lg"
              teamColor={game.secondTeamColor}
              teamId={game.secondTeamId}
            />
          </div>
        </div>

        {clock ? (
          <div
            className={cn(
              "mt-12 flex w-full max-w-5xl flex-col items-stretch gap-8 md:mt-16 md:flex-row md:justify-center md:gap-16",
              !isShotClockDisplayed(clock) && "max-w-2xl",
            )}
          >
            <div className="flex flex-1 flex-col items-center rounded-2xl border border-white/10 bg-white/5 px-8 py-8 md:py-10">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/50 md:text-base">
                Game
              </p>
              <p
                className={cn(
                  "mt-3 font-mono text-7xl font-bold tabular-nums leading-none md:text-8xl lg:text-9xl",
                  clock.gameClockMs <= 60_000 && "text-amber-300",
                )}
              >
                {formatClockMs(clock.gameClockMs)}
              </p>
            </div>
            {isShotClockDisplayed(clock) ? (
              <div className="flex flex-1 flex-col items-center rounded-2xl border border-amber-500/30 bg-amber-500/10 px-8 py-8 md:py-10">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-200/70 md:text-base">
                  Shot
                </p>
                <p
                  className={cn(
                    "mt-3 font-mono text-7xl font-bold tabular-nums leading-none text-amber-300 md:text-8xl lg:text-9xl",
                    clock.shotClockMs <= 5000 && "text-red-400",
                  )}
                >
                  {formatShotClockMs(clock.shotClockMs)}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
