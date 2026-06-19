"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table";
import { LeagueRowActions } from "@/components/leagues/league-row-actions";
import { Badge } from "@/components/ui/badge";

export type LeagueRow = {
  id: number;
  name: string | null;
  createdAt: Date;
  teamCount: number;
  isReady: boolean;
};

type LeaguesTableProps = {
  data: LeagueRow[];
};

export function LeaguesTable({ data }: LeaguesTableProps) {
  const router = useRouter();

  const columns: ColumnDef<LeagueRow>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => row.original.name ?? "Untitled league",
    },
    {
      accessorKey: "teamCount",
      header: "Teams",
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) =>
        row.original.isReady ? (
          <Badge variant="secondary">Ready</Badge>
        ) : (
          <Badge variant="outline">Needs teams</Badge>
        ),
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
            href={`/leagues/${row.original.id}`}
          >
            Open
          </Link>
          <LeagueRowActions league={row.original} />
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      emptyMessage="No leagues yet. Create your first league to get started."
      onRowClick={(row) => router.push(`/leagues/${row.id}`)}
    />
  );
}
