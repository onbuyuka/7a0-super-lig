import React from 'react';
import type { Player } from '@/types';
import { useGame } from './GameStore';

const PitchMarkings: React.FC = () => (
  <svg
    className="absolute inset-0 h-full w-full"
    viewBox="0 0 100 133"
    preserveAspectRatio="none"
    aria-hidden
  >
    <g fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.5">
      <rect x="3" y="3" width="94" height="127" rx="1.5" />
      <line x1="3" y1="66.5" x2="97" y2="66.5" />
      <circle cx="50" cy="66.5" r="11" />
      <circle cx="50" cy="66.5" r="0.8" fill="rgba(255,255,255,0.4)" />
      <rect x="26" y="3" width="48" height="18" />
      <rect x="38" y="3" width="24" height="7" />
      <rect x="26" y="112" width="48" height="18" />
      <rect x="38" y="123" width="24" height="7" />
    </g>
  </svg>
);

const FilledChip: React.FC<{ player: Player; showRating: boolean }> = ({ player, showRating }) => (
  <div className="flex flex-col items-center gap-1">
    <div className="w-10 h-10 rounded-full bg-cream-50 grid place-items-center shadow ring-2 ring-cream-50/70 transition-all hover:ring-flag-red">
      <span className="font-score font-bold text-ink-900 text-lg leading-none">
        {showRating ? player.rating : `#${player.number ?? ''}`}
      </span>
    </div>
    <span className="max-w-[84px] truncate rounded bg-ink-900/65 px-1.5 py-0.5 text-[10px] font-semibold text-cream-50">
      {player.name}
    </span>
  </div>
);

const EmptyChip: React.FC<{ position: string; eligible: boolean; dimmed: boolean }> = ({
  position,
  eligible,
  dimmed,
}) => (
  <div
    className={[
      'w-10 h-10 rounded-full grid place-items-center border-2 transition-all',
      eligible
        ? 'border-solid border-flag-red bg-flag-red/20 scale-110 animate-pop ring-2 ring-flag-red/40'
        : dimmed
          ? 'border-dashed border-cream-50/30 bg-pitch-900/10 opacity-50'
          : 'border-dashed border-cream-50/50 bg-pitch-900/20',
    ].join(' ')}
  >
    <span className="text-[11px] font-display uppercase text-cream-50/90">{position}</span>
  </div>
);

/**
 * The pitch with the built XI. While a drafted player is selected, the slots
 * they're eligible for light up — tap one to lock them. Tapping a filled slot
 * clears it (freeing that club).
 */
export const Pitch: React.FC = () => {
  const { formation, slotPlayers, state, selectedPlayer, eligibleSlotKeys, placePlayer, clearSlot } = useGame();
  const showRating = state.mode === 'Classic';
  const selecting = !!selectedPlayer;

  return (
    <div
      className="relative mx-auto w-full overflow-hidden rounded-xl bg-gradient-to-b from-pitch-600 to-pitch-800 shadow-inner ring-1 ring-ink-900/20"
      style={{ aspectRatio: '3 / 4', maxWidth: 460 }}
    >
      <PitchMarkings />
      {formation.slots.map((slot) => {
        const player = slotPlayers[slot.key];
        const eligible = eligibleSlotKeys.has(slot.key);
        const interactive = player ? true : eligible;

        const onClick = () => {
          if (player) clearSlot(slot.key);
          else if (eligible) placePlayer(slot.key);
        };

        return (
          <button
            key={slot.key}
            type="button"
            onClick={onClick}
            disabled={!interactive}
            className={[
              'absolute -translate-x-1/2 -translate-y-1/2',
              interactive ? 'cursor-pointer' : 'cursor-default',
            ].join(' ')}
            style={{ left: `${slot.x * 100}%`, top: `${(1 - slot.y) * 100}%` }}
            aria-label={
              player
                ? `${slot.position}: ${player.name} — tap to remove`
                : eligible
                  ? `Place ${selectedPlayer?.name} at ${slot.position}`
                  : `Empty ${slot.position}`
            }
          >
            {player ? (
              <FilledChip player={player} showRating={showRating} />
            ) : (
              <EmptyChip position={slot.position} eligible={eligible} dimmed={selecting && !eligible} />
            )}
          </button>
        );
      })}
    </div>
  );
};
