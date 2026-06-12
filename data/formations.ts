import type { Formation, FormationId, FormationSlot, Position } from '@/types';

type SlotTuple = [key: string, position: Position, x: number, y: number];

function build(id: FormationId, tuples: SlotTuple[]): Formation {
  const slots: FormationSlot[] = tuples.map(([key, position, x, y]) => ({ key, position, x, y }));
  return { id, slots };
}

// Coordinates: x 0(left)→1(right), y 0(own goal)→1(opponent goal).
export const formations: Record<FormationId, Formation> = {
  '4-3-3': build('4-3-3', [
    ['GK', 'GK', 0.5, 0.07],
    ['LB', 'LB', 0.15, 0.27], ['CB2', 'CB', 0.38, 0.19], ['CB1', 'CB', 0.62, 0.19], ['RB', 'RB', 0.85, 0.27],
    ['DM', 'DM', 0.5, 0.4], ['CM', 'CM', 0.33, 0.53], ['AM', 'AM', 0.67, 0.53],
    ['LW', 'LW', 0.2, 0.76], ['ST', 'ST', 0.5, 0.85], ['RW', 'RW', 0.8, 0.76],
  ]),
  '4-4-2': build('4-4-2', [
    ['GK', 'GK', 0.5, 0.07],
    ['LB', 'LB', 0.15, 0.27], ['CB2', 'CB', 0.38, 0.19], ['CB1', 'CB', 0.62, 0.19], ['RB', 'RB', 0.85, 0.27],
    ['LM', 'LM', 0.15, 0.55], ['CM2', 'CM', 0.38, 0.5], ['CM1', 'CM', 0.62, 0.5], ['RM', 'RM', 0.85, 0.55],
    ['ST2', 'ST', 0.38, 0.82], ['ST1', 'ST', 0.62, 0.82],
  ]),
  '4-2-3-1': build('4-2-3-1', [
    ['GK', 'GK', 0.5, 0.07],
    ['LB', 'LB', 0.15, 0.27], ['CB2', 'CB', 0.38, 0.19], ['CB1', 'CB', 0.62, 0.19], ['RB', 'RB', 0.85, 0.27],
    ['DM2', 'DM', 0.36, 0.42], ['DM1', 'DM', 0.64, 0.42],
    ['LW', 'LW', 0.18, 0.64], ['AM', 'AM', 0.5, 0.62], ['RW', 'RW', 0.82, 0.64],
    ['ST', 'ST', 0.5, 0.85],
  ]),
  '4-2-4': build('4-2-4', [
    ['GK', 'GK', 0.5, 0.07],
    ['LB', 'LB', 0.15, 0.27], ['CB2', 'CB', 0.38, 0.19], ['CB1', 'CB', 0.62, 0.19], ['RB', 'RB', 0.85, 0.27],
    ['CM2', 'CM', 0.38, 0.48], ['CM1', 'CM', 0.62, 0.48],
    ['LW', 'LW', 0.15, 0.74], ['ST2', 'ST', 0.4, 0.84], ['ST1', 'ST', 0.6, 0.84], ['RW', 'RW', 0.85, 0.74],
  ]),
  '3-5-2': build('3-5-2', [
    ['GK', 'GK', 0.5, 0.07],
    ['CB1', 'CB', 0.3, 0.2], ['CB2', 'CB', 0.5, 0.17], ['CB3', 'CB', 0.7, 0.2],
    ['LM', 'LM', 0.12, 0.52], ['CM2', 'CM', 0.35, 0.48], ['AM', 'AM', 0.5, 0.6], ['CM1', 'CM', 0.65, 0.48], ['RM', 'RM', 0.88, 0.52],
    ['ST2', 'ST', 0.4, 0.83], ['ST1', 'ST', 0.6, 0.83],
  ]),
  '5-3-2': build('5-3-2', [
    ['GK', 'GK', 0.5, 0.07],
    ['LB', 'LB', 0.12, 0.3], ['CB1', 'CB', 0.32, 0.19], ['CB2', 'CB', 0.5, 0.16], ['CB3', 'CB', 0.68, 0.19], ['RB', 'RB', 0.88, 0.3],
    ['CM', 'CM', 0.32, 0.54], ['DM', 'DM', 0.5, 0.44], ['AM', 'AM', 0.68, 0.54],
    ['ST2', 'ST', 0.4, 0.82], ['ST1', 'ST', 0.6, 0.82],
  ]),
  '4-5-1': build('4-5-1', [
    ['GK', 'GK', 0.5, 0.07],
    ['LB', 'LB', 0.15, 0.27], ['CB2', 'CB', 0.38, 0.19], ['CB1', 'CB', 0.62, 0.19], ['RB', 'RB', 0.85, 0.27],
    ['LM', 'LM', 0.12, 0.54], ['CM2', 'CM', 0.35, 0.5], ['AM', 'AM', 0.5, 0.58], ['CM1', 'CM', 0.65, 0.5], ['RM', 'RM', 0.88, 0.54],
    ['ST', 'ST', 0.5, 0.85],
  ]),
  '3-4-3': build('3-4-3', [
    ['GK', 'GK', 0.5, 0.07],
    ['CB1', 'CB', 0.3, 0.2], ['CB2', 'CB', 0.5, 0.17], ['CB3', 'CB', 0.7, 0.2],
    ['LM', 'LM', 0.14, 0.52], ['CM2', 'CM', 0.38, 0.48], ['CM1', 'CM', 0.62, 0.48], ['RM', 'RM', 0.86, 0.52],
    ['LW', 'LW', 0.2, 0.78], ['ST', 'ST', 0.5, 0.85], ['RW', 'RW', 0.8, 0.78],
  ]),
};

export const formationIds = Object.keys(formations) as FormationId[];
export const formationList: Formation[] = formationIds.map((id) => formations[id]);
