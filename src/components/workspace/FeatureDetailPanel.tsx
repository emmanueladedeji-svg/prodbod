import { useState, useEffect, useRef } from 'react';
import { X, AlertTriangle, CheckSquare, MessageSquare, Clock, Plus, Trash2, ShieldAlert, Paperclip, Send, Reply, Calendar, Flag, Activity } from 'lucide-react';
import { Feature, useUpdateWorkspaceFeature, useCreateWorkspaceFeature, useDeleteWorkspaceFeature } from '@/hooks/useWorkspaceFeatures';
import { STATUSES, StatusKey, PRIORITY_CONFIG, ItemPriority } from '@/constants/statuses';
import { StatusBadge } from './StatusBadge';
import { ProdbodMember } from '@/hooks/useProdbodMembers';
import { useFeatureDetails, ChecklistItem, UserStory, FeatureComment } from '@/hooks/useFeatureDetails';
import { useSprints } from '@/hooks/useSprints';
import { useWorkspaceObjectives } from '@/hooks/useWorkspaceObjectives';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

// Helper to format date-time
function fmtDateTime(d: string) {
  try {
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return d;
  }
}

// Helper to calculate difference in days/hours
function fmtTimeSpent(enteredAt: string | null) {
  if (!enteredAt) return '0m';
  const diff = Date.now() - new Date(enteredAt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
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
  const createFeature = useCreateWorkspaceFeature();
  const deleteFeature = useDeleteWorkspaceFeature();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Custom API hook for all extra details
  const {
    checklists, createChecklistItem, updateChecklistItem, deleteChecklistItem,
    userStories, createUserStory, updateUserStory, deleteUserStory,
    comments, createComment,
    activities, logActivity,
    assigneeIds, addAssignee, removeAssignee
  } = useFeatureDetails(feature?.id || null);

  const { sprints } = useSprints();
  const { objectives } = useWorkspaceObjectives(orgId);

  // States
  const [activeTab, setActiveTab] = useState<'details' | 'activity'>('details');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [descValue, setDescValue] = useState('');
  
  // Checklist input
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  
  // User story input
  const [newUserStoryText, setNewUserStoryText] = useState('');
  
  // Comment input
  const [newCommentText, setNewCommentText] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  
  // Autocomplete Mentions state
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionTriggerIdx, setMentionTriggerIdx] = useState<number | null>(null);

  // Child creation states
  const [childTitle, setChildTitle] = useState('');
  const [childType, setChildType] = useState<'sub_feature' | 'task'>('task');

  // Phase, Priority, Sprint drop states
  const [statusDropOpen, setStatusDropOpen] = useState(false);
  const [priorityDropOpen, setPriorityDropOpen] = useState(false);
  const [sprintDropOpen, setSprintDropOpen] = useState(false);
  const [objDropOpen, setObjDropOpen] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

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

  // 1. Calculate Derived Progress
  const children = allFeatures.filter(f => f.parent_id === feature.id);
  const subFeatures = children.filter(f => f.level === 'sub_feature');
  const tasksOnly = children.filter(f => f.level === 'task');

  let derivedProgress = 0;
  const hasSubFeatures = subFeatures.length > 0;
  const hasTasks = tasksOnly.length > 0;

  if (hasSubFeatures) {
    const completedSF = subFeatures.filter(sf => (sf.status as string) === 'live' || (sf.status as string) === 'closed');
    derivedProgress = Math.round((completedSF.length / subFeatures.length) * 100);
  } else if (hasTasks) {
    const completedTasks = tasksOnly.filter(t => (t.status as string) === 'live' || (t.status as string) === 'closed');
    derivedProgress = Math.round((completedTasks.length / tasksOnly.length) * 100);
  }

  // Update progress in database if it changed
  if (derivedProgress !== feature.progress) {
    updateFeature.mutate({ id: feature.id, progress: derivedProgress });
  }

  // 2. Resolve Hierarchy Breadcrumbs
  const buildBreadcrumbs = () => {
    const breadcrumbs: { title: string; id?: string; level?: string }[] = [
      { title: 'Organisation' },
      { title: 'Product Line' },
      { title: 'Backlog' }
    ];

    const parents: Feature[] = [];
    let currParentId = feature.parent_id;
    while (currParentId) {
      const found = allFeatures.find(f => f.id === currParentId);
      if (found) {
        parents.unshift(found);
        currParentId = found.parent_id;
      } else {
        break;
      }
    }

    parents.forEach(p => {
      breadcrumbs.push({ title: p.title, id: p.id, level: p.level });
    });

    breadcrumbs.push({ title: feature.title, level: feature.level });
    return breadcrumbs;
  };

  // 3. Bottleneck visibility calculations
  const totalTasks = children.filter(t => t.level === 'task');
  const outstandingTasks = totalTasks.filter(t => (t.status as string) !== 'live' && (t.status as string) !== 'closed');
  const blockedTasks = totalTasks.filter(t => t.is_blocked);
  
  // Tasks in progress longer than 5 days (threshold)
  const LONG_IN_PROGRESS_THRESHOLD_MS = 5 * 24 * 60 * 60 * 1000;
  const bottleneckTasks = totalTasks.filter(t => {
    if (t.status !== 'in_development') return false;
    if (!t.in_progress_since) return false;
    const timeSpent = Date.now() - new Date(t.in_progress_since).getTime();
    return timeSpent > LONG_IN_PROGRESS_THRESHOLD_MS;
  });

  // Mutate text helper
  const saveTitle = async () => {
    if (!titleValue.trim() || titleValue === feature.title) { setEditingTitle(false); return; }
    try {
      await updateFeature.mutateAsync({ id: feature.id, title: titleValue.trim() });
      await logActivity({
        action_type: 'title',
        description: 'Updated title',
        old_value: feature.title,
        new_value: titleValue.trim(),
      });
    } catch {}
    setEditingTitle(false);
  };

  const saveDesc = async () => {
    if (descValue === feature.description) return;
    try {
      await updateFeature.mutateAsync({ id: feature.id, description: descValue || null });
      await logActivity({
        action_type: 'description',
        description: 'Updated description',
        old_value: feature.description,
        new_value: descValue || null,
      });
    } catch {}
  };

  const changeStatus = async (status: StatusKey) => {
    setStatusDropOpen(false);
    try {
      await updateFeature.mutateAsync({ 
        id: feature.id, 
        status,
        phase_entered_at: new Date().toISOString(),
        ...(status === 'in_development' ? { in_progress_since: new Date().toISOString() } : {})
      });
      await logActivity({
        action_type: 'phase',
        description: `Changed status to ${status.replace('_', ' ')}`,
        old_value: feature.status,
        new_value: status,
      });
    } catch {}
  };

  const changePriority = async (priority: ItemPriority) => {
    setPriorityDropOpen(false);
    try {
      await updateFeature.mutateAsync({ id: feature.id, priority });
      await logActivity({
        action_type: 'priority',
        description: `Changed priority to ${priority}`,
        old_value: feature.priority,
        new_value: priority,
      });
    } catch {}
  };

  const assignSprint = async (sprintId: string | null) => {
    setSprintDropOpen(false);
    const sprintName = sprintId ? sprints.find(s => s.id === sprintId)?.name : 'None';
    const oldSprintName = feature.sprint_id ? sprints.find(s => s.id === feature.sprint_id)?.name : 'None';
    try {
      await updateFeature.mutateAsync({ id: feature.id, sprint_id: sprintId });
      await logActivity({
        action_type: 'sprint',
        description: `Assigned sprint to ${sprintName}`,
        old_value: oldSprintName,
        new_value: sprintName,
      });
    } catch {}
  };

  const toggleObjectiveMapping = async (objId: string) => {
    const isMapped = (feature as any).objective_features?.some((of: any) => of.objective_id === objId) || false;
    try {
      if (isMapped) {
        await (supabase as any).from('objective_features').delete().eq('objective_id', objId).eq('feature_id', feature.id);
      } else {
        await (supabase as any).from('objective_features').insert({ objective_id: objId, feature_id: feature.id });
      }
      queryClient.invalidateQueries({ queryKey: ['workspace-features', listId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-objectives', orgId] });
    } catch {}
  };

  const toggleAssignee = async (userId: string) => {
    const isAssigned = assigneeIds.includes(userId);
    const userEmail = members.find(m => m.member_user_id === userId)?.name || 'Team member';
    try {
      if (isAssigned) {
        await removeAssignee(userId);
        await logActivity({
          action_type: 'assignee',
          description: `Removed assignee: ${userEmail}`,
        });
      } else {
        await addAssignee(userId);
        await logActivity({
          action_type: 'assignee',
          description: `Added assignee: ${userEmail}`,
        });
      }
    } catch {}
  };

  const toggleBlocked = async () => {
    const nextBlocked = !feature.is_blocked;
    try {
      await updateFeature.mutateAsync({ 
        id: feature.id, 
        is_blocked: nextBlocked, 
        blocked_reason: nextBlocked ? (feature.blocked_reason || 'Blocked by dependencies') : null 
      });
      await logActivity({
        action_type: 'blocked',
        description: nextBlocked ? `Blocked item: ${feature.blocked_reason || 'Blocked'}` : 'Unblocked item',
      });
    } catch {}
  };

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childTitle.trim()) return;
    
    // Nesting constraints:
    // Feature (level === 'feature') can contain sub_feature or task.
    // Sub-feature (level === 'sub_feature') can contain task only.
    // Task (level === 'task') cannot contain child items.
    const resolvedLevel = feature.level === 'feature' ? childType : 'task';

    try {
      const child = await createFeature.mutateAsync({
        title: childTitle.trim(),
        listId,
        productId,
        orgId,
        parentId: feature.id,
        level: resolvedLevel,
        status: 'idea_or_problem',
        position: children.length,
      });

      await logActivity({
        action_type: resolvedLevel === 'sub_feature' ? 'sub_feature_add' : 'task_add',
        description: `Created child ${resolvedLevel === 'sub_feature' ? 'Sub-feature' : 'Task'}: ${child.title}`,
      });

      setChildTitle('');
      toast({ title: `${resolvedLevel === 'sub_feature' ? 'Sub-feature' : 'Task'} added` });
    } catch {}
  };

  const handleAddChecklist = async () => {
    if (!newChecklistTitle.trim()) return;
    try {
      await createChecklistItem({ title: newChecklistTitle.trim() });
      setNewChecklistTitle('');
    } catch {}
  };

  const handleAddUserStory = async () => {
    if (!newUserStoryText.trim()) return;
    try {
      await createUserStory(newUserStoryText.trim());
      setNewUserStoryText('');
    } catch {}
  };

  const handleAddComment = async (parentId: string | null = null) => {
    const text = parentId ? replyText : newCommentText;
    if (!text.trim()) return;

    try {
      await createComment({ content: text.trim(), parent_id: parentId });
      if (parentId) {
        setReplyText('');
        setReplyToId(null);
      } else {
        setNewCommentText('');
      }
    } catch {}
  };

  // Autocomplete Mentions detection helper
  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>, isReply = false) => {
    const text = e.target.value;
    if (isReply) setReplyText(text);
    else setNewCommentText(text);

    const match = text.match(/@(\w*)$/);
    if (match) {
      setMentionTriggerIdx(text.length - match[0].length);
      setMentionQuery(match[1]);
    } else {
      setMentionTriggerIdx(null);
      setMentionQuery('');
    }
  };

  const selectMention = (member: ProdbodMember, isReply = false) => {
    const text = isReply ? replyText : newCommentText;
    if (mentionTriggerIdx === null) return;
    const pre = text.substring(0, mentionTriggerIdx);
    const post = ' ';
    const newText = `${pre}@${member.name || member.email}${post}`;
    
    if (isReply) setReplyText(newText);
    else setNewCommentText(newText);
    
    setMentionTriggerIdx(null);
    setMentionQuery('');
  };

  const filteredMentionMembers = members.filter(m => 
    (m.name || m.email || '').toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const breadcrumbs = buildBreadcrumbs();

  return (
    <>
      {/* Backdrop overlay */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 49, background: 'rgba(0,0,0,0.15)' }}
        onClick={onClose}
      />

      {/* Main Details Panel */}
      <div
        ref={panelRef}
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          height: '100vh',
          width: 820,
          zIndex: 50,
          background: 'var(--pb-bg2)',
          borderLeft: '1px solid var(--pb-border)',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.12)',
          display: 'flex',
          flexDirection: 'row',
          overflow: 'hidden',
          animation: 'slideInRight 0.2s ease-out',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(820px); }
            to { transform: translateX(0); }
          }
        `}</style>

        {/* LEFT PANEL: Workspace Content (Breadcrumbs, Title, Stories, Checklists, Comments, Activity) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', borderRight: '1px solid var(--pb-border)', overflowY: 'auto' }}>
          
          {/* Top navigation header */}
          <div style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--pb-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--pb-bg3)',
            flexShrink: 0,
          }}>
            {/* Hierarchy Breadcrumbs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--pb-text3)', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: "'Syne', sans-serif" }}>
              {breadcrumbs.map((bc, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {idx > 0 && <span>/</span>}
                  <span 
                    onClick={() => bc.id && onOpenDetail(allFeatures.find(f => f.id === bc.id)!)}
                    style={{ 
                      cursor: bc.id ? 'pointer' : 'default', 
                      color: idx === breadcrumbs.length - 1 ? 'var(--pb-text)' : 'var(--pb-text3)',
                      fontWeight: idx === breadcrumbs.length - 1 ? 600 : 400
                    }}
                  >
                    {bc.title}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={onClose}
              style={{
                width: 26, height: 26, borderRadius: 6,
                border: '1px solid var(--pb-border)', background: 'transparent',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--pb-text3)', transition: 'all .12s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--pb-bg3)'; e.currentTarget.style.color = 'var(--pb-text)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--pb-text3)'; }}
            >
              <X size={12} />
            </button>
          </div>

          {/* Tab Selector */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--pb-border)', flexShrink: 0 }}>
            <button
              onClick={() => setActiveTab('details')}
              style={{
                flex: 1, padding: '12px', border: 'none', background: 'transparent',
                borderBottom: activeTab === 'details' ? '2px solid var(--pb-gold)' : '2px solid transparent',
                color: activeTab === 'details' ? 'var(--pb-text)' : 'var(--pb-text3)',
                fontWeight: activeTab === 'details' ? 600 : 400, fontSize: 13, cursor: 'pointer',
                fontFamily: "'Syne', sans-serif"
              }}
            >
              Feature Workspace
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              style={{
                flex: 1, padding: '12px', border: 'none', background: 'transparent',
                borderBottom: activeTab === 'activity' ? '2px solid var(--pb-gold)' : '2px solid transparent',
                color: activeTab === 'activity' ? 'var(--pb-text)' : 'var(--pb-text3)',
                fontWeight: activeTab === 'activity' ? 600 : 400, fontSize: 13, cursor: 'pointer',
                fontFamily: "'Syne', sans-serif"
              }}
            >
              Activity Logs ({activities.length})
            </button>
          </div>

          {activeTab === 'activity' ? (
            /* ACTIVITY LOG TAB */
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--pb-text2)', fontWeight: 600, fontSize: 14 }}>
                <Activity size={16} /> Immutable Activity Logs
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                {activities.length === 0 ? (
                  <div style={{ padding: 12, border: '1px dashed var(--pb-border)', borderRadius: 8, textAlign: 'center', color: 'var(--pb-text3)', fontSize: 13 }}>
                    No activity logged yet
                  </div>
                ) : (
                  activities.map(act => (
                    <div key={act.id} style={{ display: 'flex', flexDirection: 'column', padding: '10px 12px', background: 'var(--pb-bg3)', borderRadius: 8, border: '1px solid var(--pb-border)', fontSize: 12.5 }}>
                      <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', color: 'var(--pb-text3)', marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, color: 'var(--pb-text)' }}>{act.user_name}</span>
                        <span>{fmtDateTime(act.created_at)}</span>
                      </div>
                      <div style={{ color: 'var(--pb-text2)' }}>{act.description}</div>
                      {(act.old_value || act.new_value) && (
                        <div style={{ fontSize: 11, color: 'var(--pb-text3)', marginTop: 4, display: 'flex', gap: 8 }}>
                          {act.old_value && <span>Was: <code style={{ background: '#0001', padding: '1px 3px', borderRadius: 3 }}>{act.old_value}</code></span>}
                          {act.new_value && <span>Now: <code style={{ background: '#0001', padding: '1px 3px', borderRadius: 3 }}>{act.new_value}</code></span>}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* WORKSPACE / DETAILS TAB */
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
              
              {/* Title Input */}
              <div>
                {editingTitle ? (
                  <input
                    ref={titleInputRef}
                    value={titleValue}
                    onChange={(e) => setTitleValue(e.target.value)}
                    onBlur={saveTitle}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { setTitleValue(feature.title); setEditingTitle(false); } }}
                    autoFocus
                    style={{
                      width: '100%', border: '1px solid var(--pb-border2)', outline: 'none',
                      fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 18,
                      letterSpacing: '-0.02em', color: 'var(--pb-text)',
                      background: 'var(--pb-bg)', borderRadius: 8, padding: '6px 12px',
                    }}
                  />
                ) : (
                  <h2
                    onClick={() => setEditingTitle(true)}
                    style={{
                      fontFamily: "'Syne', sans-serif",
                      fontWeight: 700,
                      fontSize: 18,
                      letterSpacing: '-0.02em',
                      color: 'var(--pb-text)',
                      cursor: 'text',
                      lineHeight: 1.3,
                      padding: '4px 0',
                    }}
                  >
                    {feature.title}
                  </h2>
                )}
              </div>

              {/* Bottleneck visibility alert block */}
              <div style={{
                padding: '12px 14px',
                borderRadius: 'var(--pb-rl)',
                background: feature.is_blocked ? 'var(--pb-red-bg)' : 'var(--pb-amber-bg)',
                border: feature.is_blocked ? '1px solid var(--pb-red-border)' : '1px solid var(--pb-amber-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: feature.is_blocked ? 'var(--pb-red)' : 'var(--pb-amber)' }}>
                    <AlertTriangle size={15} /> 
                    {feature.is_blocked ? 'Feature Blocked' : 'Bottlenecks & Progress Health'}
                  </div>
                  <button
                    onClick={toggleBlocked}
                    style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 6, cursor: 'pointer',
                      background: feature.is_blocked ? 'var(--pb-red)' : 'transparent',
                      color: feature.is_blocked ? '#fff' : 'var(--pb-text2)',
                      border: `1px solid ${feature.is_blocked ? 'var(--pb-red)' : 'var(--pb-border2)'}`
                    }}
                  >
                    {feature.is_blocked ? 'Mark Unblocked' : 'Mark Blocked'}
                  </button>
                </div>

                {feature.is_blocked && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                    <div style={{ fontSize: 12.5, color: 'var(--pb-text2)' }}>
                      <strong>Reason: </strong> {feature.blocked_reason || 'No reason specified'}
                    </div>
                    <input
                      placeholder="Add blocking reason..."
                      defaultValue={feature.blocked_reason || ''}
                      onBlur={async (e) => {
                        const reason = e.target.value.trim();
                        if (reason && reason !== feature.blocked_reason) {
                          await updateFeature.mutateAsync({ id: feature.id, blocked_reason: reason });
                          await logActivity({ action_type: 'blocked', description: `Updated blocking reason: ${reason}` });
                        }
                      }}
                      style={{
                        padding: '6px 10px', fontSize: 12, border: '1px solid var(--pb-red-border)', borderRadius: 6,
                        background: 'var(--pb-bg2)', outline: 'none'
                      }}
                    />
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 4, paddingTop: 4, borderTop: '1px solid #0000000c' }}>
                  <div style={{ fontSize: 11.5, color: 'var(--pb-text2)' }}>
                    <strong>Time in Current Phase:</strong> {fmtTimeSpent(feature.phase_entered_at)}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--pb-text2)' }}>
                    <strong>Blocked Child Tasks:</strong> {blockedTasks.length}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--pb-text2)' }}>
                    <strong>Outstanding Tasks:</strong> {outstandingTasks.length}
                  </div>
                </div>

                {bottleneckTasks.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--pb-red)', fontWeight: 500, marginTop: 4 }}>
                    <ShieldAlert size={12} /> {bottleneckTasks.length} child task(s) in development longer than 5 days.
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--pb-text3)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6, fontFamily: "'Syne', sans-serif" }}>Description</label>
                <textarea
                  value={descValue}
                  onChange={(e) => setDescValue(e.target.value)}
                  onBlur={saveDesc}
                  placeholder="Describe this feature..."
                  rows={3}
                  style={{
                    width: '100%', border: '1px solid var(--pb-border)', borderRadius: 'var(--pb-r)',
                    padding: '10px 12px', fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                    color: 'var(--pb-text)', background: 'var(--pb-bg)', outline: 'none',
                    resize: 'vertical', lineHeight: 1.5, boxSizing: 'border-box',
                    transition: 'border-color .12s',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--pb-border2)')}
                  onBlurCapture={(e) => (e.currentTarget.style.borderColor = 'var(--pb-border)')}
                />
              </div>

              {/* User Stories */}
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--pb-text3)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8, fontFamily: "'Syne', sans-serif" }}>User Stories</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {userStories.map(story => (
                    <div key={story.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'var(--pb-bg3)', border: '1px solid var(--pb-border)', borderRadius: 6 }}>
                      <span style={{ fontSize: 12.5, color: 'var(--pb-text3)', fontWeight: 600 }}>AS A</span>
                      <input
                        defaultValue={story.story_text}
                        onBlur={async (e) => {
                          const val = e.target.value.trim();
                          if (val && val !== story.story_text) {
                            await updateUserStory({ id: story.id, story_text: val });
                          }
                        }}
                        style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 12.5, outline: 'none', color: 'var(--pb-text)' }}
                      />
                      <button
                        onClick={async () => {
                          await deleteUserStory(story.id);
                          toast({ title: 'User story removed' });
                        }}
                        style={{ border: 'none', background: 'transparent', color: 'var(--pb-text3)', cursor: 'pointer' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--pb-red)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--pb-text3)')}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <input
                      placeholder="e.g. As a user, I want to filter by assignee..."
                      value={newUserStoryText}
                      onChange={(e) => setNewUserStoryText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddUserStory()}
                      style={{ flex: 1, padding: '6px 10px', fontSize: 12.5, border: '1px solid var(--pb-border)', borderRadius: 6, background: 'var(--pb-bg)', outline: 'none' }}
                    />
                    <button onClick={handleAddUserStory} style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6, background: 'var(--pb-accent)', color: '#fff', border: 'none', cursor: 'pointer' }}>Add Story</button>
                  </div>
                </div>
              </div>

              {/* Checklist */}
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--pb-text3)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8, fontFamily: "'Syne', sans-serif" }}>Lightweight Checklist</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {checklists.map(item => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderBottom: '1px solid var(--pb-border)' }}>
                      <input
                        type="checkbox"
                        checked={item.is_completed}
                        onChange={async (e) => {
                          await updateChecklistItem({ id: item.id, is_completed: e.target.checked });
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                      <input
                        defaultValue={item.title}
                        onBlur={async (e) => {
                          const val = e.target.value.trim();
                          if (val && val !== item.title) {
                            await updateChecklistItem({ id: item.id, title: val });
                          }
                        }}
                        style={{
                          flex: 1, border: 'none', background: 'transparent', fontSize: 12.5, outline: 'none',
                          color: item.is_completed ? 'var(--pb-text3)' : 'var(--pb-text)',
                          textDecoration: item.is_completed ? 'line-through' : 'none'
                        }}
                      />
                      
                      {/* Assignee for checklist item */}
                      <select
                        value={item.assignee_id || ''}
                        onChange={async (e) => {
                          await updateChecklistItem({ id: item.id, assignee_id: e.target.value || null });
                        }}
                        style={{ fontSize: 11, background: 'var(--pb-bg3)', border: '1px solid var(--pb-border)', borderRadius: 4, padding: '2px 4px', color: 'var(--pb-text2)' }}
                      >
                        <option value="">Unassigned</option>
                        {members.map(m => (
                          <option key={m.id} value={m.member_user_id}>{m.name || m.email}</option>
                        ))}
                      </select>

                      <button
                        onClick={() => deleteChecklistItem(item.id)}
                        style={{ border: 'none', background: 'transparent', color: 'var(--pb-text3)', cursor: 'pointer' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--pb-red)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--pb-text3)')}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <input
                      placeholder="Add checklist item..."
                      value={newChecklistTitle}
                      onChange={(e) => setNewChecklistTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddChecklist()}
                      style={{ flex: 1, padding: '6px 10px', fontSize: 12.5, border: '1px solid var(--pb-border)', borderRadius: 6, background: 'var(--pb-bg)', outline: 'none' }}
                    />
                    <button onClick={handleAddChecklist} style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6, background: 'var(--pb-accent)', color: '#fff', border: 'none', cursor: 'pointer' }}>Add Item</button>
                  </div>
                </div>
              </div>

              {/* Hierarchy: Child feature / task addition */}
              {feature.level !== 'task' && (
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--pb-text3)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8, fontFamily: "'Syne', sans-serif" }}>
                    Nesting Hierarchy: Create Sub-Items
                  </label>
                  <form onSubmit={handleAddChild} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      placeholder={feature.level === 'feature' ? "Add sub-feature or task..." : "Add task..."}
                      value={childTitle}
                      onChange={(e) => setChildTitle(e.target.value)}
                      style={{ flex: 1, padding: '6px 10px', fontSize: 12.5, border: '1px solid var(--pb-border)', borderRadius: 6, background: 'var(--pb-bg)', outline: 'none' }}
                    />
                    {feature.level === 'feature' && (
                      <select
                        value={childType}
                        onChange={(e: any) => setChildType(e.target.value)}
                        style={{ padding: '6px 10px', fontSize: 12.5, border: '1px solid var(--pb-border)', borderRadius: 6, background: 'var(--pb-bg3)', color: 'var(--pb-text2)', outline: 'none' }}
                      >
                        <option value="sub_feature">Sub-feature</option>
                        <option value="task">Task</option>
                      </select>
                    )}
                    <button type="submit" style={{ padding: '6px 14px', fontSize: 12.5, fontWeight: 500, borderRadius: 6, background: 'var(--pb-accent)', color: '#fff', border: 'none', cursor: 'pointer' }}>
                      Add Sub-item
                    </button>
                  </form>
                </div>
              )}

              {/* Comments Threaded Section */}
              <div style={{ borderTop: '1px solid var(--pb-border)', paddingTop: 20 }}>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--pb-text3)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 12, fontFamily: "'Syne', sans-serif" }}>Threaded Comments</label>
                
                {/* Comments List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 16 }}>
                  {comments.length === 0 ? (
                    <div style={{ padding: 12, border: '1px dashed var(--pb-border)', borderRadius: 8, textAlign: 'center', color: 'var(--pb-text3)', fontSize: 12.5 }}>
                      No comments yet. Start the conversation!
                    </div>
                  ) : (
                    comments.map(c => {
                      const initials = c.author_name.substring(0, 2).toUpperCase();
                      return (
                        <div key={c.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                          <div style={{
                            width: 24, height: 24, borderRadius: '50%', background: avatarColor(c.author_name),
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff'
                          }}>
                            {initials}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--pb-text)' }}>{c.author_name}</span>
                              <span style={{ fontSize: 10.5, color: 'var(--pb-text3)' }}>{fmtDateTime(c.created_at)}</span>
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--pb-text2)', lineHeight: 1.4 }}>{c.content}</div>
                            
                            {/* Reply Action */}
                            <button
                              onClick={() => { setReplyToId(c.id); setReplyText(''); }}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'transparent', border: 'none', padding: '4px 0', fontSize: 11, color: 'var(--pb-text3)', cursor: 'pointer', marginTop: 4 }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--pb-gold)')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--pb-text3)')}
                            >
                              <Reply size={10} /> Reply
                            </button>

                            {/* Threaded replies list */}
                            {c.replies && c.replies.length > 0 && (
                              <div style={{ borderLeft: '2px solid var(--pb-border)', paddingLeft: 12, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {c.replies.map(reply => (
                                  <div key={reply.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                    <div style={{
                                      width: 20, height: 20, borderRadius: '50%', background: avatarColor(reply.author_name),
                                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: '#fff'
                                    }}>
                                      {reply.author_name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--pb-text)' }}>{reply.author_name}</span>
                                        <span style={{ fontSize: 10, color: 'var(--pb-text3)' }}>{fmtDateTime(reply.created_at)}</span>
                                      </div>
                                      <div style={{ fontSize: 12.5, color: 'var(--pb-text2)' }}>{reply.content}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Reply Input Box */}
                            {replyToId === c.id && (
                              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <div style={{ position: 'relative' }}>
                                  <textarea
                                    value={replyText}
                                    onChange={(e) => handleCommentChange(e, true)}
                                    placeholder="Write a reply..."
                                    rows={2}
                                    style={{ width: '100%', padding: '6px 8px', fontSize: 12, border: '1px solid var(--pb-border2)', borderRadius: 6, background: 'var(--pb-bg)', color: 'var(--pb-text)', resize: 'vertical', outline: 'none' }}
                                  />
                                  {/* Mentions popover */}
                                  {mentionTriggerIdx !== null && filteredMentionMembers.length > 0 && (
                                    <div style={{ position: 'absolute', bottom: '100%', left: 0, zIndex: 100, background: 'var(--pb-bg2)', border: '1px solid var(--pb-border2)', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden', minWidth: 160 }}>
                                      {filteredMentionMembers.map(m => (
                                        <div key={m.id} onClick={() => selectMention(m, true)} style={{ padding: '6px 10px', cursor: 'pointer', fontSize: 11.5, color: 'var(--pb-text)', transition: 'background .1s' }} onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--pb-bg3)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                                          {m.name || m.email}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                  <button onClick={() => setReplyToId(null)} style={{ padding: '4px 10px', fontSize: 11, background: 'transparent', border: '1px solid var(--pb-border2)', borderRadius: 4, cursor: 'pointer', color: 'var(--pb-text2)' }}>Cancel</button>
                                  <button onClick={() => handleAddComment(c.id)} style={{ padding: '4px 10px', fontSize: 11, background: 'var(--pb-accent)', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Send Reply</button>
                                </div>
                              </div>
                            )}

                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Root Comment Entry Box */}
                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <textarea
                    placeholder="Type comments, use @ to mention teammates..."
                    value={newCommentText}
                    onChange={handleCommentChange}
                    rows={3}
                    style={{ width: '100%', padding: '8px 10px', fontSize: 12.5, border: '1px solid var(--pb-border)', borderRadius: 8, background: 'var(--pb-bg)', color: 'var(--pb-text)', resize: 'vertical', outline: 'none' }}
                  />
                  {/* Mentions popover */}
                  {mentionTriggerIdx !== null && filteredMentionMembers.length > 0 && (
                    <div style={{ position: 'absolute', bottom: '100%', left: 0, zIndex: 100, background: 'var(--pb-bg2)', border: '1px solid var(--pb-border2)', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden', minWidth: 160 }}>
                      {filteredMentionMembers.map(m => (
                        <div key={m.id} onClick={() => selectMention(m, false)} style={{ padding: '6px 10px', cursor: 'pointer', fontSize: 11.5, color: 'var(--pb-text)', transition: 'background .1s' }} onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--pb-bg3)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                          {m.name || m.email}
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={() => handleAddComment(null)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', fontSize: 12.5, fontWeight: 500, borderRadius: 6, background: 'var(--pb-accent)', color: '#fff', border: 'none', cursor: 'pointer' }}>
                      <Send size={12} /> Comment
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

        {/* RIGHT PANEL: ClickUp-style Attribute Side-Panel */}
        <div style={{ width: 280, display: 'flex', flexDirection: 'column', background: 'var(--pb-bg3)', height: '100%', padding: '20px 16px', overflowY: 'auto', flexShrink: 0 }}>
          
          <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--pb-text3)', textTransform: 'uppercase', letterSpacing: '.06em', fontFamily: "'Syne', sans-serif", marginBottom: 12 }}>
            Attributes & Phase
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            {/* Status (Phase) */}
            <div>
              <label style={{ display: 'block', fontSize: 10.5, color: 'var(--pb-text3)', textTransform: 'uppercase', letterSpacing: '.02em', marginBottom: 4 }}>Status Phase</label>
              <div style={{ position: 'relative' }}>
                <div onClick={() => setStatusDropOpen(o => !o)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', border: '1px solid var(--pb-border2)', borderRadius: 6, background: 'var(--pb-bg2)', fontSize: 12.5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUSES.find(s => s.key === feature.status)?.dotColor || '#999' }} />
                  <span style={{ fontWeight: 500 }}>{STATUSES.find(s => s.key === feature.status)?.label || feature.status}</span>
                </div>
                {statusDropOpen && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 110, marginTop: 4, background: 'var(--pb-bg2)', border: '1px solid var(--pb-border2)', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                    {STATUSES.map(s => (
                      <div key={s.key} onClick={() => changeStatus(s.key)} style={{ padding: '8px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, background: feature.status === s.key ? 'var(--pb-bg3)' : 'transparent' }} onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--pb-bg3)')} onMouseLeave={(e) => { if (feature.status !== s.key) e.currentTarget.style.background = 'transparent'; }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: s.dotColor }} />
                        {s.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Derived Progress Bar (Read-only) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <label style={{ fontSize: 10.5, color: 'var(--pb-text3)', textTransform: 'uppercase', letterSpacing: '.02em' }}>Progress Roll-up</label>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--pb-text)' }}>{derivedProgress}%</span>
              </div>
              <div style={{ width: '100%', height: 6, background: 'var(--pb-border2)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${derivedProgress}%`, height: '100%', background: 'var(--pb-gold)', transition: 'width 0.2s ease' }} />
              </div>
              <span style={{ fontSize: 9.5, color: 'var(--pb-text3)', display: 'block', marginTop: 3 }}>
                {hasSubFeatures ? 'Derived from Sub-features' : hasTasks ? 'Derived from Tasks' : 'No child items to calculate'}
              </span>
            </div>

            {/* Multiple Assignees */}
            <div>
              <label style={{ display: 'block', fontSize: 10.5, color: 'var(--pb-text3)', textTransform: 'uppercase', letterSpacing: '.02em', marginBottom: 4 }}>Assignees</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                {assigneeIds.length === 0 ? (
                  <span style={{ fontSize: 12, color: 'var(--pb-text3)' }}>No assignees</span>
                ) : (
                  assigneeIds.map(uid => {
                    const member = members.find(m => m.member_user_id === uid);
                    if (!member) return null;
                    const initials = member.name ? member.name.substring(0, 2).toUpperCase() : member.email.substring(0, 2).toUpperCase();
                    return (
                      <div key={uid} title={member.name || member.email} style={{
                        width: 24, height: 24, borderRadius: '50%', background: avatarColor(member.name || member.email),
                        display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff'
                      }}>
                        {initials}
                      </div>
                    );
                  })
                )}
              </div>
              {/* Select dropdown to toggle assignees */}
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    toggleAssignee(e.target.value);
                    e.target.value = '';
                  }
                }}
                style={{ width: '100%', padding: '6px 10px', fontSize: 12, border: '1px solid var(--pb-border2)', borderRadius: 6, background: 'var(--pb-bg2)', color: 'var(--pb-text)' }}
              >
                <option value="">+ Toggle Assignee</option>
                {members.map(m => (
                  <option key={m.id} value={m.member_user_id}>{m.name || m.email}</option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label style={{ display: 'block', fontSize: 10.5, color: 'var(--pb-text3)', textTransform: 'uppercase', letterSpacing: '.02em', marginBottom: 4 }}>Priority</label>
              <div style={{ position: 'relative' }}>
                <div onClick={() => setPriorityDropOpen(o => !o)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', border: '1px solid var(--pb-border2)', borderRadius: 6, background: 'var(--pb-bg2)', fontSize: 12.5 }}>
                  <span style={{ color: PRIORITY_CONFIG[feature.priority].color }}>●</span>
                  <span>{PRIORITY_CONFIG[feature.priority].label}</span>
                </div>
                {priorityDropOpen && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 110, marginTop: 4, background: 'var(--pb-bg2)', border: '1px solid var(--pb-border2)', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                    {Object.entries(PRIORITY_CONFIG).map(([k, cfg]) => (
                      <div key={k} onClick={() => changePriority(k as ItemPriority)} style={{ padding: '8px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, background: feature.priority === k ? 'var(--pb-bg3)' : 'transparent' }} onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--pb-bg3)')} onMouseLeave={(e) => { if (feature.priority !== k) e.currentTarget.style.background = 'transparent'; }}>
                        <span style={{ color: cfg.color }}>●</span>
                        {cfg.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Start Date */}
            <div>
              <label style={{ display: 'block', fontSize: 10.5, color: 'var(--pb-text3)', textTransform: 'uppercase', letterSpacing: '.02em', marginBottom: 4 }}>Start Date</label>
              <input
                type="date"
                defaultValue={feature.start_date || ''}
                onChange={async (e) => {
                  await updateFeature.mutateAsync({ id: feature.id, start_date: e.target.value || null });
                  await logActivity({ action_type: 'dates', description: 'Updated start date', new_value: e.target.value });
                }}
                style={{ width: '100%', padding: '6px 10px', fontSize: 12, border: '1px solid var(--pb-border2)', borderRadius: 6, background: 'var(--pb-bg2)', color: 'var(--pb-text)' }}
              />
            </div>

            {/* Due Date */}
            <div>
              <label style={{ display: 'block', fontSize: 10.5, color: 'var(--pb-text3)', textTransform: 'uppercase', letterSpacing: '.02em', marginBottom: 4 }}>Due Date</label>
              <input
                type="date"
                defaultValue={feature.due_date || ''}
                onChange={async (e) => {
                  await updateFeature.mutateAsync({ id: feature.id, due_date: e.target.value || null });
                  await logActivity({ action_type: 'dates', description: 'Updated due date', new_value: e.target.value });
                }}
                style={{ width: '100%', padding: '6px 10px', fontSize: 12, border: '1px solid var(--pb-border2)', borderRadius: 6, background: 'var(--pb-bg2)', color: 'var(--pb-text)' }}
              />
            </div>

            {/* Sprint Points */}
            <div>
              <label style={{ display: 'block', fontSize: 10.5, color: 'var(--pb-text3)', textTransform: 'uppercase', letterSpacing: '.02em', marginBottom: 4 }}>Sprint Points</label>
              <input
                type="number"
                defaultValue={feature.story_points || 0}
                onBlur={async (e) => {
                  const pts = parseInt(e.target.value) || 0;
                  if (pts !== feature.story_points) {
                    await updateFeature.mutateAsync({ id: feature.id, story_points: pts });
                    await logActivity({ action_type: 'points', description: `Updated sprint points to ${pts}` });
                  }
                }}
                style={{ width: '100%', padding: '6px 10px', fontSize: 12, border: '1px solid var(--pb-border2)', borderRadius: 6, background: 'var(--pb-bg2)', color: 'var(--pb-text)' }}
              />
            </div>

            {/* Time Estimate */}
            <div>
              <label style={{ display: 'block', fontSize: 10.5, color: 'var(--pb-text3)', textTransform: 'uppercase', letterSpacing: '.02em', marginBottom: 4 }}>Time Estimate (hours)</label>
              <input
                type="number"
                defaultValue={feature.time_estimate || 0}
                onBlur={async (e) => {
                  const est = parseInt(e.target.value) || 0;
                  if (est !== feature.time_estimate) {
                    await updateFeature.mutateAsync({ id: feature.id, time_estimate: est });
                    await logActivity({ action_type: 'estimate', description: `Updated time estimate to ${est}h` });
                  }
                }}
                style={{ width: '100%', padding: '6px 10px', fontSize: 12, border: '1px solid var(--pb-border2)', borderRadius: 6, background: 'var(--pb-bg2)', color: 'var(--pb-text)' }}
              />
            </div>

            {/* Sprint */}
            <div>
              <label style={{ display: 'block', fontSize: 10.5, color: 'var(--pb-text3)', textTransform: 'uppercase', letterSpacing: '.02em', marginBottom: 4 }}>Sprint</label>
              <div style={{ position: 'relative' }}>
                <div onClick={() => setSprintDropOpen(o => !o)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between', padding: '6px 10px', border: '1px solid var(--pb-border2)', borderRadius: 6, background: 'var(--pb-bg2)', fontSize: 12.5 }}>
                  <span>{sprints.find(s => s.id === feature.sprint_id)?.name || 'Unassigned'}</span>
                  <span>▼</span>
                </div>
                {sprintDropOpen && (
                  <div style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, zIndex: 110, marginBottom: 4, background: 'var(--pb-bg2)', border: '1px solid var(--pb-border2)', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                    <div onClick={() => assignSprint(null)} style={{ padding: '8px 10px', cursor: 'pointer', fontSize: 12 }} onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--pb-bg3)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                      Unassigned
                    </div>
                    {sprints.map(s => (
                      <div key={s.id} onClick={() => assignSprint(s.id)} style={{ padding: '8px 10px', cursor: 'pointer', fontSize: 12, background: feature.sprint_id === s.id ? 'var(--pb-bg3)' : 'transparent' }} onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--pb-bg3)')} onMouseLeave={(e) => { if (feature.sprint_id !== s.id) e.currentTarget.style.background = 'transparent'; }}>
                        {s.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Objectives */}
            <div>
              <label style={{ display: 'block', fontSize: 10.5, color: 'var(--pb-text3)', textTransform: 'uppercase', letterSpacing: '.02em', marginBottom: 4 }}>Linked Objectives</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                {(() => {
                  const mappedObjs = objectives.filter(o => o.mapped_feature_ids.includes(feature.id));
                  if (mappedObjs.length === 0) return <span style={{ fontSize: 12, color: 'var(--pb-text3)' }}>No linked objectives</span>;
                  return mappedObjs.map(o => (
                    <span key={o.id} style={{ display: 'inline-block', padding: '2px 6px', fontSize: 10, background: 'var(--pb-gold-bg)', color: 'var(--pb-gold-600)', border: '1px solid var(--pb-gold-200)', borderRadius: 4 }}>
                      {o.name}
                    </span>
                  ));
                })()}
              </div>
              <div style={{ position: 'relative' }}>
                <div onClick={() => setObjDropOpen(o => !o)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between', padding: '6px 10px', border: '1px solid var(--pb-border2)', borderRadius: 6, background: 'var(--pb-bg2)', fontSize: 12.5 }}>
                  <span style={{ color: 'var(--pb-text3)' }}>+ Toggle Link</span>
                  <span>▼</span>
                </div>
                {objDropOpen && (
                  <div style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, zIndex: 110, marginBottom: 4, background: 'var(--pb-bg2)', border: '1px solid var(--pb-border2)', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                    {objectives.length === 0 ? (
                      <div style={{ padding: '8px 10px', fontSize: 12, color: 'var(--pb-text3)' }}>No objectives found</div>
                    ) : (
                      objectives.map(o => {
                        const isMapped = o.mapped_feature_ids.includes(feature.id);
                        return (
                          <div key={o.id} onClick={() => toggleObjectiveMapping(o.id)} style={{ padding: '8px 10px', cursor: 'pointer', fontSize: 12, background: isMapped ? 'var(--pb-bg3)' : 'transparent', display: 'flex', justifyItems: 'center', justifyContent: 'space-between' }} onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--pb-bg3)')} onMouseLeave={(e) => { if (!isMapped) e.currentTarget.style.background = 'transparent'; }}>
                            <span>{o.name}</span>
                            {isMapped && <span style={{ color: 'var(--pb-gold)' }}>✓</span>}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Danger Zone: Delete Feature */}
            <div style={{ borderTop: '1px solid var(--pb-border)', paddingTop: 16, marginTop: 10 }}>
              <button
                onClick={async () => {
                  if (confirm('Are you sure you want to delete this feature and all its sub-items?')) {
                    await deleteFeature.mutateAsync({ id: feature.id, listId });
                    onClose();
                    toast({ title: 'Feature deleted' });
                  }
                }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '8px 12px', border: '1px solid var(--pb-red-border)', borderRadius: 6,
                  background: 'var(--pb-red-bg)', color: 'var(--pb-red)', cursor: 'pointer', fontSize: 12.5, fontWeight: 500,
                  transition: 'background .12s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#fecaca55')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--pb-red-bg)')}
              >
                <Trash2 size={13} /> Delete Feature
              </button>
            </div>

          </div>
        </div>

      </div>
    </>
  );
}
