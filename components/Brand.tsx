import React from 'react';

/** The "7–0 · SÜPER LİG" wordmark lockup. */
export const Brand: React.FC<{ large?: boolean }> = ({ large = false }) => (
  <div className="flex items-center gap-2.5 select-none">
    <div
      className={`font-score font-bold leading-none tracking-tight text-ink-900 ${
        large ? 'text-5xl sm:text-6xl' : 'text-3xl'
      }`}
    >
      7<span className="text-flag-red">–</span>0
    </div>
    <div className="border-l-2 border-ink-900/15 pl-2.5 leading-none">
      <div
        className={`font-display font-bold uppercase leading-[0.95] tracking-tight text-ink-900 ${
          large ? 'text-2xl' : 'text-sm'
        }`}
      >
        Süper
        <br />
        Lig
      </div>
      <div
        className={`uppercase tracking-[0.18em] text-ink-700/70 ${
          large ? 'mt-1.5 text-[10px]' : 'mt-0.5 text-[8px]'
        }`}
      >
        build · simulate · 7–0
      </div>
    </div>
  </div>
);
