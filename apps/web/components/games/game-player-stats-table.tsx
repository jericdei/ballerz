"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import type { PlayerStatDeltas } from "@repo/shared";
import { zeroPlayerStatDeltas } from "@repo/shared";

import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import {
  formatMadeAttempted,
  formatTotalRebounds,
  sumPlayerStatField,
} from "@/lib/game-stats-formatters";
import { getTeamTheme } from "@/lib/team-colors";

type RosterRow = {
  playerId: number;
  teamId: number;
  isDnp: boolean;
  firstName: string;
  lastName: string;
  number: number;
  isGuest: boolean;
};

type PlayerStatsRow = PlayerStatDeltas & {
  playerId: number;
  number: number;
  name: string;
  isGuest: boolean;
};

type GamePlayerStatsTableProps = {
  teamId: number;
  teamName: string;
  teamColor: string;
  sideLabel: "Away" | "Home";
  rosters: RosterRow[];
  playerStats: Array<PlayerStatDeltas & { playerId: number }>;
};

function toStatsRow(
  roster: RosterRow,
  statsByPlayerId: Map<number, PlayerStatDeltas>,
): PlayerStatsRow {
  const stats = statsByPlayerId.get(roster.playerId) ?? zeroPlayerStatDeltas();

  return {
    playerId: roster.playerId,
    number: roster.number,
    name: `${roster.firstName} ${roster.lastName}`,
    isGuest: roster.isGuest,
    ...stats,
  };
}

function buildTotalsRow(rows: PlayerStatsRow[]): PlayerStatsRow {
  return {
    playerId: -1,
    number: 0,
    name: "Team totals",
    isGuest: false,
    fg2Made: sumPlayerStatField(rows, "fg2Made"),
    fg2Attempted: sumPlayerStatField(rows, "fg2Attempted"),
    fg3Made: sumPlayerStatField(rows, "fg3Made"),
    fg3Attempted: sumPlayerStatField(rows, "fg3Attempted"),
    ftMade: sumPlayerStatField(rows, "ftMade"),
    ftAttempted: sumPlayerStatField(rows, "ftAttempted"),
    assists: sumPlayerStatField(rows, "assists"),
    turnovers: sumPlayerStatField(rows, "turnovers"),
    offensiveRebounds: sumPlayerStatField(rows, "offensiveRebounds"),
    defensiveRebounds: sumPlayerStatField(rows, "defensiveRebounds"),
    personalFouls: sumPlayerStatField(rows, "personalFouls"),
    technicalFouls: sumPlayerStatField(rows, "technicalFouls"),
    steals: sumPlayerStatField(rows, "steals"),
    blocks: sumPlayerStatField(rows, "blocks"),
    points: sumPlayerStatField(rows, "points"),
  };
}

const columns: ColumnDef<PlayerStatsRow>[] = [
  {
    accessorKey: "number",
    header: "#",
    cell: ({ row }) =>
      row.original.playerId === -1 ? null : (
        <span className="font-medium tabular-nums">{row.original.number}</span>
      ),
  },
  {
    accessorKey: "name",
    header: "Player",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span
          className={
            row.original.playerId === -1 ? "font-semibold" : "font-medium"
          }
        >
          {row.original.name}
        </span>
        {row.original.isGuest ? (
          <Badge className="text-[10px]" variant="secondary">
            Guest
          </Badge>
        ) : null}
      </div>
    ),
  },
  {
    accessorKey: "points",
    header: "PTS",
    cell: ({ row }) => (
      <span className="font-semibold tabular-nums">{row.original.points}</span>
    ),
  },
  {
    id: "reb",
    header: "REB",
    cell: ({ row }) => (
      <span className="tabular-nums">
        {formatTotalRebounds(
          row.original.offensiveRebounds,
          row.original.defensiveRebounds,
        )}
      </span>
    ),
  },
  {
    accessorKey: "assists",
    header: "AST",
    cell: ({ row }) => (
      <span className="tabular-nums">{row.original.assists}</span>
    ),
  },
  {
    accessorKey: "steals",
    header: "STL",
    cell: ({ row }) => (
      <span className="tabular-nums">{row.original.steals}</span>
    ),
  },
  {
    accessorKey: "blocks",
    header: "BLK",
    cell: ({ row }) => (
      <span className="tabular-nums">{row.original.blocks}</span>
    ),
  },
  {
    accessorKey: "turnovers",
    header: "TO",
    cell: ({ row }) => (
      <span className="tabular-nums">{row.original.turnovers}</span>
    ),
  },
  {
    accessorKey: "personalFouls",
    header: "PF",
    cell: ({ row }) => (
      <span className="tabular-nums">{row.original.personalFouls}</span>
    ),
  },
  {
    id: "fg",
    header: "FG",
    cell: ({ row }) => (
      <span className="tabular-nums">
        {formatMadeAttempted(
          row.original.fg2Made + row.original.fg3Made,
          row.original.fg2Attempted + row.original.fg3Attempted,
        )}
      </span>
    ),
  },
  {
    id: "fg3",
    header: "3PT",
    cell: ({ row }) => (
      <span className="tabular-nums">
        {formatMadeAttempted(row.original.fg3Made, row.original.fg3Attempted)}
      </span>
    ),
  },
  {
    id: "ft",
    header: "FT",
    cell: ({ row }) => (
      <span className="tabular-nums">
        {formatMadeAttempted(row.original.ftMade, row.original.ftAttempted)}
      </span>
    ),
  },
  {
    accessorKey: "offensiveRebounds",
    header: "OREB",
    cell: ({ row }) => (
      <span className="tabular-nums">{row.original.offensiveRebounds}</span>
    ),
  },
  {
    accessorKey: "defensiveRebounds",
    header: "DREB",
    cell: ({ row }) => (
      <span className="tabular-nums">{row.original.defensiveRebounds}</span>
    ),
  },
];

export function GamePlayerStatsTable({
  teamId,
  teamName,
  teamColor,
  sideLabel,
  rosters,
  playerStats,
}: GamePlayerStatsTableProps) {
  const theme = getTeamTheme(teamColor);

  const rows = useMemo(() => {
    const statsByPlayerId = new Map(
      playerStats.map((row) => [row.playerId, row]),
    );
    const activePlayers = rosters
      .filter((row) => row.teamId === teamId && !row.isDnp)
      .map((row) => toStatsRow(row, statsByPlayerId))
      .sort((a, b) => a.number - b.number);

    if (activePlayers.length === 0) {
      return [];
    }

    return [...activePlayers, buildTotalsRow(activePlayers)];
  }, [playerStats, rosters, teamId]);

  return (
    <section
      className="overflow-hidden rounded-xl border bg-card"
      style={{ borderColor: theme.borderColor }}
    >
      <div
        className="border-b px-4 py-3"
        style={{ backgroundColor: theme.headerBackground }}
      >
        <span
          className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
          style={{
            backgroundColor: theme.badgeBackground,
            color: theme.color,
          }}
        >
          {sideLabel}
        </span>
        <h3 className="mt-1 text-lg font-semibold">{teamName}</h3>
      </div>

      <div className="overflow-x-auto p-2">
        <DataTable
          columns={columns}
          data={rows}
          emptyMessage="No players recorded for this team."
        />
      </div>
    </section>
  );
}
