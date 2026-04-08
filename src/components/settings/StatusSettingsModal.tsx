import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  DndContext, DragEndEvent, DragOverEvent, PointerSensor,
  useSensor, useSensors, DragOverlay, closestCenter,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Loader2, X } from 'lucide-react';
import { useProductStatuses, useCreateProductStatus, useUpdateProductStatus, useDeleteProductStatus, useSaveStatusTemplate, useStatusTemplates } from '@/hooks/useProductStatuses';
import { useUpdateProductSettings } from '@/hooks/useProdbodProducts';
import { CATEGORY_ORDER, StatusCategory } from '@/types/productStatus';
import { StatusCategorySection } from './StatusCategorySection';
import { LocalStatus } from './StatusRow';
import { SaveTemplateDialog } from './SaveTemplateDialog';

interface StatusSettingsModalProps {
  productId: string;
  orgId: string;
  onClose: () => void;
}

let tempIdCounter = 0;
const newTempId = () => `new-${++tempIdCounter}`;

export function StatusSettingsModal({ productId, orgId, onClose }: StatusSettingsModalProps) {
  const { data: serverStatuses = [] } = useProductStatuses(productId);
  const { data: templates = [] } = useStatusTemplates(orgId);
  const createStatus = useCreateProductStatus();
  const updateStatus = useUpdateProductStatus();
  const deleteStatus = useDeleteProductStatus();
  const updateProductSettings = useUpdateProductSettings();

  const [localStatuses, setLocalStatuses] = useState<LocalStatus[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [blockedCategory, setBlockedCategory] = useState<StatusCategory | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  // Hydrate local state from server once
  useEffect(() => {
    if (serverStatuses.length > 0 && !hydrated) {
      setLocalStatuses(serverStatuses.map(s => ({ ...s })));
      setHydrated(true);
    }
  }, [serverStatuses, hydrated]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const getByCategory = (cat: StatusCategory) =>
    localStatuses.filter(s => s.category === cat && !s.isDeleted).sort((a, b) => a.position - b.position);

  const handleAdd = (category: StatusCategory, name: string) => {
    const catStatuses = getByCategory(category);
    const colors = ['#8b5cf6', '#2563eb', '#16a34a', '#d97706', '#0891b2', '#dc2626', '#e11d48'];
    const color = colors[catStatuses.length % colors.length];
    setLocalStatuses(prev => [...prev, {
      id: newTempId(), name, color, category,
      position: catStatuses.length, is_default: false, is_closed: false, isNew: true,
    }]);
  };

  const handleUpdate = (id: string, changes: Partial<LocalStatus>) => {
    setLocalStatuses(prev => prev.map(s => s.id === id ? { ...s, ...changes } : s));
  };

  const handleDelete = (id: string) => {
    // Mark as deleted (applied on "Apply changes")
    setLocalStatuses(prev => prev.map(s => s.id === id ? { ...s, isDeleted: true } : s));
  };

  const handleSetDefault = (id: string) => {
    setLocalStatuses(prev => prev.map(s => ({ ...s, is_default: s.id === id })));
  };

  const handleApplyTemplate = (templateId: string) => {
    const template = (templates as any[]).find((t: any) => t.id === templateId);
    if (!template) return;
    const templateStatuses: any[] = template.statuses || [];
    // Keep closed status, replace everything else with template
    const closedStatus = localStatuses.find(s => s.is_closed);
    const newStatuses: LocalStatus[] = templateStatuses.map((s: any, i: number) => ({
      id: newTempId(), name: s.name, color: s.color,
      category: s.category, position: i, is_default: s.is_default || i === 0,
      is_closed: false, isNew: true,
    }));
    if (closedStatus) {
      setLocalStatuses([...newStatuses, { ...closedStatus }]);
    } else {
      setLocalStatuses(newStatuses);
    }
    setSelectedTemplateId(templateId);
  };

  // DnD: drag over — detect blocked drops
  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over) { setBlockedCategory(null); return; }
    const targetCat = over.data.current?.category as StatusCategory | undefined;
    const overContainerId = over.id as string;
    // Determine target category from container id like "cat-closed"
    const catFromContainer = overContainerId.startsWith('cat-')
      ? overContainerId.replace('cat-', '') as StatusCategory
      : null;
    const resolvedCat = targetCat ?? catFromContainer;
    setBlockedCategory(resolvedCat === 'closed' ? 'closed' : null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setBlockedCategory(null);
    setActiveDragId(null);
    if (!over) return;

    const draggedId = active.id as string;
    const dragged = localStatuses.find(s => s.id === draggedId);
    if (!dragged || dragged.is_closed) return;

    // Determine target category
    const overId = over.id as string;
    const targetCat = overId.startsWith('cat-')
      ? overId.replace('cat-', '') as StatusCategory
      : localStatuses.find(s => s.id === overId)?.category;

    if (!targetCat || targetCat === 'closed') return;

    setLocalStatuses(prev => {
      if (targetCat === dragged.category) {
        // Same category — reorder
        const catItems = prev.filter(s => s.category === targetCat && !s.isDeleted).sort((a, b) => a.position - b.position);
        const oldIndex = catItems.findIndex(s => s.id === draggedId);
        const newIndex = catItems.findIndex(s => s.id === overId);
        if (oldIndex === -1 || newIndex === -1) return prev;
        const reordered = arrayMove(catItems, oldIndex, newIndex).map((s, i) => ({ ...s, position: i }));
        return prev.map(s => {
          const updated = reordered.find(r => r.id === s.id);
          return updated ?? s;
        });
      } else {
        // Cross-category move
        const destItems = prev.filter(s => s.category === targetCat && !s.isDeleted && s.id !== draggedId).sort((a, b) => a.position - b.position);
        const newPosition = destItems.length;
        return prev.map(s => s.id === draggedId ? { ...s, category: targetCat, position: newPosition } : s);
      }
    });
  };

  const handleApplyChanges = async () => {
    setIsSaving(true);
    setSaveError('');
    try {
      const defaultStatus = localStatuses.find(s => s.is_default && !s.isDeleted);
      const defaultStatusId = defaultStatus?.id;

      // Delete removed (non-new) statuses
      const toDelete = localStatuses.filter(s => s.isDeleted && !s.isNew && !s.id.startsWith('new-'));
      for (const s of toDelete) {
        await deleteStatus.mutateAsync({
          id: s.id, productId,
          defaultStatusId: defaultStatusId ?? serverStatuses.find(ss => ss.is_default)?.id ?? '',
        });
      }

      // Insert new statuses
      const toCreate = localStatuses.filter(s => s.isNew && !s.isDeleted);
      for (const s of toCreate) {
        await createStatus.mutateAsync({
          productId, orgId, name: s.name, color: s.color,
          category: s.category as StatusCategory, position: s.position,
        });
      }

      // Update existing statuses
      const toUpdate = localStatuses.filter(s => !s.isNew && !s.isDeleted && !s.id.startsWith('new-'));
      for (const s of toUpdate) {
        const original = serverStatuses.find(ss => ss.id === s.id);
        const changed = original && (
          original.name !== s.name || original.color !== s.color ||
          original.category !== s.category || original.position !== s.position ||
          original.is_default !== s.is_default
        );
        if (changed) {
          await updateStatus.mutateAsync({
            id: s.id, productId,
            name: s.name, color: s.color, category: s.category as StatusCategory,
            position: s.position, is_default: s.is_default,
          });
        }
      }

      onClose();
    } catch (e: any) {
      setSaveError(e.message || 'Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const previewStatuses = localStatuses.filter(s => !s.isDeleted);

  return createPortal(
    <>
      <div
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div style={{
          background: 'var(--pb-bg2)', border: '1px solid var(--pb-border2)',
          borderRadius: 'var(--pb-rxl)', width: '100%', maxWidth: 720, maxHeight: '90vh',
          display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.15)',
          fontFamily: "'DM Sans', sans-serif", overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 22px', borderBottom: '1px solid var(--pb-border)',
            display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
          }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, flex: 1 }}>
              Edit statuses
            </div>
            <button
              onClick={onClose}
              style={{
                width: 28, height: 28, borderRadius: 6, border: '1px solid var(--pb-border)',
                background: 'transparent', cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: 'var(--pb-text3)',
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Body: two-panel */}
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {/* Left panel — black */}
            <div style={{
              width: 250, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.08)',
              padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20,
              background: 'var(--pb-black)',
            }}>
              {/* Template selector */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: "'Syne', sans-serif", marginBottom: 8 }}>
                  Status template
                </div>
                <select
                  value={selectedTemplateId}
                  onChange={e => handleApplyTemplate(e.target.value)}
                  style={{
                    width: '100%', padding: '9px 12px', border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 'var(--pb-r)', fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13.5, color: '#fff', background: 'rgba(255,255,255,0.08)',
                    outline: 'none', cursor: 'pointer',
                  }}
                >
                  <option value="">ProdBod Default</option>
                  {(templates as any[]).map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.35)', marginTop: 6, lineHeight: 1.5 }}>
                  Selecting a template previews it. Changes apply only when you click "Apply changes".
                </div>
              </div>

              {/* Progress icons ClickApp */}
              <div style={{
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--pb-rl)',
                padding: '12px 14px', background: 'rgba(255,255,255,0.06)',
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--pb-gold)', marginBottom: 4, fontFamily: "'Syne', sans-serif" }}>
                  Progress icons
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: 10 }}>
                  Build linear workflows with status progress icons.
                </div>
                <button
                  onClick={async () => {
                    try {
                      await updateProductSettings.mutateAsync({
                        id: productId, orgId,
                        progress_icons_enabled: true,
                      });
                    } catch {}
                  }}
                  style={{
                    padding: '6px 12px', borderRadius: 6, border: 'none',
                    background: 'var(--pb-gold)', color: 'var(--pb-black)',
                    cursor: 'pointer', fontSize: 12.5, fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Enable
                </button>
              </div>
            </div>

            {/* Right panel — status configuration */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              {saveError && (
                <div style={{
                  padding: '8px 12px', borderRadius: 6, fontSize: 12.5,
                  background: 'var(--pb-red-bg)', border: '1px solid var(--pb-red-border)',
                  color: 'var(--pb-red)', marginBottom: 12,
                }}>
                  {saveError}
                </div>
              )}

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={e => setActiveDragId(e.active.id as string)}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
              >
                {CATEGORY_ORDER.map(cat => (
                  <StatusCategorySection
                    key={cat}
                    category={cat}
                    statuses={getByCategory(cat)}
                    isBlockedDrop={blockedCategory === 'closed' && cat === 'closed' && activeDragId !== null}
                    onAdd={handleAdd}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                    onSetDefault={handleSetDefault}
                  />
                ))}

                <DragOverlay>
                  {activeDragId ? (
                    <div style={{
                      background: 'var(--pb-bg2)', border: '1px solid var(--pb-border2)',
                      borderRadius: 6, padding: '8px 12px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                      fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: 'var(--pb-text)',
                    }}>
                      {previewStatuses.find(s => s.id === activeDragId)?.name ?? '…'}
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: '12px 22px', borderTop: '1px solid var(--pb-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
          }}>
            <a
              href="#"
              style={{ fontSize: 12.5, color: 'var(--pb-text3)', textDecoration: 'none' }}
              onClick={e => e.preventDefault()}
            >
              Learn more about statuses
            </a>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                onClick={() => setShowSaveTemplate(true)}
                style={{
                  padding: '9px 16px', borderRadius: 'var(--pb-r)',
                  border: '1px solid var(--pb-border)', background: 'transparent',
                  cursor: 'pointer', fontSize: 13.5, fontFamily: "'DM Sans', sans-serif",
                  color: 'var(--pb-text2)',
                }}
              >
                Save template
              </button>
              <button
                onClick={handleApplyChanges}
                disabled={isSaving}
                style={{
                  padding: '9px 20px', borderRadius: 'var(--pb-r)', border: 'none',
                  background: 'var(--pb-accent)', color: '#fff', cursor: 'pointer',
                  fontSize: 13.5, fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
                  display: 'flex', alignItems: 'center', gap: 6,
                  opacity: isSaving ? 0.7 : 1,
                }}
              >
                {isSaving && <Loader2 size={14} className="animate-spin" />}
                Apply changes
              </button>
            </div>
          </div>
        </div>
      </div>

      {showSaveTemplate && (
        <SaveTemplateDialog
          orgId={orgId}
          statuses={previewStatuses.map(s => ({
            name: s.name, color: s.color, category: s.category,
            position: s.position, is_default: s.is_default, is_closed: s.is_closed,
          }))}
          onClose={() => setShowSaveTemplate(false)}
          onSaved={() => {}}
        />
      )}
    </>,
    document.body
  );
}
