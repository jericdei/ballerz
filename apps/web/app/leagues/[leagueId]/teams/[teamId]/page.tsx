import { notFound } from "next/navigation";

import { TeamDetailPageContent } from "@/components/teams/team-detail-page-content";

type TeamPageProps = {
  params: Promise<{ leagueId: string; teamId: string }>;
};

export default async function TeamPage({ params }: TeamPageProps) {
  const { leagueId, teamId } = await params;
  const parsedLeagueId = Number(leagueId);
  const parsedTeamId = Number(teamId);

  if (
    !Number.isInteger(parsedLeagueId) ||
    parsedLeagueId <= 0 ||
    !Number.isInteger(parsedTeamId) ||
    parsedTeamId <= 0
  ) {
    notFound();
  }

  return (
    <TeamDetailPageContent leagueId={parsedLeagueId} teamId={parsedTeamId} />
  );
}
