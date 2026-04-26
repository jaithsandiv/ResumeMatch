interface LogoProps {
  size?: number;
  className?: string;
}

/**
 * ResumeMatch geometric "R" mark — inline SVG so the transparent counter
 * shows through correctly on any background colour.
 *
 * Shape breakdown (100×100 viewBox):
 *  - Left stem  : full-height rectangle (x 0-33)
 *  - Bowl       : D-shape right half (x 33-100, y 0-57) with evenodd hole
 *  - Knuckle    : concave quarter-circle bridging bowl bottom to leg top
 *  - Leg        : bottom-right horizontal bar (x 50-100, y 75-100)
 */
export function Logo({ size = 32, className }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      aria-label="ResumeMatch logo"
      fill="#00E5A0"
    >
      {/* Stem */}
      <rect x="0" y="0" width="33" height="100" />

      {/* Bowl: outer D minus inner counter (evenodd = transparent hole) */}
      <path
        fillRule="evenodd"
        d={[
          'M 33,0 H 100 A 67,50 0 0,1 33,57 Z',
          'M 33,10 H 70 A 37,27 0 0,1 33,47 Z',
        ].join(' ')}
      />

      {/* Knuckle: concave quarter-circle at crotch of R */}
      <path d="M 33,57 L 33,75 A 17,17 0 0,0 50,57 Z" />

      {/* Leg */}
      <rect x="50" y="75" width="50" height="25" />
    </svg>
  );
}
