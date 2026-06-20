export const DEFAULT_TIMEOUTS_PER_QUARTER = 2;
export const DEFAULT_FOULS_BEFORE_BONUS = 5;

export function isTeamInBonus(
  teamFouls: number,
  foulsBeforeBonus: number,
): boolean {
  return teamFouls >= foulsBeforeBonus;
}

export function getRemainingTimeouts(
  timeoutsUsed: number,
  timeoutsPerQuarter: number,
): number {
  return Math.max(0, timeoutsPerQuarter - timeoutsUsed);
}
