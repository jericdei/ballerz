"use client";

import { notFound } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { MIN_TEAMS_PER_LEAGUE } from "@repo/api/constants";

import { AppShell } from "@/components/app-shell";
import { CreateGameDialog } from "@/components/games/create-game-dialog";
import { GamesTable } from "@/components/games/games-table";
import { LeagueDetailActions } from "@/components/leagues/league-detail-actions";
import { CreateTeamDialog } from "@/components/teams/create-team-dialog";
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
  const gamesQuery = useQuery(
    trpc.games.listByLeague.queryOptions({ leagueId }),
  );

  if (leagueQuery.isError) {
    notFound();
  }

  const league = leagueQuery.data;
  const teams = teamsQuery.data ?? [];
  const games = gamesQuery.data ?? [];
  const isLoading =
    leagueQuery.isLoading || teamsQuery.isLoading || gamesQuery.isLoading;

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
          ? `${league.teamCount} team${league.teamCount === 1 ? "" : "s"} · ${games.length} game${games.length === 1 ? "" : "s"}`
          : undefined
      }
      title={league?.name ?? "League"}
    >
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading league...</p>
      ) : league ? (
        <div className="space-y-8">
          <div className="flex items-center gap-2">
            {league.isReady ? (
              <Badge variant="secondary">Ready for games</Badge>
            ) : (
              <Badge variant="outline">
                Needs {MIN_TEAMS_PER_LEAGUE}+ teams
              </Badge>
            )}
          </div>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Teams</h2>
                <p className="text-sm text-muted-foreground">
                  Manage teams in this league.
                </p>
              </div>
              <CreateTeamDialog leagueId={leagueId} />
            </div>
            <TeamsTable data={teams} leagueId={leagueId} />
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Games</h2>
                <p className="text-sm text-muted-foreground">
                  Schedule and manage matchups.
                </p>
              </div>
              <CreateGameDialog
                disabled={!league.isReady}
                leagueId={leagueId}
                teams={teams}
              />
            </div>
            {!league.isReady ? (
              <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                Add at least {MIN_TEAMS_PER_LEAGUE} teams before scheduling
                games.
              </p>
            ) : null}
            <GamesTable data={games} leagueId={leagueId} teams={teams} />
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}
