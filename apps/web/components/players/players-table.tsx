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
          <Badge variant="secondary">Captain</Badge>
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
