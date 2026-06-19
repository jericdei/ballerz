"use client";

import { notFound } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Crown, Hash, Shirt, Users } from "lucide-react";

import { MAX_PLAYERS_PER_TEAM } from "@repo/api/constants";

import { AppShell } from "@/components/app-shell";
import { CrudPageLoading } from "@/components/crud/crud-page-loading";
import { CrudPageSection } from "@/components/crud/crud-page-section";
import { CrudStatCard, CrudStatStrip } from "@/components/crud/crud-stat-card";
import { PlayersTable } from "@/components/players/players-table";
import { TeamDetailActions } from "@/components/teams/team-detail-actions";
import { useTRPC } from "@/trpc/client";

type TeamDetailPageContentProps = {
  leagueId: number;
  teamId: number;
};

export function TeamDetailPageContent({
  leagueId,
  teamId,
}: TeamDetailPageContentProps) {
  const trpc = useTRPC();
  const leagueQuery = useQuery(
    trpc.leagues.getById.queryOptions({ id: leagueId }),
  );
  const teamsQuery = useQuery(
    trpc.teams.listByLeague.queryOptions({ leagueId }),
  );
  const playersQuery = useQuery(
    trpc.players.listByTeam.queryOptions({ teamId }),
  );

  if (leagueQuery.isError || teamsQuery.isError || playersQuery.isError) {
    notFound();
  }

  const league = leagueQuery.data;
  const team = teamsQuery.data?.find((item) => item.id === teamId);
  const players = playersQuery.data ?? [];
  const captainCount = players.filter((player) => player.isCaptain).length;
  const openSlots = Math.max(0, MAX_PLAYERS_PER_TEAM - players.length);

  if (
    teamsQuery.isSuccess &&
    !teamsQuery.data.some((item) => item.id === teamId)
  ) {
    notFound();
  }

  return (
    <AppShell
      actions={
        team ? (
          <TeamDetailActions
            leagueId={leagueId}
            maxPlayers={MAX_PLAYERS_PER_TEAM}
            playerCount={players.length}
            teamColor={team.color}
            teamId={teamId}
            teamName={team.name ?? "Untitled team"}
          />
        ) : null
      }
      breadcrumbs={[
        { label: "Leagues", href: "/leagues" },
        {
          label: league?.name ?? "League",
          href: `/leagues/${leagueId}`,
        },
        { label: team?.name ?? "Team" },
      ]}
      description={
        team ? `${players.length}/${MAX_PLAYERS_PER_TEAM} players` : undefined
      }
      layout="wide"
      title={team?.name ?? "Team roster"}
    >
      {leagueQuery.isLoading ||
      teamsQuery.isLoading ||
      playersQuery.isLoading ? (
        <CrudPageLoading message="Loading roster..." />
      ) : team ? (
        <div className="space-y-6">
          <CrudStatStrip>
            <CrudStatCard
              accent="violet"
              icon={Users}
              label="Players"
              value={players.length}
            />
            <CrudStatCard
              accent="blue"
              icon={Hash}
              label="Open slots"
              value={openSlots}
            />
            <CrudStatCard
              accent="amber"
              icon={Crown}
              label="Captains"
              value={captainCount}
            />
            <CrudStatCard
              accent="emerald"
              icon={Shirt}
              label="Roster capacity"
              value={`${players.length}/${MAX_PLAYERS_PER_TEAM}`}
            />
          </CrudStatStrip>

          <CrudPageSection
            accent="violet"
            description="Jersey numbers, positions, and captain flags for this team."
            icon={Shirt}
            title="Roster"
          >
            <PlayersTable data={players} teamId={teamId} />
          </CrudPageSection>
        </div>
      ) : null}
    </AppShell>
  );
}
