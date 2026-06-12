import type { Player, Position, Squad } from '@/types';
import { clubById } from './clubs';
import { firstNames, surnames } from './names';
import { realSquad } from './realData';
import { pick, randInt, rngFromString } from '@/utils/rng';

// ---------------------------------------------------------------------------
// Squad source.
//
// `getSquad` returns real scraped data (data/players.generated.json) when the
// club+year exists there; otherwise it falls back to a deterministic sample
// generator so the game stays playable before/while data is being collected.
// ---------------------------------------------------------------------------

interface SlotSpec {
  pos: Position;
  /** Secondary positions a player in this slot may also cover. */
  alts: Position[];
}

/** 23-man template: 3 GK · 8 DEF · 8 MID · 4 ATT. */
const TEMPLATE: SlotSpec[] = [
  { pos: 'GK', alts: [] }, { pos: 'GK', alts: [] }, { pos: 'GK', alts: [] },
  { pos: 'RB', alts: ['CB', 'RM'] }, { pos: 'RB', alts: ['CB'] },
  { pos: 'CB', alts: ['DM'] }, { pos: 'CB', alts: [] }, { pos: 'CB', alts: ['RB'] }, { pos: 'CB', alts: ['LB'] },
  { pos: 'LB', alts: ['CB', 'LM'] }, { pos: 'LB', alts: ['CB'] },
  { pos: 'DM', alts: ['CM'] }, { pos: 'DM', alts: ['CB'] },
  { pos: 'CM', alts: ['DM'] }, { pos: 'CM', alts: ['AM'] }, { pos: 'CM', alts: ['RM'] },
  { pos: 'AM', alts: ['CM'] },
  { pos: 'RM', alts: ['RW'] }, { pos: 'LM', alts: ['LW'] },
  { pos: 'RW', alts: ['ST', 'AM'] }, { pos: 'LW', alts: ['ST', 'AM'] },
  { pos: 'ST', alts: ['AM'] }, { pos: 'ST', alts: ['RW'] },
];

const ATTACKING: Position[] = ['ST', 'RW', 'LW', 'AM'];

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export function squadKey(clubId: string, editionId: string): string {
  return `${clubId}-${editionId}`;
}

/** Real scraped squad if available, otherwise a deterministic sample squad. */
export function getSquad(clubId: string, editionId: string): Squad {
  return realSquad(clubId, editionId) ?? generateSquad(clubId, editionId);
}

/** Deterministically build a sample squad for a club in a given edition. */
function generateSquad(clubId: string, editionId: string): Squad {
  const club = clubById[clubId];
  const rng = rngFromString(`squad:${clubId}:${editionId}`);
  const base = (club?.tier ?? 70) + randInt(rng, -3, 3); // per-era swing

  const roleSeen: Partial<Record<Position, number>> = {};

  const drafts = TEMPLATE.map((spec, i) => {
    const order = (roleSeen[spec.pos] = (roleSeen[spec.pos] ?? 0) + 1); // 1 = starter
    const starterPenalty = (order - 1) * 4; // backups are weaker
    const rating = clamp(base - starterPenalty + randInt(rng, -3, 3), 45, 90);

    const positions: Position[] = [spec.pos];
    if (spec.alts.length && rng() < 0.55) {
      const alt = pick(rng, spec.alts);
      if (!positions.includes(alt)) positions.push(alt);
    }

    return { i, rating, positions, first: pick(rng, firstNames), surname: pick(rng, surnames) };
  });

  // Promote one attacking player to "star" for a bit of squad personality.
  let starIdx = -1;
  let starBest = -1;
  drafts.forEach((d) => {
    if (ATTACKING.includes(d.positions[0]) && d.rating > starBest) {
      starBest = d.rating;
      starIdx = d.i;
    }
  });
  if (starIdx >= 0) {
    drafts[starIdx].rating = clamp(drafts[starIdx].rating + randInt(rng, 5, 9), 45, 93);
  }

  // Disambiguate duplicate surnames within the squad (e.g. "A. Yılmaz").
  const surnameCount = new Map<string, number>();
  drafts.forEach((d) => surnameCount.set(d.surname, (surnameCount.get(d.surname) ?? 0) + 1));

  const players: Player[] = drafts.map((d) => ({
    id: `${clubId}-${editionId}-${d.i + 1}`,
    name: (surnameCount.get(d.surname) ?? 0) > 1 ? `${d.first[0]}. ${d.surname}` : d.surname,
    number: d.i + 1,
    positions: d.positions,
    rating: d.rating,
  }));

  return { clubId, editionId, players };
}
