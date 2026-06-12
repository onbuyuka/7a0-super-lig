import type {
  Campaign, CampaignMatch, CampaignOpponent, Formation, GoalEvent,
  GroupStanding, MatchOutcome, PhaseKey, PlayingStyle, SlotPlayers,
} from '@/types';
import { clubs } from '@/data/clubs';
import { editions } from '@/data/editions';
import { availableCombos, hasRealData } from '@/data/realData';
import { getSquad } from '@/data/squads';
import { comboLabel } from './display';
import { ATT_WEIGHT, computeStrength } from './strength';
import { simulateMatch, type SimInput } from './simulate';
import { pick, rngFromString } from './rng';
import type { Rng } from '@/types';

/** A random opponent club+year face. Uses real squads when available. */
function drawFace(rng: Rng): { clubId: string; editionId: string } {
  if (hasRealData && availableCombos.length) {
    const c = pick(rng, availableCombos);
    return { clubId: c.clubId, editionId: c.editionId };
  }
  return { clubId: pick(rng, clubs).id, editionId: pick(rng, editions).id };
}

// 7a0's fixed phase structure: 3 group games then four knockout rounds, each
// against a fixed (escalating) opponent overall.
export interface Phase {
  key: PhaseKey;
  label: string;
  overall: number;
  knockout: boolean;
}

export const PHASES: Phase[] = [
  { key: 'GROUP', label: 'Group · game 1', overall: 68, knockout: false },
  { key: 'GROUP', label: 'Group · game 2', overall: 72, knockout: false },
  { key: 'GROUP', label: 'Group · game 3', overall: 76, knockout: false },
  { key: 'R16', label: 'Round of 16', overall: 79, knockout: true },
  { key: 'QF', label: 'Quarter-final', overall: 83, knockout: true },
  { key: 'SF', label: 'Semi-final', overall: 87, knockout: true },
  { key: 'FINAL', label: 'Final', overall: 91, knockout: true },
];

const GROUP_OVERALLS = [68, 72, 76];
const ESMAGADOR_GD = 18; // 7a0's badge.esmagadorGD

export interface RunInput {
  formation: Formation;
  style: PlayingStyle;
  slotPlayers: SlotPlayers;
  /** Seed for a reproducible run; defaults to a time-based seed. */
  seed?: string;
}

/** Apply a tactical style tilt to the XI's raw strength for the simulation. */
function styled(attack: number, defense: number, style: PlayingStyle): SimInput {
  if (style === 'Attacking') return { attack: attack * 1.08, defense: defense * 0.93 };
  if (style === 'Defensive') return { attack: attack * 0.92, defense: defense * 1.08 };
  return { attack, defense };
}

/** Late-biased, unique goal minutes (7a0 uses 1 + floor(90 · rng^0.85)). */
function goalMinutes(rng: Rng, n: number): number[] {
  const set = new Set<number>();
  let guard = 0;
  while (set.size < n && guard++ < 1000) {
    set.add(1 + Math.floor(90 * Math.pow(rng(), 0.85)));
  }
  return [...set].sort((a, b) => a - b);
}

interface WeightedName {
  name: string;
  w: number;
}

function weightedName(rng: Rng, pool: WeightedName[]): string {
  const total = pool.reduce((s, x) => s + x.w, 0);
  if (total <= 0) return pool[0]?.name ?? '—';
  let r = rng() * total;
  for (const x of pool) {
    r -= x.w;
    if (r <= 0) return x.name;
  }
  return pool[pool.length - 1].name;
}

/** Build the goal feed for one match (your scorers + conceded). */
function buildGoals(
  rng: Rng,
  yourGoals: number,
  oppGoals: number,
  yourPool: WeightedName[],
  oppPool: WeightedName[],
): GoalEvent[] {
  const events: GoalEvent[] = [];
  for (const m of goalMinutes(rng, yourGoals)) {
    events.push({ minute: m, scorer: weightedName(rng, yourPool), conceded: false });
  }
  for (const m of goalMinutes(rng, oppGoals)) {
    events.push({ minute: m, scorer: weightedName(rng, oppPool), conceded: true });
  }
  return events.sort((a, b) => a.minute - b.minute);
}

/** Attack-weighted scorer pool for a club+year squad (for conceded goals). */
function squadPool(clubId: string, editionId: string): WeightedName[] {
  return getSquad(clubId, editionId).players.map((p) => ({
    name: p.name,
    w: (ATT_WEIGHT[p.positions[0]] ?? 0.3) + 0.06,
  }));
}

interface Tally {
  played: number;
  points: number;
  gf: number;
  ga: number;
}

function emptyTally(): Tally {
  return { played: 0, points: 0, gf: 0, ga: 0 };
}

function record(t: Tally, gf: number, ga: number): void {
  t.played++;
  t.gf += gf;
  t.ga += ga;
  t.points += gf > ga ? 3 : gf === ga ? 1 : 0;
}

/** Simulate a full 7a0-style run game by game and return the campaign. */
export function simulateCampaign(input: RunInput): Campaign {
  const rng = rngFromString(input.seed ?? `run:${Date.now()}:${Math.random()}`);
  const base = computeStrength(input.formation, input.slotPlayers);
  const you = styled(base.attack, base.defense, input.style);

  // Your attack-weighted scorer pool, from the slots you filled.
  const yourPool: WeightedName[] = input.formation.slots
    .map((s) => ({ player: input.slotPlayers[s.key], pos: s.position }))
    .filter((x) => x.player)
    .map((x) => ({ name: x.player!.name, w: (ATT_WEIGHT[x.pos] ?? 0.3) + 0.06 }));

  const matches: CampaignMatch[] = [];
  let wins = 0, draws = 0, losses = 0, gf = 0, ga = 0;

  // --- Group stage: three games, no early elimination. --------------------
  const groupFaces: CampaignOpponent[] = [];
  const yourGroupResults: { gf: number; ga: number }[] = [];

  for (let i = 0; i < 3; i++) {
    const phase = PHASES[i];
    const opp: CampaignOpponent = {
      ...drawFace(rng),
      overall: phase.overall,
      label: phase.label,
    };
    groupFaces.push(opp);

    const out = simulateMatch(you, { attack: opp.overall, defense: opp.overall }, { rng });
    const yg = out.score.homeGoals;
    const og = out.score.awayGoals;
    gf += yg; ga += og;
    yourGroupResults.push({ gf: yg, ga: og });

    const outcome: MatchOutcome = yg > og ? 'W' : yg < og ? 'L' : 'D';
    if (outcome === 'W') wins++; else if (outcome === 'D') draws++; else losses++;

    matches.push({
      phase: 'GROUP',
      opponent: opp,
      gf: yg,
      ga: og,
      outcome,
      advanced: true,
      goals: buildGoals(rng, yg, og, yourPool, squadPool(opp.clubId, opp.editionId)),
    });
  }

  // --- Group table: your results + the three opponents playing each other. -
  const tallies: Tally[] = [emptyTally(), emptyTally(), emptyTally(), emptyTally()]; // 0 = you
  yourGroupResults.forEach((r, i) => {
    record(tallies[0], r.gf, r.ga);
    record(tallies[i + 1], r.ga, r.gf); // mirror for the opponent
  });
  const oppPairs: [number, number][] = [[0, 1], [0, 2], [1, 2]];
  for (const [a, b] of oppPairs) {
    const out = simulateMatch(
      { attack: GROUP_OVERALLS[a], defense: GROUP_OVERALLS[a] },
      { attack: GROUP_OVERALLS[b], defense: GROUP_OVERALLS[b] },
      { rng },
    );
    record(tallies[a + 1], out.score.homeGoals, out.score.awayGoals);
    record(tallies[b + 1], out.score.awayGoals, out.score.homeGoals);
  }

  const rows: (GroupStanding & { _i: number })[] = tallies.map((t, i) => ({
    _i: i,
    me: i === 0,
    name: i === 0 ? 'Your team' : comboLabel(groupFaces[i - 1].clubId, groupFaces[i - 1].editionId),
    played: t.played,
    points: t.points,
    gd: t.gf - t.ga,
    gf: t.gf,
  }));
  rows.sort((x, y) => y.points - x.points || y.gd - x.gd || y.gf - x.gf || x._i - y._i);
  const groupTable: GroupStanding[] = rows.map(({ _i, ...r }) => r);
  const advancedFromGroup = rows.findIndex((r) => r.me) < 2;

  // --- Knockouts: win (or win on penalties) to advance. -------------------
  if (advancedFromGroup) {
    for (let i = 3; i < PHASES.length; i++) {
      const phase = PHASES[i];
      const opp: CampaignOpponent = {
        ...drawFace(rng),
        overall: phase.overall,
        label: phase.label,
      };
      const out = simulateMatch(you, { attack: opp.overall, defense: opp.overall }, { rng, knockout: true });
      const yg = out.score.homeGoals;
      const og = out.score.awayGoals;
      gf += yg; ga += og;

      const wonPens = !!out.score.penalties && out.winner === 'home';
      const advanced = out.winner === 'home';
      const outcome: MatchOutcome = advanced ? 'W' : 'L';
      if (advanced) wins++; else losses++;

      const m: CampaignMatch = {
        phase: phase.key,
        opponent: opp,
        gf: yg,
        ga: og,
        outcome,
        advanced,
        goals: buildGoals(rng, yg, og, yourPool, squadPool(opp.clubId, opp.editionId)),
      };
      if (out.score.penalties) {
        m.pens = { for: out.score.penalties.home, against: out.score.penalties.away, won: wonPens };
      }
      matches.push(m);
      if (!advanced) break;
    }
  }

  const champion =
    advancedFromGroup && matches[matches.length - 1]?.phase === 'FINAL' && matches[matches.length - 1]?.advanced;
  const perfect = !!champion && wins === 7 && draws === 0 && losses === 0;
  const gd = gf - ga;

  let badge: Campaign['badge'] = null;
  if (perfect && gd >= ESMAGADOR_GD) badge = 'ESMAGADOR';
  else if (champion && ga === 0) badge = 'MURALHA';

  return {
    matches,
    groupTable,
    champion: !!champion,
    perfect,
    wins,
    draws,
    losses,
    gf,
    ga,
    badge,
    overall: base.overall,
  };
}
