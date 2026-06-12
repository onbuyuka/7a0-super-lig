import type { Draw, Rng } from '@/types';
import { clubs } from '@/data/clubs';
import { editions } from '@/data/editions';
import { availableCombos, hasRealData } from '@/data/realData';
import { pick } from './rng';

// When real data exists, draws come from the (club, year) cells that actually
// have squads. Otherwise we roll the full clubs × years grid (sample data).

/** Clubs not already used in the current build. */
function availableClubs(usedClubIds: Set<string>) {
  const free = clubs.filter((c) => !usedClubIds.has(c.id));
  return free.length ? free : clubs;
}

function gridDraw(usedClubIds: Set<string>, rng: Rng): Draw {
  return {
    clubId: pick(rng, availableClubs(usedClubIds)).id,
    editionId: pick(rng, editions).id,
  };
}

/** Combos whose club hasn't been used yet. */
function freeCombos(usedClubIds: Set<string>): Draw[] {
  const free = availableCombos.filter((c) => !usedClubIds.has(c.clubId));
  return free.length ? free : availableCombos;
}

/** Draw a fresh club (excluding ones already picked) at a random year. */
export function rollDraw(usedClubIds: Iterable<string> = [], rng: Rng = Math.random): Draw {
  const used = new Set(usedClubIds);
  if (hasRealData) {
    const c = pick(rng, freeCombos(used));
    return { clubId: c.clubId, editionId: c.editionId };
  }
  return gridDraw(used, rng);
}

/** Swap to a different fresh club, keeping the year if possible (re-roll team). */
export function swapClub(
  keepEditionId: string,
  usedClubIds: Iterable<string>,
  currentClubId: string,
  rng: Rng = Math.random,
): Draw {
  const used = new Set([...usedClubIds, currentClubId]);
  if (hasRealData) {
    const sameYear = freeCombos(used).filter((c) => c.editionId === keepEditionId);
    const poolc = sameYear.length ? sameYear : freeCombos(used);
    const c = pick(rng, poolc);
    return { clubId: c.clubId, editionId: c.editionId };
  }
  return { clubId: pick(rng, availableClubs(used)).id, editionId: keepEditionId };
}

/** Swap to a different year for the same club if possible (re-roll year). */
export function swapYear(keepClubId: string, currentEditionId: string, rng: Rng = Math.random): Draw {
  if (hasRealData) {
    const sameClub = availableCombos.filter(
      (c) => c.clubId === keepClubId && c.editionId !== currentEditionId,
    );
    if (sameClub.length) return pick(rng, sameClub);
    return { clubId: keepClubId, editionId: currentEditionId };
  }
  const others = editions.filter((e) => e.id !== currentEditionId);
  return { clubId: keepClubId, editionId: pick(rng, others.length ? others : editions).id };
}

