"use client";

import { ClipboardList, Monitor, Timer } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type StatsheetView = "stats" | "clock" | "live";

function parseView(param: string | null): StatsheetView {
  if (param === "clock") return "clock";
  if (param === "live") return "live";
  return "stats";
}

export function StatsheetViewToggle() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const view = parseView(searchParams.get("view"));

  function setView(next: StatsheetView) {
    if (next === view) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    if (next === "stats") {
      params.delete("view");
    } else {
      params.set("view", next);
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="flex items-center rounded-md border bg-background p-0.5">
      <Button
        className={cn("gap-1.5", view === "stats" && "shadow-sm")}
        onClick={() => setView("stats")}
        size="sm"
        type="button"
        variant={view === "stats" ? "default" : "ghost"}
      >
        <ClipboardList className="size-3.5" />
        Stats
      </Button>
      <Button
        className={cn("gap-1.5", view === "clock" && "shadow-sm")}
        onClick={() => setView("clock")}
        size="sm"
        type="button"
        variant={view === "clock" ? "default" : "ghost"}
      >
        <Timer className="size-3.5" />
        Clock
      </Button>
      <Button
        className={cn("gap-1.5", view === "live" && "shadow-sm")}
        onClick={() => setView("live")}
        size="sm"
        type="button"
        variant={view === "live" ? "default" : "ghost"}
      >
        <Monitor className="size-3.5" />
        Live
      </Button>
    </div>
  );
}

export { parseView as parseStatsheetView };
