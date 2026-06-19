"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
import { z } from "zod";

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
import { Input } from "@/components/ui/input";
import { useStatsheetStore } from "@/stores/use-statsheet-store";
import { useTRPC } from "@/trpc/client";

const formSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  number: z.coerce.number().int().min(0).max(99),
  position: z.string().trim().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type AddGuestPlayerDialogProps = {
  gameId: number;
  teamId: number;
};

export function AddGuestPlayerDialog({
  gameId,
  teamId,
}: AddGuestPlayerDialogProps) {
  const trpc = useTRPC();
  const hydrate = useStatsheetStore((state) => state.hydrate);
  const selectPlayer = useStatsheetStore((state) => state.selectPlayer);
  const [open, setOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      number: 0,
      position: "",
    },
  });

  const addGuestMutation = useMutation(
    trpc.statsheet.addGuestPlayer.mutationOptions({
      onSuccess: (snapshot, variables) => {
        hydrate({
          game: snapshot.game,
          rosters: snapshot.rosters,
          playerStats: snapshot.playerStats,
          teamPeriodStats: snapshot.teamPeriodStats,
          events: snapshot.events,
        });

        const addedGuest = snapshot.rosters.find(
          (row) =>
            row.teamId === teamId &&
            row.isGuest &&
            row.firstName === variables.firstName &&
            row.lastName === variables.lastName &&
            row.number === variables.number,
        );

        if (addedGuest) {
          selectPlayer(addedGuest.playerId);
        }

        form.reset({
          firstName: "",
          lastName: "",
          number: 0,
          position: "",
        });
        setOpen(false);
      },
    }),
  );

  function onSubmit(values: FormValues) {
    addGuestMutation.mutate({
      gameId,
      teamId,
      firstName: values.firstName,
      lastName: values.lastName,
      number: values.number,
      position: values.position || undefined,
    });
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button className="h-8 gap-1.5" size="sm" type="button" variant="ghost">
          <UserPlus className="size-3.5" />
          Add guest
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add guest player</DialogTitle>
          <DialogDescription>
            Add a substitute for this game only. They will not appear on the
            permanent team roster.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jersey #</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <FormControl>
                      <Input placeholder="PG" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {addGuestMutation.error ? (
              <p className="text-sm text-destructive">
                {addGuestMutation.error.message}
              </p>
            ) : null}
            <DialogFooter>
              <Button disabled={addGuestMutation.isPending} type="submit">
                {addGuestMutation.isPending ? "Adding..." : "Add guest"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
