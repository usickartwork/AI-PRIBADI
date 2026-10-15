import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

/**
 * Minimalist Latin Cross with slender, contemplative proportions
 */
export function CrossIcon({ size = 20, className = '', ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M12 3v18" />
      <path d="M7 8h10" />
    </svg>
  );
}

/**
 * Radiant Star of Hope / Morning Star
 */
export function MorningStarIcon({ size = 20, className = '', ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07l14.14-14.14" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" fillOpacity="0.2" />
    </svg>
  );
}

/**
 * Open Scripture / Parchment of Truth
 */
export function OpenScriptureIcon({ size = 20, className = '', ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M2 5.5C2 4.12 3.12 3 4.5 3H10c1.5 0 2 1 2 1s.5-1 2-1h5.5C20.88 3 22 4.12 22 5.5v12c0 1.38-1.12 2.5-2.5 2.5H14c-1.5 0-2 1-2 1s-.5-1-2-1H4.5C3.12 20 2 18.88 2 17.5v-12z" />
      <path d="M12 4v16" />
      <path d="M6 7.5h3.5M6 11.5h3.5M14.5 7.5H18M14.5 11.5H18" opacity="0.6" />
    </svg>
  );
}

/**
 * Contemplative Candle / Quiet Flame of the Holy Spirit
 */
export function QuietFlameIcon({ size = 20, className = '', ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M12 2c1.5 3.5 5 7 5 11a5 5 0 1 1-10 0c0-4 3.5-7.5 5-11z" />
      <path d="M12 17a2 2 0 0 0 2-2c0-1.5-1-2.5-2-4-1 1.5-2 2.5-2 4a2 2 0 0 0 2 2z" fill="currentColor" fillOpacity="0.25" />
    </svg>
  );
}

/**
 * Olive Branch / Leaves of Healing
 */
export function OliveBranchIcon({ size = 20, className = '', ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M3 21c8-2 13-7 18-18" />
      <path d="M16 6c2 1 3 4 1 6-2 2-5 1-6-1 0-3 3-5 5-5z" />
      <path d="M9 13c2 1 3 4 1 6-2 2-5 1-6-1 0-3 3-5 5-5z" />
    </svg>
  );
}

/**
 * Hands in Quiet Reverent Prayer
 */
export function ReverentPrayerIcon({ size = 20, className = '', ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M12 3v13" />
      <path d="M8 8c1-1 3-2 4-2s3 1 4 2v10c-1 1-3 2-4 2s-3-1-4-2V8z" />
      <path d="M5 11c1-1 2-1 3 0v6c-1 1-2 1-3 0v-6z" />
      <path d="M19 11c-1-1-2-1-3 0v6c1 1 2 1 3 0v-6z" />
    </svg>
  );
}

/**
 * NFC Contactless Tap Halo
 */
export function SacredNfcIcon({ size = 20, className = '', ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M6 18a10 10 0 0 1 0-12" />
      <path d="M10 15a6 6 0 0 1 0-6" />
      <path d="M14 13a2 2 0 0 1 0-2" />
      <circle cx="18" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}
