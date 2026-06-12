// ---------------------------------------------------------------------------
// scrape-sofifa.mjs — pull Süper Lig squads (name, positions, overall) from
// sofifa.com for the years 2015–2026, and write data/players.generated.json.
//
// sofifa.com sits behind Cloudflare's "Verify you are human" challenge, which
// blocks plain HTTP and flags headless automation. So this opens a REAL,
// headed browser with a PERSISTENT profile: you solve the checkbox ONCE in the
// window, press Enter, and the script then pulls every edition via in-page
// fetch() (same-origin XHR reuses the Cloudflare clearance cookie — no further
// challenges, no page navigations).
//
// Usage:
//   npm i -D playwright    (first time)
//   npx playwright install chromium
//   npm run scrape
// ---------------------------------------------------------------------------

import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import readline from 'node:readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT_FILE = resolve(ROOT, 'data', 'players.generated.json');
const USER_DATA_DIR = resolve(ROOT, '.sofifa-profile'); // persists the CF clearance

const LEAGUE = 68; // Turkish Süper Lig
const FIRST_YEAR = 2015;
const LAST_YEAR = 2026;
const PAGE_SIZE = 60;

/** sofifa English position codes → our position set. */
const POSITION_MAP = {
  GK: 'GK',
  RB: 'RB', RWB: 'RB',
  CB: 'CB',
  LB: 'LB', LWB: 'LB',
  CDM: 'DM',
  CM: 'CM',
  CAM: 'AM',
  RM: 'RM',
  LM: 'LM',
  RW: 'RW', RF: 'RW',
  LW: 'LW', LF: 'LW',
  ST: 'ST', CF: 'ST',
};

/** Diacritic-insensitive name needle → our club id. */
const CLUB_MATCHERS = [
  ['galatasaray', 'galatasaray'],
  ['fenerbah', 'fenerbahce'],
  ['besiktas', 'besiktas'],
  ['trabzon', 'trabzonspor'],
  ['basaksehir', 'basaksehir'],
  ['adana demir', 'adanademirspor'],
  ['samsun', 'samsunspor'],
  ['antalya', 'antalyaspor'],
  ['sivas', 'sivasspor'],
  ['konya', 'konyaspor'],
  ['alanya', 'alanyaspor'],
  ['kayseri', 'kayserispor'],
  ['rize', 'rizespor'],
  ['gaziantep', 'gaziantep'],
  ['kasimpasa', 'kasimpasa'],
  ['goztepe', 'goztepe'],
];

const deburr = (s) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i').toLowerCase();

function clubIdFor(teamName) {
  const n = deburr(teamName);
  for (const [needle, id] of CLUB_MATCHERS) if (n.includes(needle)) return id;
  return null;
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((res) => rl.question(question, (a) => { rl.close(); res(a); }));
}

async function main() {
  console.log('Launching browser (a window will open)…');
  const ctx = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: false,
    viewport: { width: 1280, height: 900 },
    args: ['--disable-blink-features=AutomationControlled'],
  });
  const page = ctx.pages()[0] ?? (await ctx.newPage());

  const startUrl = `https://sofifa.com/players?type=all&lg[0]=${LEAGUE}&hl=en-US`;
  await page.goto(startUrl, { waitUntil: 'domcontentloaded' });

  // Wait until the players table is present (i.e. Cloudflare cleared).
  for (let i = 0; i < 60; i++) {
    const ready = await page.evaluate(() => !!document.querySelector('table tbody tr'));
    if (ready) break;
    if (i === 0) {
      console.log('\n>>> If you see a Cloudflare "Verify you are human" box, click it in the window.');
    }
    await page.waitForTimeout(1000);
  }
  if (!(await page.evaluate(() => !!document.querySelector('table tbody tr')))) {
    await ask('\nPress Enter once the Süper Lig players table is visible in the browser… ');
  }

  // Map edition labels → roster ids from the version dropdown, then to years.
  const editions = await page.evaluate(() => {
    const sel = document.querySelector('select[name="version"]');
    if (!sel) return [];
    return [...sel.options].map((o) => {
      const m = o.value.match(/[?&]r=(\d+)/);
      return { label: o.textContent.trim(), roster: m ? m[1] : null };
    });
  });

  // FIFA 15 → 2015 … FC 26 → 2026. Keep the first (latest) roster per year in range.
  const byYear = new Map();
  for (const e of editions) {
    if (!e.roster) continue;
    const m = e.label.match(/(\d{2})\s*$/);
    if (!m) continue;
    const year = 2000 + Number(m[1]);
    if (year < FIRST_YEAR || year > LAST_YEAR) continue;
    if (!byYear.has(year)) byYear.set(year, e.roster); // dropdown lists latest first
  }
  const targets = [...byYear.entries()].sort((a, b) => a[0] - b[0]);
  console.log(`\nEditions to pull: ${targets.map(([y]) => y).join(', ')}`);

  const result = {
    meta: {
      source: 'sofifa.com',
      league: LEAGUE,
      generatedAt: new Date().toISOString(),
      years: targets.map(([y]) => y),
    },
    clubs: {},
  };

  for (const [year, roster] of targets) {
    process.stdout.write(`\n${year} (r=${roster}): `);
    let offset = 0;
    let pulled = 0;
    while (true) {
      const url = `/players?type=all&lg[0]=${LEAGUE}&r=${roster}&set=true&offset=${offset}&hl=en-US`;
      // Fetch + parse inside the page so the Cloudflare cookie is reused.
      const rows = await page.evaluate(async (u) => {
        const res = await fetch(u, { credentials: 'include' });
        if (!res.ok) return { error: res.status };
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const trs = [...doc.querySelectorAll('table tbody tr')];
        return {
          rows: trs.map((tr) => {
            const nameA = tr.querySelector('a[href^="/player/"]');
            const teamA = tr.querySelector('a[href^="/team/"]');
            const posEls = [...tr.querySelectorAll('a[href*="/players?pn="]')];
            // age, overall, potential are the consecutive numeric cells
            const nums = [...tr.querySelectorAll('td')]
              .map((td) => td.textContent.trim())
              .filter((t) => /^\d{1,2}$/.test(t));
            return {
              name: nameA ? nameA.textContent.trim() : null,
              team: teamA ? teamA.textContent.trim() : null,
              positions: posEls.map((a) => a.textContent.trim()).filter(Boolean),
              // nums = [age, overall, potential]
              overall: nums.length >= 2 ? Number(nums[1]) : null,
            };
          }),
        };
      }, url);

      if (rows.error) {
        process.stdout.write(`[http ${rows.error}] `);
        break;
      }
      if (!rows.rows.length) break;

      for (const r of rows.rows) {
        if (!r.name || !r.team || !r.overall) continue;
        const clubId = clubIdFor(r.team);
        if (!clubId) continue; // a Süper Lig club we don't model
        const positions = [];
        for (const p of r.positions) {
          const mapped = POSITION_MAP[p.toUpperCase()];
          if (mapped && !positions.includes(mapped)) positions.push(mapped);
        }
        if (!positions.length) continue;
        (result.clubs[clubId] ??= {});
        (result.clubs[clubId][year] ??= []);
        result.clubs[clubId][year].push({ name: r.name, positions, rating: r.overall });
        pulled++;
      }

      offset += PAGE_SIZE;
      await page.waitForTimeout(250); // be polite
    }
    process.stdout.write(`${pulled} players`);
  }

  mkdirSync(dirname(OUT_FILE), { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify(result, null, 2) + '\n');
  const clubCount = Object.keys(result.clubs).length;
  const cellCount = Object.values(result.clubs).reduce((s, y) => s + Object.keys(y).length, 0);
  console.log(`\n\nWrote ${OUT_FILE}`);
  console.log(`Clubs: ${clubCount} · club-year squads: ${cellCount}`);

  await ctx.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
