"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table";

export type TeamRow = {
  id: number;
  name: string | null;
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
        <Link
          className="text-sm text-primary hover:underline"
          href={`/leagues/${leagueId}/teams/${row.original.id}`}
          onClick={(event) => event.stopPropagation()}
        >
          Roster
        </Link>
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
