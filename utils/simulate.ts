import type { MatchScore, Rng } from '@/types';

// ---------------------------------------------------------------------------
// Match simulation, ported 1:1 from 7a0 — Sete a Zero.
//
// Goals are Poisson-distributed with a per-side mean (lambda) derived from the
// attacking side's attack vs the defending side's defence:
//     lambda(a, d) = clamp(baseLambda + (a - d) * slope, minLambda, maxLambda)
// A level knockout is decided by a shoot-out whose win probability follows
// 7a0's penalty model. There is no home advantage (7a0 has none).
// ---------------------------------------------------------------------------

/** Goal model, identical to 7a0's `model` config. */
export const GOAL_MODEL = {
  baseLambda: 1.4,
  slope: 0.08,
  minLambda: 0.15,
  maxLambda: 5,
} as const;

/** Penalty shoot-out model, identical to 7a0's `penalty` config. */
export const PENALTY_MODEL = {
  base: 0.5,
  slope: 0.012,
  min: 0.1,
  max: 0.9,
} as const;

/** Minimal team profile a match needs: attack & defense on the rating scale. */
export interface SimInput {
  attack: number;
  defense: number;
}

export interface SimOptions {
  rng: Rng;
  /** Resolve a level score with a penalty shoot-out (knockouts). */
  knockout?: boolean;
}

export interface SimOutcome {
  score: MatchScore;
  winner: 'home' | 'away' | 'draw';
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/** Expected goals (Poisson mean) for an attack rating against a defence rating. */
export function lambda(attack: number, defense: number): number {
  const { baseLambda, slope, minLambda, maxLambda } = GOAL_MODEL;
  return clamp(baseLambda + (attack - defense) * slope, minLambda, maxLambda);
}

/** Draw a goal count from a Poisson distribution (Knuth's algorithm). */
export function poisson(rng: Rng, mean: number): number {
  if (mean <= 0) return 0;
  const L = Math.exp(-mean);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= rng();
  } while (p > L);
  return k - 1;
}

/** Overall strength used for the shoot-out: the mean of attack & defense. */
function strength(team: SimInput): number {
  return (team.attack + team.defense) / 2;
}

/**
 * Decide a level knockout. 7a0 models a single advance probability for the
 * player's side; generalised here to two real teams symmetrically around 0.5.
 */
function shootoutWinner(rng: Rng, home: SimInput, away: SimInput): 'home' | 'away' {
  const { base, slope, min, max } = PENALTY_MODEL;
  const pHome = clamp(base + (strength(home) - strength(away)) * slope, min, max);
  return rng() < pHome ? 'home' : 'away';
}

/** Simulate one match between two teams using 7a0's goal model. */
export function simulateMatch(home: SimInput, away: SimInput, opts: SimOptions): SimOutcome {
  const { rng } = opts;
  const homeGoals = poisson(rng, lambda(home.attack, away.defense));
  const awayGoals = poisson(rng, lambda(away.attack, home.defense));
  const score: MatchScore = { homeGoals, awayGoals };

  if (homeGoals > awayGoals) return { score, winner: 'home' };
  if (homeGoals < awayGoals) return { score, winner: 'away' };

  if (opts.knockout) {
    const winner = shootoutWinner(rng, home, away);
    // Record a representative 5-kick shoot-out line for display.
    const w = 3 + Math.floor(rng() * 2); // 3 or 4
    const l = Math.floor(rng() * Math.min(3, w));
    score.penalties = winner === 'home' ? { home: w, away: l } : { home: l, away: w };
    return { score, winner };
  }

  return { score, winner: 'draw' };
}
