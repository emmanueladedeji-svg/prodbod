import { useRef, useState } from 'react';
import {
  DndContext, DragEndEvent, DragOverEvent, DragOverlay,
  PointerSensor, useSensor, useSensors, closestCenter,
} from '@dnd-kit/core';
import { Feature, useUpdateWorkspaceFeature } from '@/hooks/useWorkspaceFeatures';
import { ProductStatus } from '@/types/productStatus';
import { StatusGroup } from './StatusGroup';
import { ProdbodMember } from '@/hooks/useProdbodMembers';

interface ListViewProps {
  features: Feature[];
  listId: string;
  productId: string;
  orgId: string;
  onOpenDetail: (f: Feature) => void;
  onAssign: (featureId: string) => void;
  members: ProdbodMember[];
  productStatuses: ProductStatus[];
  progressEnabled?: boolean;
  sprints?: any[];
}

export function ListView({
  features, listId, productId, orgId, onOpenDetail, onAssign, members, productStatuses, progressEnabled, sprints,
}: ListViewProps) {
  const updateFeature = useUpdateWorkspaceFeature();

  // Optimistic overrides: featureId → new statusId before server round-trip
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({});
  const [arrivingFeatureId, setArrivingFeatureId] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [overStatusId, setOverStatusId] = useState<string | null>(null);
  const arrivingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Called from FeatureRow when user clicks status dot and picks new status
  const handleStatusChange = (featureId: string, newStatusId: string) => {
    setStatusOverrides(prev => ({ ...prev, [featureId]: newStatusId }));
    if (arrivingTimer.current) clearTimeout(arrivingTimer.current);
    setArrivingFeatureId(featureId);
    arrivingTimer.current = setTimeout(() => setArrivingFeatureId(null), 1200);
  };

  const effectiveStatusId = (feature: Feature) =>
    statusOverrides[feature.id] ?? feature.status_id ?? null;

  const featuresByStatus = (statusId: string) =>
    features.filter(f => effectiveStatusId(f) === statusId && f.parent_id === null && f.level === 'feature');

  // Sort statuses: not_started → active → done → closed
  const orderedStatuses = [...productStatuses].sort((a, b) => {
    const catOrder = ['not_started', 'active', 'done', 'closed'];
    const catDiff = catOrder.indexOf(a.category) - catOrder.indexOf(b.category);
    if (catDiff !== 0) return catDiff;
    return a.position - b.position;
  });

  // DnD handlers for list view cross-group drag
  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over) { setOverStatusId(null); return; }
    // over.id could be a status group id or a feature id
    const overStatusGroup = productStatuses.find(s => s.id === over.id);
    if (overStatusGroup) {
      setOverStatusId(overStatusGroup.id);
    } else {
      // Hovering over a feature row — find which status group it belongs to
      const overFeature = features.find(f => f.id === over.id);
      if (overFeature) {
        setOverStatusId(effectiveStatusId(overFeature));
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    setOverStatusId(null);
    if (!over) return;

    const draggedFeatureId = active.id as string;
    const draggedFeature = features.find(f => f.id === draggedFeatureId);
    if (!draggedFeature) return;

    // Determine destination status
    let destStatusId: string | null = null;
    const overStatusGroup = productStatuses.find(s => s.id === over.id);
    if (overStatusGroup) {
      destStatusId = overStatusGroup.id;
    } else {
      const overFeature = features.find(f => f.id === over.id);
      if (overFeature) destStatusId = effectiveStatusId(overFeature);
    }

    if (!destStatusId) return;
    const currentStatusId = effectiveStatusId(draggedFeature);
    if (destStatusId === currentStatusId) return; // same group — no cross-group action

    // Cross-group move: optimistic update + server action
    setStatusOverrides(prev => ({ ...prev, [draggedFeatureId]: destStatusId! }));
    if (arrivingTimer.current) clearTimeout(arrivingTimer.current);
    setArrivingFeatureId(draggedFeatureId);
    arrivingTimer.current = setTimeout(() => setArrivingFeatureId(null), 1200);

    // Fire server action (no await — optimistic already applied)
    updateFeature.mutate({ id: draggedFeatureId, status_id: destStatusId });
  };

  const activeDragFeature = activeDragId ? features.find(f => f.id === activeDragId) : null;

  if (productStatuses.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--pb-text3)' }}>
        No statuses configured for this product. 
        Please check product settings or try refreshing.
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={e => setActiveDragId(e.active.id as string)}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div style={{ overflowY: 'auto', height: '100%', fontFamily: "'DM Sans', sans-serif" }}>
        {orderedStatuses.map(s => (
          <StatusGroup
            key={s.id}
            status={s}
            features={featuresByStatus(s.id)}
            allFeatures={features}
            listId={listId}
            productId={productId}
            orgId={orgId}
            onOpenDetail={onOpenDetail}
            onAssign={onAssign}
            members={members}
            productStatuses={productStatuses}
            arrivingFeatureId={arrivingFeatureId}
            progressEnabled={progressEnabled}
            isDropTarget={overStatusId === s.id && activeDragId !== null}
            dropTargetColor={s.color}
            sprints={sprints}
            onStatusChange={handleStatusChange}
          />
        ))}

        {features.length === 0 && (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--pb-text3)', fontSize: 13 }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>📋</div>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>No features yet</div>
            <div>Add your first feature using the + Feature button above</div>
          </div>
        )}
      </div>

      <DragOverlay>
        {activeDragFeature ? (
          <div style={{
            background: 'var(--pb-bg2)', border: '1px solid var(--pb-border2)',
            borderRadius: 6, padding: '8px 16px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: 'var(--pb-text)',
            opacity: 0.9, cursor: 'grabbing',
          }}>
            {activeDragFeature.title}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
