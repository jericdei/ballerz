"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { GAME_TYPES } from "@repo/api/constants";

import { formatGameType } from "@/components/games/game-labels";
import {
  combineDateAndTime,
  defaultScheduleValues,
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
  DialogTrigger,
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

type CreateGameDialogProps = {
  leagueId: number;
  teams: TeamRow[];
  disabled?: boolean;
};

export function CreateGameDialog({
  leagueId,
  teams,
  disabled = false,
}: CreateGameDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const defaultSchedule = defaultScheduleValues();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstTeamId: teams[0]?.id ?? 0,
      secondTeamId: teams[1]?.id ?? 0,
      type: "regular",
      ...defaultSchedule,
    },
  });

  const createMutation = useMutation(
    trpc.games.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.games.listByLeague.queryFilter({ leagueId }),
        );
        form.reset({
          firstTeamId: teams[0]?.id ?? 0,
          secondTeamId: teams[1]?.id ?? 0,
          type: "regular",
          ...defaultScheduleValues(),
        });
        setOpen(false);
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

    createMutation.mutate({
      leagueId,
      firstTeamId: values.firstTeamId,
      secondTeamId: values.secondTeamId,
      type: values.type,
      scheduledAt,
    });
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button disabled={disabled} type="button">
          Schedule game
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule game</DialogTitle>
          <DialogDescription>
            Choose teams, date, time, and game type.
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
            {createMutation.error ? (
              <p className="text-sm text-destructive">
                {createMutation.error.message}
              </p>
            ) : null}
            <DialogFooter>
              <Button disabled={createMutation.isPending} type="submit">
                {createMutation.isPending ? "Scheduling..." : "Schedule"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
