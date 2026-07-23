import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Feature } from '@/hooks/useWorkspaceFeatures';
import { ProductStatus } from '@/types/productStatus';
import { FeatureRow } from './FeatureRow';
import { InlineAddRow } from './InlineAddRow';
import { ProdbodMember } from '@/hooks/useProdbodMembers';

interface StatusGroupProps {
  status: ProductStatus;
  features: Feature[];
  allFeatures: Feature[];
  listId: string;
  productId: string;
  orgId: string;
  onOpenDetail: (f: Feature) => void;
  onAssign: (featureId: string) => void;
  members: ProdbodMember[];
  productStatuses: ProductStatus[];
  onStatusChange: (featureId: string, newStatusId: string) => void;
  arrivingFeatureId?: string | null;
  progressEnabled?: boolean;
  isDropTarget?: boolean;
  dropTargetColor?: string;
  sprints?: any[];
}

export function StatusGroup({
  status, features, allFeatures, listId, productId, orgId, onOpenDetail, onAssign, members,
  productStatuses, onStatusChange, arrivingFeatureId, progressEnabled, isDropTarget, dropTargetColor, sprints,
}: StatusGroupProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const { setNodeRef } = useDroppable({ id: status.id });

  const l1Features = features.filter(f => f.parent_id === null && f.level === 'feature');

  const childsByParent = (parentId: string) =>
    allFeatures.filter(f => f.parent_id === parentId);

  return (
    <div
      ref={setNodeRef}
      style={{
        marginBottom: 4,
        borderTop: isDropTarget ? `2px solid ${dropTargetColor ?? status.color}` : undefined,
        transition: 'border-top-color .15s',
      }}
    >
      {/* Group header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '6px 16px',
          gap: 8,
          cursor: 'pointer',
          background: isDropTarget ? (status.color + '10') : 'var(--pb-bg3)',
          borderBottom: '1px solid var(--pb-border)',
          borderTop: isDropTarget ? undefined : '1px solid var(--pb-border)',
          userSelect: 'none',
          transition: 'background .15s',
        }}
        onClick={() => setCollapsed(c => !c)}
      >
        {/* Collapse triangle */}
        <svg
          width="8" height="8" viewBox="0 0 8 8" fill="currentColor"
          style={{
            color: 'var(--pb-text3)',
            transition: 'transform .15s',
            transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
            flexShrink: 0,
          }}
        >
          <path d="M4 6L0.536 2h6.928L4 6z"/>
        </svg>

        {/* Status dot + name badge */}
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500,
          background: status.color + '20', color: status.color, whiteSpace: 'nowrap',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: status.color, flexShrink: 0 }} />
          {status.name}
        </span>

        <span style={{ fontSize: 12, color: 'var(--pb-text3)', marginLeft: 2 }}>
          {l1Features.length}
        </span>

        <div style={{ flex: 1 }} />

        {/* Add button */}
        <button
          onClick={(e) => { e.stopPropagation(); setCollapsed(false); setShowAdd(true); }}
          style={{
            fontSize: 11, padding: '2px 7px', borderRadius: 4,
            border: '1px solid var(--pb-border)', background: 'var(--pb-bg2)',
            cursor: 'pointer', color: 'var(--pb-text3)',
            fontFamily: "'DM Sans', sans-serif",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--pb-text)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--pb-text3)'; }}
        >
          + Add
        </button>
      </div>

      {!collapsed && (
        <>
          {/* Column headers */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            height: 28,
            background: 'var(--pb-bg3)',
            borderBottom: '1px solid var(--pb-border)',
          }}>
            <div style={{ width: 20, flexShrink: 0 }} />
            <div style={{ width: 10, flexShrink: 0, marginRight: 8 }} />
            <div style={{ flex: 1, fontSize: 11, color: 'var(--pb-text3)', fontFamily: "'Syne', sans-serif", letterSpacing: '.06em', textTransform: 'uppercase' }}>Name</div>
            <div style={{ width: 90, flexShrink: 0, fontSize: 11, color: 'var(--pb-text3)', fontFamily: "'Syne', sans-serif", letterSpacing: '.06em', textTransform: 'uppercase' }}>Assignee</div>
            <div style={{ width: 100, flexShrink: 0, fontSize: 11, color: 'var(--pb-text3)', fontFamily: "'Syne', sans-serif", letterSpacing: '.06em', textTransform: 'uppercase' }}>Due Date</div>
            <div style={{ width: 80, flexShrink: 0, fontSize: 11, color: 'var(--pb-text3)', fontFamily: "'Syne', sans-serif", letterSpacing: '.06em', textTransform: 'uppercase' }}>Priority</div>
            <div style={{ width: 100, flexShrink: 0, fontSize: 11, color: 'var(--pb-text3)', fontFamily: "'Syne', sans-serif", letterSpacing: '.06em', textTransform: 'uppercase' }}>Sprint</div>
            <div style={{ width: 60, flexShrink: 0, fontSize: 11, color: 'var(--pb-text3)', fontFamily: "'Syne', sans-serif", letterSpacing: '.06em', textTransform: 'uppercase', textAlign: 'right' }}>Points</div>
          </div>

          {/* Feature rows — wrapped in SortableContext for list-view DnD */}
          <SortableContext items={l1Features.map(f => f.id)} strategy={verticalListSortingStrategy}>
          {l1Features.map(feature => (
            <FeatureRow
              key={feature.id}
              feature={feature}
              childFeatures={childsByParent(feature.id)}
              allFeatures={allFeatures}
              nestLevel={0}
              listId={listId}
              productId={productId}
              orgId={orgId}
              onOpenDetail={onOpenDetail}
              onAssign={onAssign}
              members={members}
              productStatuses={productStatuses}
              onStatusChange={onStatusChange}
              isArriving={feature.id === arrivingFeatureId}
              progressEnabled={progressEnabled}
              sprints={sprints}
            />
          ))}
          </SortableContext>

          {/* Inline add */}
          {showAdd ? (
            <InlineAddRow
              listId={listId}
              productId={productId}
              orgId={orgId}
              defaultStatusId={status.id}
              level="feature"
              parentId={null}
              position={l1Features.length}
              indentPx={0}
              onDone={() => setShowAdd(false)}
              onCancel={() => setShowAdd(false)}
            />
          ) : (
            <div
              onClick={() => setShowAdd(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 16px',
                cursor: 'pointer',
                fontSize: 12.5,
                color: 'var(--pb-text3)',
                borderBottom: '1px solid var(--pb-border)',
                transition: 'background .1s',
                fontFamily: "'DM Sans', sans-serif",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--pb-bg3)'; e.currentTarget.style.color = 'var(--pb-text)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--pb-text3)'; }}
            >
              <span style={{ marginLeft: 30 }}>+ Add {status.name} feature</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
