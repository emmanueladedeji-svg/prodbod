import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Feature, useUpdateWorkspaceFeature } from '@/hooks/useWorkspaceFeatures';
import { STATUSES, StatusKey, PRIORITY_CONFIG, ItemPriority } from '@/constants/statuses';
import { StatusBadge } from './StatusBadge';

function fmtDateTime(d: string) {
  try {
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return d;
  }
}

interface FeatureDetailPanelProps {
  feature: Feature | null;
  allFeatures: Feature[];
  listId: string;
  productId: string;
  orgId: string;
  onClose: () => void;
  onOpenDetail: (f: Feature) => void;
}

export function FeatureDetailPanel({ feature, allFeatures, listId, productId, orgId, onClose, onOpenDetail }: FeatureDetailPanelProps) {
  const updateFeature = useUpdateWorkspaceFeature();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [descValue, setDescValue] = useState('');
  const [statusDropOpen, setStatusDropOpen] = useState(false);
  const [priorityDropOpen, setPriorityDropOpen] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (feature) {
      setTitleValue(feature.title);
      setDescValue(feature.description || '');
      setEditingTitle(false);
    }
  }, [feature?.id]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!feature) return null;

  const saveTitle = async () => {
    if (!titleValue.trim() || titleValue === feature.title) { setEditingTitle(false); return; }
    try {
      await updateFeature.mutateAsync({ id: feature.id, title: titleValue.trim() });
    } catch {}
    setEditingTitle(false);
  };

  const saveDesc = async () => {
    if (descValue === feature.description) return;
    try {
      await updateFeature.mutateAsync({ id: feature.id, description: descValue || null });
    } catch {}
  };

  const setStatus = async (status: StatusKey) => {
    setStatusDropOpen(false);
    try { await updateFeature.mutateAsync({ id: feature.id, status }); } catch {}
  };

  const setPriority = async (priority: ItemPriority) => {
    setPriorityDropOpen(false);
    try { await updateFeature.mutateAsync({ id: feature.id, priority }); } catch {}
  };

  const subItems = allFeatures.filter(f => f.parent_id === feature.id);

  const propRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid var(--pb-border)',
    gap: 12,
  };

  const propLabelStyle: React.CSSProperties = {
    width: 90,
    flexShrink: 0,
    fontSize: 12,
    color: 'var(--pb-text3)',
    fontFamily: "'Syne', sans-serif",
    letterSpacing: '.04em',
    textTransform: 'uppercase',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 49 }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          height: '100vh',
          width: 420,
          zIndex: 50,
          background: 'var(--pb-bg2)',
          borderLeft: '1px solid var(--pb-border)',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          animation: 'slideInRight 0.2s ease-out',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(420px); }
            to { transform: translateX(0); }
          }
        `}</style>

        {/* Header */}
        <div style={{
          padding: '14px 18px',
          borderBottom: '1px solid var(--pb-border)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          flexShrink: 0,
        }}>
          <div style={{ flex: 1 }}>
            {editingTitle ? (
              <input
                ref={titleInputRef}
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { setTitleValue(feature.title); setEditingTitle(false); } }}
                autoFocus
                style={{
                  width: '100%', border: 'none', outline: 'none',
                  fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15,
                  letterSpacing: '-0.02em', color: 'var(--pb-text)',
                  background: 'var(--pb-bg3)', borderRadius: 6, padding: '4px 8px',
                }}
              />
            ) : (
              <div
                onClick={() => setEditingTitle(true)}
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700,
                  fontSize: 15,
                  letterSpacing: '-0.02em',
                  color: 'var(--pb-text)',
                  cursor: 'text',
                  lineHeight: 1.4,
                  padding: '4px 0',
                }}
              >
                {feature.title}
              </div>
            )}
            <div style={{ fontSize: 11, color: 'var(--pb-text3)', marginTop: 2 }}>
              {feature.level === 'feature' ? 'Feature' : feature.level === 'sub_feature' ? 'Sub-feature' : 'Task'}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: 6,
              border: '1px solid var(--pb-border)', background: 'transparent',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--pb-text3)', flexShrink: 0,
              transition: 'all .12s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--pb-bg3)'; e.currentTarget.style.color = 'var(--pb-text)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--pb-text3)'; }}
          >
            <X size={13} />
          </button>
        </div>

        {/* Properties */}
        <div style={{ padding: '8px 18px', flexShrink: 0 }}>
          {/* Status */}
          <div style={propRowStyle}>
            <span style={propLabelStyle}>Status</span>
            <div style={{ position: 'relative' }}>
              <div
                onClick={() => setStatusDropOpen(o => !o)}
                style={{ cursor: 'pointer' }}
              >
                <StatusBadge status={feature.status} size="sm" />
              </div>
              {statusDropOpen && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, zIndex: 60,
                  background: 'var(--pb-bg2)', border: '1px solid var(--pb-border2)',
                  borderRadius: 'var(--pb-r)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                  overflow: 'hidden', minWidth: 180,
                }}>
                  {STATUSES.map(s => (
                    <div
                      key={s.key}
                      onClick={() => setStatus(s.key)}
                      style={{
                        padding: '9px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                        fontSize: 13, color: 'var(--pb-text)', transition: 'background .1s',
                        background: feature.status === s.key ? 'var(--pb-bg3)' : 'transparent',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--pb-bg3)')}
                      onMouseLeave={(e) => { if (feature.status !== s.key) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.dotColor, flexShrink: 0 }} />
                      {s.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Priority */}
          <div style={propRowStyle}>
            <span style={propLabelStyle}>Priority</span>
            <div style={{ position: 'relative' }}>
              <div
                onClick={() => setPriorityDropOpen(o => !o)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer',
                  padding: '3px 8px', borderRadius: 6, border: '1px solid var(--pb-border)',
                  background: 'var(--pb-bg3)', fontSize: 12, transition: 'all .1s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--pb-border2)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--pb-border)')}
              >
                <div style={{ width: 8, height: 8, borderRadius: 2, background: PRIORITY_CONFIG[feature.priority].color, flexShrink: 0 }} />
                <span style={{ color: PRIORITY_CONFIG[feature.priority].color }}>
                  {PRIORITY_CONFIG[feature.priority].label}
                </span>
              </div>
              {priorityDropOpen && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, zIndex: 60, marginTop: 4,
                  background: 'var(--pb-bg2)', border: '1px solid var(--pb-border2)',
                  borderRadius: 'var(--pb-r)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                  overflow: 'hidden', minWidth: 140,
                }}>
                  {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                    <div
                      key={key}
                      onClick={() => setPriority(key as ItemPriority)}
                      style={{
                        padding: '9px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                        fontSize: 13, color: config.color, transition: 'background .1s',
                        background: feature.priority === key ? 'var(--pb-bg3)' : 'transparent',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--pb-bg3)')}
                      onMouseLeave={(e) => { if (feature.priority !== key) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: config.color, flexShrink: 0 }} />
                      {config.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Due date */}
          <div style={propRowStyle}>
            <span style={propLabelStyle}>Due Date</span>
            <input
              type="date"
              defaultValue={feature.due_date || ''}
              onChange={async (e) => {
                try { await updateFeature.mutateAsync({ id: feature.id, due_date: e.target.value || null }); } catch {}
              }}
              style={{
                border: '1px solid var(--pb-border)', borderRadius: 6, padding: '4px 8px',
                fontSize: 12.5, fontFamily: "'DM Sans', sans-serif", color: 'var(--pb-text)',
                background: 'var(--pb-bg3)', outline: 'none', cursor: 'pointer',
              }}
            />
          </div>

          {/* Created */}
          <div style={propRowStyle}>
            <span style={propLabelStyle}>Created</span>
            <span style={{ fontSize: 12.5, color: 'var(--pb-text2)' }}>{fmtDateTime(feature.created_at)}</span>
          </div>
        </div>

        {/* Description */}
        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--pb-border)', flexShrink: 0 }}>
          <div style={{ fontSize: 12, color: 'var(--pb-text3)', marginBottom: 6, fontFamily: "'Syne', sans-serif", letterSpacing: '.04em', textTransform: 'uppercase' }}>Description</div>
          <textarea
            value={descValue}
            onChange={(e) => setDescValue(e.target.value)}
            onBlur={saveDesc}
            placeholder="Add a description…"
            rows={4}
            style={{
              width: '100%', border: '1px solid var(--pb-border)', borderRadius: 'var(--pb-r)',
              padding: '10px 12px', fontSize: 13, fontFamily: "'DM Sans', sans-serif",
              color: 'var(--pb-text)', background: 'var(--pb-bg)', outline: 'none',
              resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box',
              transition: 'border-color .1s',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--pb-border2)')}
            onBlurCapture={(e) => (e.currentTarget.style.borderColor = 'var(--pb-border)')}
          />
        </div>

        {/* Sub-items */}
        {subItems.length > 0 && (
          <div style={{ padding: '12px 18px', borderTop: '1px solid var(--pb-border)', flex: 1 }}>
            <div style={{ fontSize: 12, color: 'var(--pb-text3)', marginBottom: 8, fontFamily: "'Syne', sans-serif", letterSpacing: '.04em', textTransform: 'uppercase' }}>
              Sub-items ({subItems.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {subItems.map(sub => (
                <div
                  key={sub.id}
                  onClick={() => onOpenDetail(sub)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                    borderRadius: 'var(--pb-r)', cursor: 'pointer', fontSize: 13,
                    color: 'var(--pb-text)', border: '1px solid var(--pb-border)',
                    background: 'var(--pb-bg)', transition: 'background .1s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--pb-bg3)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--pb-bg)')}
                >
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: STATUSES.find(s => s.key === sub.status)?.dotColor || '#9a9a94', flexShrink: 0 }} />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub.title}</span>
                  <span style={{ fontSize: 11, color: 'var(--pb-text3)', textTransform: 'capitalize', flexShrink: 0 }}>{sub.level.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
