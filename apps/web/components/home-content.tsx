"use client";

import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { useAppStore } from "@/stores/use-app-store";
import { useTRPC } from "@/trpc/client";

export function HomeContent() {
  const trpc = useTRPC();
  const healthQuery = useQuery(trpc.health.ping.queryOptions());
  const sidebarOpen = useAppStore((state) => state.sidebarOpen);
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 p-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Ballerz</h1>
        <p className="text-muted-foreground">
          Live basketball statsheet recorder
        </p>
      </div>

      <section className="space-y-3 rounded-lg border p-4">
        <h2 className="font-medium">tRPC + TanStack Query</h2>
        <p className="text-sm text-muted-foreground">
          Database health via{" "}
          <code className="rounded bg-muted px-1 py-0.5">health.ping</code>
        </p>
        <p className="text-sm">
          Status: {healthQuery.isLoading && "Checking..."}
          {healthQuery.isError && "Error connecting to database"}
          {healthQuery.isSuccess &&
            (healthQuery.data.ok ? "Connected" : "Unknown")}
        </p>
      </section>

      <section className="space-y-3 rounded-lg border p-4">
        <h2 className="font-medium">Zustand</h2>
        <p className="text-sm text-muted-foreground">
          Sidebar is {sidebarOpen ? "open" : "closed"}
        </p>
        <Button onClick={toggleSidebar} type="button">
          Toggle sidebar
        </Button>
      </section>
    </main>
  );
}
