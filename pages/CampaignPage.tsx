import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { saveCardImage } from '@/utils/share';
import { useGame } from '@/components/GameStore';
import { MatchReveal } from '@/components/MatchReveal';
import { ResultCard } from '@/components/ResultCard';

const GroupTableView: React.FC = () => {
  const { state } = useGame();
  const rows = state.campaign?.groupTable ?? [];
  return (
    <div className="rounded-xl border border-ink-900/10 bg-cream-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-ink-900/10">
        <span className="font-display uppercase text-sm text-ink-900">Group · final table</span>
        <span className="text-[9px] uppercase tracking-wide text-ink-700/50">P · GD · Pts</span>
      </div>
      <table className="w-full text-sm">
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={i}
              className={[
                'border-b border-ink-900/5 last:border-0',
                i < 2 ? 'bg-pitch-500/10' : 'opacity-70',
                r.me ? 'ring-1 ring-inset ring-flag-red/40' : '',
              ].join(' ')}
            >
              <td className="w-6 pl-3 py-1.5 text-xs tabular-nums text-ink-700/60">{i + 1}</td>
              <td className="py-1.5 pr-2 font-medium text-ink-900 truncate">{r.name}</td>
              <td className="w-6 py-1.5 text-center text-xs tabular-nums text-ink-700/70">{r.played}</td>
              <td className="w-8 py-1.5 text-center text-xs tabular-nums text-ink-700/70">
                {r.gd > 0 ? `+${r.gd}` : r.gd}
              </td>
              <td className="w-8 pr-3 py-1.5 text-right font-score font-bold text-ink-900">{r.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const CampaignPage: React.FC = () => {
  const { state, reveal, revealAll, reset } = useGame();
  const navigate = useNavigate();
  const [imageLabel, setImageLabel] = React.useState<string>('Save image');
  const cardRef = React.useRef<HTMLDivElement>(null);
  const t = state.campaign;

  if (!t) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display uppercase text-3xl text-ink-900">No run yet</h1>
        <p className="mt-3 text-ink-700">Build your team and simulate to start a run.</p>
        <Link
          to="/play"
          className="inline-block mt-6 bg-flag-red hover:bg-flag-dark text-cream-50 font-display uppercase tracking-wide rounded-lg px-6 py-3 transition-colors"
        >
          Go to Play →
        </Link>
      </div>
    );
  }

  const shown = t.matches.slice(0, state.revealed);
  const allRevealed = state.revealed >= t.matches.length;
  const groupRevealed = state.revealed >= 3;
  const advancedFromGroup = t.matches.some((m) => m.phase !== 'GROUP');

  // Running record from only the revealed matches, so nothing is spoiled.
  const shownWins = shown.filter((m) => m.outcome === 'W').length;
  const shownLosses = shown.filter((m) => m.outcome === 'L').length;

  let verdict = 'Group stage';
  if (t.champion) verdict = 'Champions 🏆';
  else if (advancedFromGroup) {
    const lastLoss = [...t.matches].reverse().find((m) => m.outcome === 'L');
    verdict = lastLoss ? `Out · ${lastLoss.opponent.label}` : 'Eliminated';
  } else verdict = 'Out · Group stage';

  const newRoll = () => {
    reset();
    navigate('/play');
  };

  const handleSaveImage = async () => {
    if (!cardRef.current) return;
    setImageLabel('Saving…');
    const result = await saveCardImage(cardRef.current);
    setImageLabel(result === 'failed' ? 'Save failed' : 'Saved!');
    window.setTimeout(() => setImageLabel('Save image'), 2000);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-ink-700/60">The run</div>
          <h1 className="font-display uppercase text-2xl text-ink-900">Your team · 7-game gauntlet</h1>
        </div>
        <div className="text-right">
          <div className="font-score font-bold text-2xl text-ink-900">
            {shownWins}-{shownLosses}
          </div>
          <div className="text-[10px] uppercase tracking-wide text-ink-700/60">W · L</div>
        </div>
      </div>

      {/* Revealed matches in order. */}
      <div className="space-y-3">
        {shown.map((m, i) => (
          <React.Fragment key={i}>
            <MatchReveal match={m} highlight={i === state.revealed - 1} />
            {i === 2 && groupRevealed && (
              <>
                <GroupTableView />
                <div className="text-center text-sm font-display uppercase tracking-wide text-ink-700">
                  {advancedFromGroup ? 'Qualified — into the knockouts' : 'Eliminated in the group stage'}
                </div>
              </>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Reveal controls or the final result card. */}
      {!allRevealed ? (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={reveal}
            className="bg-flag-red hover:bg-flag-dark text-cream-50 font-display uppercase tracking-wide rounded-lg px-6 py-3 transition-colors"
          >
            {state.revealed === 0 ? 'Reveal 1st match →' : 'Reveal next match →'}
          </button>
          <button
            type="button"
            onClick={revealAll}
            className="font-display uppercase text-sm rounded-lg px-4 py-3 border border-ink-900/15 hover:border-ink-900/40 transition-colors"
          >
            Skip to result
          </button>
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in-up">
          <div className="flex justify-center">
            <ResultCard ref={cardRef} verdict={verdict} />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={handleSaveImage}
              className="inline-flex items-center gap-2 font-display uppercase text-sm rounded-lg px-5 py-2.5 bg-flag-red hover:bg-flag-dark text-cream-50 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 3v12" />
                <path d="M7 10l5 5 5-5" />
                <path d="M5 21h14" />
              </svg>
              {imageLabel}
            </button>
            <button
              type="button"
              onClick={newRoll}
              className="font-display uppercase text-sm rounded-lg px-5 py-2.5 border border-ink-900/15 hover:border-ink-900/40 transition-colors"
            >
              New team
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
