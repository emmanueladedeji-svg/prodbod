import { useState, useEffect, useRef } from 'react';
import { X, Send, ChevronRight, Plus } from 'lucide-react';
import { Feature, useUpdateWorkspaceFeature } from '@/hooks/useWorkspaceFeatures';
import { STATUSES, StatusKey, PRIORITY_CONFIG, ItemPriority, ItemLevel } from '@/constants/statuses';
import { StatusBadge } from './StatusBadge';
import { ProdbodMember } from '@/hooks/useProdbodMembers';
import { EffortSizeSelect } from '@/components/feature-detail/EffortSizeSelect';
import { EffortSize } from '@/types';
import { useFeatureComments } from '@/hooks/useFeatureComments';
import { supabase } from '@/integrations/supabase/client';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { InlineAddRow } from './InlineAddRow';

function fmtDateTime(d: string) {
  try {
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return d;
  }
}

function avatarColor(s: string) {
  const c = ['#3d6cff', '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626', '#be185d'];
  let h = 0;
  for (const ch of (s || '')) h = (h * 31 + ch.charCodeAt(0)) % c.length;
  return c[h];
}

interface FeatureDetailPanelProps {
  feature: Feature | null;
  allFeatures: Feature[];
  listId: string;
  productId: string;
  orgId: string;
  onClose: () => void;
  onOpenDetail: (f: Feature) => void;
  onAssign: (featureId: string) => void;
  members: ProdbodMember[];
}

export function FeatureDetailPanel({ 
  feature, allFeatures, listId, productId, orgId, onClose, onOpenDetail, onAssign, members 
}: FeatureDetailPanelProps) {
  const updateFeature = useUpdateWorkspaceFeature();
  const { comments, addComment } = useFeatureComments(feature?.id ?? null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [descValue, setDescValue] = useState('');
  const [commentValue, setCommentValue] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [statusDropOpen, setStatusDropOpen] = useState(false);
  const [priorityDropOpen, setPriorityDropOpen] = useState(false);
  const [descOpen, setDescOpen] = useState(true);
  const [subtasksOpen, setSubtasksOpen] = useState(true);
  const [activityOpen, setActivityOpen] = useState(true);
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const commentEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (feature) {
      setTitleValue(feature.title);
      setDescValue(feature.description || '');
      setCommentValue('');
      setEditingTitle(false);
    }
  }, [feature?.id]);

  useEffect(() => {
    commentEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments.length]);

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

  const setEffortSize = async (effort_size: EffortSize | null) => {
    try { await updateFeature.mutateAsync({ id: feature.id, effort_size } as any); } catch {}
  };

  const handlePostComment = async () => {
    if (!commentValue.trim() || isPostingComment) return;
    setIsPostingComment(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const authorName = user?.email?.split('@')[0] ?? 'Member';
      await addComment({ feature_id: feature.id, author_name: authorName, content: commentValue.trim() });
      setCommentValue('');
    } finally {
      setIsPostingComment(false);
    }
  };

  const subItems = allFeatures.filter(f => f.parent_id === feature.id);
  const doneSubItems = subItems.filter(s => s.status === 'live');
  const subtaskPct = subItems.length > 0 ? Math.round((doneSubItems.length / subItems.length) * 100) : 0;
  const addSubtaskLevel: ItemLevel = feature.level === 'feature' ? 'sub_feature' : 'task';

  const toggleSubtaskDone = async (sub: Feature, checked: boolean) => {
    try {
      await updateFeature.mutateAsync({ id: sub.id, status: checked ? 'live' : 'in_testing' });
    } catch {}
  };

  const sectionLabelStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', userSelect: 'none',
    fontSize: 12, color: 'var(--pb-text3)', fontFamily: "'Syne', sans-serif",
    letterSpacing: '.04em', textTransform: 'uppercase',
  };

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

          {/* Assignee */}
          <div style={propRowStyle}>
            <span style={propLabelStyle}>Assignee</span>
            <div 
              onClick={() => onAssign(feature.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
            >
              {(() => {
                const assignee = feature.assignee_id ? members.find(m => m.member_user_id === feature.assignee_id) : null;
                if (!assignee) return <span style={{ fontSize: 13, color: 'var(--pb-text3)' }}>Unassigned</span>;
                
                const initials = assignee.profile 
                  ? ((assignee.profile.first_name?.[0] || '') + (assignee.profile.last_name?.[0] || '')).toUpperCase()
                  : (assignee.name || '?').substring(0, 2).toUpperCase();
                
                return (
                  <>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: avatarColor(assignee.name || assignee.email || ''),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 700, color: '#fff', fontFamily: "'Syne', sans-serif"
                    }}>
                      {initials}
                    </div>
                    <span style={{ fontSize: 13, color: 'var(--pb-text)' }}>{assignee.name || assignee.email}</span>
                  </>
                );
              })()}
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

          {/* Effort size */}
          <div style={propRowStyle}>
            <span style={propLabelStyle}>Effort</span>
            <EffortSizeSelect
              value={(feature as any).effort_size as EffortSize | null}
              onChange={setEffortSize}
            />
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
        <Collapsible open={descOpen} onOpenChange={setDescOpen}>
          <div style={{ padding: '12px 18px', borderTop: '1px solid var(--pb-border)', flexShrink: 0 }}>
            <CollapsibleTrigger asChild>
              <div style={{ ...sectionLabelStyle, marginBottom: descOpen ? 6 : 0 }}>
                <ChevronRight size={12} style={{ transition: 'transform .15s', transform: descOpen ? 'rotate(90deg)' : 'rotate(0deg)' }} />
                Description
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
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
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* Subtasks (checklist) */}
        <Collapsible open={subtasksOpen} onOpenChange={setSubtasksOpen}>
          <div style={{ padding: '12px 18px', borderTop: '1px solid var(--pb-border)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: subtasksOpen ? 10 : 0 }}>
              <CollapsibleTrigger asChild>
                <div style={sectionLabelStyle}>
                  <ChevronRight size={12} style={{ transition: 'transform .15s', transform: subtasksOpen ? 'rotate(90deg)' : 'rotate(0deg)' }} />
                  Subtasks {subItems.length > 0 && `(${doneSubItems.length}/${subItems.length})`}
                </div>
              </CollapsibleTrigger>
              <button
                onClick={() => { setSubtasksOpen(true); setShowAddSubtask(true); }}
                title="Add subtask"
                style={{
                  width: 20, height: 20, borderRadius: 5, border: '1px solid var(--pb-border)',
                  background: 'transparent', cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', color: 'var(--pb-text3)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--pb-text)'; e.currentTarget.style.borderColor = 'var(--pb-border2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--pb-text3)'; e.currentTarget.style.borderColor = 'var(--pb-border)'; }}
              >
                <Plus size={12} />
              </button>
            </div>
            <CollapsibleContent>
              {subItems.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <Progress value={subtaskPct} className="h-1.5" />
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {subItems.map(sub => {
                  const done = sub.status === 'live';
                  return (
                    <div
                      key={sub.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                        borderRadius: 'var(--pb-r)', cursor: 'pointer', fontSize: 13,
                        color: 'var(--pb-text)', border: '1px solid var(--pb-border)',
                        background: 'var(--pb-bg)', transition: 'background .1s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--pb-bg3)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--pb-bg)')}
                    >
                      <Checkbox
                        checked={done}
                        onCheckedChange={(checked) => toggleSubtaskDone(sub, checked === true)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span
                        onClick={() => onOpenDetail(sub)}
                        style={{
                          flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          textDecoration: done ? 'line-through' : 'none',
                          color: done ? 'var(--pb-text3)' : 'var(--pb-text)',
                        }}
                      >
                        {sub.title}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--pb-text3)', textTransform: 'capitalize', flexShrink: 0 }} onClick={() => onOpenDetail(sub)}>
                        {sub.level.replace('_', ' ')}
                      </span>
                    </div>
                  );
                })}
                {showAddSubtask ? (
                  <InlineAddRow
                    listId={listId}
                    productId={productId}
                    orgId={orgId}
                    defaultStatusId={feature.status_id ?? ''}
                    level={addSubtaskLevel}
                    parentId={feature.id}
                    position={subItems.length}
                    onDone={() => setShowAddSubtask(false)}
                    onCancel={() => setShowAddSubtask(false)}
                  />
                ) : (
                  <button
                    onClick={() => setShowAddSubtask(true)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px',
                      border: 'none', background: 'transparent', cursor: 'pointer',
                      fontSize: 12.5, color: 'var(--pb-text3)', fontFamily: "'DM Sans', sans-serif",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--pb-text)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--pb-text3)')}
                  >
                    <Plus size={12} /> Add subtask
                  </button>
                )}
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* Activity / Comments */}
        <Collapsible open={activityOpen} onOpenChange={setActivityOpen}>
          <div style={{ padding: '12px 18px', borderTop: '1px solid var(--pb-border)', flexShrink: 0 }}>
            <CollapsibleTrigger asChild>
              <div style={{ ...sectionLabelStyle, marginBottom: activityOpen ? 10 : 0 }}>
                <ChevronRight size={12} style={{ transition: 'transform .15s', transform: activityOpen ? 'rotate(90deg)' : 'rotate(0deg)' }} />
                Activity {comments.length > 0 && `(${comments.length})`}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {/* Comment list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 12, maxHeight: 240, overflowY: 'auto' }}>
                {comments.length === 0 && (
                  <p style={{ fontSize: 12.5, color: 'var(--pb-text3)', textAlign: 'center', padding: '12px 0' }}>No comments yet</p>
                )}
                {comments.map(c => (
                  <div key={c.id} style={{ display: 'flex', gap: 8 }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                      background: avatarColor(c.author_name),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 700, color: '#fff', fontFamily: "'Syne', sans-serif",
                    }}>
                      {c.author_name[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--pb-text)' }}>{c.author_name}</span>
                        <span style={{ fontSize: 11, color: 'var(--pb-text3)' }}>
                          {new Date(c.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--pb-text2)', lineHeight: 1.5, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {c.content}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={commentEndRef} />
              </div>

              {/* Comment input */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <textarea
                  value={commentValue}
                  onChange={e => setCommentValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handlePostComment(); }}
                  placeholder="Write a comment… (⌘+Enter to post)"
                  rows={2}
                  style={{
                    flex: 1, border: '1px solid var(--pb-border)', borderRadius: 'var(--pb-r)',
                    padding: '8px 10px', fontSize: 12.5, fontFamily: "'DM Sans', sans-serif",
                    color: 'var(--pb-text)', background: 'var(--pb-bg)', outline: 'none',
                    resize: 'none', lineHeight: 1.5, boxSizing: 'border-box', transition: 'border-color .1s',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--pb-border2)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--pb-border)')}
                />
                <button
                  onClick={handlePostComment}
                  disabled={!commentValue.trim() || isPostingComment}
                  style={{
                    width: 34, height: 34, borderRadius: 'var(--pb-r)', border: 'none',
                    background: commentValue.trim() ? 'var(--pb-gold)' : 'var(--pb-bg3)',
                    cursor: commentValue.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, transition: 'background .15s',
                  }}
                >
                  <Send size={14} color={commentValue.trim() ? 'var(--pb-text)' : 'var(--pb-text3)'} />
                </button>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </div>
    </>
  );
}
