import type { Draw, Player, Position, Squad } from '@/types';
import { positionGroup } from '@/utils/positions';
import generated from './players.generated.json';

// ---------------------------------------------------------------------------
// Real squad data loaded from data/players.generated.json (produced by
// `npm run scrape`, which pulls Süper Lig squads from sofifa.com).
//
// The file ships empty; until it's populated the app falls back to the sample
// squad generator. Once populated, the game rolls only the (club, year) cells
// that actually exist here.
// ---------------------------------------------------------------------------

interface RawPlayer {
  name: string;
  positions: string[];
  rating: number;
  number?: number;
}

interface GeneratedData {
  meta: { source: string; league: number; generatedAt: string | null; years: number[] };
  clubs: Record<string, Record<string, RawPlayer[]>>;
}

const data = generated as GeneratedData;

const POSITIONS = new Set<Position>([
  'GK', 'RB', 'CB', 'LB', 'DM', 'CM', 'RM', 'LM', 'AM', 'RW', 'LW', 'ST',
]);

/** Display order: goalkeepers → defenders → midfielders → forwards. */
const GROUP_ORDER: Record<string, number> = { GK: 0, DEF: 1, MID: 2, ATT: 3 };

function groupRank(positions: string[]): number {
  const first = positions.find((p) => POSITIONS.has(p as Position)) as Position | undefined;
  return first ? GROUP_ORDER[positionGroup[first]] : 99;
}

function toPlayer(clubId: string, editionId: string, raw: RawPlayer, i: number): Player {
  const positions = raw.positions.filter((p): p is Position => POSITIONS.has(p as Position));
  return {
    id: `${clubId}-${editionId}-${i + 1}`,
    name: raw.name,
    number: raw.number ?? i + 1,
    positions: positions.length ? positions : ['CM'],
    rating: raw.rating,
  };
}

/** Build the squad cache: clubId → editionId → Squad. */
const squads = new Map<string, Squad>();
const combos: Draw[] = [];
let totalPlayers = 0;

for (const [clubId, years] of Object.entries(data.clubs ?? {})) {
  for (const [year, players] of Object.entries(years)) {
    if (!players?.length) continue;
    const editionId = `y${year}`;
    // Order by position group (GK → DEF → MID → ATT), then rating within a group.
    const ordered = [...players].sort(
      (a, b) => groupRank(a.positions) - groupRank(b.positions) || b.rating - a.rating,
    );
    squads.set(`${clubId}:${editionId}`, {
      clubId,
      editionId,
      players: ordered.map((p, i) => toPlayer(clubId, editionId, p, i)),
    });
    combos.push({ clubId, editionId });
    totalPlayers += players.length;
  }
}

/** True once real data has been scraped in. */
export const hasRealData = combos.length > 0;

/** All (club, year) combinations that have real squads. */
export const availableCombos: Draw[] = combos;

/** Number of (club, year) squads available. */
export const realSquadCount = combos.length;

/** Total players across all real squads. */
export const realPlayerCount = totalPlayers;

/** Real squad for a club+year, or null if not present. */
export function realSquad(clubId: string, editionId: string): Squad | null {
  return squads.get(`${clubId}:${editionId}`) ?? null;
}
