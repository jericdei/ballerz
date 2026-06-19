import { z } from "zod";

export const DEFAULT_TEAM_COLOR = "#2563eb";

export const TEAM_COLOR_PRESETS = [
  "#2563eb",
  "#ea580c",
  "#7c3aed",
  "#059669",
  "#db2777",
  "#0891b2",
  "#ca8a04",
  "#dc2626",
] as const;

export const teamColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex code (e.g. #2563eb)");

export function normalizeTeamColor(color: string) {
  return color.toLowerCase();
}
