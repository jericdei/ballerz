import { create } from "zustand";

import {
  addPlayerStats,
  type GamePeriod,
  type GameStatEventType,
  type GameStatus,
  getStatEventEffects,
  type PlayerStatDeltas,
  zeroPlayerStatDeltas,
  zeroTeamPeriodDeltas,
} from "@repo/shared";

import {
  formatPlayerName,
  formatStatEventLabel,
} from "@/components/statsheet/statsheet-labels";

export type StatsheetRosterPlayer = {
  id: number;
  gameId: number;
  playerId: number;
  teamId: number;
  isDnp: boolean;
  isStarter: boolean;
  isGuest: boolean;
  firstName: string;
  lastName: string;
  number: number;
  position: string | null;
};

export type StatsheetGame = {
  id: number;
  leagueId: number | null;
  firstTeamId: number | null;
  secondTeamId: number | null;
  firstTeamName: string | null;
  secondTeamName: string | null;
  type: string;
  status: GameStatus;
  currentPeriod: GamePeriod | null;
  firstTeamScore: number;
  secondTeamScore: number;
  scheduledAt: Date | null;
  startedAt: Date | null;
  endedAt: Date | null;
};

export type StatsheetEventLogEntry = {
  clientId: string;
  id?: number;
  eventType: GameStatEventType;
  playerId: number | null;
  teamId: number;
  period: GamePeriod;
  occurredAt: Date;
  playerName: string | null;
  label: string;
  synced: boolean;
  canUndo: boolean;
};

type PendingEvent = {
  clientId: string;
  eventType: GameStatEventType;
  teamId: number;
  playerId?: number;
  period: GamePeriod;
  occurredAt: Date;
  playerName: string | null;
};

type TeamPeriodKey = string;

function teamPeriodKey(teamId: number, period: GamePeriod): TeamPeriodKey {
  return `${teamId}:${period}`;
}

type StatsheetSnapshot = {
  game: StatsheetGame;
  rosters: StatsheetRosterPlayer[];
  playerStats: Array<{
    playerId: number;
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
  }>;
  teamPeriodStats: Array<{
    teamId: number;
    period: GamePeriod;
    timeoutsUsed: number;
    teamFouls: number;
  }>;
  events: Array<{
    id: number;
    sequence: number;
    period: GamePeriod;
    eventType: GameStatEventType;
    playerId: number | null;
    teamId: number;
    occurredAt: Date;
    reversesEventId: number | null;
    firstName: string | null;
    lastName: string | null;
  }>;
};

type StatsheetStore = {
  game: StatsheetGame | null;
  rosters: StatsheetRosterPlayer[];
  playerStats: Record<number, PlayerStatDeltas>;
  teamPeriodStats: Record<
    TeamPeriodKey,
    { timeoutsUsed: number; teamFouls: number }
  >;
  selectedPlayerId: number | null;
  currentPeriod: GamePeriod;
  status: GameStatus;
  savedPeriod: GamePeriod;
  savedStatus: GameStatus;
  firstTeamScore: number;
  secondTeamScore: number;
  eventLog: StatsheetEventLogEntry[];
  pendingEvents: PendingEvent[];
  dirty: boolean;
  hydrate: (snapshot: StatsheetSnapshot) => void;
  selectPlayer: (playerId: number | null) => void;
  setPeriod: (period: GamePeriod) => void;
  setStatus: (status: GameStatus) => void;
  applyStat: (eventType: GameStatEventType) => void;
  applyTimeout: (teamId: number) => void;
  undoPending: (clientId: string) => void;
  undoLast: () => StatsheetEventLogEntry | null;
  getSyncPayload: () => {
    currentPeriod: GamePeriod;
    status: GameStatus;
    events: Array<{
      eventType: GameStatEventType;
      teamId: number;
      playerId?: number;
      period: GamePeriod;
      occurredAt: Date;
    }>;
  };
  resetDirty: () => void;
};

function mapPlayerStatsRow(
  row: StatsheetSnapshot["playerStats"][number],
): PlayerStatDeltas {
  return {
    fg2Made: row.fg2Made,
    fg2Attempted: row.fg2Attempted,
    fg3Made: row.fg3Made,
    fg3Attempted: row.fg3Attempted,
    ftMade: row.ftMade,
    ftAttempted: row.ftAttempted,
    assists: row.assists,
    turnovers: row.turnovers,
    offensiveRebounds: row.offensiveRebounds,
    defensiveRebounds: row.defensiveRebounds,
    personalFouls: row.personalFouls,
    technicalFouls: row.technicalFouls,
    steals: row.steals,
    blocks: row.blocks,
    points: row.points,
  };
}

function getReversedEventIds(events: StatsheetSnapshot["events"]) {
  return new Set(
    events
      .map((event) => event.reversesEventId)
      .filter((id): id is number => id != null),
  );
}

function canUndoSyncedEvents(status: GameStatus) {
  return status === "in_progress" || status === "halftime";
}

function computeDirty(state: {
  pendingEvents: PendingEvent[];
  currentPeriod: GamePeriod;
  status: GameStatus;
  savedPeriod: GamePeriod;
  savedStatus: GameStatus;
}) {
  return (
    state.pendingEvents.length > 0 ||
    state.currentPeriod !== state.savedPeriod ||
    state.status !== state.savedStatus
  );
}

function buildEventLog(
  snapshot: StatsheetSnapshot,
  pending: PendingEvent[],
  status: GameStatus,
) {
  const reversedIds = getReversedEventIds(snapshot.events);
  const canUndoSynced = canUndoSyncedEvents(status);

  const persisted: StatsheetEventLogEntry[] = snapshot.events
    .filter(
      (event) => event.reversesEventId == null && !reversedIds.has(event.id),
    )
    .map((event) => ({
      clientId: `db-${event.id}`,
      id: event.id,
      eventType: event.eventType,
      playerId: event.playerId,
      teamId: event.teamId,
      period: event.period,
      occurredAt: event.occurredAt,
      playerName:
        event.firstName && event.lastName
          ? formatPlayerName(event.firstName, event.lastName)
          : null,
      label: formatStatEventLabel(event.eventType),
      synced: true,
      canUndo: canUndoSynced,
    }));

  const local: StatsheetEventLogEntry[] = pending.map((event) => ({
    clientId: event.clientId,
    eventType: event.eventType,
    playerId: event.playerId ?? null,
    teamId: event.teamId,
    period: event.period,
    occurredAt: event.occurredAt,
    playerName: event.playerName,
    label: formatStatEventLabel(event.eventType),
    synced: false,
    canUndo: true,
  }));

  return [...persisted, ...local].sort(
    (a, b) => b.occurredAt.getTime() - a.occurredAt.getTime(),
  );
}

function applyPendingEventEffects(
  state: Pick<
    StatsheetStore,
    | "playerStats"
    | "teamPeriodStats"
    | "firstTeamScore"
    | "secondTeamScore"
    | "game"
  >,
  event: PendingEvent,
  multiplier: 1 | -1,
) {
  if (!state.game) {
    return state;
  }

  const isFirstTeam = event.teamId === state.game.firstTeamId;
  const effects = getStatEventEffects(event.eventType, {
    isFirstTeam,
    multiplier,
  });

  const nextPlayerStats = { ...state.playerStats };
  if (effects.playerStats && event.playerId != null) {
    const existing = nextPlayerStats[event.playerId] ?? zeroPlayerStatDeltas();
    nextPlayerStats[event.playerId] = addPlayerStats(
      existing,
      effects.playerStats,
    );
  }

  const nextTeamPeriodStats = { ...state.teamPeriodStats };
  if (effects.teamPeriod) {
    const key = teamPeriodKey(event.teamId, event.period);
    const existing = nextTeamPeriodStats[key] ?? zeroTeamPeriodDeltas();
    nextTeamPeriodStats[key] = {
      timeoutsUsed: existing.timeoutsUsed + effects.teamPeriod.timeoutsUsed,
      teamFouls: existing.teamFouls + effects.teamPeriod.teamFouls,
    };
  }

  return {
    playerStats: nextPlayerStats,
    teamPeriodStats: nextTeamPeriodStats,
    firstTeamScore: state.firstTeamScore + (effects.score?.firstTeam ?? 0),
    secondTeamScore: state.secondTeamScore + (effects.score?.secondTeam ?? 0),
  };
}

export const useStatsheetStore = create<StatsheetStore>((set, get) => ({
  game: null,
  rosters: [],
  playerStats: {},
  teamPeriodStats: {},
  selectedPlayerId: null,
  currentPeriod: "q1",
  status: "in_progress",
  savedPeriod: "q1",
  savedStatus: "in_progress",
  firstTeamScore: 0,
  secondTeamScore: 0,
  eventLog: [],
  pendingEvents: [],
  dirty: false,

  hydrate: (snapshot) => {
    const playerStats: Record<number, PlayerStatDeltas> = {};
    for (const row of snapshot.playerStats) {
      playerStats[row.playerId] = mapPlayerStatsRow(row);
    }

    const teamPeriodStats: Record<
      TeamPeriodKey,
      { timeoutsUsed: number; teamFouls: number }
    > = {};
    for (const row of snapshot.teamPeriodStats) {
      teamPeriodStats[teamPeriodKey(row.teamId, row.period)] = {
        timeoutsUsed: row.timeoutsUsed,
        teamFouls: row.teamFouls,
      };
    }

    const currentPeriod = snapshot.game.currentPeriod ?? "q1";
    const status = snapshot.game.status;

    set({
      game: snapshot.game,
      rosters: snapshot.rosters,
      playerStats,
      teamPeriodStats,
      currentPeriod,
      status,
      savedPeriod: currentPeriod,
      savedStatus: status,
      firstTeamScore: snapshot.game.firstTeamScore,
      secondTeamScore: snapshot.game.secondTeamScore,
      pendingEvents: [],
      dirty: false,
      eventLog: buildEventLog(snapshot, [], status),
    });
  },

  selectPlayer: (playerId) => set({ selectedPlayerId: playerId }),

  setPeriod: (period) =>
    set((state) => {
      const next = { ...state, currentPeriod: period };
      return { currentPeriod: period, dirty: computeDirty(next) };
    }),

  setStatus: (status) =>
    set((state) => {
      const next = { ...state, status };
      return { status, dirty: computeDirty(next) };
    }),

  applyStat: (eventType) => {
    const state = get();
    if (!state.game) return;

    if (eventType !== "timeout" && state.selectedPlayerId == null) {
      return;
    }

    const rosterPlayer =
      eventType === "timeout"
        ? null
        : state.rosters.find((row) => row.playerId === state.selectedPlayerId);

    if (eventType !== "timeout" && !rosterPlayer) {
      return;
    }

    const teamId =
      eventType === "timeout"
        ? (rosterPlayer?.teamId ?? state.game.firstTeamId!)
        : rosterPlayer!.teamId;
    const playerId = rosterPlayer?.playerId;
    const occurredAt = new Date();
    const clientId = crypto.randomUUID();

    const pendingEvent: PendingEvent = {
      clientId,
      eventType,
      teamId,
      playerId,
      period: state.currentPeriod,
      occurredAt,
      playerName: rosterPlayer
        ? formatPlayerName(rosterPlayer.firstName, rosterPlayer.lastName)
        : null,
    };

    set((current) => {
      const effects = applyPendingEventEffects(current, pendingEvent, 1);
      const pendingEvents = [...current.pendingEvents, pendingEvent];
      const logEntry: StatsheetEventLogEntry = {
        clientId,
        eventType,
        playerId: playerId ?? null,
        teamId,
        period: current.currentPeriod,
        occurredAt,
        playerName: pendingEvent.playerName,
        label: formatStatEventLabel(eventType),
        synced: false,
        canUndo: true,
      };

      const next = {
        ...current,
        ...effects,
        pendingEvents,
      };

      return {
        ...effects,
        pendingEvents,
        dirty: computeDirty(next),
        eventLog: [logEntry, ...current.eventLog],
      };
    });
  },

  applyTimeout: (teamId) => {
    const state = get();
    if (!state.game) return;
    if (
      teamId !== state.game.firstTeamId &&
      teamId !== state.game.secondTeamId
    ) {
      return;
    }

    const occurredAt = new Date();
    const clientId = crypto.randomUUID();

    const pendingEvent: PendingEvent = {
      clientId,
      eventType: "timeout",
      teamId,
      period: state.currentPeriod,
      occurredAt,
      playerName: null,
    };

    set((current) => {
      const effects = applyPendingEventEffects(current, pendingEvent, 1);
      const pendingEvents = [...current.pendingEvents, pendingEvent];
      const next = {
        ...current,
        ...effects,
        pendingEvents,
      };

      return {
        ...effects,
        pendingEvents,
        dirty: computeDirty(next),
        eventLog: [
          {
            clientId,
            eventType: "timeout",
            playerId: null,
            teamId,
            period: current.currentPeriod,
            occurredAt,
            playerName: null,
            label: formatStatEventLabel("timeout"),
            synced: false,
            canUndo: true,
          },
          ...current.eventLog,
        ],
      };
    });
  },

  undoPending: (clientId) => {
    const state = get();
    const pendingEvent = state.pendingEvents.find(
      (event) => event.clientId === clientId,
    );
    if (!pendingEvent) return;

    set((current) => {
      const effects = applyPendingEventEffects(current, pendingEvent, -1);
      const pendingEvents = current.pendingEvents.filter(
        (event) => event.clientId !== clientId,
      );
      const next = {
        ...current,
        ...effects,
        pendingEvents,
      };

      return {
        ...effects,
        pendingEvents,
        dirty: computeDirty(next),
        eventLog: current.eventLog.filter(
          (entry) => entry.clientId !== clientId,
        ),
      };
    });
  },

  undoLast: () => {
    const state = get();
    const entry = state.eventLog.find((item) => item.canUndo);
    if (!entry) return null;

    if (!entry.synced) {
      get().undoPending(entry.clientId);
      return entry;
    }

    return entry;
  },

  getSyncPayload: () => {
    const state = get();
    return {
      currentPeriod: state.currentPeriod,
      status: state.status,
      events: state.pendingEvents.map((event) => ({
        eventType: event.eventType,
        teamId: event.teamId,
        playerId: event.playerId,
        period: event.period,
        occurredAt: event.occurredAt,
      })),
    };
  },

  resetDirty: () => set({ dirty: false, pendingEvents: [] }),
}));
