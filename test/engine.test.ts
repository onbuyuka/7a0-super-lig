import { describe, it, expect } from 'vitest';
import type { Formation, SlotPlayers, Squad } from '@/types';
import { getSquad } from '@/data/squads';
import { formations } from '@/data/formations';
import { computeStrength, emptySlots } from '@/utils/strength';
import { GOAL_MODEL, lambda, poisson, simulateMatch } from '@/utils/simulate';
import { simulateCampaign, PHASES } from '@/utils/campaign';
import { mulberry32 } from '@/utils/rng';

/** Fill a formation's slots with the first 11 players of a squad. */
function buildXI(formation: Formation, squad: Squad): SlotPlayers {
  const sp = emptySlots(formation);
  formation.slots.forEach((slot, i) => {
    sp[slot.key] = squad.players[i] ?? null;
  });
  return sp;
}

describe('squad generator (fallback)', () => {
  it('produces a deterministic 23-man squad for an unknown club-year', () => {
    // A club id not present in the scraped data falls back to the generator.
    const a = getSquad('samplefc', 'y2015');
    const b = getSquad('samplefc', 'y2015');
    expect(a.players).toHaveLength(23);
    expect(a).toEqual(b);
    expect(a.players.every((p) => p.rating >= 45 && p.rating <= 93)).toBe(true);
    expect(a.players.filter((p) => p.positions[0] === 'GK')).toHaveLength(3);
  });
});

describe('strength (7a0 box score)', () => {
  it('rates a full XI on the rating scale', () => {
    const squad = getSquad('galatasaray', 'y2024');
    const s = computeStrength(formations['4-3-3'], buildXI(formations['4-3-3'], squad));
    expect(s.filled).toBe(11);
    expect(s.overall).toBeGreaterThan(40);
    expect(s.overall).toBeLessThanOrEqual(95);
  });

  it('counts empty slots against an incomplete XI', () => {
    const f = formations['4-3-3'];
    const empty = computeStrength(f, emptySlots(f));
    expect(empty.filled).toBe(0);
    expect(empty.overall).toBe(0);
  });
});

describe('7a0 goal model', () => {
  it('uses lambda = clamp(1.4 + (att - def) * 0.08, 0.15, 5)', () => {
    expect(lambda(80, 80)).toBeCloseTo(GOAL_MODEL.baseLambda, 10);
    expect(lambda(90, 70)).toBeCloseTo(1.4 + 20 * 0.08, 10);
    expect(lambda(40, 99)).toBe(GOAL_MODEL.minLambda);
    expect(lambda(99, 20)).toBe(GOAL_MODEL.maxLambda);
  });

  it('Poisson returns 0 for non-positive mean and non-negative ints otherwise', () => {
    const rng = mulberry32(123);
    expect(poisson(rng, 0)).toBe(0);
    for (let i = 0; i < 50; i++) {
      const g = poisson(rng, 2.5);
      expect(Number.isInteger(g)).toBe(true);
      expect(g).toBeGreaterThanOrEqual(0);
    }
  });

  it('always yields a knockout winner even when level', () => {
    const rng = mulberry32(99);
    for (let i = 0; i < 200; i++) {
      const out = simulateMatch({ attack: 75, defense: 75 }, { attack: 75, defense: 75 }, { rng, knockout: true });
      expect(out.winner === 'home' || out.winner === 'away').toBe(true);
    }
  });
});

describe('campaign (7a0 run)', () => {
  const formation = formations['4-3-3'];
  const xi = buildXI(formation, getSquad('galatasaray', 'y2024'));
  const run = () => simulateCampaign({ formation, style: 'Balanced', slotPlayers: xi, seed: 'seed-1' });

  it('has the 7a0 phase structure (3 group + 4 knockouts)', () => {
    expect(PHASES).toHaveLength(7);
    expect(PHASES.filter((p) => p.key === 'GROUP')).toHaveLength(3);
    expect(PHASES.map((p) => p.overall)).toEqual([68, 72, 76, 79, 83, 87, 91]);
  });

  it('plays 3 to 7 matches and tallies them consistently', () => {
    const c = run();
    expect(c.matches.length).toBeGreaterThanOrEqual(3);
    expect(c.matches.length).toBeLessThanOrEqual(7);
    expect(c.wins + c.draws + c.losses).toBe(c.matches.length);
    expect(c.groupTable).toHaveLength(4);
    expect(c.groupTable.filter((r) => r.me)).toHaveLength(1);
  });

  it('is deterministic for a fixed seed', () => {
    expect(run()).toEqual(run());
  });

  it('only crowns a champion after winning the final', () => {
    const c = run();
    if (c.champion) {
      const last = c.matches[c.matches.length - 1];
      expect(last.phase).toBe('FINAL');
      expect(last.advanced).toBe(true);
    }
    if (c.perfect) {
      expect(c.champion).toBe(true);
      expect(c.wins).toBe(7);
      expect(c.draws).toBe(0);
    }
  });

  it('elimination ends the run early', () => {
    // A weak XI should usually be eliminated before the final.
    const weak = buildXI(formation, getSquad('goztepe', 'y2015'));
    let eliminatedRuns = 0;
    for (let i = 0; i < 20; i++) {
      const c = simulateCampaign({ formation, style: 'Balanced', slotPlayers: weak, seed: `w${i}` });
      if (!c.champion) eliminatedRuns++;
      // Every non-group match before the last must have advanced.
      c.matches.forEach((m, idx) => {
        if (idx < c.matches.length - 1) expect(m.advanced).toBe(true);
      });
    }
    expect(eliminatedRuns).toBeGreaterThan(0);
  });
});
