"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table";
import { normalizeHexColor } from "@/lib/team-colors";
import { cn } from "@/lib/utils";

export type LeagueLeaderRow = {
  playerId: number;
  firstName: string;
  lastName: string;
  number: number;
  position: string | null;
  teamId: number;
  teamName: string | null;
  teamColor: string;
  gamesPlayed: number;
  pointsPerGame: number;
  reboundsPerGame: number;
  assistsPerGame: number;
  stealsPerGame: number;
  blocksPerGame: number;
  turnoversPerGame: number;
  fieldGoalPct: number | null;
};

type LeaderStatKey =
  | "pointsPerGame"
  | "reboundsPerGame"
  | "assistsPerGame"
  | "stealsPerGame"
  | "blocksPerGame";

const statTabs: Array<{
  key: LeaderStatKey;
  label: string;
  shortLabel: string;
}> = [
  { key: "pointsPerGame", label: "Points", shortLabel: "PTS" },
  { key: "reboundsPerGame", label: "Rebounds", shortLabel: "REB" },
  { key: "assistsPerGame", label: "Assists", shortLabel: "AST" },
  { key: "stealsPerGame", label: "Steals", shortLabel: "STL" },
  { key: "blocksPerGame", label: "Blocks", shortLabel: "BLK" },
];

function formatAverage(value: number) {
  return value.toFixed(1);
}

function formatPct(value: number | null) {
  if (value == null) return "—";
  return `${value.toFixed(1)}%`;
}

type LeagueLeadersTableProps = {
  data: LeagueLeaderRow[];
};

export function LeagueLeadersTable({ data }: LeagueLeadersTableProps) {
  const [activeStat, setActiveStat] = useState<LeaderStatKey>("pointsPerGame");

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => b[activeStat] - a[activeStat]);
  }, [activeStat, data]);

  const leaderValue = sortedData[0]?.[activeStat];

  const columns: ColumnDef<LeagueLeaderRow>[] = [
    {
      id: "rank",
      header: "#",
      cell: ({ row }) => {
        const rank = row.index + 1;
        return (
          <span
            className={cn(
              "inline-flex size-7 items-center justify-center rounded-full text-xs font-bold tabular-nums",
              rank === 1 &&
                "bg-amber-500/20 text-amber-700 ring-1 ring-amber-500/40 dark:text-amber-300",
              rank === 2 &&
                "bg-slate-400/20 text-slate-700 ring-1 ring-slate-400/40 dark:text-slate-300",
              rank === 3 &&
                "bg-orange-600/20 text-orange-800 ring-1 ring-orange-600/40 dark:text-orange-300",
              rank > 3 && "text-muted-foreground",
            )}
          >
            {rank}
          </span>
        );
      },
    },
    {
      id: "player",
      header: "Player",
      cell: ({ row }) => {
        const color = normalizeHexColor(row.original.teamColor);
        return (
          <div className="flex items-center gap-3">
            <span
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ backgroundColor: color }}
            >
              {row.original.number}
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold">
                {row.original.firstName} {row.original.lastName}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {row.original.position ?? "—"} ·{" "}
                {row.original.teamName ?? "Team"}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "gamesPlayed",
      header: "GP",
      cell: ({ row }) => (
        <span className="tabular-nums">{row.original.gamesPlayed}</span>
      ),
    },
    {
      id: "primaryStat",
      header:
        statTabs.find((tab) => tab.key === activeStat)?.shortLabel ?? "AVG",
      cell: ({ row }) => {
        const value = row.original[activeStat];
        const isLeader = leaderValue != null && value === leaderValue;

        return (
          <span
            className={cn(
              "text-lg font-bold tabular-nums",
              isLeader && "text-amber-600 dark:text-amber-400",
            )}
          >
            {formatAverage(value)}
          </span>
        );
      },
    },
    {
      accessorKey: "pointsPerGame",
      header: "PTS",
      cell: ({ row }) => (
        <span className="tabular-nums">
          {formatAverage(row.original.pointsPerGame)}
        </span>
      ),
    },
    {
      accessorKey: "reboundsPerGame",
      header: "REB",
      cell: ({ row }) => (
        <span className="tabular-nums">
          {formatAverage(row.original.reboundsPerGame)}
        </span>
      ),
    },
    {
      accessorKey: "assistsPerGame",
      header: "AST",
      cell: ({ row }) => (
        <span className="tabular-nums">
          {formatAverage(row.original.assistsPerGame)}
        </span>
      ),
    },
    {
      accessorKey: "stealsPerGame",
      header: "STL",
      cell: ({ row }) => (
        <span className="tabular-nums">
          {formatAverage(row.original.stealsPerGame)}
        </span>
      ),
    },
    {
      accessorKey: "blocksPerGame",
      header: "BLK",
      cell: ({ row }) => (
        <span className="tabular-nums">
          {formatAverage(row.original.blocksPerGame)}
        </span>
      ),
    },
    {
      accessorKey: "fieldGoalPct",
      header: "FG%",
      cell: ({ row }) => (
        <span className="tabular-nums">
          {formatPct(row.original.fieldGoalPct)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {statTabs.map((tab) => (
          <button
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors",
              activeStat === tab.key
                ? "border-amber-500/50 bg-amber-500/15 text-amber-800 dark:text-amber-300"
                : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            key={tab.key}
            onClick={() => setActiveStat(tab.key)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={sortedData}
        emptyMessage="No completed games yet. Finish a game to populate league leaders."
      />
    </div>
  );
}
