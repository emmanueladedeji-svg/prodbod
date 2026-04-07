import { STATUSES, StatusKey } from '@/constants/statuses';

interface StatusBadgeProps {
  status: StatusKey;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const s = STATUSES.find(st => st.key === status);
  if (!s) return null;

  const fontSize = size === 'sm' ? 11 : 12;
  const padding = size === 'sm' ? '2px 7px' : '3px 9px';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding,
        borderRadius: 20,
        fontSize,
        fontWeight: 500,
        background: s.bgColor,
        color: s.color,
        whiteSpace: 'nowrap',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dotColor, flexShrink: 0 }} />
      {s.label}
    </span>
  );
}
