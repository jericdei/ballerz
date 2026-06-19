"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table";
import { PlayerRowActions } from "@/components/players/player-row-actions";
import { Badge } from "@/components/ui/badge";

export type PlayerRow = {
  id: number;
  teamId: number | null;
  firstName: string;
  lastName: string;
  number: number;
  position: string | null;
  isCaptain: boolean;
  createdAt: Date;
};

type PlayersTableProps = {
  data: PlayerRow[];
  teamId: number;
};

export function PlayersTable({ data, teamId }: PlayersTableProps) {
  const columns: ColumnDef<PlayerRow>[] = [
    {
      accessorKey: "number",
      header: "#",
      cell: ({ row }) => (
        <span className="inline-flex size-8 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white dark:bg-violet-500">
          {row.original.number}
        </span>
      ),
    },
    {
      id: "name",
      header: "Name",
      cell: ({ row }) => `${row.original.firstName} ${row.original.lastName}`,
    },
    {
      accessorKey: "position",
      header: "Position",
      cell: ({ row }) => row.original.position ?? "—",
    },
    {
      id: "captain",
      header: "Captain",
      cell: ({ row }) =>
        row.original.isCaptain ? (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300">
            Captain
          </Badge>
        ) : (
          "—"
        ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end">
          <PlayerRowActions player={row.original} teamId={teamId} />
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      emptyMessage="No players on this roster yet."
    />
  );
}
