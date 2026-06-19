"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table";
import { TeamRowActions } from "@/components/teams/team-row-actions";

export type TeamRow = {
  id: number;
  name: string | null;
  color: string;
  leagueId: number | null;
  createdAt: Date;
  playerCount: number;
};

type TeamsTableProps = {
  data: TeamRow[];
  leagueId: number;
};

export function TeamsTable({ data, leagueId }: TeamsTableProps) {
  const router = useRouter();

  const columns: ColumnDef<TeamRow>[] = [
    {
      accessorKey: "color",
      header: "Color",
      cell: ({ row }) => (
        <span
          aria-hidden
          className="inline-block size-5 rounded-full border shadow-sm"
          style={{ backgroundColor: row.original.color }}
        />
      ),
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => row.original.name ?? "Untitled team",
    },
    {
      accessorKey: "playerCount",
      header: "Players",
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) =>
        new Date(row.original.createdAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div
          className="flex items-center justify-end gap-2"
          onClick={(event) => event.stopPropagation()}
        >
          <Link
            className="text-sm text-primary hover:underline"
            href={`/leagues/${leagueId}/teams/${row.original.id}`}
          >
            Roster
          </Link>
          <TeamRowActions leagueId={leagueId} team={row.original} />
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      emptyMessage="No teams yet. Add at least two teams to get this league ready."
      onRowClick={(row) => router.push(`/leagues/${leagueId}/teams/${row.id}`)}
    />
  );
}
