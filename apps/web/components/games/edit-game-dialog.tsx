"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { GAME_STATUSES, GAME_TYPES } from "@repo/api/constants";

import {
  formatGameStatus,
  formatGameType,
} from "@/components/games/game-labels";
import type { GameRow } from "@/components/games/games-table";
import {
  combineDateAndTime,
  defaultScheduleValues,
  toDateInputValue,
  toTimeInputValue,
} from "@/components/games/schedule-datetime";
import { ScheduleDateTimeFields } from "@/components/games/schedule-datetime-fields";
import type { TeamRow } from "@/components/teams/teams-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTRPC } from "@/trpc/client";

const formSchema = z
  .object({
    firstTeamId: z.coerce.number().int().positive("Select a team"),
    secondTeamId: z.coerce.number().int().positive("Select a team"),
    type: z.enum(GAME_TYPES),
    status: z.enum(GAME_STATUSES),
    scheduledDate: z.string().min(1, "Date is required"),
    scheduledTime: z.string().min(1, "Time is required"),
  })
  .refine((values) => values.firstTeamId !== values.secondTeamId, {
    message: "Teams must be different",
    path: ["secondTeamId"],
  })
  .refine(
    (values) =>
      combineDateAndTime(values.scheduledDate, values.scheduledTime) !== null,
    {
      message: "Enter a valid date and time",
      path: ["scheduledTime"],
    },
  );

type FormValues = z.infer<typeof formSchema>;

type EditGameDialogProps = {
  game: GameRow;
  leagueId: number;
  teams: TeamRow[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const editableTeamStatuses = new Set(["scheduled", "cancelled"]);

function scheduleFormValues(game: GameRow) {
  if (game.scheduledAt) {
    return {
      scheduledDate: toDateInputValue(game.scheduledAt),
      scheduledTime: toTimeInputValue(game.scheduledAt),
    };
  }

  return defaultScheduleValues();
}

export function EditGameDialog({
  game,
  leagueId,
  teams,
  open,
  onOpenChange,
}: EditGameDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const teamsEditable = editableTeamStatuses.has(game.status);
  const scheduleDefaults = scheduleFormValues(game);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstTeamId: game.firstTeamId ?? 0,
      secondTeamId: game.secondTeamId ?? 0,
      type: game.type,
      status: game.status,
      ...scheduleDefaults,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        firstTeamId: game.firstTeamId ?? 0,
        secondTeamId: game.secondTeamId ?? 0,
        type: game.type,
        status: game.status,
        ...scheduleFormValues(game),
      });
    }
  }, [open, game, form]);

  const updateMutation = useMutation(
    trpc.games.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.games.listByLeague.queryFilter({ leagueId }),
        );
        onOpenChange(false);
      },
    }),
  );

  function onSubmit(values: FormValues) {
    const scheduledAt = combineDateAndTime(
      values.scheduledDate,
      values.scheduledTime,
    );

    if (!scheduledAt) {
      return;
    }

    updateMutation.mutate({
      id: game.id,
      firstTeamId: values.firstTeamId,
      secondTeamId: values.secondTeamId,
      type: values.type,
      status: values.status,
      scheduledAt,
    });
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit game</DialogTitle>
          <DialogDescription>
            {teamsEditable
              ? "Update schedule, teams, type, or status."
              : "Teams are locked once a game has started. You can still update the schedule, type, and status."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <ScheduleDateTimeFields control={form.control} />
            <FormField
              control={form.control}
              name="firstTeamId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First team</FormLabel>
                  <Select
                    disabled={!teamsEditable}
                    onValueChange={(value) => field.onChange(Number(value))}
                    value={field.value ? String(field.value) : undefined}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select team" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={String(team.id)}>
                          {team.name ?? "Untitled team"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="secondTeamId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Second team</FormLabel>
                  <Select
                    disabled={!teamsEditable}
                    onValueChange={(value) => field.onChange(Number(value))}
                    value={field.value ? String(field.value) : undefined}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select team" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={String(team.id)}>
                          {team.name ?? "Untitled team"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {GAME_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {formatGameType(type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {GAME_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {formatGameStatus(status)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {updateMutation.error ? (
              <p className="text-sm text-destructive">
                {updateMutation.error.message}
              </p>
            ) : null}
            <DialogFooter>
              <Button
                disabled={updateMutation.isPending}
                onClick={() => onOpenChange(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={updateMutation.isPending} type="submit">
                {updateMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
