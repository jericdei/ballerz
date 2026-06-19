"use client";

import { notFound } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { MAX_PLAYERS_PER_TEAM } from "@repo/api/constants";

import { AppShell } from "@/components/app-shell";
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
      title={team?.name ?? "Team roster"}
    >
      {leagueQuery.isLoading ||
      teamsQuery.isLoading ||
      playersQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading roster...</p>
      ) : team ? (
        <PlayersTable data={players} teamId={teamId} />
      ) : null}
    </AppShell>
  );
}
