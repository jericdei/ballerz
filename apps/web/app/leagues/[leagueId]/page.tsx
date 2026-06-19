import { notFound } from "next/navigation";

import { LeagueDetailPageContent } from "@/components/leagues/league-detail-page-content";

type LeaguePageProps = {
  params: Promise<{ leagueId: string }>;
};

export default async function LeaguePage({ params }: LeaguePageProps) {
  const { leagueId } = await params;
  const id = Number(leagueId);

  if (!Number.isInteger(id) || id <= 0) {
    notFound();
  }

  return <LeagueDetailPageContent leagueId={id} />;
}
