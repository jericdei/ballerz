export function formatMadeAttempted(made: number, attempted: number) {
  return `${made}/${attempted}`;
}

export function formatTotalRebounds(
  offensiveRebounds: number,
  defensiveRebounds: number,
) {
  return offensiveRebounds + defensiveRebounds;
}

export function sumPlayerStatField<
  T extends Record<K, number>,
  K extends keyof T,
>(rows: T[], field: K) {
  return rows.reduce((total, row) => total + row[field], 0);
}
