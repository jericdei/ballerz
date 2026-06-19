"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table";
import {
  formatGameStatus,
  formatGameType,
  formatMatchup,
  formatScore,
} from "@/components/games/game-labels";
import { GameRowActions } from "@/components/games/game-row-actions";
import { formatScheduledAt } from "@/components/games/schedule-datetime";
import type { TeamRow } from "@/components/teams/teams-table";
import { Badge } from "@/components/ui/badge";

export type GameRow = {
  id: number;
  leagueId: number | null;
  firstTeamId: number | null;
  secondTeamId: number | null;
  firstTeamName: string | null;
  secondTeamName: string | null;
  type: "regular" | "playoffs" | "exhibition" | "finals";
  status: "scheduled" | "in_progress" | "halftime" | "final" | "cancelled";
  firstTeamScore: number;
  secondTeamScore: number;
  scheduledAt: Date | null;
  createdAt: Date;
};

type GamesTableProps = {
  data: GameRow[];
  leagueId: number;
  teams: TeamRow[];
};

function statusVariant(
  status: GameRow["status"],
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "in_progress":
    case "halftime":
      return "default";
    case "final":
      return "secondary";
    case "cancelled":
      return "destructive";
    default:
      return "outline";
  }
}

export function GamesTable({ data, leagueId, teams }: GamesTableProps) {
  const columns: ColumnDef<GameRow>[] = [
    {
      id: "matchup",
      header: "Matchup",
      cell: ({ row }) =>
        formatMatchup(row.original.firstTeamName, row.original.secondTeamName),
    },
    {
      id: "score",
      header: "Score",
      cell: ({ row }) =>
        formatScore(
          row.original.status,
          row.original.firstTeamScore,
          row.original.secondTeamScore,
        ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => formatGameType(row.original.type),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={statusVariant(row.original.status)}>
          {formatGameStatus(row.original.status)}
        </Badge>
      ),
    },
    {
      accessorKey: "scheduledAt",
      header: "Scheduled",
      cell: ({ row }) => formatScheduledAt(row.original.scheduledAt),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end">
          <GameRowActions
            game={row.original}
            leagueId={leagueId}
            teams={teams}
          />
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      emptyMessage="No games scheduled yet."
    />
  );
}
