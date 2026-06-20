import { notFound } from "next/navigation";

import { GameBoxScorePageContent } from "@/components/games/game-box-score-page-content";

type BoxScorePageProps = {
  params: Promise<{ leagueId: string; gameId: string }>;
};

export default async function BoxScorePage({ params }: BoxScorePageProps) {
  const { leagueId, gameId } = await params;
  const parsedLeagueId = Number(leagueId);
  const parsedGameId = Number(gameId);

  if (
    !Number.isInteger(parsedLeagueId) ||
    parsedLeagueId <= 0 ||
    !Number.isInteger(parsedGameId) ||
    parsedGameId <= 0
  ) {
    notFound();
  }

  return (
    <GameBoxScorePageContent gameId={parsedGameId} leagueId={parsedLeagueId} />
  );
}
