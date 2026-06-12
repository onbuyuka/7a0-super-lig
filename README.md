# 7A0 · Süper Lig 🏆

A Süper Lig spin on **[7a0 — Sete a Zero](https://7a0.com.br/en)**.

Set up a formation → **roll** Süper Lig clubs across the years and take **one player from each**
to build **“Your team”** (a mix of 11) → **simulate** a 7-game run (group → final), revealed
**game by game**. Win all seven to go **7–0**.

> An independent fan project. Not affiliated with any club, league, or game publisher.
> Player ratings are an approximation for entertainment.

## Status

- **Phase 1 — Fundamentals (done):** scaffold, domain model, a match engine ported 1:1 from
  7a0, and the full set-up → roll/build → game-by-game run loop.
- **Phase 2 — Data (done):** real Süper Lig squads & ratings (2015–2026) scraped from
  [sofifa.com](https://sofifa.com) into `data/players.generated.json`. The game rolls only the
  (club, year) squads that actually exist; a deterministic sample generator covers any gaps.

## Develop

```bash
npm install
npm run dev      # http://localhost:3000/7a0-super-lig/
npm run build    # production build to dist/
npm run test     # run the engine unit tests (vitest)
npm run deploy   # build + publish dist/ to the gh-pages branch
```

Deployed as a GitHub Pages **project site**, so `vite.config.ts` sets
`base: '/7a0-super-lig/'` and the app uses a `HashRouter` (no server rewrites needed).

## Project structure

```
data/        clubs, years, squads (real data + sample generator), formations
             players.generated.json — scraped Süper Lig squads (name, positions, rating)
utils/       team-strength (box score), match + campaign simulation (7a0 model), RNG
components/  brand/header, pitch, roll panel, player picker, box score, match reveal
pages/       Home, Play (set up + roll/build), Run (game-by-game campaign)
scripts/     scrape-sofifa.mjs — pulls real squads from sofifa.com
types.ts     core domain types (Club, Edition, Squad, Player, Formation, Campaign, …)
```

## Data (sofifa.com)

Real squads & ratings come from sofifa.com (Turkish Süper Lig, `lg[0]=68`) for the years
2015–2026, stored in [`data/players.generated.json`](data/players.generated.json) as
`{ clubs: { <clubId>: { <year>: [{ name, positions, rating }] } } }`.

sofifa is behind Cloudflare, so the scraper opens a **real browser** (headed) with a persistent
profile — you solve the “Verify you are human” box **once**, and it then pulls every edition via
in-page `fetch()` (no further challenges):

```bash
npm i -D playwright            # first time only
npx playwright install chromium
npm run scrape                 # solve the checkbox once, then it harvests 2015–2026
```

If `players.generated.json` is empty, the app falls back to a deterministic **sample generator**
so it stays playable. Positions are mapped to our set (e.g. `CDM→DM`, `CF→ST`); players whose
club isn't one of the modelled 16 are skipped. An independent fan project — data is used for a
non-commercial game.

## Concept (from 7a0)

| 7a0 (original)                              | 7A0 · Süper Lig (this project)                       |
| ------------------------------------------- | ---------------------------------------------------- |
| Roll a **national team** + **World Cup**    | Roll **Süper Lig clubs** across the **years**        |
| Pick players who were actually there        | Take **one player per club** → “Your team” mix of 11 |
| Simulate a 7-game run, win **7–0**          | Simulate a 7-game run (group → final), win **7–0**   |

## Simulation (ported from 7a0)

- **Box score:** `attack`/`defense` are position-weighted averages of the XI; `overall` is the
  mean of the eleven ratings.
- **Goals:** Poisson with `λ = clamp(1.4 + (attack − oppOverall)·0.08, 0.15, 5)` per side.
- **Run:** group games vs overalls 68/72/76, then Round of 16 (79), quarter (83), semi (87),
  final (91). Top two of the group advance; level knockouts go to penalties.
- **7–0** = win all seven. *Record crusher* (goal-difference ≥ 18) and *The wall* (no goals
  conceded) are bonus badges.

