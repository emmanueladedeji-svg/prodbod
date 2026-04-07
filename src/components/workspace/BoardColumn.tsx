import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Feature } from '@/hooks/useWorkspaceFeatures';
import { ProductStatus } from '@/types/productStatus';
import { PRIORITY_CONFIG } from '@/constants/statuses';

function fmtDate(d: string | null) {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  } catch {
    return null;
  }
}

interface FeatureCardProps {
  feature: Feature;
  onOpenDetail: (f: Feature) => void;
  statusColor?: string;
}

function FeatureCard({ feature, onOpenDetail, statusColor }: FeatureCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: feature.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    background: 'var(--pb-bg2)',
    border: '1px solid var(--pb-border)',
    borderRadius: 'var(--pb-r)',
    padding: '10px 12px',
    cursor: 'grab',
    marginBottom: 6,
    fontFamily: "'DM Sans', sans-serif",
    userSelect: 'none',
    boxShadow: isDragging ? '0 4px 16px rgba(0,0,0,0.12)' : undefined,
  };

  const dueDateStr = fmtDate(feature.due_date);
  const isOverdue = feature.due_date && new Date(feature.due_date) < new Date();
  const priority = PRIORITY_CONFIG[feature.priority];

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {/* Status indicator line */}
      {statusColor && (
        <div style={{ width: 28, height: 3, borderRadius: 2, background: statusColor, marginBottom: 8 }} />
      )}
      <div
        onClick={(e) => { e.stopPropagation(); onOpenDetail(feature); }}
        style={{ cursor: 'pointer' }}
      >
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--pb-text)', marginBottom: 8, lineHeight: 1.4 }}>
          {feature.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          {feature.priority !== 'none' && (
            <span style={{ fontSize: 11, color: priority.color, display: 'flex', alignItems: 'center', gap: 3 }}>
              <div style={{ width: 6, height: 6, borderRadius: 2, background: priority.color }} />
              {priority.label}
            </span>
          )}
          {dueDateStr && (
            <span style={{ fontSize: 11, color: isOverdue ? 'var(--pb-red)' : 'var(--pb-text3)', marginLeft: 'auto' }}>
              {dueDateStr}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

interface BoardColumnProps {
  status: ProductStatus;
  features: Feature[];
  onAddFeature: (statusId: string) => void;
  onOpenDetail: (f: Feature) => void;
}

export function BoardColumn({ status, features, onAddFeature, onOpenDetail }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status.id });

  return (
    <div
      style={{
        width: 240,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        background: isOver ? status.color + '10' : 'transparent',
        borderRadius: 'var(--pb-rl)',
        border: isOver ? `2px solid ${status.color}` : '1px solid var(--pb-border)',
        transition: 'all .15s',
      }}
    >
      {/* Column header */}
      <div style={{
        padding: '10px 12px',
        borderBottom: '1px solid var(--pb-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500,
          background: status.color + '20', color: status.color, whiteSpace: 'nowrap',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: status.color, flexShrink: 0 }} />
          {status.name}
        </span>
        <span style={{ fontSize: 12, color: 'var(--pb-text3)' }}>{features.length}</span>
      </div>

      {/* Cards */}
      <div ref={setNodeRef} style={{ flex: 1, padding: '8px 10px', overflowY: 'auto', minHeight: 80 }}>
        <SortableContext items={features.map(f => f.id)} strategy={verticalListSortingStrategy}>
          {features.map(feature => (
            <FeatureCard
              key={feature.id}
              feature={feature}
              onOpenDetail={onOpenDetail}
              statusColor={status.color}
            />
          ))}
        </SortableContext>
      </div>

      {/* Footer: add */}
      <div
        onClick={() => onAddFeature(status.id)}
        style={{
          padding: '8px 12px',
          cursor: 'pointer',
          fontSize: 12.5,
          color: 'var(--pb-text3)',
          borderTop: '1px solid var(--pb-border)',
          transition: 'background .1s',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: "'DM Sans', sans-serif",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--pb-bg3)'; e.currentTarget.style.color = 'var(--pb-text)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--pb-text3)'; }}
      >
        + Add feature
      </div>
    </div>
  );
}
