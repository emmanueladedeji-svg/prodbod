import { useState } from 'react';
import { DndContext, DragEndEvent, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Feature, useUpdateWorkspaceFeature } from '@/hooks/useWorkspaceFeatures';
import { ProductStatus } from '@/types/productStatus';
import { BoardColumn } from './BoardColumn';
import { InlineAddRow } from './InlineAddRow';

interface BoardViewProps {
  features: Feature[];
  listId: string;
  productId: string;
  orgId: string;
  onOpenDetail: (f: Feature) => void;
  productStatuses: ProductStatus[];
}

export function BoardView({ features, listId, productId, orgId, onOpenDetail, productStatuses }: BoardViewProps) {
  const updateFeature = useUpdateWorkspaceFeature();
  const [addingStatusId, setAddingStatusId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const featureId = active.id as string;
    const newStatusId = over.id as string;

    // Confirm it's a valid status column
    const isStatusColumn = productStatuses.some(s => s.id === newStatusId);
    if (!isStatusColumn) return;

    const feature = features.find(f => f.id === featureId);
    if (!feature || feature.status_id === newStatusId) return;

    try {
      await updateFeature.mutateAsync({ id: featureId, status_id: newStatusId });
    } catch (err) {
      console.error('Failed to update feature status:', err);
    }
  };

  // Only show L1 features in board (parent_id = null)
  const l1Features = features.filter(f => f.parent_id === null && f.level === 'feature');
  const featuresByStatus = (statusId: string) => l1Features.filter(f => f.status_id === statusId);

  // Sort statuses: not_started → active → done → closed
  const orderedStatuses = [...productStatuses].sort((a, b) => {
    const catOrder = ['not_started', 'active', 'done', 'closed'];
    const catDiff = catOrder.indexOf(a.category) - catOrder.indexOf(b.category);
    if (catDiff !== 0) return catDiff;
    return a.position - b.position;
  });

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div
        style={{
          display: 'flex',
          gap: 12,
          padding: '16px 20px',
          overflowX: 'auto',
          height: '100%',
          alignItems: 'flex-start',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {orderedStatuses.map(s => (
          <div key={s.id} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <BoardColumn
              status={s}
              features={featuresByStatus(s.id)}
              onAddFeature={(statusId) => setAddingStatusId(statusId)}
              onOpenDetail={onOpenDetail}
            />
            {addingStatusId === s.id && (
              <div style={{ marginTop: 4 }}>
                <InlineAddRow
                  listId={listId}
                  productId={productId}
                  orgId={orgId}
                  defaultStatusId={s.id}
                  level="feature"
                  parentId={null}
                  position={featuresByStatus(s.id).length}
                  onDone={() => setAddingStatusId(null)}
                  onCancel={() => setAddingStatusId(null)}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </DndContext>
  );
}
