interface ProgressRingProps {
  percentage: number;   // 0–100
  size?: number;        // px (default 20)
  strokeWidth?: number; // px (default 2.5)
  color?: string;       // hex or CSS color
}

export function ProgressRing({ percentage, size = 20, strokeWidth = 2.5, color = '#8b5cf6' }: ProgressRingProps) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.max(0, Math.min(1, percentage / 100)) * circ;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ flexShrink: 0, transform: 'rotate(-90deg)' }}
      aria-label={`${percentage}% complete`}
    >
      {/* Background track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--pb-border2)"
        strokeWidth={strokeWidth}
      />
      {/* Progress arc */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        style={{ transition: 'stroke-dasharray 300ms ease' }}
      />
    </svg>
  );
}
