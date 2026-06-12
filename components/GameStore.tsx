import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import type {
  Campaign, Draw, Formation, FormationId, GameMode, Picks, PickRef,
  PlayingStyle, Player, SlotPlayers, Squad, TeamStrength,
} from '@/types';
import { formations } from '@/data/formations';
import { getSquad } from '@/data/squads';
import { computeStrength } from '@/utils/strength';
import { rollDraw, swapClub, swapYear } from '@/utils/roll';
import { simulateCampaign } from '@/utils/campaign';

const STORAGE_KEY = '7a0-super-lig:v2';
const MAX_REROLLS = 3;

export type Phase = 'setup' | 'building' | 'running';

interface GameState {
  phase: Phase;
  mode: GameMode;
  style: PlayingStyle;
  formationId: FormationId;
  /** slotKey → chosen pick (or null). */
  picks: Picks;
  /** Current rolled club+year to pick from (building phase). */
  draw: Draw | null;
  /** Player selected from the drawn squad, awaiting a position to lock into. */
  selectedPlayerId: string | null;
  /** Rerolls left for the current drawn team (shared by team/year), like 7a0. */
  rerollsLeft: number;
  campaign: Campaign | null;
  /** How many campaign matches have been revealed (running phase). */
  revealed: number;
}

function emptyPicks(formation: Formation): Picks {
  const picks: Picks = {};
  for (const slot of formation.slots) picks[slot.key] = null;
  return picks;
}

function freshState(): GameState {
  return {
    phase: 'setup',
    mode: 'Classic',
    style: 'Balanced',
    formationId: '4-3-3',
    picks: emptyPicks(formations['4-3-3']),
    draw: null,
    selectedPlayerId: null,
    rerollsLeft: MAX_REROLLS,
    campaign: null,
    revealed: 0,
  };
}

// --- Derived helpers --------------------------------------------------------

function resolvePlayer(ref: PickRef | null): Player | null {
  if (!ref) return null;
  const squad = getSquad(ref.clubId, ref.editionId);
  return squad.players.find((p) => p.id === ref.playerId) ?? null;
}

function slotPlayersOf(picks: Picks): SlotPlayers {
  const out: SlotPlayers = {};
  for (const key of Object.keys(picks)) out[key] = resolvePlayer(picks[key]);
  return out;
}

function usedClubsOf(picks: Picks): Set<string> {
  const set = new Set<string>();
  for (const ref of Object.values(picks)) if (ref) set.add(ref.clubId);
  return set;
}

/** Names of players already in the XI (a person can recur across clubs/years). */
function pickedNamesOf(picks: Picks): Set<string> {
  const set = new Set<string>();
  for (const ref of Object.values(picks)) {
    const player = resolvePlayer(ref);
    if (player) set.add(player.name);
  }
  return set;
}

/** Empty slots a player is eligible for: an empty slot whose position they list. */
function computeEligibleSlots(
  formation: Formation,
  picks: Picks,
  player: Player | null,
): Set<string> {
  const keys = new Set<string>();
  if (!player) return keys;
  for (const slot of formation.slots) {
    if (!picks[slot.key] && player.positions.includes(slot.position)) keys.add(slot.key);
  }
  return keys;
}

// --- Reducer ----------------------------------------------------------------

type Action =
  | { type: 'setMode'; mode: GameMode }
  | { type: 'setStyle'; style: PlayingStyle }
  | { type: 'setFormation'; formationId: FormationId }
  | { type: 'startBuild' }
  | { type: 'roll' }
  | { type: 'rerollClub' }
  | { type: 'rerollYear' }
  | { type: 'selectDraftPlayer'; playerId: string }
  | { type: 'placePlayer'; slotKey: string }
  | { type: 'clearSlot'; slotKey: string }
  | { type: 'simulate' }
  | { type: 'reveal' }
  | { type: 'revealAll' }
  | { type: 'backToBuild' }
  | { type: 'reset' };

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    // Formation, style and mode are locked once rolling starts.
    case 'setMode':
      if (state.phase !== 'setup') return state;
      return { ...state, mode: action.mode };
    case 'setStyle':
      if (state.phase !== 'setup') return state;
      return { ...state, style: action.style, campaign: null };
    case 'setFormation': {
      if (state.phase !== 'setup') return state;
      const nextFormation = formations[action.formationId];
      return {
        ...state,
        formationId: action.formationId,
        picks: emptyPicks(nextFormation),
        selectedPlayerId: null,
        campaign: null,
      };
    }
    case 'startBuild': {
      const formation = formations[state.formationId];
      const picks = emptyPicks(formation);
      return {
        ...state,
        phase: 'building',
        picks,
        // Don't auto-draw — the build screen opens with a Roll button (like 7a0).
        draw: null,
        selectedPlayerId: null,
        rerollsLeft: MAX_REROLLS,
        campaign: null,
        revealed: 0,
      };
    }
    case 'roll':
      return {
        ...state,
        draw: rollDraw(usedClubsOf(state.picks)),
        selectedPlayerId: null,
      };
    case 'rerollClub':
      if (!state.draw || state.rerollsLeft <= 0) return state;
      return {
        ...state,
        draw: swapClub(state.draw.editionId, usedClubsOf(state.picks), state.draw.clubId),
        selectedPlayerId: null,
        rerollsLeft: state.rerollsLeft - 1,
      };
    case 'rerollYear':
      if (!state.draw || state.rerollsLeft <= 0) return state;
      return {
        ...state,
        draw: swapYear(state.draw.clubId, state.draw.editionId),
        selectedPlayerId: null,
        rerollsLeft: state.rerollsLeft - 1,
      };
    case 'selectDraftPlayer': {
      if (!state.draw) return state;
      // Tapping the selected player again deselects them.
      return { ...state, selectedPlayerId: state.selectedPlayerId === action.playerId ? null : action.playerId };
    }
    case 'placePlayer': {
      if (!state.draw || !state.selectedPlayerId) return state;
      const formation = formations[state.formationId];
      const slot = formation.slots.find((s) => s.key === action.slotKey);
      if (!slot || state.picks[action.slotKey]) return state;
      const player = getSquad(state.draw.clubId, state.draw.editionId).players.find(
        (p) => p.id === state.selectedPlayerId,
      );
      // Only allow placing into one of the player's listed positions.
      if (!player || !player.positions.includes(slot.position)) return state;
      // Don't allow the same person twice (they can recur across clubs/years).
      if (pickedNamesOf(state.picks).has(player.name)) return state;
      const picks: Picks = {
        ...state.picks,
        [action.slotKey]: { clubId: state.draw.clubId, editionId: state.draw.editionId, playerId: player.id },
      };
      return {
        ...state,
        picks,
        selectedPlayerId: null,
        // Clear the draw so the next pick starts with a Roll button (like 7a0).
        draw: null,
        campaign: null,
      };
    }
    case 'clearSlot': {
      const picks: Picks = { ...state.picks, [action.slotKey]: null };
      return {
        ...state,
        picks,
        selectedPlayerId: null,
        campaign: null,
      };
    }
    case 'simulate': {
      const formation = formations[state.formationId];
      const sp = slotPlayersOf(state.picks);
      const strength = computeStrength(formation, sp);
      if (strength.filled !== 11) return state;
      const campaign = simulateCampaign({ formation, style: state.style, slotPlayers: sp });
      return { ...state, phase: 'running', campaign, revealed: 0 };
    }
    case 'reveal':
      if (!state.campaign) return state;
      return { ...state, revealed: Math.min(state.revealed + 1, state.campaign.matches.length) };
    case 'revealAll':
      if (!state.campaign) return state;
      return { ...state, revealed: state.campaign.matches.length };
    case 'backToBuild': {
      return {
        ...state,
        phase: 'building',
        draw: null,
        selectedPlayerId: null,
        campaign: null,
        revealed: 0,
      };
    }
    case 'reset':
      return freshState();
    default:
      return state;
  }
}

function loadState(): GameState {
  if (typeof window === 'undefined') return freshState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshState();
    const saved = JSON.parse(raw) as Partial<GameState>;
    const base = freshState();
    const formationId =
      saved.formationId && formations[saved.formationId] ? saved.formationId : base.formationId;
    const formation = formations[formationId];
    const picks = saved.picks ?? emptyPicks(formation);
    const hasPicks = Object.values(picks).some(Boolean);
    return {
      ...base,
      mode: saved.mode ?? base.mode,
      style: saved.style ?? base.style,
      formationId,
      picks,
      phase: hasPicks ? 'building' : 'setup',
      // Resume with the Roll button showing (no auto-draw), like a fresh build.
      draw: null,
      selectedPlayerId: null,
    };
  } catch {
    return freshState();
  }
}

// --- Context ----------------------------------------------------------------

interface GameContextValue {
  state: GameState;
  formation: Formation;
  slotPlayers: SlotPlayers;
  strength: TeamStrength;
  usedClubs: Set<string>;
  drawSquad: Squad | null;
  /** The player currently selected from the drawn squad (awaiting a position). */
  selectedPlayer: Player | null;
  /** Empty slot keys the selected player may be placed into. */
  eligibleSlotKeys: Set<string>;
  filled: number;
  complete: boolean;
  setMode: (mode: GameMode) => void;
  setStyle: (style: PlayingStyle) => void;
  setFormation: (id: FormationId) => void;
  startBuild: () => void;
  roll: () => void;
  rerollClub: () => void;
  rerollYear: () => void;
  selectDraftPlayer: (playerId: string) => void;
  placePlayer: (slotKey: string) => void;
  clearSlot: (slotKey: string) => void;
  simulate: () => void;
  reveal: () => void;
  revealAll: () => void;
  backToBuild: () => void;
  reset: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  useEffect(() => {
    try {
      const { mode, style, formationId, picks } = state;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode, style, formationId, picks }));
    } catch {
      /* storage may be unavailable; ignore */
    }
  }, [state]);

  const formation = formations[state.formationId];
  const slotPlayers = useMemo(() => slotPlayersOf(state.picks), [state.picks]);
  const strength = useMemo(() => computeStrength(formation, slotPlayers), [formation, slotPlayers]);
  const usedClubs = useMemo(() => usedClubsOf(state.picks), [state.picks]);
  const drawSquad = useMemo(
    () => (state.draw ? getSquad(state.draw.clubId, state.draw.editionId) : null),
    [state.draw],
  );
  const selectedPlayer = useMemo(
    () => (state.selectedPlayerId && drawSquad
      ? drawSquad.players.find((p) => p.id === state.selectedPlayerId) ?? null
      : null),
    [state.selectedPlayerId, drawSquad],
  );
  const eligibleSlotKeys = useMemo(
    () => computeEligibleSlots(formation, state.picks, selectedPlayer),
    [formation, state.picks, selectedPlayer],
  );

  const value = useMemo<GameContextValue>(
    () => ({
      state,
      formation,
      slotPlayers,
      strength,
      usedClubs,
      drawSquad,
      selectedPlayer,
      eligibleSlotKeys,
      filled: strength.filled,
      complete: strength.filled === 11,
      setMode: (mode) => dispatch({ type: 'setMode', mode }),
      setStyle: (style) => dispatch({ type: 'setStyle', style }),
      setFormation: (id) => dispatch({ type: 'setFormation', formationId: id }),
      startBuild: () => dispatch({ type: 'startBuild' }),
      roll: () => dispatch({ type: 'roll' }),
      rerollClub: () => dispatch({ type: 'rerollClub' }),
      rerollYear: () => dispatch({ type: 'rerollYear' }),
      selectDraftPlayer: (playerId) => dispatch({ type: 'selectDraftPlayer', playerId }),
      placePlayer: (slotKey) => dispatch({ type: 'placePlayer', slotKey }),
      clearSlot: (slotKey) => dispatch({ type: 'clearSlot', slotKey }),
      simulate: () => dispatch({ type: 'simulate' }),
      reveal: () => dispatch({ type: 'reveal' }),
      revealAll: () => dispatch({ type: 'revealAll' }),
      backToBuild: () => dispatch({ type: 'backToBuild' }),
      reset: () => dispatch({ type: 'reset' }),
    }),
    [state, formation, slotPlayers, strength, usedClubs, drawSquad, selectedPlayer, eligibleSlotKeys],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within a GameProvider');
  return ctx;
}
