import type { GameStatEventType } from "./stat-enums";

export type PlayerStatDeltas = {
  fg2Made: number;
  fg2Attempted: number;
  fg3Made: number;
  fg3Attempted: number;
  ftMade: number;
  ftAttempted: number;
  assists: number;
  turnovers: number;
  offensiveRebounds: number;
  defensiveRebounds: number;
  personalFouls: number;
  technicalFouls: number;
  steals: number;
  blocks: number;
  points: number;
};

export type TeamPeriodDeltas = {
  timeoutsUsed: number;
  teamFouls: number;
};

export type ScoreDelta = {
  firstTeam: number;
  secondTeam: number;
};

export type StatEventEffects = {
  playerStats: PlayerStatDeltas | null;
  teamPeriod: TeamPeriodDeltas | null;
  score: ScoreDelta | null;
  marksDnp: boolean;
};

const zeroPlayerStats = (): PlayerStatDeltas => ({
  fg2Made: 0,
  fg2Attempted: 0,
  fg3Made: 0,
  fg3Attempted: 0,
  ftMade: 0,
  ftAttempted: 0,
  assists: 0,
  turnovers: 0,
  offensiveRebounds: 0,
  defensiveRebounds: 0,
  personalFouls: 0,
  technicalFouls: 0,
  steals: 0,
  blocks: 0,
  points: 0,
});

const zeroTeamPeriod = (): TeamPeriodDeltas => ({
  timeoutsUsed: 0,
  teamFouls: 0,
});

function scalePlayerStats(
  stats: PlayerStatDeltas,
  multiplier: number,
): PlayerStatDeltas {
  return {
    fg2Made: stats.fg2Made * multiplier,
    fg2Attempted: stats.fg2Attempted * multiplier,
    fg3Made: stats.fg3Made * multiplier,
    fg3Attempted: stats.fg3Attempted * multiplier,
    ftMade: stats.ftMade * multiplier,
    ftAttempted: stats.ftAttempted * multiplier,
    assists: stats.assists * multiplier,
    turnovers: stats.turnovers * multiplier,
    offensiveRebounds: stats.offensiveRebounds * multiplier,
    defensiveRebounds: stats.defensiveRebounds * multiplier,
    personalFouls: stats.personalFouls * multiplier,
    technicalFouls: stats.technicalFouls * multiplier,
    steals: stats.steals * multiplier,
    blocks: stats.blocks * multiplier,
    points: stats.points * multiplier,
  };
}

function scaleTeamPeriod(
  stats: TeamPeriodDeltas,
  multiplier: number,
): TeamPeriodDeltas {
  return {
    timeoutsUsed: stats.timeoutsUsed * multiplier,
    teamFouls: stats.teamFouls * multiplier,
  };
}

function scaleScore(score: ScoreDelta, multiplier: number): ScoreDelta {
  return {
    firstTeam: score.firstTeam * multiplier,
    secondTeam: score.secondTeam * multiplier,
  };
}

function withScoreForTeam(points: number, isFirstTeam: boolean): ScoreDelta {
  return {
    firstTeam: isFirstTeam ? points : 0,
    secondTeam: isFirstTeam ? 0 : points,
  };
}

const baseEffects: Record<GameStatEventType, StatEventEffects> = {
  fg2_made: {
    playerStats: {
      ...zeroPlayerStats(),
      fg2Made: 1,
      fg2Attempted: 1,
      points: 2,
    },
    teamPeriod: null,
    score: null,
    marksDnp: false,
  },
  fg2_missed: {
    playerStats: { ...zeroPlayerStats(), fg2Attempted: 1 },
    teamPeriod: null,
    score: null,
    marksDnp: false,
  },
  fg3_made: {
    playerStats: {
      ...zeroPlayerStats(),
      fg3Made: 1,
      fg3Attempted: 1,
      points: 3,
    },
    teamPeriod: null,
    score: null,
    marksDnp: false,
  },
  fg3_missed: {
    playerStats: { ...zeroPlayerStats(), fg3Attempted: 1 },
    teamPeriod: null,
    score: null,
    marksDnp: false,
  },
  ft_made: {
    playerStats: { ...zeroPlayerStats(), ftMade: 1, ftAttempted: 1, points: 1 },
    teamPeriod: null,
    score: null,
    marksDnp: false,
  },
  ft_missed: {
    playerStats: { ...zeroPlayerStats(), ftAttempted: 1 },
    teamPeriod: null,
    score: null,
    marksDnp: false,
  },
  assist: {
    playerStats: { ...zeroPlayerStats(), assists: 1 },
    teamPeriod: null,
    score: null,
    marksDnp: false,
  },
  turnover: {
    playerStats: { ...zeroPlayerStats(), turnovers: 1 },
    teamPeriod: null,
    score: null,
    marksDnp: false,
  },
  offensive_rebound: {
    playerStats: { ...zeroPlayerStats(), offensiveRebounds: 1 },
    teamPeriod: null,
    score: null,
    marksDnp: false,
  },
  defensive_rebound: {
    playerStats: { ...zeroPlayerStats(), defensiveRebounds: 1 },
    teamPeriod: null,
    score: null,
    marksDnp: false,
  },
  personal_foul: {
    playerStats: { ...zeroPlayerStats(), personalFouls: 1 },
    teamPeriod: { ...zeroTeamPeriod(), teamFouls: 1 },
    score: null,
    marksDnp: false,
  },
  technical_foul: {
    playerStats: { ...zeroPlayerStats(), technicalFouls: 1 },
    teamPeriod: null,
    score: null,
    marksDnp: false,
  },
  steal: {
    playerStats: { ...zeroPlayerStats(), steals: 1 },
    teamPeriod: null,
    score: null,
    marksDnp: false,
  },
  block: {
    playerStats: { ...zeroPlayerStats(), blocks: 1 },
    teamPeriod: null,
    score: null,
    marksDnp: false,
  },
  timeout: {
    playerStats: null,
    teamPeriod: { ...zeroTeamPeriod(), timeoutsUsed: 1 },
    score: null,
    marksDnp: false,
  },
  dnp_marked: {
    playerStats: null,
    teamPeriod: null,
    score: null,
    marksDnp: true,
  },
};

export function getStatEventEffects(
  eventType: GameStatEventType,
  options: { isFirstTeam: boolean; multiplier?: number },
): StatEventEffects {
  const multiplier = options.multiplier ?? 1;
  const base = baseEffects[eventType]!;
  const playerStats = base.playerStats
    ? scalePlayerStats(base.playerStats, multiplier)
    : null;

  let score = base.score;
  if (playerStats && playerStats.points !== 0) {
    score = scaleScore(
      withScoreForTeam(playerStats.points, options.isFirstTeam),
      multiplier,
    );
  }

  return {
    playerStats,
    teamPeriod: base.teamPeriod
      ? scaleTeamPeriod(base.teamPeriod, multiplier)
      : null,
    score,
    marksDnp: base.marksDnp,
  };
}

export function addPlayerStats(
  current: PlayerStatDeltas,
  delta: PlayerStatDeltas,
): PlayerStatDeltas {
  return {
    fg2Made: current.fg2Made + delta.fg2Made,
    fg2Attempted: current.fg2Attempted + delta.fg2Attempted,
    fg3Made: current.fg3Made + delta.fg3Made,
    fg3Attempted: current.fg3Attempted + delta.fg3Attempted,
    ftMade: current.ftMade + delta.ftMade,
    ftAttempted: current.ftAttempted + delta.ftAttempted,
    assists: current.assists + delta.assists,
    turnovers: current.turnovers + delta.turnovers,
    offensiveRebounds: current.offensiveRebounds + delta.offensiveRebounds,
    defensiveRebounds: current.defensiveRebounds + delta.defensiveRebounds,
    personalFouls: current.personalFouls + delta.personalFouls,
    technicalFouls: current.technicalFouls + delta.technicalFouls,
    steals: current.steals + delta.steals,
    blocks: current.blocks + delta.blocks,
    points: current.points + delta.points,
  };
}

export function zeroPlayerStatDeltas(): PlayerStatDeltas {
  return zeroPlayerStats();
}

export function zeroTeamPeriodDeltas(): TeamPeriodDeltas {
  return zeroTeamPeriod();
}
