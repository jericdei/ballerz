import type { LucideIcon } from "lucide-react";

import type { CrudAccent } from "@/components/crud/crud-page-section";
import { cn } from "@/lib/utils";

const accentStyles: Record<CrudAccent, string> = {
  blue: "border-blue-500/30 bg-blue-500/5",
  orange: "border-orange-500/30 bg-orange-500/5",
  emerald: "border-emerald-500/30 bg-emerald-500/5",
  violet: "border-violet-500/30 bg-violet-500/5",
  amber: "border-amber-500/30 bg-amber-500/5",
};

const iconStyles: Record<CrudAccent, string> = {
  blue: "text-blue-600 dark:text-blue-400",
  orange: "text-orange-600 dark:text-orange-400",
  emerald: "text-emerald-600 dark:text-emerald-400",
  violet: "text-violet-600 dark:text-violet-400",
  amber: "text-amber-600 dark:text-amber-400",
};

type CrudStatCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: CrudAccent;
};

export function CrudStatCard({
  label,
  value,
  icon: Icon,
  accent = "blue",
}: CrudStatCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border px-4 py-3",
        accentStyles[accent],
      )}
    >
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg bg-background/80",
          iconStyles[accent],
        )}
      >
        <Icon className="size-4" />
      </div>
      <div>
        <p className="text-2xl font-bold tabular-nums leading-none">{value}</p>
        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
      </div>
    </div>
  );
}

type CrudStatStripProps = {
  children: React.ReactNode;
};

export function CrudStatStrip({ children }: CrudStatStripProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
  );
}
