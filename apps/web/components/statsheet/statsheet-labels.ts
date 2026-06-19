import type { GamePeriod, GameStatEventType } from "@repo/shared";

const labels: Record<GameStatEventType, string> = {
  fg2_made: "+2 FG",
  fg2_missed: "Missed 2",
  fg3_made: "+3 FG",
  fg3_missed: "Missed 3",
  ft_made: "+1 FT",
  ft_missed: "Missed FT",
  assist: "Assist",
  turnover: "Turnover",
  offensive_rebound: "Off. reb",
  defensive_rebound: "Def. reb",
  personal_foul: "Foul",
  technical_foul: "Tech foul",
  steal: "Steal",
  block: "Block",
  timeout: "Timeout",
  dnp_marked: "DNP",
};

export function formatStatEventLabel(eventType: GameStatEventType) {
  return labels[eventType];
}

export function formatPeriodLabel(period: GamePeriod) {
  return period.toUpperCase();
}

export function formatPlayerName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`;
}
