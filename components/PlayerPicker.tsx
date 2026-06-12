import React, { useMemo } from 'react';
import { editionTag } from '@/utils/display';
import { editionById } from '@/data/editions';
import { clubById } from '@/data/clubs';
import { useGame } from './GameStore';
import { Badge } from './Badge';

/**
 * The "pick a player" list for the drawn club. Tap a player to select them, then
 * tap one of their highlighted positions on the pitch to lock them in — which
 * rolls the next club (one player per club). Players whose listed positions are
 * all taken are disabled.
 */
export const PlayerPicker: React.FC = () => {
  const { state, drawSquad, formation, slotPlayers, selectDraftPlayer, complete } = useGame();
  const showRating = state.mode === 'Classic';

  // Which positions still have an open slot.
  const openPositions = useMemo(() => {
    const set = new Set<string>();
    for (const slot of formation.slots) if (!slotPlayers[slot.key]) set.add(slot.position);
    return set;
  }, [formation, slotPlayers]);

  // Names already in the XI — the same person can appear in several clubs/years.
  const pickedNames = useMemo(() => {
    const set = new Set<string>();
    for (const p of Object.values(slotPlayers)) if (p) set.add(p.name);
    return set;
  }, [slotPlayers]);

  // Squad shown in its natural, position-grouped order (GK → defenders → … → forwards).
  const players = drawSquad?.players ?? [];

  if (complete) {
    return (
      <div className="rounded-xl border border-ink-900/10 bg-cream-50 p-5 text-center">
        <div className="font-display uppercase text-lg text-ink-900">Your team is ready</div>
        <p className="text-sm text-ink-700/70 mt-1">11 players, 11 clubs. Simulate your run.</p>
      </div>
    );
  }

  if (!drawSquad || !state.draw) {
    return (
      <div className="rounded-xl border border-ink-900/10 bg-cream-50 p-5 text-sm text-ink-700/70">
        Roll to draw a club, then pick a player.
      </div>
    );
  }

  const club = clubById[state.draw.clubId];
  const edition = editionById[state.draw.editionId];

  return (
    <div className="rounded-xl border border-ink-900/10 bg-cream-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-ink-900/10">
        <span className="flex items-center gap-2 text-sm font-display text-ink-900">
          <Badge clubId={state.draw.clubId} size={20} />
          {club?.name} {edition ? editionTag(edition) : ''}
        </span>
        <span className="text-[10px] uppercase tracking-[0.18em] text-flag-red">
          {state.selectedPlayerId ? 'Tap a position →' : 'Pick a player'}
        </span>
      </div>

      <ul className="max-h-[380px] overflow-auto divide-y divide-ink-900/5">
        {players.map((p) => {
          const alreadyIn = pickedNames.has(p.name);
          const placeable = !alreadyIn && p.positions.some((pos) => openPositions.has(pos));
          const selected = state.selectedPlayerId === p.id;
          return (
            <li key={p.id}>
              <button
                type="button"
                disabled={!placeable}
                onClick={() => selectDraftPlayer(p.id)}
                className={[
                  'w-full flex items-center gap-3 px-4 py-2 text-left transition-colors',
                  selected ? 'bg-flag-red/10 ring-1 ring-inset ring-flag-red/40' : 'hover:bg-ink-900/[0.04]',
                  placeable ? '' : 'opacity-40 cursor-not-allowed',
                ].join(' ')}
              >
                <span className="w-7 shrink-0 text-xs tabular-nums text-ink-700/60">#{p.number}</span>
                <span className="flex-1 font-semibold text-ink-900 truncate">{p.name}</span>
                {alreadyIn ? (
                  <span className="shrink-0 text-[9px] uppercase tracking-wide text-pitch-700 font-display">
                    In XI
                  </span>
                ) : null}
                <span className="w-16 shrink-0 text-right text-[11px] uppercase text-ink-700/60">
                  {p.positions.join('/')}
                </span>
                <span className="w-7 shrink-0 text-right font-score font-bold text-ink-900">
                  {showRating ? p.rating : '–'}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
