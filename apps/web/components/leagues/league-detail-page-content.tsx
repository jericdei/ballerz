"use client";

import { notFound } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { MIN_TEAMS_PER_LEAGUE } from "@repo/api/constants";

import { AppShell } from "@/components/app-shell";
import { LeagueDetailActions } from "@/components/leagues/league-detail-actions";
import { TeamsTable } from "@/components/teams/teams-table";
import { Badge } from "@/components/ui/badge";
import { useTRPC } from "@/trpc/client";

type LeagueDetailPageContentProps = {
  leagueId: number;
};

export function LeagueDetailPageContent({
  leagueId,
}: LeagueDetailPageContentProps) {
  const trpc = useTRPC();
  const leagueQuery = useQuery(
    trpc.leagues.getById.queryOptions({ id: leagueId }),
  );
  const teamsQuery = useQuery(
    trpc.teams.listByLeague.queryOptions({ leagueId }),
  );

  if (leagueQuery.isError) {
    notFound();
  }

  const league = leagueQuery.data;
  const teams = teamsQuery.data ?? [];

  return (
    <AppShell
      actions={
        league ? (
          <LeagueDetailActions
            leagueId={leagueId}
            leagueName={league.name ?? "Untitled league"}
          />
        ) : null
      }
      breadcrumbs={[
        { label: "Leagues", href: "/leagues" },
        { label: league?.name ?? "League" },
      ]}
      description={
        league
          ? `${league.teamCount} team${league.teamCount === 1 ? "" : "s"}`
          : undefined
      }
      title={league?.name ?? "League"}
    >
      {leagueQuery.isLoading || teamsQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading league...</p>
      ) : league ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {league.isReady ? (
              <Badge variant="secondary">Ready for games</Badge>
            ) : (
              <Badge variant="outline">
                Needs {MIN_TEAMS_PER_LEAGUE}+ teams
              </Badge>
            )}
          </div>
          {!league.isReady ? (
            <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              Add at least {MIN_TEAMS_PER_LEAGUE} teams before scheduling games.
            </p>
          ) : null}
          <TeamsTable data={teams} leagueId={leagueId} />
        </div>
      ) : null}
    </AppShell>
  );
}
