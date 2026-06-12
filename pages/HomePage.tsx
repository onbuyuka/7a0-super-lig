import React from 'react';
import { Link } from 'react-router-dom';
import { Brand } from '@/components/Brand';
import { clubs } from '@/data/clubs';
import { editions } from '@/data/editions';
import { hasRealData, realPlayerCount, realSquadCount } from '@/data/realData';

const STEPS = [
  { n: '01', title: 'Set up', desc: 'Choose your formation, style and mode' },
  { n: '02', title: 'Roll & build', desc: 'Roll Süper Lig clubs — one player from each' },
  { n: '03', title: 'Simulate', desc: 'Play a 7-game run, game by game — go 7–0?' },
];

export const HomePage: React.FC = () => {
  const minYear = Math.min(...editions.map((e) => e.year));
  const maxYear = Math.max(...editions.map((e) => e.year));
  const squadCount = hasRealData ? realSquadCount : clubs.length * editions.length;
  const playerCount = hasRealData ? realPlayerCount : squadCount * 23;

  return (
    <div className="mx-auto max-w-6xl px-4">
      <section className="py-14 sm:py-20 text-center flex flex-col items-center animate-fade-in-up">
        <div className="mb-6">
          <Brand large />
        </div>
        <div className="font-display uppercase tracking-[0.18em] text-xs text-ink-700/60 mb-3">
          Dream Süper Lig XI · {minYear} — {maxYear}
        </div>
        <h1 className="font-display uppercase text-4xl sm:text-6xl leading-[0.95] text-ink-900 max-w-2xl">
          Roll the dice. Build your dream <span className="text-flag-red">Super Lig XI</span>.
        </h1>
        <p className="mt-5 max-w-xl text-ink-700">
          Roll Süper Lig clubs across the years and take one player from each to build “Your team” —
          a mix of 11. Then simulate a 7-game run from the group to the final, game by game. Can you go 7–0?
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/play"
            className="bg-flag-red hover:bg-flag-dark text-cream-50 font-display uppercase tracking-wide text-lg rounded-lg px-8 py-3 transition-colors"
          >
            Play now →
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3 pb-10">
        {STEPS.map((s) => (
          <div key={s.n} className="rounded-xl border border-ink-900/10 bg-cream-50 p-5">
            <div className="font-score font-bold text-3xl text-flag-red/80">{s.n}</div>
            <div className="font-display uppercase text-lg text-ink-900 mt-1">{s.title}</div>
            <p className="text-sm text-ink-700/80 mt-1">{s.desc}</p>
          </div>
        ))}
      </section>

      <section className="pb-16 text-center text-sm text-ink-700/70">
        <span className="font-score font-bold text-ink-900">{clubs.length}</span> clubs ·{' '}
        <span className="font-score font-bold text-ink-900">{editions.length}</span> years ·{' '}
        <span className="font-score font-bold text-ink-900">{squadCount}</span> squads ·{' '}
        <span className="font-score font-bold text-ink-900">{playerCount.toLocaleString()}</span> players
        <div className="mt-2 text-xs text-ink-700/50">
          {hasRealData
            ? 'Squads & ratings sourced from sofifa.com.'
            : 'Sample data for now — run the scraper to load real squads & ratings.'}
        </div>
      </section>
    </div>
  );
};
