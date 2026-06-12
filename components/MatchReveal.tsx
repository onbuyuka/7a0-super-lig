import React from 'react';
import type { CampaignMatch } from '@/types';
import { editionById } from '@/data/editions';
import { clubById } from '@/data/clubs';
import { editionTag } from '@/utils/display';
import { Badge } from './Badge';

function outcomeMark(m: CampaignMatch): { mark: string; cls: string } {
  if (m.phase === 'FINAL' && m.advanced) return { mark: '★', cls: 'bg-flag-red text-cream-50' };
  if (m.outcome === 'W') return { mark: '✓', cls: 'bg-pitch-600 text-cream-50' };
  if (m.outcome === 'L') return { mark: '✕', cls: 'bg-flag-red text-cream-50' };
  return { mark: '–', cls: 'bg-ink-700 text-cream-50' };
}

/** One revealed match: phase, opponent, scoreline, and the goal feed. */
export const MatchReveal: React.FC<{ match: CampaignMatch; highlight?: boolean }> = ({
  match,
  highlight = false,
}) => {
  const club = clubById[match.opponent.clubId];
  const edition = editionById[match.opponent.editionId];
  const { mark, cls } = outcomeMark(match);

  return (
    <div
      className={[
        'rounded-xl border bg-cream-50 overflow-hidden transition-all',
        highlight ? 'border-flag-red/50 shadow-md animate-fade-in-up' : 'border-ink-900/10',
      ].join(' ')}
    >
      <div className="flex items-center gap-3 px-4 py-3 border-b border-ink-900/10">
        <span className="text-[10px] uppercase tracking-[0.18em] text-ink-700/60 w-24 shrink-0">
          {match.opponent.label}
        </span>
        <span className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-ink-700/50 text-sm">vs</span>
          <Badge clubId={match.opponent.clubId} size={22} />
          <span className="truncate font-display text-ink-900">
            {club?.name} {edition ? editionTag(edition) : ''}
          </span>
        </span>
        <span className="font-score font-bold text-xl text-ink-900 tabular-nums">
          {match.gf} – {match.ga}
        </span>
        <span className={`grid place-items-center w-6 h-6 rounded text-sm font-bold ${cls}`}>{mark}</span>
      </div>

      {match.pens && (
        <div className="px-4 pt-2 text-[11px] text-ink-700/60">
          Penalties {match.pens.for}–{match.pens.against} ({match.pens.won ? 'won' : 'lost'})
        </div>
      )}

      {match.goals.length > 0 && (
        <ul className="px-4 py-2 grid sm:grid-cols-2 gap-x-6 gap-y-0.5">
          {match.goals.map((g, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <span className="w-8 shrink-0 text-xs tabular-nums text-ink-700/50">{g.minute}'</span>
              <span className={g.conceded ? 'text-ink-700/40' : 'text-pitch-600'}>
                {g.conceded ? '◦' : '●'}
              </span>
              <span className={`truncate ${g.conceded ? 'text-ink-700/60' : 'text-ink-900'}`}>
                {g.scorer}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
