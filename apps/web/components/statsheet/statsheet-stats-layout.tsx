"use client";

import { ClipboardList, History, Users } from "lucide-react";
import { useState } from "react";

import { StatsheetCourt } from "@/components/statsheet/statsheet-court";
import { StatsheetEventLog } from "@/components/statsheet/statsheet-event-log";
import { StatsheetStatPanel } from "@/components/statsheet/statsheet-stat-panel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useStatsheetStore } from "@/stores/use-statsheet-store";

type MobilePanel = "court" | "stats" | "log";

const mobileTabs: {
  id: MobilePanel;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "court", label: "Rosters", icon: Users },
  { id: "stats", label: "Record", icon: ClipboardList },
  { id: "log", label: "Log", icon: History },
];

export function StatsheetStatsLayout() {
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("court");
  const selectedPlayerId = useStatsheetStore((state) => state.selectedPlayerId);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 gap-1 border-b bg-card/50 p-2 xl:hidden">
        {mobileTabs.map(({ id, label, icon: Icon }) => {
          const isActive = mobilePanel === id;
          const showSelectedDot = id === "stats" && selectedPlayerId != null;

          return (
            <Button
              className={cn(
                "relative min-h-10 flex-1 gap-1.5 px-2",
                isActive && "shadow-sm",
              )}
              key={id}
              onClick={() => setMobilePanel(id)}
              size="sm"
              type="button"
              variant={isActive ? "default" : "ghost"}
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{label}</span>
              {showSelectedDot ? (
                <span
                  aria-hidden
                  className="absolute right-2 top-1.5 size-1.5 rounded-full bg-primary-foreground"
                />
              ) : null}
            </Button>
          );
        })}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden xl:hidden">
        {mobilePanel === "court" ? <StatsheetCourt /> : null}
        {mobilePanel === "stats" ? <StatsheetStatPanel /> : null}
        {mobilePanel === "log" ? <StatsheetEventLog /> : null}
      </div>

      <div className="hidden min-h-0 flex-1 overflow-hidden xl:grid xl:grid-cols-[minmax(240px,280px)_1fr_minmax(260px,320px)]">
        <div className="min-h-0 overflow-hidden">
          <StatsheetStatPanel />
        </div>
        <div className="min-h-0 overflow-hidden">
          <StatsheetCourt />
        </div>
        <div className="min-h-0 overflow-hidden">
          <StatsheetEventLog />
        </div>
      </div>
    </div>
  );
}
