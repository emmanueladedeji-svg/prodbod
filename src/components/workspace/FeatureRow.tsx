import { useState, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Feature, useUpdateWorkspaceFeature } from '@/hooks/useWorkspaceFeatures';
import { PRIORITY_CONFIG } from '@/constants/statuses';
import { ProductStatus } from '@/types/productStatus';
import { InlineAddRow } from './InlineAddRow';
import { StatusPickerDropdown } from './StatusPickerDropdown';
import { ProgressRing } from './ProgressRing';
import { calculateProgress } from '@/utils/statusHelpers';
import { ProdbodMember } from '@/hooks/useProdbodMembers';

function fmtDate(d: string | null) {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  } catch {
    return null;
  }
}

function avatarColor(s: string) {
  const c = ['#3d6cff', '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626', '#be185d'];
  let h = 0;
  for (const ch of (s || '')) h = (h * 31 + ch.charCodeAt(0)) % c.length;
  return c[h];
}

type AnimState = 'idle' | 'flashing' | 'collapsing' | 'done';

interface FeatureRowProps {
  feature: Feature;
  childFeatures: Feature[];
  allFeatures: Feature[];
  nestLevel: number;
  listId: string;
  productId: string;
  orgId: string;
  onOpenDetail: (f: Feature) => void;
  onAssign: (featureId: string) => void;
  members: ProdbodMember[];
  productStatuses: ProductStatus[];
  onStatusChange: (featureId: string, newStatusId: string) => void;
  isArriving?: boolean;
  progressEnabled?: boolean;
  sprints?: any[];
}

export function FeatureRow({
  feature, childFeatures, allFeatures, nestLevel, listId, productId, orgId,
  onOpenDetail, onAssign, members, productStatuses, onStatusChange, isArriving, progressEnabled, sprints,
}: FeatureRowProps) {
  const [expanded, setExpanded] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [showAddChild, setShowAddChild] = useState(false);
  const [addChildType, setAddChildType] = useState<'sub_feature' | 'task'>('sub_feature');
  const [statusPickerOpen, setStatusPickerOpen] = useState(false);
  const [animState, setAnimState] = useState<AnimState>('idle');
  const [pendingColor, setPendingColor] = useState<string | null>(null);
  const dotRef = useRef<HTMLButtonElement>(null);
  const updateFeature = useUpdateWorkspaceFeature();

  // Sortable for list-view DnD (only top-level features are sortable)
  const { attributes, listeners, setNodeRef: setSortableRef, transform, transition, isDragging } = useSortable({
    id: feature.id,
    disabled: nestLevel > 0, // only L1 features are draggable
  });

  const indent = nestLevel * 24;
  const statusInfo = productStatuses.find(s => s.id === feature.status_id);
  const statusColor = statusInfo?.color ?? '#9a9a94';
  const priorityInfo = PRIORITY_CONFIG[feature.priority];
  const hasChildren = childFeatures.length > 0;

  const assignee = feature.assignee_id
    ? members.find(m => m.member_user_id === feature.assignee_id)
    : null;
  const assigneeInitials = assignee
    ? (assignee.profile
      ? ((assignee.profile.first_name?.[0] || '') + (assignee.profile.last_name?.[0] || '')).toUpperCase() || '?'
      : (assignee.name || '?').substring(0, 2).toUpperCase())
    : null;
  const assigneeColor = assignee ? avatarColor(assignee.name || assignee.email || '') : '#9a9a94';

  const dueDateStr = fmtDate(feature.due_date);
  const isOverdue = feature.due_date && new Date(feature.due_date) < new Date();

  const childsByParent = (parentId: string) =>
    allFeatures.filter(f => f.parent_id === parentId);

  const handleStatusChange = (newStatusId: string) => {
    if (newStatusId === feature.status_id) return;
    const newStatus = productStatuses.find(s => s.id === newStatusId);
    setPendingColor(newStatus?.color ?? null);
    setAnimState('flashing');
    setStatusPickerOpen(false);

    setTimeout(() => setAnimState('collapsing'), 300);
    setTimeout(() => {
      onStatusChange(feature.id, newStatusId);
      setAnimState('idle');
      setPendingColor(null);
      updateFeature.mutate({ id: feature.id, status_id: newStatusId });
    }, 500);
  };

  // Determine row class based on animation state
  let rowClass = '';
  if (animState === 'flashing') rowClass = 'status-changing';
  else if (animState === 'collapsing') rowClass = 'status-collapsing';
  else if (isArriving) rowClass = 'status-arriving';

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    paddingLeft: 16 + indent,
    minHeight: 36,
    borderBottom: '1px solid var(--pb-border)',
    cursor: 'default',
    background: isDragging ? 'var(--pb-bg3)' : hovered ? 'var(--pb-bg3)' : 'transparent',
    transition: 'background .1s',
    gap: 0,
    position: 'relative',
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  if (animState === 'flashing' && pendingColor) {
    (rowStyle as any)['--flash-color'] = pendingColor + '26';
  }
  if (isArriving && statusColor) {
    (rowStyle as any)['--arriving-status-color'] = statusColor;
  }

  return (
    <>
      <div
        ref={setSortableRef}
        className={rowClass}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={rowStyle}
        {...(nestLevel === 0 ? attributes : {})}
      >
        {/* Drag handle — only for L1 features */}
        {nestLevel === 0 && (
          <div
            {...listeners}
            style={{
              width: 10, flexShrink: 0, cursor: 'grab', color: 'var(--pb-text3)',
              fontSize: 11, opacity: hovered ? 0.8 : 0,
              transition: 'opacity .1s', display: 'flex', alignItems: 'center',
              marginRight: 2,
            }}
            title="Drag to reorder"
          >
            ⠿
          </div>
        )}

        {/* Expand/collapse */}
        <div style={{ width: 20, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          {hasChildren ? (
            <ChevronRight
              size={12}
              onClick={() => setExpanded(e => !e)}
              style={{
                cursor: 'pointer',
                transition: 'transform .15s',
                transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
                color: 'var(--pb-text3)',
              }}
            />
          ) : (
            <div style={{ width: 12 }} />
          )}
        </div>

        {/* Status dot — clickable */}
        <div style={{ position: 'relative', flexShrink: 0, marginRight: 8 }}>
          <button
            ref={dotRef}
            onClick={(e) => { e.stopPropagation(); setStatusPickerOpen(p => !p); }}
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: statusColor,
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              display: 'block',
              transition: 'transform .1s, box-shadow .1s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.3)';
              e.currentTarget.style.boxShadow = `0 0 0 2px ${statusColor}33`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            title={statusInfo?.name ?? 'Change status'}
          />
          {statusPickerOpen && (
            <StatusPickerDropdown
              productId={productId}
              currentStatusId={feature.status_id}
              onSelect={handleStatusChange}
              onClose={() => setStatusPickerOpen(false)}
            />
          )}
        </div>

        {/* Progress ring — only for top-level features when enabled */}
        {progressEnabled && feature.level === 'feature' && nestLevel === 0 && (() => {
          const pct = calculateProgress(feature.id, allFeatures, productStatuses);
          return (
            <div style={{ marginRight: 6, flexShrink: 0 }} title={`${pct}% complete`}>
              <ProgressRing percentage={pct} size={16} strokeWidth={2} color={statusColor} />
            </div>
          );
        })()}

        {/* Title */}
        <div
          onClick={() => onOpenDetail(feature)}
          style={{
            flex: 1,
            fontSize: 13,
            color: 'var(--pb-text)',
            cursor: 'pointer',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            paddingRight: 8,
            fontFamily: "'DM Sans', sans-serif",
          }}
          title={feature.title}
        >
          {feature.title}
        </div>

        {/* Hover actions */}
        {hovered && feature.level !== 'task' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginRight: 8, flexShrink: 0 }}>
            {feature.level === 'feature' && (
              <button
                onClick={() => { setAddChildType('sub_feature'); setShowAddChild(true); }}
                style={{
                  fontSize: 11, padding: '2px 6px', borderRadius: 4, border: '1px solid var(--pb-border)',
                  background: 'var(--pb-bg2)', cursor: 'pointer', color: 'var(--pb-text3)',
                  whiteSpace: 'nowrap', fontFamily: "'DM Sans', sans-serif",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--pb-text)'; e.currentTarget.style.borderColor = 'var(--pb-border2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--pb-text3)'; e.currentTarget.style.borderColor = 'var(--pb-border)'; }}
              >
                + Sub-feature
              </button>
            )}
            {(feature.level === 'feature' || feature.level === 'sub_feature') && (
              <button
                onClick={() => { setAddChildType('task'); setShowAddChild(true); }}
                style={{
                  fontSize: 11, padding: '2px 6px', borderRadius: 4, border: '1px solid var(--pb-border)',
                  background: 'var(--pb-bg2)', cursor: 'pointer', color: 'var(--pb-text3)',
                  whiteSpace: 'nowrap', fontFamily: "'DM Sans', sans-serif",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--pb-text)'; e.currentTarget.style.borderColor = 'var(--pb-border2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--pb-text3)'; e.currentTarget.style.borderColor = 'var(--pb-border)'; }}
              >
                + Task
              </button>
            )}
          </div>
        )}

        {/* Assignee (90px) */}
        <div 
          onClick={(e) => { e.stopPropagation(); onAssign(feature.id); }}
          style={{ 
            width: 90, flexShrink: 0, display: 'flex', alignItems: 'center', 
            justifyContent: 'flex-start', cursor: 'pointer', transition: 'opacity .1s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          {assigneeInitials ? (
            <div
              title={assignee?.name || assignee?.email || ''}
              style={{
                width: 22, height: 22, borderRadius: '50%',
                background: assigneeColor, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 9, fontWeight: 700,
                color: '#fff', fontFamily: "'Syne', sans-serif",
              }}
            >
              {assigneeInitials}
            </div>
          ) : (
            <span style={{ 
              fontSize: 12, color: 'var(--pb-text3)', width: 22, height: 22, 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '50%', border: '1px dashed var(--pb-border)',
            }}>
              +
            </span>
          )}
        </div>

        {/* Due Date (100px) */}
        <div style={{ width: 100, flexShrink: 0, fontSize: 12, color: isOverdue ? 'var(--pb-red)' : 'var(--pb-text3)' }}>
          {dueDateStr || '—'}
        </div>

        {/* Priority (80px) */}
        <div style={{ width: 80, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
          {feature.priority !== 'none' ? (
            <>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: priorityInfo.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: priorityInfo.color }}>{priorityInfo.label}</span>
            </>
          ) : (
            <span style={{ fontSize: 12, color: 'var(--pb-text3)' }}>—</span>
          )}
        </div>

        {/* Sprint (100px) */}
        <div style={{ width: 100, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          {feature.sprint_id && sprints ? (
            <span style={{ fontSize: 11, background: 'var(--pb-gold-bg)', color: 'var(--pb-gold-600)', border: '1px solid var(--pb-gold-200)', borderRadius: 4, padding: '2px 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 90 }}>
              {sprints.find((s: any) => s.id === feature.sprint_id)?.name || 'Sprint'}
            </span>
          ) : (
            <span style={{ fontSize: 11, background: '#f5f5f5', color: '#a3a3a3', border: '1px dashed #d4d4d4', borderRadius: 4, padding: '2px 6px' }}>
              No Sprint
            </span>
          )}
        </div>

        {/* Sprint Points (60px) */}
        <div style={{ width: 60, flexShrink: 0, fontSize: 12, color: 'var(--pb-text2)', textAlign: 'right' }}>
          {(feature as any).story_points ? `${(feature as any).story_points} pts` : '—'}
        </div>
      </div>

      {/* Inline add child row */}
      {showAddChild && (
        <InlineAddRow
          listId={listId}
          productId={productId}
          orgId={orgId}
          defaultStatusId={feature.status_id ?? ''}
          level={addChildType}
          parentId={feature.id}
          position={childFeatures.length}
          indentPx={indent + 24}
          onDone={() => setShowAddChild(false)}
          onCancel={() => setShowAddChild(false)}
        />
      )}

      {/* Children */}
      {expanded && childFeatures.map(child => (
        <FeatureRow
          key={child.id}
          feature={child}
          childFeatures={childsByParent(child.id)}
          allFeatures={allFeatures}
          nestLevel={nestLevel + 1}
          listId={listId}
          productId={productId}
          orgId={orgId}
          onOpenDetail={onOpenDetail}
          onAssign={onAssign}
          members={members}
          productStatuses={productStatuses}
          onStatusChange={onStatusChange}
          progressEnabled={progressEnabled}
          sprints={sprints}
        />
      ))}
    </>
  );
}
