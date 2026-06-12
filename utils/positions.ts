import type { Position, PositionGroup } from '@/types';

/** Maps each detailed position to its broad group. */
export const positionGroup: Record<Position, PositionGroup> = {
  GK: 'GK',
  RB: 'DEF', CB: 'DEF', LB: 'DEF',
  DM: 'MID', CM: 'MID', RM: 'MID', LM: 'MID', AM: 'MID',
  RW: 'ATT', LW: 'ATT', ST: 'ATT',
};

const GROUP_ORDER: PositionGroup[] = ['GK', 'DEF', 'MID', 'ATT'];

function groupDistance(a: PositionGroup, b: PositionGroup): number {
  return Math.abs(GROUP_ORDER.indexOf(a) - GROUP_ORDER.indexOf(b));
}

/**
 * 0–1 suitability of a player (by their eligible positions) for a slot.
 * 1 = natural, 0.9 = listed alt, 0.72 = same group, then decays by distance.
 */
export function fitScore(positions: Position[], slot: Position): number {
  if (positions[0] === slot) return 1;
  if (positions.includes(slot)) return 0.9;
  const slotGroup = positionGroup[slot];
  if (positions.some((p) => positionGroup[p] === slotGroup)) return 0.72;
  const best = Math.min(...positions.map((p) => groupDistance(positionGroup[p], slotGroup)));
  if (best === 1) return 0.5;
  if (best === 2) return 0.3;
  return 0.12;
}
