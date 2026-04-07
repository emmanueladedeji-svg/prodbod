import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { StatusCategory, CATEGORY_LABELS } from '@/types/productStatus';
import { StatusRow, LocalStatus } from './StatusRow';

const CATEGORY_COLORS: Record<StatusCategory, string> = {
  not_started: '#9a9a94',
  active: '#2563eb',
  done: '#16a34a',
  closed: '#0f766e',
};

const CATEGORY_TOOLTIPS: Record<StatusCategory, string> = {
  not_started: "Work that hasn't been started yet. Counts 0% toward progress.",
  active: 'Work currently in progress.',
  done: 'Completed work. Counts 100% toward progress.',
  closed: 'Terminal state. Every product has exactly one Closed status. Cannot be dragged or deleted.',
};

const DEFAULT_COLORS = ['#8b5cf6', '#2563eb', '#16a34a', '#d97706', '#0891b2', '#dc2626', '#e11d48'];

interface StatusCategorySectionProps {
  category: StatusCategory;
  statuses: LocalStatus[];
  isBlockedDrop?: boolean;
  onAdd: (category: StatusCategory, name: string) => void;
  onUpdate: (id: string, changes: Partial<LocalStatus>) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
}

export function StatusCategorySection({
  category, statuses, isBlockedDrop, onAdd, onUpdate, onDelete, onSetDefault,
}: StatusCategorySectionProps) {
  const [addingName, setAddingName] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);

  const { setNodeRef, isOver } = useDroppable({
    id: `cat-${category}`,
    data: { category },
  });

  const isClosedCat = category === 'closed';
  const catColor = CATEGORY_COLORS[category];

  const handleAddCommit = () => {
    const trimmed = addingName.trim();
    if (!trimmed) { setShowAddInput(false); return; }
    onAdd(category, trimmed);
    setAddingName('');
    setShowAddInput(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        marginBottom: 20,
        borderRadius: 8,
        border: isBlockedDrop
          ? '2px solid #fecaca'
          : isOver && !isClosedCat
          ? `2px solid ${catColor}`
          : '2px solid transparent',
        background: isBlockedDrop
          ? '#fef2f2'
          : isOver && !isClosedCat
          ? catColor + '08'
          : 'transparent',
        padding: '0 0 4px',
        transition: 'all .15s',
      }}
    >
      {/* Category header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 4px', marginBottom: 8,
      }}>
        <span style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.07em',
          textTransform: 'uppercase', color: catColor,
          fontFamily: "'Syne', sans-serif",
        }}>
          {CATEGORY_LABELS[category]}
        </span>
        <span
          title={CATEGORY_TOOLTIPS[category]}
          style={{
            width: 14, height: 14, borderRadius: '50%',
            background: 'var(--pb-bg3)', border: '1px solid var(--pb-border2)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, color: 'var(--pb-text3)', cursor: 'help', flexShrink: 0,
          }}
        >
          ?
        </span>
        {isBlockedDrop && (
          <span style={{ fontSize: 11, color: '#dc2626', marginLeft: 4 }}>
            Cannot add to Closed
          </span>
        )}
      </div>

      {/* Status rows */}
      <SortableContext
        items={statuses.map(s => s.id)}
        strategy={verticalListSortingStrategy}
      >
        {statuses.map(s => (
          <StatusRow
            key={s.id}
            status={s}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onSetDefault={onSetDefault}
          />
        ))}
      </SortableContext>

      {/* Add status row — not for Closed */}
      {!isClosedCat && (
        showAddInput ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', marginTop: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: DEFAULT_COLORS[statuses.length % DEFAULT_COLORS.length], flexShrink: 0 }} />
            <input
              autoFocus
              value={addingName}
              onChange={e => setAddingName(e.target.value)}
              onBlur={handleAddCommit}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAddCommit();
                if (e.key === 'Escape') { setAddingName(''); setShowAddInput(false); }
              }}
              placeholder="Status name…"
              style={{
                flex: 1, border: 'none', outline: 'none', background: 'transparent',
                fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: 'var(--pb-text)',
                borderBottom: '1px solid var(--pb-accent-alt)', padding: '2px',
              }}
            />
          </div>
        ) : (
          <div
            onClick={() => setShowAddInput(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 12px', marginTop: 4, borderRadius: 6,
              border: '1px dashed var(--pb-border2)', cursor: 'pointer',
              fontSize: 12.5, color: 'var(--pb-text3)', transition: 'all .12s',
              fontFamily: "'DM Sans', sans-serif",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = catColor; e.currentTarget.style.color = catColor; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--pb-border2)'; e.currentTarget.style.color = 'var(--pb-text3)'; }}
          >
            + Add status
          </div>
        )
      )}
    </div>
  );
}
