import type { GameStatus, GameType } from "@repo/api/constants";

export function formatGameType(type: GameType) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function formatGameStatus(status: GameStatus) {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatMatchup(
  firstTeamName: string | null,
  secondTeamName: string | null,
) {
  const first = firstTeamName ?? "Team A";
  const second = secondTeamName ?? "Team B";
  return `${first} vs ${second}`;
}

export function formatScore(
  status: GameStatus,
  firstTeamScore: number,
  secondTeamScore: number,
) {
  if (status === "scheduled" && firstTeamScore === 0 && secondTeamScore === 0) {
    return "—";
  }

  return `${firstTeamScore} – ${secondTeamScore}`;
}
