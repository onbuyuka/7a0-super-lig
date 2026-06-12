import type { Club } from '@/types';

/** Club plus a base `tier` (~overall) used by the sample squad generator. */
export interface ClubMeta extends Club {
  /** Roughly the club's overall strength, before per-edition variation. */
  tier: number;
}

/**
 * A representative set of Turkish clubs. Colours are approximate kit colours
 * for SVG badges (no copyrighted imagery). Phase 2 may expand this list.
 */
export const clubs: ClubMeta[] = [
  { id: 'galatasaray', name: 'Galatasaray', shortName: 'GS', city: 'İstanbul', colors: { primary: '#a90432', secondary: '#fdb912' }, tier: 79 },
  { id: 'fenerbahce', name: 'Fenerbahçe', shortName: 'FB', city: 'İstanbul', colors: { primary: '#163962', secondary: '#ffed00' }, tier: 79 },
  { id: 'besiktas', name: 'Beşiktaş', shortName: 'BJK', city: 'İstanbul', colors: { primary: '#000000', secondary: '#ffffff' }, tier: 77 },
  { id: 'trabzonspor', name: 'Trabzonspor', shortName: 'TS', city: 'Trabzon', colors: { primary: '#7b1422', secondary: '#5bc2e7' }, tier: 76 },
  { id: 'basaksehir', name: 'İstanbul Başakşehir', shortName: 'İBFK', city: 'İstanbul', colors: { primary: '#f36f21', secondary: '#16284b' }, tier: 73 },
  { id: 'adanademirspor', name: 'Adana Demirspor', shortName: 'ADS', city: 'Adana', colors: { primary: '#0a2240', secondary: '#1e73be' }, tier: 72 },
  { id: 'samsunspor', name: 'Samsunspor', shortName: 'SAM', city: 'Samsun', colors: { primary: '#d2122e', secondary: '#ffffff' }, tier: 71 },
  { id: 'antalyaspor', name: 'Antalyaspor', shortName: 'ANT', city: 'Antalya', colors: { primary: '#e30613', secondary: '#ffffff' }, tier: 70 },
  { id: 'sivasspor', name: 'Sivasspor', shortName: 'SVS', city: 'Sivas', colors: { primary: '#b1141b', secondary: '#ffffff' }, tier: 70 },
  { id: 'konyaspor', name: 'Konyaspor', shortName: 'KON', city: 'Konya', colors: { primary: '#0a6b3b', secondary: '#ffffff' }, tier: 70 },
  { id: 'alanyaspor', name: 'Alanyaspor', shortName: 'ALA', city: 'Alanya', colors: { primary: '#f57f17', secondary: '#0a6b3b' }, tier: 70 },
  { id: 'kayserispor', name: 'Kayserispor', shortName: 'KAY', city: 'Kayseri', colors: { primary: '#d2122e', secondary: '#fdb912' }, tier: 69 },
  { id: 'rizespor', name: 'Çaykur Rizespor', shortName: 'RİZ', city: 'Rize', colors: { primary: '#0a6b3b', secondary: '#1565c0' }, tier: 69 },
  { id: 'gaziantep', name: 'Gaziantep FK', shortName: 'GFK', city: 'Gaziantep', colors: { primary: '#b1141b', secondary: '#000000' }, tier: 69 },
  { id: 'kasimpasa', name: 'Kasımpaşa', shortName: 'KSM', city: 'İstanbul', colors: { primary: '#1565c0', secondary: '#ffffff' }, tier: 68 },
  { id: 'goztepe', name: 'Göztepe', shortName: 'GÖZ', city: 'İzmir', colors: { primary: '#d2122e', secondary: '#fdb912' }, tier: 68 },
];

export const clubById: Record<string, ClubMeta> = Object.fromEntries(
  clubs.map((c) => [c.id, c]),
);
