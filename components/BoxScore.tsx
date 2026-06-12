import React from 'react';
import { useGame } from './GameStore';

const Bar: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div>
    <div className="flex items-center justify-between text-[11px] mb-1">
      <span className="uppercase tracking-wide text-ink-700/70">{label}</span>
      <span className="font-score font-bold text-ink-900">{value || '—'}</span>
    </div>
    <div className="h-2 rounded-full bg-ink-900/10 overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${Math.min(100, (value / 99) * 100)}%`, backgroundColor: color }}
      />
    </div>
  </div>
);

export const BoxScore: React.FC = () => {
  const { formation, slotPlayers, state, strength } = useGame();
  const filled = strength.filled;
  const showRating = state.mode === 'Classic';

  return (
    <div className="rounded-xl border border-ink-900/10 bg-cream-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-ink-900/10">
        <span className="text-[10px] uppercase tracking-[0.18em] text-ink-700/60">
          Box score · {filled}/11
        </span>
        <span className="font-score font-bold text-2xl text-ink-900 leading-none">
          {filled ? strength.overall : '—'}
        </span>
      </div>

      <div className="px-4 py-3 space-y-3 border-b border-ink-900/10">
        <Bar label="Attack" value={strength.attack} color="#e30a17" />
        <Bar label="Defense" value={strength.defense} color="#15130f" />
      </div>

      <table className="w-full text-sm">
        <tbody>
          {formation.slots.map((slot) => {
            const player = slotPlayers[slot.key];
            return (
              <tr key={slot.key} className="border-b border-ink-900/5 last:border-0">
                <td className="w-12 px-4 py-1.5 text-[11px] uppercase text-ink-700/60">{slot.position}</td>
                <td className="px-1 py-1.5 text-ink-900 truncate">{player?.name ?? '—'}</td>
                <td className="w-10 px-4 py-1.5 text-right font-score font-bold text-ink-900">
                  {player ? (showRating ? player.rating : '•') : ''}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
