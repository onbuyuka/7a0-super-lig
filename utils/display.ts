import type { Edition } from '@/types';
import { clubById, type ClubMeta } from '@/data/clubs';
import { editionById } from '@/data/editions';

export function clubOf(clubId: string): ClubMeta | undefined {
  return clubById[clubId];
}

export function editionOf(editionId: string): Edition | undefined {
  return editionById[editionId];
}

/** Short year tag, e.g. "'14" or "'24". */
export function editionTag(edition: Edition): string {
  return `'${String(edition.year).slice(-2)}`;
}

/** Display label for a club+year combo, e.g. "Galatasaray '14". */
export function comboLabel(clubId: string, editionId: string): string {
  const club = clubById[clubId];
  const edition = editionById[editionId];
  return `${club?.name ?? clubId}${edition ? ` ${editionTag(edition)}` : ''}`;
}

