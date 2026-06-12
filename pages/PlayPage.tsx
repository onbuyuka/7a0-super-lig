import React from 'react';
import { useGame } from '@/components/GameStore';
import { Controls } from '@/components/Controls';
import { RollPanel } from '@/components/RollPanel';
import { PlayerPicker } from '@/components/PlayerPicker';
import { Pitch } from '@/components/Pitch';
import { BoxScore } from '@/components/BoxScore';

const SetupView: React.FC = () => {
  const { state, startBuild } = useGame();
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="rounded-2xl border border-ink-900/10 bg-cream-50 p-6 sm:p-8 animate-fade-in-up">
        <div className="text-[10px] uppercase tracking-[0.18em] text-ink-700/60">Step 1 · set up</div>
        <h1 className="font-display uppercase text-3xl text-ink-900 mt-1">Choose your shape</h1>
        <p className="text-sm text-ink-700/80 mt-1 mb-6">
          Pick a formation, style and mode. Then start rolling clubs to build your XI.
        </p>

        <Controls />

        <button
          type="button"
          onClick={startBuild}
          className="mt-8 w-full bg-flag-red hover:bg-flag-dark text-cream-50 font-display uppercase tracking-wide text-lg rounded-lg py-3 transition-colors"
        >
          Start rolling <span aria-hidden>🎲</span>
        </button>
        <p className="mt-3 text-center text-xs text-ink-700/50">
          {state.formationId} · {state.style} · {state.mode === 'Classic' ? 'Classic' : 'From memory'}
        </p>
      </div>
    </div>
  );
};

const BuildView: React.FC = () => {
  const { state } = useGame();
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="grid gap-4 lg:grid-cols-[330px_minmax(0,1fr)_300px]">
        <div className="space-y-4 order-2 lg:order-1">
          <RollPanel />
          <PlayerPicker />
        </div>

        <div className="order-1 lg:order-2">
          <Pitch />
          <p className="mt-3 text-center text-xs text-ink-700/60">
            Pick a player from the squad, then tap a highlighted position. One player per club.
            <br />
            {state.formationId} · {state.style} · {state.mode === 'Classic' ? 'Classic' : 'From memory'}
          </p>
        </div>

        <div className="order-3">
          <BoxScore />
        </div>
      </div>
    </div>
  );
};

export const PlayPage: React.FC = () => {
  const { state } = useGame();
  return state.phase === 'setup' ? <SetupView /> : <BuildView />;
};
