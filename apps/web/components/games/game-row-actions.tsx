"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";

import { DeleteGameDialog } from "@/components/games/delete-game-dialog";
import { EditGameDialog } from "@/components/games/edit-game-dialog";
import type { GameRow } from "@/components/games/games-table";
import type { TeamRow } from "@/components/teams/teams-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type GameRowActionsProps = {
  game: GameRow;
  leagueId: number;
  teams: TeamRow[];
};

export function GameRowActions({ game, leagueId, teams }: GameRowActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="size-8" size="icon" type="button" variant="ghost">
            <MoreHorizontal className="size-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <EditGameDialog
        game={game}
        leagueId={leagueId}
        onOpenChange={setEditOpen}
        open={editOpen}
        teams={teams}
      />
      <DeleteGameDialog
        game={game}
        leagueId={leagueId}
        onOpenChange={setDeleteOpen}
        open={deleteOpen}
      />
    </>
  );
}
