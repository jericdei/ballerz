import { notFound } from "next/navigation";

import { StatsheetPageContent } from "@/components/statsheet/statsheet-page-content";

type GamePageProps = {
  params: Promise<{ leagueId: string; gameId: string }>;
};

export default async function GamePage({ params }: GamePageProps) {
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
    <StatsheetPageContent gameId={parsedGameId} leagueId={parsedLeagueId} />
  );
}
