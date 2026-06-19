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
  name: z.string().trim().min(1, "League name is required"),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateLeagueDialog() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "" },
  });

  const createMutation = useMutation(
    trpc.leagues.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.leagues.list.queryFilter());
        form.reset();
        setOpen(false);
      },
    }),
  );

  function onSubmit(values: FormValues) {
    createMutation.mutate(values);
  }

  return (
    <Dialog
      onOpenChange={guardDialogOpenChange(createMutation.isPending, setOpen)}
      open={open}
    >
      <DialogTrigger asChild>
        <Button className="gap-1.5" type="button">
          <Plus className="size-4" />
          Create league
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create league</DialogTitle>
          <DialogDescription>
            Add a new league to organize teams and games.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Summer League" {...field} />
                  </FormControl>
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
                {createMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
