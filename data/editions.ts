import type { Edition } from '@/types';

/**
 * Squad-years to roll from (2015–2026). Each is a year; the ratings represent
 * that club's roster for that season.
 */
const FIRST_YEAR = 2015;
const LAST_YEAR = 2026;

const YEARS = Array.from({ length: LAST_YEAR - FIRST_YEAR + 1 }, (_, i) => FIRST_YEAR + i);

export const editions: Edition[] = YEARS.map((year) => ({
  id: `y${year}`,
  label: String(year),
  year,
}));

export const editionById: Record<string, Edition> = Object.fromEntries(
  editions.map((e) => [e.id, e]),
);

