import type { LucideIcon } from "lucide-react";
import {
  AlertOctagon,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Ban,
  CircleDot,
  CircleX,
  Hand,
  Minus,
  RotateCcw,
  Share2,
  Target,
  Zap,
} from "lucide-react";

import type { GameStatEventType } from "@repo/shared";

export type StatCategory =
  | "scoring"
  | "playmaking"
  | "defense"
  | "fouls"
  | "turnovers"
  | "rebounds";

export type StatButtonConfig = {
  eventType: GameStatEventType;
  label: string;
  shortLabel: string;
  category: StatCategory;
  icon: LucideIcon;
  made?: boolean;
};

export const statCategoryMeta: Record<
  StatCategory,
  { label: string; accent: string; chip: string }
> = {
  scoring: {
    label: "Scoring",
    accent: "text-emerald-600 dark:text-emerald-400",
    chip: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  playmaking: {
    label: "Playmaking",
    accent: "text-sky-600 dark:text-sky-400",
    chip: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
  defense: {
    label: "Defense",
    accent: "text-violet-600 dark:text-violet-400",
    chip: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  },
  fouls: {
    label: "Fouls",
    accent: "text-orange-600 dark:text-orange-400",
    chip: "bg-orange-500/10 text-orange-700 dark:text-orange-300",
  },
  turnovers: {
    label: "Turnovers",
    accent: "text-amber-600 dark:text-amber-400",
    chip: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  rebounds: {
    label: "Rebounds",
    accent: "text-cyan-600 dark:text-cyan-400",
    chip: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
  },
};

export const statButtonConfigs: StatButtonConfig[] = [
  {
    eventType: "ft_made",
    label: "Free throw made",
    shortLabel: "+1 FT",
    category: "scoring",
    icon: CircleDot,
    made: true,
  },
  {
    eventType: "ft_missed",
    label: "Free throw missed",
    shortLabel: "Miss FT",
    category: "scoring",
    icon: CircleX,
    made: false,
  },
  {
    eventType: "fg2_made",
    label: "2-point field goal",
    shortLabel: "+2 FG",
    category: "scoring",
    icon: Target,
    made: true,
  },
  {
    eventType: "fg2_missed",
    label: "2-point miss",
    shortLabel: "Miss 2",
    category: "scoring",
    icon: Minus,
    made: false,
  },
  {
    eventType: "fg3_made",
    label: "3-point field goal",
    shortLabel: "+3 FG",
    category: "scoring",
    icon: Zap,
    made: true,
  },
  {
    eventType: "fg3_missed",
    label: "3-point miss",
    shortLabel: "Miss 3",
    category: "scoring",
    icon: Minus,
    made: false,
  },
  {
    eventType: "assist",
    label: "Assist",
    shortLabel: "AST",
    category: "playmaking",
    icon: Share2,
  },
  {
    eventType: "steal",
    label: "Steal",
    shortLabel: "STL",
    category: "defense",
    icon: Hand,
  },
  {
    eventType: "block",
    label: "Block",
    shortLabel: "BLK",
    category: "defense",
    icon: Ban,
  },
  {
    eventType: "personal_foul",
    label: "Personal foul",
    shortLabel: "Foul",
    category: "fouls",
    icon: AlertTriangle,
  },
  {
    eventType: "technical_foul",
    label: "Technical foul",
    shortLabel: "Tech",
    category: "fouls",
    icon: AlertOctagon,
  },
  {
    eventType: "turnover",
    label: "Turnover",
    shortLabel: "TO",
    category: "turnovers",
    icon: RotateCcw,
  },
  {
    eventType: "offensive_rebound",
    label: "Offensive rebound",
    shortLabel: "OREB",
    category: "rebounds",
    icon: ArrowUp,
  },
  {
    eventType: "defensive_rebound",
    label: "Defensive rebound",
    shortLabel: "DREB",
    category: "rebounds",
    icon: ArrowDown,
  },
];

const statConfigByType = Object.fromEntries(
  statButtonConfigs.map((config) => [config.eventType, config]),
) as Record<GameStatEventType, StatButtonConfig | undefined>;

export function getStatButtonConfig(eventType: GameStatEventType) {
  return statConfigByType[eventType];
}

export const statCategories: StatCategory[] = [
  "scoring",
  "rebounds",
  "playmaking",
  "defense",
  "fouls",
  "turnovers",
];

export function getStatsByCategory(category: StatCategory) {
  return statButtonConfigs.filter((config) => config.category === category);
}
