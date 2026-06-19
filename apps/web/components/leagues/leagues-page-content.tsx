"use client";

import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/app-shell";
import { CreateLeagueDialog } from "@/components/leagues/create-league-dialog";
import { LeaguesTable } from "@/components/leagues/leagues-table";
import { useTRPC } from "@/trpc/client";

export function LeaguesPageContent() {
  const trpc = useTRPC();
  const leaguesQuery = useQuery(trpc.leagues.list.queryOptions());

  return (
    <AppShell
      actions={<CreateLeagueDialog />}
      description="Create leagues and manage teams and rosters."
      title="Leagues"
    >
      {leaguesQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading leagues...</p>
      ) : leaguesQuery.isError ? (
        <p className="text-sm text-destructive">
          Failed to load leagues: {leaguesQuery.error.message}
        </p>
      ) : (
        <LeaguesTable data={leaguesQuery.data ?? []} />
      )}
    </AppShell>
  );
}
