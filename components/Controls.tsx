import React from 'react';
import type { FormationId, GameMode, PlayingStyle } from '@/types';
import { formationIds } from '@/data/formations';
import { useGame } from './GameStore';

const STYLES: PlayingStyle[] = ['Defensive', 'Balanced', 'Attacking'];
const MODES: { id: GameMode; label: string }[] = [
  { id: 'Classic', label: 'Classic' },
  { id: 'FromMemory', label: 'From memory' },
];

const Opt: React.FC<{
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ active, onClick, disabled = false, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-pressed={active}
    className={[
      'font-display text-sm px-2.5 py-1 rounded-md border transition-colors',
      active
        ? 'bg-ink-900 text-cream-50 border-ink-900'
        : 'bg-cream-50 text-ink-700 border-ink-900/15',
      disabled
        ? active
          ? 'opacity-100 cursor-default'
          : 'opacity-40 cursor-not-allowed'
        : 'hover:border-ink-900/40',
    ].join(' ')}
  >
    {children}
  </button>
);

const Group: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <div className="text-[10px] uppercase tracking-[0.18em] text-ink-700/60 mb-1.5">{label}</div>
    <div className="flex flex-wrap gap-1.5">{children}</div>
  </div>
);

/**
 * Formation / style / mode pickers. Pass `locked` once rolling has started:
 * the current choices stay visible but can no longer be changed.
 */
export const Controls: React.FC<{ locked?: boolean }> = ({ locked = false }) => {
  const { state, setFormation, setStyle, setMode } = useGame();
  return (
    <div className="flex flex-wrap gap-x-8 gap-y-4">
      <Group label="Formation">
        {formationIds.map((id: FormationId) => (
          <Opt
            key={id}
            active={state.formationId === id}
            disabled={locked}
            onClick={() => setFormation(id)}
          >
            {id}
          </Opt>
        ))}
      </Group>
      <Group label="Style">
        {STYLES.map((s) => (
          <Opt key={s} active={state.style === s} disabled={locked} onClick={() => setStyle(s)}>
            {s}
          </Opt>
        ))}
      </Group>
      <Group label="Mode · difficulty">
        {MODES.map((m) => (
          <Opt key={m.id} active={state.mode === m.id} disabled={locked} onClick={() => setMode(m.id)}>
            {m.label}
          </Opt>
        ))}
      </Group>
    </div>
  );
};
