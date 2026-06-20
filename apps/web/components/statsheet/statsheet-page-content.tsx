"use client";

import { useEffect } from "react";
import { notFound, redirect, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/app-shell";
import { CrudPageLoading } from "@/components/crud/crud-page-loading";
import { formatMatchup } from "@/components/games/game-labels";
import { StatsheetClockPanel } from "@/components/statsheet/statsheet-clock-panel";
import { StatsheetHeaderActions } from "@/components/statsheet/statsheet-header-actions";
import {
  StatsheetMutationsProvider,
  useStatsheetMutations,
} from "@/components/statsheet/statsheet-mutations-context";
import { StatsheetLiveBoard } from "@/components/statsheet/statsheet-live-board";
import { StatsheetScoreboard } from "@/components/statsheet/statsheet-scoreboard";
import { StatsheetStatsLayout } from "@/components/statsheet/statsheet-stats-layout";
import { StatsheetStatusBadges } from "@/components/statsheet/statsheet-status-badges";
import {
  parseStatsheetView,
  type StatsheetView,
} from "@/components/statsheet/statsheet-view-toggle";
import { cn } from "@/lib/utils";
import { useStatsheetStore } from "@/stores/use-statsheet-store";
import { useTRPC } from "@/trpc/client";

type StatsheetPageContentProps = {
  leagueId: number;
  gameId: number;
};

function StatsheetContent({
  view,
  leagueId,
  gameId,
}: {
  view: StatsheetView;
  leagueId: number;
  gameId: number;
}) {
  const { isUndoing, isFinishing } = useStatsheetMutations();
  const isBlocked = isUndoing || isFinishing;

  if (view === "live") {
    return <StatsheetLiveBoard gameId={gameId} leagueId={leagueId} />;
  }

  if (view === "clock") {
    return (
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-hidden",
          isBlocked && "pointer-events-none opacity-60",
        )}
      >
        <StatsheetScoreboard hideCompactClock />
        <div className="min-h-0 flex-1 overflow-hidden p-3 sm:p-4 md:p-6">
          <StatsheetClockPanel className="h-full w-full" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden",
        isBlocked && "pointer-events-none opacity-60",
      )}
    >
      <StatsheetScoreboard />
      <StatsheetStatsLayout />
    </div>
  );
}

export function StatsheetPageContent({
  leagueId,
  gameId,
}: StatsheetPageContentProps) {
  const trpc = useTRPC();
  const searchParams = useSearchParams();
  const hydrate = useStatsheetStore((state) => state.hydrate);
  const view = parseStatsheetView(searchParams.get("view"));

  const leagueQuery = useQuery(
    trpc.leagues.getById.queryOptions({ id: leagueId }),
  );
  const statsheetQuery = useQuery(
    trpc.statsheet.getState.queryOptions({ gameId }),
  );

  useEffect(() => {
    if (statsheetQuery.data) {
      hydrate(statsheetQuery.data);
    }
  }, [statsheetQuery.data, hydrate]);

  const isLoading = leagueQuery.isLoading || statsheetQuery.isLoading;

  if (leagueQuery.isError || statsheetQuery.isError) {
    notFound();
  }

  if (statsheetQuery.data?.game.status === "final") {
    redirect(`/leagues/${leagueId}/games/${gameId}/box-score`);
  }

  const snapshot = statsheetQuery.data;
  const title = snapshot
    ? formatMatchup(snapshot.game.firstTeamName, snapshot.game.secondTeamName)
    : "Game";

  if (isLoading) {
    if (view === "live") {
      return (
        <div className="flex min-h-svh items-center justify-center bg-black text-white">
          <p className="text-lg text-white/60">Loading live board...</p>
        </div>
      );
    }

    return (
      <AppShell
        breadcrumbs={[
          { label: "Leagues", href: "/leagues" },
          { label: "League", href: `/leagues/${leagueId}` },
          { label: "Game" },
        ]}
        layout="full"
        title="Game"
      >
        <CrudPageLoading message="Loading statsheet..." />
      </AppShell>
    );
  }

  if (view === "live") {
    return (
      <StatsheetMutationsProvider gameId={gameId}>
        <StatsheetContent gameId={gameId} leagueId={leagueId} view={view} />
      </StatsheetMutationsProvider>
    );
  }

  return (
    <StatsheetMutationsProvider gameId={gameId}>
      <AppShell
        actions={<StatsheetHeaderActions />}
        breadcrumbs={[
          { label: "Leagues", href: "/leagues" },
          {
            label: leagueQuery.data?.name ?? "League",
            href: `/leagues/${leagueId}`,
          },
          { label: title },
        ]}
        layout="full"
        title={title}
        titleAddon={<StatsheetStatusBadges />}
      >
        <StatsheetContent gameId={gameId} leagueId={leagueId} view={view} />
      </AppShell>
    </StatsheetMutationsProvider>
  );
}
