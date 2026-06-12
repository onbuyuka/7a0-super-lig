import React from 'react';
import { NavLink } from 'react-router-dom';
import { Brand } from './Brand';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-cream-100">
      <header className="border-b border-ink-900/10 bg-cream-50/80 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-4">
          <NavLink to="/" aria-label="Home">
            <Brand />
          </NavLink>
        </div>
      </header>

      <main className="flex-1 w-full">{children}</main>

      <footer className="border-t border-ink-900/10 mt-10">
        <div className="mx-auto max-w-6xl px-4 py-5 text-xs text-ink-700/70 flex flex-wrap items-center justify-between gap-2">
          <span className="uppercase tracking-[0.18em] font-display">
            7A0 · Süper Lig — build · simulate · 7–0
          </span>
          <span>Independent fan project</span>
        </div>
      </footer>
    </div>
  );
};
