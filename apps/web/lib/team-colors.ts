import type { CSSProperties } from "react";

import { DEFAULT_TEAM_COLOR } from "@repo/api/constants";

export function normalizeHexColor(color: string | null | undefined) {
  if (!color || !/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return DEFAULT_TEAM_COLOR;
  }
  return color.toLowerCase();
}

function hexToRgb(hex: string) {
  const normalized = normalizeHexColor(hex).slice(1);
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

export function withAlpha(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getTeamTheme(color: string | null | undefined) {
  const normalized = normalizeHexColor(color);

  return {
    color: normalized,
    borderColor: withAlpha(normalized, 0.35),
    headerBackground: withAlpha(normalized, 0.12),
    badgeBackground: withAlpha(normalized, 0.18),
    scoreGradient: `linear-gradient(135deg, ${withAlpha(normalized, 0.08)} 0%, transparent 100%)`,
  };
}

export function getTeamThemeStyle(
  color: string | null | undefined,
): CSSProperties {
  const theme = getTeamTheme(color);
  return {
    borderColor: theme.borderColor,
    backgroundColor: theme.headerBackground,
    color: theme.color,
  };
}
