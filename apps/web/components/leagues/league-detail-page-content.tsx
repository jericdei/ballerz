"use client";

import { notFound } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  CheckCircle2,
  Shield,
  Swords,
  Trophy,
  Users,
} from "lucide-react";

import { MIN_TEAMS_PER_LEAGUE } from "@repo/api/constants";

import { AppShell } from "@/components/app-shell";
import { CrudPageLoading } from "@/components/crud/crud-page-loading";
import { CrudStatCard, CrudStatStrip } from "@/components/crud/crud-stat-card";
import { CreateGameDialog } from "@/components/games/create-game-dialog";
import { GamesTable } from "@/components/games/games-table";
import { QuickStartGameDialog } from "@/components/games/quick-start-game-dialog";
import { LeagueDetailActions } from "@/components/leagues/league-detail-actions";
import { LeagueLeadersTable } from "@/components/leagues/league-leaders-table";
import { CreateTeamDialog } from "@/components/teams/create-team-dialog";
import { TeamsTable } from "@/components/teams/teams-table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTRPC } from "@/trpc/client";

type LeagueDetailPageContentProps = {
  leagueId: number;
};

function TabPanelHeader({
  description,
  actions,
}: {
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

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
  const leadersQuery = useQuery(
    trpc.leagues.leaders.queryOptions({ id: leagueId }),
  );

  if (
    leagueQuery.isError ||
    teamsQuery.isError ||
    gamesQuery.isError ||
    leadersQuery.isError
  ) {
    notFound();
  }

  const league = leagueQuery.data;
  const teams = teamsQuery.data ?? [];
  const games = gamesQuery.data ?? [];
  const leaders = leadersQuery.data ?? [];
  const isLoading =
    leagueQuery.isLoading ||
    teamsQuery.isLoading ||
    gamesQuery.isLoading ||
    leadersQuery.isLoading;
  const liveGames = games.filter(
    (game) => game.status === "in_progress" || game.status === "halftime",
  ).length;

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
      layout="wide"
      title={league?.name ?? "League"}
    >
      {isLoading ? (
        <CrudPageLoading message="Loading league..." />
      ) : league ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            {league.isReady ? (
              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                Ready for games
              </Badge>
            ) : (
              <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300">
                Needs {MIN_TEAMS_PER_LEAGUE}+ teams
              </Badge>
            )}
          </div>

          <CrudStatStrip>
            <CrudStatCard
              accent="blue"
              icon={Shield}
              label="Teams"
              value={league.teamCount}
            />
            <CrudStatCard
              accent="orange"
              icon={CalendarDays}
              label="Games"
              value={games.length}
            />
            <CrudStatCard
              accent="emerald"
              icon={Swords}
              label="Live now"
              value={liveGames}
            />
            <CrudStatCard
              accent="violet"
              icon={CheckCircle2}
              label="Roster slots"
              value={teams.reduce((sum, team) => sum + team.playerCount, 0)}
            />
          </CrudStatStrip>

          <Tabs
            className="rounded-2xl border bg-card p-4 shadow-sm md:p-6"
            defaultValue="leaders"
          >
            <TabsList className="grid w-full grid-cols-3 sm:inline-flex sm:w-auto">
              <TabsTrigger value="leaders">
                <Trophy />
                Leaders
              </TabsTrigger>
              <TabsTrigger value="teams">
                <Users />
                Teams
              </TabsTrigger>
              <TabsTrigger value="games">
                <CalendarDays />
                Games
              </TabsTrigger>
            </TabsList>

            <TabsContent value="leaders">
              <TabPanelHeader description="Per-game averages from completed games, ranked by category." />
              <LeagueLeadersTable data={leaders} />
            </TabsContent>

            <TabsContent value="teams">
              <TabPanelHeader
                actions={<CreateTeamDialog leagueId={leagueId} />}
                description="Add teams and open rosters to manage players."
              />
              <TeamsTable data={teams} leagueId={leagueId} />
            </TabsContent>

            <TabsContent value="games">
              <TabPanelHeader
                actions={
                  <>
                    <CreateGameDialog
                      disabled={!league.isReady}
                      leagueId={leagueId}
                      teams={teams}
                    />
                    <QuickStartGameDialog
                      disabled={!league.isReady}
                      leagueId={leagueId}
                      teams={teams}
                    />
                  </>
                }
                description="Schedule matchups or quick-start a live statsheet."
              />
              {!league.isReady ? (
                <p className="mb-4 rounded-xl border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
                  Add at least {MIN_TEAMS_PER_LEAGUE} teams before scheduling
                  games.
                </p>
              ) : null}
              <GamesTable data={games} leagueId={leagueId} teams={teams} />
            </TabsContent>
          </Tabs>
        </div>
      ) : null}
    </AppShell>
  );
}
