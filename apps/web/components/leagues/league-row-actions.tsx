"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";

import { DeleteLeagueDialog } from "@/components/leagues/delete-league-dialog";
import { EditLeagueDialog } from "@/components/leagues/edit-league-dialog";
import type { LeagueRow } from "@/components/leagues/leagues-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type LeagueRowActionsProps = {
  league: LeagueRow;
};

export function LeagueRowActions({ league }: LeagueRowActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="size-8"
            onClick={(event) => event.stopPropagation()}
            size="icon"
            type="button"
            variant="ghost"
          >
            <MoreHorizontal className="size-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={(event) => {
              event.stopPropagation();
              setEditOpen(true);
            }}
          >
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={(event) => {
              event.stopPropagation();
              setDeleteOpen(true);
            }}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <EditLeagueDialog
        defaultName={league.name ?? ""}
        leagueId={league.id}
        onOpenChange={setEditOpen}
        open={editOpen}
      />
      <DeleteLeagueDialog
        leagueId={league.id}
        leagueName={league.name ?? "Untitled league"}
        onOpenChange={setDeleteOpen}
        open={deleteOpen}
      />
    </>
  );
}
