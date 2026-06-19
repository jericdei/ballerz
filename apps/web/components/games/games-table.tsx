"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { StartGameButton } from "@/components/games/start-game-button";
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

const openableStatuses = new Set(["in_progress", "halftime", "final"]);

function statusBadgeClass(status: GameRow["status"]) {
  switch (status) {
    case "in_progress":
    case "halftime":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
    case "final":
      return "bg-violet-500/15 text-violet-700 dark:text-violet-300";
    case "cancelled":
      return "bg-destructive/15 text-destructive";
    default:
      return "bg-slate-500/15 text-slate-700 dark:text-slate-300";
  }
}

export function GamesTable({ data, leagueId, teams }: GamesTableProps) {
  const router = useRouter();

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
        <Badge className={statusBadgeClass(row.original.status)}>
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
        <div
          className="flex items-center justify-end gap-2"
          onClick={(event) => event.stopPropagation()}
        >
          <StartGameButton game={row.original} leagueId={leagueId} />
          {openableStatuses.has(row.original.status) ? (
            <Link
              className="text-sm text-primary hover:underline"
              href={`/leagues/${leagueId}/games/${row.original.id}`}
            >
              Statsheet
            </Link>
          ) : null}
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
      onRowClick={(row) => {
        if (openableStatuses.has(row.status)) {
          router.push(`/leagues/${leagueId}/games/${row.id}`);
        }
      }}
    />
  );
}
