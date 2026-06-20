"use client";

import { useMemo } from "react";

import { GAME_PERIODS, type GamePeriod } from "@repo/shared";

import { formatPeriodLabel } from "@/components/statsheet/statsheet-labels";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getTeamTheme } from "@/lib/team-colors";

type TeamPeriodStatRow = {
  teamId: number;
  period: GamePeriod;
  timeoutsUsed: number;
  teamFouls: number;
};

type TeamSummary = {
  teamId: number;
  teamName: string;
  teamColor: string;
  sideLabel: "Away" | "Home";
  score: number;
  totalTimeouts: number;
  totalFouls: number;
};

type GameTeamStatsSummaryProps = {
  firstTeamId: number;
  secondTeamId: number;
  firstTeamName: string | null;
  secondTeamName: string | null;
  firstTeamColor: string;
  secondTeamColor: string;
  firstTeamScore: number;
  secondTeamScore: number;
  teamPeriodStats: TeamPeriodStatRow[];
};

function getPeriodsWithData(rows: TeamPeriodStatRow[]) {
  const periods = new Set<GamePeriod>();

  for (const row of rows) {
    if (row.timeoutsUsed > 0 || row.teamFouls > 0) {
      periods.add(row.period);
    }
  }

  return GAME_PERIODS.filter((period) => periods.has(period));
}

export function GameTeamStatsSummary({
  firstTeamId,
  secondTeamId,
  firstTeamName,
  secondTeamName,
  firstTeamColor,
  secondTeamColor,
  firstTeamScore,
  secondTeamScore,
  teamPeriodStats,
}: GameTeamStatsSummaryProps) {
  const teams = useMemo<TeamSummary[]>(() => {
    const summarize = (
      teamId: number,
      teamName: string | null,
      teamColor: string,
      sideLabel: "Away" | "Home",
      score: number,
    ): TeamSummary => {
      const teamRows = teamPeriodStats.filter((row) => row.teamId === teamId);

      return {
        teamId,
        teamName: teamName ?? "Team",
        teamColor,
        sideLabel,
        score,
        totalTimeouts: teamRows.reduce(
          (total, row) => total + row.timeoutsUsed,
          0,
        ),
        totalFouls: teamRows.reduce((total, row) => total + row.teamFouls, 0),
      };
    };

    return [
      summarize(
        firstTeamId,
        firstTeamName,
        firstTeamColor,
        "Away",
        firstTeamScore,
      ),
      summarize(
        secondTeamId,
        secondTeamName,
        secondTeamColor,
        "Home",
        secondTeamScore,
      ),
    ];
  }, [
    firstTeamColor,
    firstTeamId,
    firstTeamName,
    firstTeamScore,
    secondTeamColor,
    secondTeamId,
    secondTeamName,
    secondTeamScore,
    teamPeriodStats,
  ]);

  const periods = useMemo(
    () => getPeriodsWithData(teamPeriodStats),
    [teamPeriodStats],
  );

  const statsByTeamPeriod = useMemo(() => {
    const map = new Map<string, TeamPeriodStatRow>();

    for (const row of teamPeriodStats) {
      map.set(`${row.teamId}:${row.period}`, row);
    }

    return map;
  }, [teamPeriodStats]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {teams.map((team) => {
          const theme = getTeamTheme(team.teamColor);

          return (
            <section
              className="rounded-xl border bg-card p-4"
              key={team.teamId}
              style={{ borderColor: theme.borderColor }}
            >
              <span
                className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: theme.badgeBackground,
                  color: theme.color,
                }}
              >
                {team.sideLabel}
              </span>
              <h3 className="mt-1 text-lg font-semibold">{team.teamName}</h3>

              <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <div className="rounded-lg border bg-muted/30 px-3 py-2">
                  <dt className="text-xs text-muted-foreground">Points</dt>
                  <dd className="text-xl font-bold tabular-nums">
                    {team.score}
                  </dd>
                </div>
                <div className="rounded-lg border bg-muted/30 px-3 py-2">
                  <dt className="text-xs text-muted-foreground">Timeouts</dt>
                  <dd className="text-xl font-bold tabular-nums">
                    {team.totalTimeouts}
                  </dd>
                </div>
                <div className="rounded-lg border bg-muted/30 px-3 py-2">
                  <dt className="text-xs text-muted-foreground">Team fouls</dt>
                  <dd className="text-xl font-bold tabular-nums">
                    {team.totalFouls}
                  </dd>
                </div>
              </dl>
            </section>
          );
        })}
      </div>

      {periods.length > 0 ? (
        <section className="overflow-hidden rounded-xl border bg-card">
          <div className="border-b px-4 py-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Fouls and timeouts by period
            </h3>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  {teams.map((team) => (
                    <TableHead
                      className="text-center"
                      colSpan={2}
                      key={team.teamId}
                    >
                      {team.teamName}
                    </TableHead>
                  ))}
                </TableRow>
                <TableRow>
                  <TableHead />
                  {teams.flatMap((team) => [
                    <TableHead
                      className="text-center"
                      key={`${team.teamId}-to`}
                    >
                      TO
                    </TableHead>,
                    <TableHead
                      className="text-center"
                      key={`${team.teamId}-pf`}
                    >
                      Fouls
                    </TableHead>,
                  ])}
                </TableRow>
              </TableHeader>
              <TableBody>
                {periods.map((period) => (
                  <TableRow key={period}>
                    <TableCell className="font-medium">
                      {formatPeriodLabel(period)}
                    </TableCell>
                    {teams.flatMap((team) => {
                      const row = statsByTeamPeriod.get(
                        `${team.teamId}:${period}`,
                      );

                      return [
                        <TableCell
                          className="text-center tabular-nums"
                          key={`${team.teamId}-${period}-to`}
                        >
                          {row?.timeoutsUsed ?? 0}
                        </TableCell>,
                        <TableCell
                          className="text-center tabular-nums"
                          key={`${team.teamId}-${period}-pf`}
                        >
                          {row?.teamFouls ?? 0}
                        </TableCell>,
                      ];
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      ) : (
        <p className="text-sm text-muted-foreground">
          No team fouls or timeouts were recorded by period.
        </p>
      )}
    </div>
  );
}
