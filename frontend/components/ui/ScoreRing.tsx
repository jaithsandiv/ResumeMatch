'use client';

interface ScoreRingProps {
  score: number;
  size?: number;
}

function getStrokeColor(score: number): string {
  if (score >= 70) return '#00E5A0';
  if (score >= 40) return '#F5A623';
  return '#F06060';
}

export function ScoreRing({ score, size = 120 }: ScoreRingProps) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const center = size / 2;

  return (
    <div className="inline-flex flex-col items-center justify-center">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#1C2030"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={getStrokeColor(score)}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease',
          }}
        />
        {/* Center text — counter-rotate so it reads upright */}
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ transform: `rotate(90deg)`, transformOrigin: `${center}px ${center}px` }}
        >
          <tspan
            fontSize={size * 0.22}
            fontWeight="600"
            fontFamily="'JetBrains Mono', monospace"
            fill="#E8EAF0"
            dy="-0.1em"
          >
            {score}
          </tspan>
          <tspan
            fontSize={size * 0.13}
            fontFamily="'JetBrains Mono', monospace"
            fill="#8891AA"
            dy="0.1em"
          >
            %
          </tspan>
        </text>
      </svg>
    </div>
  );
}
