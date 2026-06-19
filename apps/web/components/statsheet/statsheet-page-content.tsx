"use client";

import { useEffect } from "react";
import { notFound } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/app-shell";
import { CrudPageLoading } from "@/components/crud/crud-page-loading";
import { formatMatchup } from "@/components/games/game-labels";
import { StatsheetCourt } from "@/components/statsheet/statsheet-court";
import { StatsheetEventLog } from "@/components/statsheet/statsheet-event-log";
import { StatsheetHeaderActions } from "@/components/statsheet/statsheet-header-actions";
import {
  StatsheetMutationsProvider,
  useStatsheetMutations,
} from "@/components/statsheet/statsheet-mutations-context";
import { StatsheetScoreboard } from "@/components/statsheet/statsheet-scoreboard";
import { StatsheetStatPanel } from "@/components/statsheet/statsheet-stat-panel";
import { cn } from "@/lib/utils";
import { useStatsheetStore } from "@/stores/use-statsheet-store";
import { useTRPC } from "@/trpc/client";

type StatsheetPageContentProps = {
  leagueId: number;
  gameId: number;
};

function StatsheetContent() {
  const { isBusy } = useStatsheetMutations();

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden",
        isBusy && "pointer-events-none opacity-60",
      )}
    >
      <StatsheetScoreboard />
      <div className="grid min-h-0 flex-1 overflow-hidden grid-rows-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)] lg:grid-cols-[minmax(240px,280px)_1fr_minmax(260px,320px)] lg:grid-rows-1">
        <div className="min-h-0 overflow-hidden">
          <StatsheetStatPanel />
        </div>
        <div className="min-h-0 overflow-hidden">
          <StatsheetCourt />
        </div>
        <div className="min-h-0 overflow-hidden">
          <StatsheetEventLog />
        </div>
      </div>
    </div>
  );
}

export function StatsheetPageContent({
  leagueId,
  gameId,
}: StatsheetPageContentProps) {
  const trpc = useTRPC();
  const hydrate = useStatsheetStore((state) => state.hydrate);

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

  const snapshot = statsheetQuery.data;
  const title = snapshot
    ? formatMatchup(snapshot.game.firstTeamName, snapshot.game.secondTeamName)
    : "Game";

  if (isLoading) {
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
      >
        <StatsheetContent />
      </AppShell>
    </StatsheetMutationsProvider>
  );
}
