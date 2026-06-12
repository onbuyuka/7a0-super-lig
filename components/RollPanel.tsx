import React from 'react';
import { useNavigate } from 'react-router-dom';
import { clubById } from '@/data/clubs';
import { editionById } from '@/data/editions';
import { useGame } from './GameStore';
import { Badge } from './Badge';

const btn =
  'font-display text-sm rounded-md px-3 py-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

export const RollPanel: React.FC = () => {
  const { state, filled, complete, roll, rerollClub, rerollYear, simulate } = useGame();
  const navigate = useNavigate();

  const handleSimulate = () => {
    simulate();
    navigate('/run');
  };

  const club = state.draw ? clubById[state.draw.clubId] : null;
  const edition = state.draw ? editionById[state.draw.editionId] : null;

  return (
    <div className="rounded-xl border border-ink-900/10 bg-cream-50 p-5 animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-[0.18em] text-ink-700/60">Your team</div>
        <div className="font-score font-bold text-ink-900">{filled}/11</div>
      </div>

      {!complete && state.draw ? (
        <>
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-ink-700/60">Drawn</div>
            <div className="mt-1 flex items-center gap-2.5">
              <Badge clubId={state.draw.clubId} size={34} />
              <div>
                <div className="font-display text-xl leading-tight text-ink-900">{club?.name}</div>
                <div className="font-display uppercase tracking-wide text-flag-red text-sm">{edition?.year}</div>
              </div>
            </div>
            <p className="mt-1 text-xs text-ink-700/60">
              Pick a player below, then tap one of their highlighted positions on the pitch.
            </p>
          </div>

          <div>
            <div className="text-xs text-ink-700/70 mb-1.5">
              Not feeling it? Re-roll · <span className="font-semibold">{state.rerollsLeft} left</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={rerollClub}
                disabled={state.rerollsLeft <= 0}
                className={`${btn} border border-ink-900/15 hover:border-ink-900/40`}
              >
                ↺ Another team
              </button>
              <button
                type="button"
                onClick={rerollYear}
                disabled={state.rerollsLeft <= 0}
                className={`${btn} border border-ink-900/15 hover:border-ink-900/40`}
              >
                ↺ Another year
              </button>
            </div>
          </div>
        </>
      ) : complete ? (
        <div className="rounded-lg bg-pitch-500/10 border border-pitch-500/20 px-3 py-2 text-sm text-pitch-800">
          Your XI is complete — a mix of 11 clubs.
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-ink-700/70">
            {filled === 0
              ? 'Roll to draw your first club.'
              : 'Roll to draw the next club.'}
          </p>
          <button
            type="button"
            onClick={roll}
            className="w-full bg-flag-red hover:bg-flag-dark text-cream-50 font-display uppercase tracking-wide text-lg rounded-lg py-3 transition-colors"
          >
            Roll <span aria-hidden>🎲</span>
          </button>
        </div>
      )}

      <div className="border-t border-ink-900/10 pt-4 space-y-2">
        <button
          type="button"
          disabled={!complete}
          onClick={handleSimulate}
          className={`${btn} w-full bg-pitch-700 hover:bg-pitch-800 text-cream-50 uppercase tracking-wide text-base py-3`}
        >
          {complete ? 'Simulate the run →' : `Fill your XI · ${filled}/11`}
        </button>
      </div>
    </div>
  );
};
