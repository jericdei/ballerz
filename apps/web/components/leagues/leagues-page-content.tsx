"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Trophy, Users } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { CrudPageLoading } from "@/components/crud/crud-page-loading";
import { CrudPageSection } from "@/components/crud/crud-page-section";
import { CrudStatCard, CrudStatStrip } from "@/components/crud/crud-stat-card";
import { CreateLeagueDialog } from "@/components/leagues/create-league-dialog";
import { LeaguesTable } from "@/components/leagues/leagues-table";
import { useTRPC } from "@/trpc/client";

export function LeaguesPageContent() {
  const trpc = useTRPC();
  const leaguesQuery = useQuery(trpc.leagues.list.queryOptions());
  const leagues = leaguesQuery.data ?? [];
  const readyCount = leagues.filter((league) => league.isReady).length;

  return (
    <AppShell
      actions={<CreateLeagueDialog />}
      description="Create leagues and manage teams, rosters, and games."
      layout="wide"
      title="Leagues"
    >
      {leaguesQuery.isLoading ? (
        <CrudPageLoading message="Loading leagues..." />
      ) : leaguesQuery.isError ? (
        <p className="text-sm text-destructive">
          Failed to load leagues: {leaguesQuery.error.message}
        </p>
      ) : (
        <div className="space-y-6">
          <CrudStatStrip>
            <CrudStatCard
              accent="blue"
              icon={Trophy}
              label="Total leagues"
              value={leagues.length}
            />
            <CrudStatCard
              accent="emerald"
              icon={CheckCircle2}
              label="Ready for games"
              value={readyCount}
            />
            <CrudStatCard
              accent="violet"
              icon={Users}
              label="Total teams"
              value={leagues.reduce((sum, league) => sum + league.teamCount, 0)}
            />
          </CrudStatStrip>

          <CrudPageSection
            accent="blue"
            description="Open a league to manage teams, schedule games, and record stats."
            icon={Trophy}
            title="Your leagues"
          >
            <LeaguesTable data={leagues} />
          </CrudPageSection>
        </div>
      )}
    </AppShell>
  );
}
