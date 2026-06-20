"use client";

import { UserRound } from "lucide-react";

import { useStatsheetMutations } from "@/components/statsheet/statsheet-mutations-context";
import {
  getStatsByCategory,
  statCategories,
  statCategoryMeta,
} from "@/components/statsheet/statsheet-stat-config";
import { isActiveGameStatus } from "@/lib/statsheet-utils";
import { cn } from "@/lib/utils";
import { useStatsheetStore } from "@/stores/use-statsheet-store";

function StatButton({
  label,
  shortLabel,
  category,
  icon: Icon,
  made,
  disabled,
  onClick,
}: {
  label: string;
  shortLabel: string;
  category: keyof typeof statCategoryMeta;
  icon: React.ComponentType<{ className?: string }>;
  made?: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const meta = statCategoryMeta[category];

  return (
    <button
      className={cn(
        "group flex flex-col items-center justify-center gap-1 rounded-xl border p-2.5 text-center transition-all",
        "disabled:cursor-not-allowed disabled:opacity-40",
        made === true &&
          "border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 hover:border-emerald-500/50",
        made === false && "border-border bg-muted/30 hover:bg-muted/60",
        made === undefined && meta.chip,
        "active:scale-[0.98] md:hover:scale-[1.02]",
      )}
      disabled={disabled}
      onClick={onClick}
      title={label}
      type="button"
    >
      <Icon
        className={cn(
          "size-5",
          made === true && "text-emerald-600 dark:text-emerald-400",
          made === false && "text-muted-foreground",
          made === undefined && meta.accent,
        )}
      />
      <span className="text-[11px] font-semibold leading-tight">
        {shortLabel}
      </span>
    </button>
  );
}

export function StatsheetStatPanel() {
  const selectedPlayerId = useStatsheetStore((state) => state.selectedPlayerId);
  const rosters = useStatsheetStore((state) => state.rosters);
  const status = useStatsheetStore((state) => state.status);
  const applyStat = useStatsheetStore((state) => state.applyStat);
  const { isBusy } = useStatsheetMutations();
  const canRecordStats = isActiveGameStatus(status) && !isBusy;

  const selectedPlayer = rosters.find(
    (row) => row.playerId === selectedPlayerId,
  );

  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden border-b bg-card/30 xl:border-b-0 xl:border-r">
      <div className="shrink-0 border-b p-3 sm:p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Record stat
        </h2>
        {!canRecordStats ? (
          <p className="mt-2 text-sm text-muted-foreground">
            This game is finished. Stats are read-only.
          </p>
        ) : null}
        {selectedPlayer ? (
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {selectedPlayer.number}
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold">
                {selectedPlayer.firstName} {selectedPlayer.lastName}
              </p>
              <p className="text-xs text-muted-foreground">Selected player</p>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-dashed p-3 text-muted-foreground">
            <UserRound className="size-8 shrink-0 opacity-50" />
            <p className="text-sm">
              Select a player from the court to record stats.
            </p>
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3 sm:space-y-5 sm:p-4">
        {statCategories.map((category) => {
          const meta = statCategoryMeta[category];
          const buttons = getStatsByCategory(category);

          return (
            <div key={category}>
              <h3
                className={cn(
                  "mb-2 text-xs font-semibold uppercase tracking-wider",
                  meta.accent,
                )}
              >
                {meta.label}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {buttons.map((config) => (
                  <StatButton
                    category={config.category}
                    disabled={!selectedPlayerId || !canRecordStats}
                    icon={config.icon}
                    key={config.eventType}
                    label={config.label}
                    made={config.made}
                    onClick={() => applyStat(config.eventType)}
                    shortLabel={config.shortLabel}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
