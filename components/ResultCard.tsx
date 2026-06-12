import React from 'react';
import { clubById } from '@/data/clubs';
import { editionById } from '@/data/editions';
import { useGame } from './GameStore';
import { Badge } from './Badge';

interface ResultCardProps {
  verdict: string;
}

/**
 * A self-contained "collectible" result card, styled after 7a0's shareable
 * card. Rendered on screen and captured to a PNG for sharing, so it avoids
 * external images (badges are inline SVG) and uses solid colours.
 */
export const ResultCard = React.forwardRef<HTMLDivElement, ResultCardProps>(({ verdict }, ref) => {
  const { formation, slotPlayers, state, strength } = useGame();
  const t = state.campaign;
  if (!t) return null;

  // Highlight the highest-rated player (the "star").
  let starKey: string | null = null;
  let starRating = -1;
  for (const slot of formation.slots) {
    const p = slotPlayers[slot.key];
    if (p && p.rating > starRating) {
      starRating = p.rating;
      starKey = slot.key;
    }
  }

  return (
    <div
      ref={ref}
      className="relative w-[380px] bg-cream-100 p-3"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <div className="border-2 border-cream-300 p-1.5">
        <div className="border border-ink-900/25 bg-cream-50 px-5 py-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 select-none">
              <div className="font-score font-bold text-2xl leading-none text-ink-900">
                7<span className="text-flag-red">–</span>0
              </div>
              <div className="border-l-2 border-ink-900/15 pl-2 leading-[0.9]">
                <div className="font-display font-bold uppercase text-[11px] tracking-tight text-ink-900">
                  Süper<br />Lig
                </div>
              </div>
            </div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-ink-700/50">
              {t.perfect ? '7–0 club' : 'dream XI'}
            </div>
          </div>

          <div className="my-3 border-t border-ink-900/10" />

          {/* Verdict + score */}
          <div className="text-center">
            <div className="font-display uppercase tracking-wide text-xl text-ink-900">{verdict}</div>
            <div
              className="font-score font-bold text-ink-900 text-center"
              style={{ fontSize: '80px', lineHeight: '104px', height: '104px' }}
            >
              {t.wins}<span className="text-flag-red">-</span>{t.losses}
            </div>
          </div>

          {/* Stats box */}
          <div className="mt-3 grid grid-cols-4 border border-ink-900/20">
            {[
              { v: t.gf, l: 'goals for', accent: false },
              { v: t.ga, l: 'against', accent: false },
              { v: strength.overall, l: 'overall', accent: false },
              { v: t.wins, l: 'wins', accent: true },
            ].map((s, i) => (
              <div
                key={s.l}
                className={`px-2 py-2 text-center ${i > 0 ? 'border-l border-ink-900/15' : ''}`}
              >
                <div className={`font-score font-bold text-2xl leading-none ${s.accent ? 'text-flag-red' : 'text-ink-900'}`}>
                  {s.v}
                </div>
                <div className="mt-1 text-[8px] uppercase tracking-[0.12em] text-ink-700/55">{s.l}</div>
              </div>
            ))}
          </div>

          {/* Badge ribbon */}
          {t.badge && (
            <div className="mt-3 text-center font-display uppercase tracking-wide text-xs text-flag-red">
              {t.badge === 'ESMAGADOR' ? '★ Record crusher ★' : '★ The wall — no goals conceded ★'}
            </div>
          )}

          {/* XI list — a table so html2canvas vertically centers each row.
              Every cell shares one height + line-height so text and badges align. */}
          <table className="mt-3 w-full" style={{ borderCollapse: 'separate', borderSpacing: '0 3px' }}>
            <tbody>
              {formation.slots.map((slot) => {
                const player = slotPlayers[slot.key];
                const pick = state.picks[slot.key];
                const club = pick ? clubById[pick.clubId] : null;
                const edition = pick ? editionById[pick.editionId] : null;
                const isStar = slot.key === starKey;
                const cellBg = isStar ? 'bg-cream-200' : 'bg-cream-100/60';
                const cell = `${cellBg} h-7 align-middle leading-7`;
                return (
                  <tr key={slot.key}>
                    <td className={`${cell} w-7 rounded-l text-center font-score font-bold text-[13px] text-ink-700/70`}>
                      {player?.rating ?? ''}
                    </td>
                    <td className={`${cell} pl-2 text-[13px] ${isStar ? 'font-bold text-flag-red' : 'font-semibold text-ink-900'}`}>
                      <span className="block truncate max-w-[150px] leading-7">{player?.name ?? '—'}</span>
                    </td>
                    <td className={`${cell} w-6 text-center`}>
                      {club && (
                        <span className="inline-block align-middle">
                          <Badge clubId={club.id} size={15} />
                        </span>
                      )}
                    </td>
                    <td className={`${cell} rounded-r pr-2 w-20 text-right text-[10px] uppercase tracking-wide text-ink-700/55`}>
                      {club?.shortName} {edition?.year}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="mt-4 text-center text-[9px] uppercase tracking-[0.16em] text-ink-700/45">
            7a0 Süper Lig · build yours
          </div>
        </div>
      </div>
    </div>
  );
});

ResultCard.displayName = 'ResultCard';
