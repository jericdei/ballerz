"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
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
import { guardDialogOpenChange } from "@/lib/dialog-open-change";
import { useTRPC } from "@/trpc/client";

const formSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  number: z.coerce.number().int().min(0).max(99),
  position: z.string().trim().optional(),
  isCaptain: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type CreatePlayerDialogProps = {
  teamId: number;
  playerCount: number;
  maxPlayers: number;
};

export function CreatePlayerDialog({
  teamId,
  playerCount,
  maxPlayers,
}: CreatePlayerDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const isFull = playerCount >= maxPlayers;
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      number: 0,
      position: "",
      isCaptain: false,
    },
  });

  const createMutation = useMutation(
    trpc.players.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.players.listByTeam.queryFilter({ teamId }),
        );
        form.reset({
          firstName: "",
          lastName: "",
          number: 0,
          position: "",
          isCaptain: false,
        });
        setOpen(false);
      },
    }),
  );

  function onSubmit(values: FormValues) {
    createMutation.mutate({
      teamId,
      firstName: values.firstName,
      lastName: values.lastName,
      number: values.number,
      position: values.position || undefined,
      isCaptain: values.isCaptain,
    });
  }

  return (
    <Dialog
      onOpenChange={guardDialogOpenChange(createMutation.isPending, setOpen)}
      open={open}
    >
      <DialogTrigger asChild>
        <Button className="gap-1.5" disabled={isFull} size="sm" type="button">
          <Plus className="size-4" />
          Add player
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add player</DialogTitle>
          <DialogDescription>
            Add a player to this team roster ({playerCount}/{maxPlayers}).
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
            <FormField
              control={form.control}
              name="isCaptain"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <input
                        checked={field.value}
                        className="size-4 rounded border"
                        onChange={(event) =>
                          field.onChange(event.target.checked)
                        }
                        type="checkbox"
                      />
                    </FormControl>
                    <FormLabel className="font-normal">Team captain</FormLabel>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Only one captain per team. Assigning a new captain replaces
                    the current one.
                  </p>
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
                {createMutation.isPending ? "Adding..." : "Add player"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
