// ---------------------------------------------------------------------------
// Core domain types for 7A0 · Süper Lig.
//
// The game mirrors 7a0 — Sete a Zero: set up a formation/style, then ROLL
// random Süper Lig clubs (each from a random year) and pick ONE player from
// each to build "Your team" — a mix of 11 players. Then SIMULATE a 7-game
// run (group → final) game by game. Win all 7 to go 7–0.
// ---------------------------------------------------------------------------

// --- Players & positions ----------------------------------------------------

/** Outfield + goalkeeper positions used by squads and formation slots. */
export type Position =
  | 'GK'
  | 'RB' | 'CB' | 'LB'
  | 'DM' | 'CM' | 'RM' | 'LM' | 'AM'
  | 'RW' | 'LW' | 'ST';

/** Broad position groups, used for scoring and slot eligibility. */
export type PositionGroup = 'GK' | 'DEF' | 'MID' | 'ATT';

export interface Player {
  /** Stable id, unique within a squad (e.g. "galatasaray-y2014-10"). */
  id: string;
  name: string;
  /** Shirt number, if known. */
  number?: number;
  /** Eligible positions, most natural first (drives the picker + fit logic). */
  positions: Position[];
  /** Overall rating on a 0–99 scale (roughly 40–99). */
  rating: number;
}

// --- Clubs & editions -------------------------------------------------------

export interface Club {
  /** Lowercase slug, also used in entrant ids and routing. */
  id: string;
  name: string;
  /** 2–4 letter abbreviation, e.g. "GS", "FB". */
  shortName: string;
  city?: string;
  /** Kit / badge colours for SVG rendering (no copyrighted imagery). */
  colors: { primary: string; secondary: string };
}

/** A squad-year: a club's roster as it was in a given year. */
export interface Edition {
  /** Slug, e.g. "y2014". */
  id: string;
  /** Display label — the year only, e.g. "2014". */
  label: string;
  /** Calendar year the ratings represent. */
  year: number;
}

/** A specific club as it was in a specific year — the rollable unit. */
export interface Squad {
  clubId: string;
  editionId: string;
  players: Player[];
}

// --- Formations -------------------------------------------------------------

export type FormationId =
  | '4-3-3' | '4-4-2' | '4-2-3-1' | '4-2-4'
  | '3-5-2' | '5-3-2' | '4-5-1' | '3-4-3';

export interface FormationSlot {
  /** Unique within a formation, e.g. "CB1", "CB2". */
  key: string;
  /** Canonical position the slot wants. */
  position: Position;
  /** Normalised pitch coordinates: x 0(left)→1(right), y 0(own goal)→1(opp goal). */
  x: number;
  y: number;
}

export interface Formation {
  id: FormationId;
  /** Exactly 11 slots. */
  slots: FormationSlot[];
}

export type PlayingStyle = 'Defensive' | 'Balanced' | 'Attacking';

/** "Classic" shows ratings; "FromMemory" hides them while picking. */
export type GameMode = 'Classic' | 'FromMemory';

// --- Build state ------------------------------------------------------------

/** A randomly drawn club + year to pick from. */
export interface Draw {
  clubId: string;
  editionId: string;
}

/** A chosen player and where they came from (serialisable). */
export interface PickRef {
  clubId: string;
  editionId: string;
  playerId: string;
}

/** Map of formation slot key → chosen pick (or null when empty). */
export type Picks = Record<string, PickRef | null>;

/** Map of formation slot key → resolved player (derived view of Picks). */
export type SlotPlayers = Record<string, Player | null>;

/** Aggregate XI strength shown in the "box score". */
export interface TeamStrength {
  /** 0–99 attacking strength. */
  attack: number;
  /** 0–99 defensive strength. */
  defense: number;
  /** 0–99 overall (mean of the chosen players' ratings). */
  overall: number;
  /** Filled slots / 11. */
  filled: number;
}

// --- Campaign (7-game run) --------------------------------------------------

export type PhaseKey = 'GROUP' | 'R16' | 'QF' | 'SF' | 'FINAL';

export type MatchOutcome = 'W' | 'D' | 'L';

export interface MatchScore {
  homeGoals: number;
  awayGoals: number;
  /** Shoot-out result when a knockout is level after 90'. */
  penalties?: { home: number; away: number };
}

/** The opponent's cosmetic identity for one match (sim uses a fixed overall). */
export interface CampaignOpponent {
  clubId: string;
  editionId: string;
  /** Fixed phase overall used by the simulation. */
  overall: number;
  /** Short phase label, e.g. "Group · game 1", "Final". */
  label: string;
}

/** A goal event for the match feed. */
export interface GoalEvent {
  minute: number;
  scorer: string;
  /** True when conceded (opponent scored). */
  conceded: boolean;
}

export interface CampaignMatch {
  phase: PhaseKey;
  opponent: CampaignOpponent;
  gf: number;
  ga: number;
  outcome: MatchOutcome;
  /** True if the team advanced past this match (always true for group games). */
  advanced: boolean;
  /** Set on a knockout decided by penalties. */
  pens?: { for: number; against: number; won: boolean };
  goals: GoalEvent[];
}

export interface GroupStanding {
  /** Display name; "Your team" when this is the player. */
  name: string;
  me: boolean;
  played: number;
  points: number;
  gd: number;
  gf: number;
}

export type CampaignBadge = 'ESMAGADOR' | 'MURALHA' | null;

export interface Campaign {
  /** Played matches in order; ends early on elimination. */
  matches: CampaignMatch[];
  /** Final group standings (4 rows). */
  groupTable: GroupStanding[];
  champion: boolean;
  perfect: boolean;
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  ga: number;
  badge: CampaignBadge;
  /** The built XI's overall, shown on the result card. */
  overall: number;
}

/** Deterministic random source so a run can be replayed / shared. */
export type Rng = () => number;
