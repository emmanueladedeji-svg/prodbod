import { useEffect, useRef } from 'react';
import { useProductStatuses } from '@/hooks/useProductStatuses';
import { ProductStatus, CATEGORY_LABELS, CATEGORY_ORDER, StatusCategory } from '@/types/productStatus';

interface StatusPickerDropdownProps {
  productId: string;
  currentStatusId: string | null;
  onSelect: (statusId: string) => void;
  onClose: () => void;
}

export function StatusPickerDropdown({ productId, currentStatusId, onSelect, onClose }: StatusPickerDropdownProps) {
  const { data: statuses = [] } = useProductStatuses(productId);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const keyHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, [onClose]);

  // Group by category
  const grouped = CATEGORY_ORDER.reduce((acc, cat) => {
    acc[cat] = statuses.filter(s => s.category === cat);
    return acc;
  }, {} as Record<StatusCategory, ProductStatus[]>);

  return (
    <div ref={ref} style={{
      position: 'absolute', top: '100%', left: 0, zIndex: 60,
      background: 'var(--pb-bg2)', border: '1px solid var(--pb-border2)',
      borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
      width: 200, overflow: 'hidden', fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ padding: '6px 12px 4px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--pb-text3)', fontFamily: "'Syne', sans-serif" }}>
        Change status
      </div>
      {CATEGORY_ORDER.map(cat => {
        const items = grouped[cat] || [];
        if (items.length === 0) return null;
        return (
          <div key={cat}>
            <div style={{ padding: '4px 12px 2px', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--pb-text3)', fontFamily: "'Syne', sans-serif" }}>
              {CATEGORY_LABELS[cat]}
            </div>
            {items.map(status => (
              <div
                key={status.id}
                onClick={() => { onSelect(status.id); onClose(); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
                  cursor: 'pointer', fontSize: 13, color: 'var(--pb-text)',
                  background: status.id === currentStatusId ? 'var(--pb-bg3)' : 'transparent',
                  transition: 'background .1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--pb-bg3)')}
                onMouseLeave={e => (e.currentTarget.style.background = status.id === currentStatusId ? 'var(--pb-bg3)' : 'transparent')}
              >
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: status.color, flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{status.name}</span>
                {status.id === currentStatusId && <span style={{ color: 'var(--pb-text3)', fontSize: 12 }}>✓</span>}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
