"use client";

import { useEffect } from "react";
import { notFound } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { formatMatchup } from "@/components/games/game-labels";
import { StatsheetCourt } from "@/components/statsheet/statsheet-court";
import { StatsheetEventLog } from "@/components/statsheet/statsheet-event-log";
import { StatsheetHeaderActions } from "@/components/statsheet/statsheet-header-actions";
import { StatsheetScoreboard } from "@/components/statsheet/statsheet-scoreboard";
import { StatsheetStatPanel } from "@/components/statsheet/statsheet-stat-panel";
import { useStatsheetStore } from "@/stores/use-statsheet-store";
import { useTRPC } from "@/trpc/client";

type StatsheetPageContentProps = {
  leagueId: number;
  gameId: number;
};

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

  if (leagueQuery.isError || statsheetQuery.isError) {
    notFound();
  }

  const snapshot = statsheetQuery.data;
  const title = snapshot
    ? formatMatchup(snapshot.game.firstTeamName, snapshot.game.secondTeamName)
    : "Game";

  return (
    <AppShell
      actions={<StatsheetHeaderActions gameId={gameId} />}
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
      {statsheetQuery.isLoading ? (
        <div className="flex flex-1 items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          <p className="text-sm">Loading statsheet...</p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <StatsheetScoreboard />
          <div className="grid min-h-0 flex-1 overflow-hidden grid-rows-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)] lg:grid-cols-[minmax(240px,280px)_1fr_minmax(260px,320px)] lg:grid-rows-1">
            <div className="min-h-0 overflow-hidden">
              <StatsheetStatPanel />
            </div>
            <div className="min-h-0 overflow-hidden">
              <StatsheetCourt />
            </div>
            <div className="min-h-0 overflow-hidden">
              <StatsheetEventLog gameId={gameId} />
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
