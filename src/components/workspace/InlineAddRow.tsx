import { useEffect, useRef, useState } from 'react';
import { useCreateWorkspaceFeature } from '@/hooks/useWorkspaceFeatures';
import { ItemLevel } from '@/constants/statuses';

interface InlineAddRowProps {
  listId: string;
  productId: string;
  orgId: string;
  defaultStatusId: string;
  level: ItemLevel;
  parentId?: string | null;
  position: number;
  indentPx?: number;
  onDone: () => void;
  onCancel: () => void;
}

export function InlineAddRow({
  listId, productId, orgId, defaultStatusId, level, parentId, position, indentPx = 0, onDone, onCancel,
}: InlineAddRowProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const createFeature = useCreateWorkspaceFeature();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!value.trim()) return;
      try {
        await createFeature.mutateAsync({
          title: value.trim(),
          listId,
          productId,
          orgId,
          parentId: parentId ?? null,
          level,
          statusId: defaultStatusId || undefined,
          position,
        });
        setValue('');
        onDone();
      } catch (err) {
        console.error('Failed to create feature:', err);
      }
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '5px 16px',
        paddingLeft: 16 + indentPx,
        gap: 8,
      }}
    >
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--pb-border2)', flexShrink: 0 }} />
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => { if (!value.trim()) onCancel(); }}
        placeholder={level === 'feature' ? 'Feature name…' : level === 'sub_feature' ? 'Sub-feature name…' : 'Task name…'}
        disabled={createFeature.isPending}
        style={{
          flex: 1,
          border: 'none',
          outline: 'none',
          fontSize: 13,
          fontFamily: "'DM Sans', sans-serif",
          background: 'transparent',
          color: 'var(--pb-text)',
          padding: '3px 0',
        }}
      />
      <span style={{ fontSize: 11, color: 'var(--pb-text3)' }}>Enter to save · Esc to cancel</span>
    </div>
  );
}
