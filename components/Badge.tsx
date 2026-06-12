import React from 'react';
import { clubById } from '@/data/clubs';

/** Pick a readable text colour (#fff or near-black) for a background hex. */
function readableOn(hex: string): string {
  const c = hex.replace('#', '');
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? '#15130f' : '#ffffff';
}

interface BadgeProps {
  clubId: string;
  size?: number;
  className?: string;
}

/** A simple two-tone club crest rendered as inline SVG (no copyrighted imagery). */
export const Badge: React.FC<BadgeProps> = ({ clubId, size = 28, className }) => {
  const club = clubById[clubId];
  const primary = club?.colors.primary ?? '#888888';
  const secondary = club?.colors.secondary ?? '#ffffff';
  const short = club?.shortName ?? '??';
  const fontSize = short.length >= 4 ? 9 : short.length === 3 ? 11 : 13;

  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={club?.name ?? clubId}
    >
      <circle cx="20" cy="20" r="18.5" fill={primary} stroke={secondary} strokeWidth="2.5" />
      <text
        x="20"
        y="20"
        dominantBaseline="central"
        textAnchor="middle"
        fontSize={fontSize}
        fontWeight="800"
        fontFamily="Oswald, sans-serif"
        fill={readableOn(primary)}
      >
        {short}
      </text>
    </svg>
  );
};
