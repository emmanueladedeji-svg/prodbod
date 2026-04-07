import { useEffect, useRef } from 'react';
import { STATUS_COLOR_PALETTE } from '@/types/productStatus';

interface StatusColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  onClose: () => void;
}

export function StatusColorPicker({ color, onChange, onClose }: StatusColorPickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div ref={ref} style={{
      position: 'absolute', zIndex: 70, background: 'var(--pb-bg2)',
      border: '1px solid var(--pb-border2)', borderRadius: 8,
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: 10, width: 186,
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 5 }}>
        {STATUS_COLOR_PALETTE.map(c => (
          <button
            key={c}
            onClick={() => { onChange(c); onClose(); }}
            style={{
              width: 28, height: 28, borderRadius: 6, background: c,
              border: c === color ? '2px solid var(--pb-text)' : '2px solid transparent',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'transform .1s',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.15)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {c === color && <span style={{ color: '#fff', fontSize: 12, textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
