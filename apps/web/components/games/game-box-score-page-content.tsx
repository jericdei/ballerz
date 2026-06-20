"use client";

import { notFound } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/app-shell";
import { CrudPageLoading } from "@/components/crud/crud-page-loading";
import { formatMatchup } from "@/components/games/game-labels";
import { GamePlayByPlay } from "@/components/games/game-play-by-play";
import { GamePlayerStatsTable } from "@/components/games/game-player-stats-table";
import { GameScoreSummary } from "@/components/games/game-score-summary";
import { GameTeamStatsSummary } from "@/components/games/game-team-stats-summary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTRPC } from "@/trpc/client";

type GameBoxScorePageContentProps = {
  leagueId: number;
  gameId: number;
};

export function GameBoxScorePageContent({
  leagueId,
  gameId,
}: GameBoxScorePageContentProps) {
  const trpc = useTRPC();

  const leagueQuery = useQuery(
    trpc.leagues.getById.queryOptions({ id: leagueId }),
  );
  const statsheetQuery = useQuery(
    trpc.statsheet.getState.queryOptions({ gameId }),
  );

  const isLoading = leagueQuery.isLoading || statsheetQuery.isLoading;

  if (leagueQuery.isError || statsheetQuery.isError) {
    notFound();
  }

  if (!isLoading && statsheetQuery.data?.game.status !== "final") {
    notFound();
  }

  const snapshot = statsheetQuery.data;
  const title = snapshot
    ? formatMatchup(snapshot.game.firstTeamName, snapshot.game.secondTeamName)
    : "Game";

  if (isLoading || !snapshot) {
    return (
      <AppShell
        breadcrumbs={[
          { label: "Leagues", href: "/leagues" },
          { label: "League", href: `/leagues/${leagueId}` },
          { label: "Box score" },
        ]}
        layout="wide"
        title="Box score"
      >
        <CrudPageLoading message="Loading box score..." />
      </AppShell>
    );
  }

  const { game, rosters, playerStats, teamPeriodStats, events } = snapshot;

  if (!game.firstTeamId || !game.secondTeamId) {
    notFound();
  }

  return (
    <AppShell
      breadcrumbs={[
        { label: "Leagues", href: "/leagues" },
        {
          label: leagueQuery.data?.name ?? "League",
          href: `/leagues/${leagueId}`,
        },
        { label: title },
      ]}
      layout="wide"
      title={title}
    >
      <div className="space-y-6">
        <GameScoreSummary
          currentPeriod={game.currentPeriod}
          endedAt={game.endedAt}
          firstTeamColor={game.firstTeamColor}
          firstTeamName={game.firstTeamName}
          firstTeamScore={game.firstTeamScore}
          secondTeamColor={game.secondTeamColor}
          secondTeamName={game.secondTeamName}
          secondTeamScore={game.secondTeamScore}
        />

        <Tabs defaultValue="box-score">
          <TabsList className="grid w-full grid-cols-3 sm:inline-flex sm:w-auto">
            <TabsTrigger value="box-score">Box score</TabsTrigger>
            <TabsTrigger value="team-stats">Team stats</TabsTrigger>
            <TabsTrigger value="play-by-play">Play-by-play</TabsTrigger>
          </TabsList>

          <TabsContent className="space-y-6" value="box-score">
            <GamePlayerStatsTable
              playerStats={playerStats}
              rosters={rosters}
              sideLabel="Away"
              teamColor={game.firstTeamColor}
              teamId={game.firstTeamId}
              teamName={game.firstTeamName ?? "Team 1"}
            />
            <GamePlayerStatsTable
              playerStats={playerStats}
              rosters={rosters}
              sideLabel="Home"
              teamColor={game.secondTeamColor}
              teamId={game.secondTeamId}
              teamName={game.secondTeamName ?? "Team 2"}
            />
          </TabsContent>

          <TabsContent value="team-stats">
            <GameTeamStatsSummary
              firstTeamColor={game.firstTeamColor}
              firstTeamId={game.firstTeamId}
              firstTeamName={game.firstTeamName}
              firstTeamScore={game.firstTeamScore}
              secondTeamColor={game.secondTeamColor}
              secondTeamId={game.secondTeamId}
              secondTeamName={game.secondTeamName}
              secondTeamScore={game.secondTeamScore}
              teamPeriodStats={teamPeriodStats}
            />
          </TabsContent>

          <TabsContent value="play-by-play">
            <GamePlayByPlay
              events={events}
              firstTeamId={game.firstTeamId}
              firstTeamName={game.firstTeamName}
              secondTeamId={game.secondTeamId}
              secondTeamName={game.secondTeamName}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
