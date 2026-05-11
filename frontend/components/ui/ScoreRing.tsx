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

function getGradientId(score: number): string {
  if (score >= 70) return 'gradGreen';
  if (score >= 40) return 'gradAmber';
  return 'gradRed';
}

export function ScoreRing({ score, size = 120 }: ScoreRingProps) {
  const strokeWidth = 9;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const center = size / 2;
  const color = getStrokeColor(score);
  const gradientId = getGradientId(score);

  return (
    <div className="inline-flex flex-col items-center justify-center relative">
      {/* Soft glow halo */}
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-full blur-2xl opacity-30 pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${color} 0%, transparent 65%)`,
        }}
      />
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} className="relative">
        <defs>
          <linearGradient id="gradGreen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00E5A0" />
            <stop offset="100%" stopColor="#4F8EF7" />
          </linearGradient>
          <linearGradient id="gradAmber" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F5A623" />
            <stop offset="100%" stopColor="#F06060" />
          </linearGradient>
          <linearGradient id="gradRed" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F06060" />
            <stop offset="100%" stopColor="#A879F7" />
          </linearGradient>
        </defs>
        {/* Background ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#1A1F2C"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 1s cubic-bezier(0.22, 1, 0.36, 1)',
            filter: `drop-shadow(0 0 6px ${color}66)`,
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
            fontSize={size * 0.24}
            fontWeight="700"
            fontFamily="'JetBrains Mono', monospace"
            fill="#E8EAF0"
            dy="-0.08em"
          >
            {score}
          </tspan>
          <tspan
            fontSize={size * 0.13}
            fontFamily="'JetBrains Mono', monospace"
            fill="#8891AA"
            dy="0.08em"
          >
            %
          </tspan>
        </text>
      </svg>
    </div>
  );
}
