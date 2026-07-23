import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, Plus, Calendar, Flag, Filter, ArrowUpDown, LayoutList, Columns3, CheckCircle, Target, Package, Layers, Edit, Trash2, Archive, CheckSquare, Sparkles, AlertCircle } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useMyOrgs } from '@/hooks/useProdbodOrgs';
import { useOrgProducts } from '@/hooks/useProdbodProducts';
import { useProductLists } from '@/hooks/useLists';
import { useWorkspaceFeatures, Feature, useUpdateWorkspaceFeature, useCreateWorkspaceFeature } from '@/hooks/useWorkspaceFeatures';
import { useOrgMembersProdbod } from '@/hooks/useProdbodMembers';
import { useProductStatuses } from '@/hooks/useProductStatuses';
import { useProductLines, ProductLine } from '@/hooks/useProductLines';
import { useWorkspaceObjectives, Objective } from '@/hooks/useWorkspaceObjectives';
import { useSprints, SprintData, useSprintSnapshots, useSprintObjectives } from '@/hooks/useSprints';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell';
import { ListView } from '@/components/workspace/ListView';
import { BoardView } from '@/components/workspace/BoardView';
import { FeatureDetailPanel } from '@/components/workspace/FeatureDetailPanel';
import { PeoplePicker } from '@/components/dashboard/PeoplePicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

export default function ProductWorkspace() {
  const { productId, listId: routeListId } = useParams<{ productId: string; listId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { currentOrgId } = useApp();
  const { data: orgs = [] } = useMyOrgs();
  const { data: products = [] } = useOrgProducts(currentOrgId);
  const { data: lists = [], isLoading: listsLoading } = useProductLists(productId ?? null);
  const { data: members = [] } = useOrgMembersProdbod(currentOrgId);
  const { data: productStatuses = [] } = useProductStatuses(productId ?? null);
  
  // Custom API hooks
  const { productLines, createProductLine, updateProductLine } = useProductLines(productId ?? null);
  const { objectives, createObjective, updateObjective, deleteObjective, linkFeatureToObjective, unlinkFeatureFromObjective } = useWorkspaceObjectives(currentOrgId);
  const { sprints, createSprint, updateSprint, deleteSprint, linkObjectiveToSprint, unlinkObjectiveFromSprint, saveSprintSnapshot } = useSprints();
  const updateFeature = useUpdateWorkspaceFeature();
  const createFeatureMutation = useCreateWorkspaceFeature();

  // Tabs: backlog, sprints, objectives, product_lines
  const [activeTab, setActiveTab] = useState<'backlog' | 'sprints' | 'objectives' | 'product_lines'>('backlog');
  const [view, setView] = useState<'list' | 'board'>('list');
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);

  // Active items states
  const [activeLineId, setActiveLineId] = useState<string>('');
  const [activeSprintId, setActiveSprintId] = useState<string>('');
  const [activeObjId, setActiveObjId] = useState<string>('');

  // Sprints state
  const { data: activeSprintObjectives = [] } = useSprintObjectives(activeSprintId || null);
  const { data: activeSprintSnapshots = [] } = useSprintSnapshots(activeSprintId || null);

  // Modal/Dialog states
  const [showCreateLine, setShowCreateLine] = useState(false);
  const [showRenameLine, setShowRenameLine] = useState(false);
  const [newLineName, setNewLineName] = useState('');
  const [renameLineName, setRenameLineName] = useState('');

  const [showCreateSprint, setShowCreateSprint] = useState(false);
  const [showEditSprint, setShowEditSprint] = useState(false);
  const [sprintForm, setSprintForm] = useState({ name: '', goal: '', start_date: '', end_date: '', status: 'planned' });

  const [showCreateObj, setShowCreateObj] = useState(false);
  const [showEditObj, setShowEditObj] = useState(false);
  const [objForm, setObjForm] = useState({ name: '', description: '', owner_id: '', target_date: '', status: 'on_track' as Objective['status'] });

  // Filters state
  const [filterPhase, setFilterPhase] = useState<string>('__all__');
  const [filterAssignee, setFilterAssignee] = useState<string>('__all__');
  const [filterPriority, setFilterPriority] = useState<string>('__all__');
  const [filterObjective, setFilterObjective] = useState<string>('__all__');
  const [filterSprint, setFilterSprint] = useState<string>('__all__');

  // Sorting state
  const [sortBy, setSortBy] = useState<'priority' | 'due_date' | 'points'>('priority');

  // Inline assignee picker state
  const [pickerState, setPickerState] = useState<{ isOpen: boolean; featureId: string | null; title: string }>({ isOpen: false, featureId: null, title: 'Assign Team Member' });

  // 1. Query ALL workspace features for this product to avoid list-only limitations
  const { data: allFeatures = [], isLoading: featuresLoading } = useQuery({
    queryKey: ['workspace-features-all', productId],
    queryFn: async () => {
      if (!productId) return [];
      const { data, error } = await (supabase as any)
        .from('workspace_features')
        .select(`
          *,
          product_statuses (
            name,
            color,
            category
          ),
          objective_features (
            objective_id
          )
        `)
        .eq('product_id', productId)
        .order('position', { ascending: true });

      if (error) throw error;
      return (data || []) as Feature[];
    },
    enabled: !!productId,
  });

  const product = (products as any[]).find((p: any) => p.id === productId) ?? null;
  const progressEnabled = (product as any)?.progress_icons_enabled ?? false;
  const defaultStatusId = productStatuses.find(s => s.is_default)?.id ?? productStatuses[0]?.id ?? '';
  const currentOrg = orgs.find(o => o.id === currentOrgId);
  const orgName = currentOrg?.name || '—';
  const orgId = currentOrgId || product?.organization_id || '';

  // Get active listId (default Backlog list of product)
  const backlogListId = lists.find(l => l.is_default)?.id ?? lists[0]?.id ?? '';
  const listId = routeListId ?? backlogListId;
  const activeList = lists.find(l => l.id === listId) ?? null;

  // Auto-initialize active product line
  useEffect(() => {
    if (productLines.length > 0 && !activeLineId) {
      setActiveLineId(productLines[0].id);
    }
  }, [productLines, activeLineId]);

  // Auto-initialize active sprint
  useEffect(() => {
    if (sprints.length > 0 && !activeSprintId) {
      setActiveSprintId(sprints[0].id);
    }
  }, [sprints, activeSprintId]);

  // Auto-initialize active objective
  useEffect(() => {
    if (objectives.length > 0 && !activeObjId) {
      setActiveObjId(objectives[0].id);
    }
  }, [objectives, activeObjId]);

  // Handle assignees picker
  const handleAssign = (featureId: string) => {
    setPickerState({ isOpen: true, featureId, title: 'Assign Team Member' });
  };

  const handlePickerSelect = async (userId: string) => {
    if (pickerState.featureId) {
      await updateFeature.mutateAsync({ id: pickerState.featureId, assignee_id: userId });
      queryClient.invalidateQueries({ queryKey: ['workspace-features-all', productId] });
    }
    setPickerState(prev => ({ ...prev, isOpen: false }));
  };

  // 2. BACKLOG - Group, filter and sort features
  const filteredAndSortedFeatures = useMemo(() => {
    let result = allFeatures.filter(f => {
      // Must match the selected product line
      const lineId = f.product_line_id;
      if (activeLineId) {
        // Fallback for older features
        if (!lineId && activeLineId === productLines[0]?.id) return true;
        return lineId === activeLineId;
      }
      return true;
    });

    // Apply Filter bar
    if (filterPhase !== '__all__') {
      result = result.filter(f => f.status_id === filterPhase);
    }
    if (filterAssignee !== '__all__') {
      result = result.filter(f => f.assignee_id === filterAssignee);
    }
    if (filterPriority !== '__all__') {
      result = result.filter(f => f.priority === filterPriority);
    }
    if (filterObjective !== '__all__') {
      result = result.filter(f => (f as any).objective_features?.some((of: any) => of.objective_id === filterObjective));
    }
    if (filterSprint !== '__all__') {
      if (filterSprint === '__unassigned__') {
        result = result.filter(f => !f.sprint_id);
      } else {
        result = result.filter(f => f.sprint_id === filterSprint);
      }
    }

    // Apply Sorting (priority, due_date, story_points)
    const priorityWeights = { urgent: 5, high: 4, medium: 3, low: 2, none: 1 };
    result.sort((a, b) => {
      if (sortBy === 'priority') {
        const wa = priorityWeights[a.priority] || 0;
        const wb = priorityWeights[b.priority] || 0;
        return wb - wa;
      }
      if (sortBy === 'due_date') {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      if (sortBy === 'points') {
        return ((b as any).story_points || 0) - ((a as any).story_points || 0);
      }
      return 0;
    });

    return result;
  }, [allFeatures, activeLineId, filterPhase, filterAssignee, filterPriority, filterObjective, filterSprint, sortBy, productLines]);

  // 3. SPRINTS - Calculations
  const activeSprintFeatures = useMemo(() => {
    return allFeatures.filter(f => f.sprint_id === activeSprintId);
  }, [allFeatures, activeSprintId]);

  const sprintPointsMetrics = useMemo(() => {
    const total = activeSprintFeatures.reduce((acc, f) => acc + ((f as any).story_points || 0), 0);
    // Completed status category is 'done' (Ready for Prod status is category 'done')
    const completed = activeSprintFeatures
      .filter(f => {
        const name = f.product_statuses?.name?.toLowerCase() || f.status?.toLowerCase() || '';
        return name === 'ready for prod';
      })
      .reduce((acc, f) => acc + ((f as any).story_points || 0), 0);

    const totalFeatures = activeSprintFeatures.length;
    const completedFeatures = activeSprintFeatures.filter(f => {
      const name = f.product_statuses?.name?.toLowerCase() || f.status?.toLowerCase() || '';
      return name === 'ready for prod';
    }).length;

    const weightedProgress = total > 0 ? Math.round((completed / total) * 100) : 0;
    const countProgress = totalFeatures > 0 ? Math.round((completedFeatures / totalFeatures) * 100) : 0;

    return { total, completed, totalFeatures, completedFeatures, weightedProgress, countProgress };
  }, [activeSprintFeatures]);

  // Capture daily snapshot helper
  const handleCaptureSnapshot = async () => {
    if (!activeSprintId) return;
    try {
      // Prepare phase distribution counts
      const dist: Record<string, number> = {};
      productStatuses.forEach(ps => { dist[ps.name] = 0; });
      activeSprintFeatures.forEach(f => {
        const name = f.product_statuses?.name || f.status;
        dist[name] = (dist[name] || 0) + 1;
      });

      await saveSprintSnapshot({
        sprintId: activeSprintId,
        completedPoints: sprintPointsMetrics.completed,
        completedFeatures: sprintPointsMetrics.completedFeatures,
        featuresPerPhase: dist
      });
      toast({ title: 'Daily snapshot captured successfully' });
    } catch (e: any) {
      toast({ title: 'Snapshot capture failed', description: e.message, variant: 'destructive' });
    }
  };

  // Create Product Line
  const handleCreateLine = async () => {
    if (!newLineName.trim()) return;
    try {
      await createProductLine(newLineName.trim());
      setShowCreateLine(false);
      setNewLineName('');
      queryClient.invalidateQueries({ queryKey: ['product-lines', productId] });
    } catch {}
  };

  const handleRenameLine = async () => {
    if (!renameLineName.trim() || !activeLineId) return;
    try {
      await updateProductLine({ id: activeLineId, name: renameLineName.trim() });
      setShowRenameLine(false);
      setRenameLineName('');
      queryClient.invalidateQueries({ queryKey: ['product-lines', productId] });
    } catch {}
  };

  const handleArchiveLine = async () => {
    if (!activeLineId) return;
    if (confirm('Are you sure you want to archive this Product Line? All backlog tasks will remain but the line layout is archived.')) {
      try {
        await updateProductLine({ id: activeLineId, is_archived: true });
        setActiveLineId('');
        queryClient.invalidateQueries({ queryKey: ['product-lines', productId] });
      } catch {}
    }
  };

  // Sprint Form handler
  const handleSprintSubmit = async () => {
    if (!sprintForm.name) return;
    try {
      if (showCreateSprint) {
        await createSprint({
          name: sprintForm.name,
          goal: sprintForm.goal,
          start_date: sprintForm.start_date || undefined,
          end_date: sprintForm.end_date || undefined,
        });
      } else {
        await updateSprint({
          id: activeSprintId,
          name: sprintForm.name,
          goal: sprintForm.goal,
          start_date: sprintForm.start_date || null,
          end_date: sprintForm.end_date || null,
          status: sprintForm.status,
        });
      }
      setShowCreateSprint(false);
      setShowEditSprint(false);
      queryClient.invalidateQueries({ queryKey: ['sprints', productId] });
    } catch {}
  };

  // Objective Form handler
  const handleObjSubmit = async () => {
    if (!objForm.name) return;
    try {
      if (showCreateObj) {
        await createObjective({
          name: objForm.name,
          description: objForm.description,
          owner_id: objForm.owner_id || null,
          target_date: objForm.target_date || null,
          status: objForm.status
        });
      } else {
        await updateObjective({
          id: activeObjId,
          name: objForm.name,
          description: objForm.description,
          owner_id: objForm.owner_id || null,
          target_date: objForm.target_date || null,
          status: objForm.status
        });
      }
      setShowCreateObj(false);
      setShowEditObj(false);
      queryClient.invalidateQueries({ queryKey: ['workspace-objectives', currentOrgId] });
    } catch {}
  };

  // Safe transfer of features between product lines
  const handleTransferProductLine = async (featureId: string, destLineId: string) => {
    try {
      await updateFeature.mutateAsync({ id: featureId, product_line_id: destLineId });
      queryClient.invalidateQueries({ queryKey: ['workspace-features-all', productId] });
      toast({ title: 'Feature transferred successfully' });
    } catch {}
  };

  // Loading states
  if (listsLoading || featuresLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--pb-gold)' }} />
      </div>
    );
  }

  return (
    <div className="prodbod" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      
      {/* Tab bar header */}
      <div style={{
        background: 'var(--pb-bg2)', borderBottom: '1px solid var(--pb-border)',
        display: 'flex', alignItems: 'center', padding: '0 20px', justifyContent: 'space-between', flexShrink: 0
      }}>
        <div style={{ display: 'flex', gap: 24 }}>
          {['backlog', 'sprints', 'objectives', 'product_lines'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              style={{
                background: 'transparent', border: 'none', padding: '14px 4px', cursor: 'pointer',
                fontFamily: "'Syne', sans-serif", fontSize: 13.5, fontWeight: activeTab === tab ? 700 : 500,
                color: activeTab === tab ? 'var(--pb-text)' : 'var(--pb-text3)',
                borderBottom: activeTab === tab ? '2.5px solid var(--pb-gold)' : '2.5px solid transparent',
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1).replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Action button inside tab bar */}
        {activeTab === 'backlog' && (
          <button
            onClick={async () => {
              // Add feature directly
              try {
                const title = prompt('Enter feature title:');
                if (!title) return;
                const newFeat = await createFeatureMutation.mutateAsync({
                  title: title.trim(),
                  listId,
                  productId: productId!,
                  orgId,
                  level: 'feature',
                  status: 'idea_or_problem',
                  statusId: defaultStatusId,
                  position: allFeatures.filter(f => f.parent_id === null).length
                });

                // Set product line
                if (activeLineId) {
                  await updateFeature.mutateAsync({ id: newFeat.id, product_line_id: activeLineId });
                }
                queryClient.invalidateQueries({ queryKey: ['workspace-features-all', productId] });
                toast({ title: 'Feature created successfully' });
              } catch {}
            }}
            style={{ padding: '6px 14px', borderRadius: 6, background: 'var(--pb-accent)', color: '#fff', fontSize: 12.5, fontWeight: 500, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={13} /> Add Feature
          </button>
        )}
      </div>

      {/* Tabs panels */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* BACKLOG VIEW TAB */}
        {activeTab === 'backlog' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            
            {/* Filter and Sort Subbar */}
            <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--pb-border)', background: 'var(--pb-bg2)', display: 'flex', flexWrap: 'wrap', gap: 12, justifyItems: 'center', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                
                {/* Product Line Switcher dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginRight: 12 }}>
                  <Layers size={13} style={{ color: 'var(--pb-text3)' }} />
                  <select
                    value={activeLineId}
                    onChange={(e) => setActiveLineId(e.target.value)}
                    style={{ border: '1px solid var(--pb-border2)', borderRadius: 6, padding: '4px 8px', fontSize: 12, background: 'var(--pb-bg)', fontWeight: 600, color: 'var(--pb-text)' }}
                  >
                    {productLines.filter(l => !l.is_archived).map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                  {activeLineId && (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => { setRenameLineName(productLines.find(l => l.id === activeLineId)?.name || ''); setShowRenameLine(true); }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--pb-text3)' }} title="Rename Product Line"><Edit size={12} /></button>
                      <button onClick={handleArchiveLine} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--pb-text3)' }} title="Archive Product Line"><Archive size={12} /></button>
                    </div>
                  )}
                  <button onClick={() => setShowCreateLine(true)} style={{ padding: '4px 6px', background: 'transparent', border: '1px dashed var(--pb-border2)', borderRadius: 6, fontSize: 11, cursor: 'pointer', color: 'var(--pb-text2)' }}>+ Line</button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--pb-text3)', fontSize: 12 }}><Filter size={12} /> Filters:</div>
                
                {/* Phase Filter */}
                <select value={filterPhase} onChange={e => setFilterPhase(e.target.value)} style={{ fontSize: 11.5, background: 'var(--pb-bg3)', border: '1px solid var(--pb-border)', borderRadius: 6, padding: '3px 8px', color: 'var(--pb-text2)' }}>
                  <option value="__all__">All Phases</option>
                  {productStatuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>

                {/* Assignee Filter */}
                <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)} style={{ fontSize: 11.5, background: 'var(--pb-bg3)', border: '1px solid var(--pb-border)', borderRadius: 6, padding: '3px 8px', color: 'var(--pb-text2)' }}>
                  <option value="__all__">All Assignees</option>
                  {members.map(m => <option key={m.id} value={m.member_user_id}>{m.name || m.email}</option>)}
                </select>

                {/* Priority Filter */}
                <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={{ fontSize: 11.5, background: 'var(--pb-bg3)', border: '1px solid var(--pb-border)', borderRadius: 6, padding: '3px 8px', color: 'var(--pb-text2)' }}>
                  <option value="__all__">All Priorities</option>
                  <option value="critical">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Normal</option>
                  <option value="low">Low</option>
                  <option value="none">None</option>
                </select>

                {/* Objective Filter */}
                <select value={filterObjective} onChange={e => setFilterObjective(e.target.value)} style={{ fontSize: 11.5, background: 'var(--pb-bg3)', border: '1px solid var(--pb-border)', borderRadius: 6, padding: '3px 8px', color: 'var(--pb-text2)' }}>
                  <option value="__all__">All Objectives</option>
                  {objectives.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>

                {/* Sprint Filter */}
                <select value={filterSprint} onChange={e => setFilterSprint(e.target.value)} style={{ fontSize: 11.5, background: 'var(--pb-bg3)', border: '1px solid var(--pb-border)', borderRadius: 6, padding: '3px 8px', color: 'var(--pb-text2)' }}>
                  <option value="__all__">All Sprints</option>
                  <option value="__unassigned__">No Sprint / Unscheduled</option>
                  {sprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {/* Sorting & Views controls */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--pb-text3)' }}>
                  <ArrowUpDown size={12} /> Sort:
                </div>
                <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} style={{ fontSize: 11.5, background: 'var(--pb-bg3)', border: '1px solid var(--pb-border)', borderRadius: 6, padding: '3px 8px', color: 'var(--pb-text2)', marginRight: 10 }}>
                  <option value="priority">Priority</option>
                  <option value="due_date">Due Date</option>
                  <option value="points">Sprint Points</option>
                </select>

                <div style={{ display: 'flex', gap: 2, background: 'var(--pb-bg3)', padding: 3, borderRadius: 8, border: '1px solid var(--pb-border)' }}>
                  <button onClick={() => setView('list')} style={{ padding: '4px 10px', fontSize: 11.5, borderRadius: 6, border: view === 'list' ? '1px solid var(--pb-border2)' : 'none', background: view === 'list' ? 'var(--pb-bg2)' : 'transparent', cursor: 'pointer', color: view === 'list' ? 'var(--pb-text)' : 'var(--pb-text3)' }}><LayoutList size={12} /></button>
                  <button onClick={() => setView('board')} style={{ padding: '4px 10px', fontSize: 11.5, borderRadius: 6, border: view === 'board' ? '1px solid var(--pb-border2)' : 'none', background: view === 'board' ? 'var(--pb-bg2)' : 'transparent', cursor: 'pointer', color: view === 'board' ? 'var(--pb-text)' : 'var(--pb-text3)' }}><Columns3 size={12} /></button>
                </div>
              </div>
            </div>

            {/* Backlog Features List / Board content */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              {productLines.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--pb-text3)' }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>📂</div>
                  <h3 style={{ fontWeight: 600, color: 'var(--pb-text)', marginBottom: 4 }}>No Product Lines Configured</h3>
                  <p style={{ fontSize: 13, marginBottom: 16 }}>Create a Product Line to start organizing your product features backlog.</p>
                  <Button onClick={() => setShowCreateLine(true)}>+ Create Product Line</Button>
                </div>
              ) : view === 'list' ? (
                <ListView
                  features={filteredAndSortedFeatures}
                  listId={listId}
                  productId={productId!}
                  orgId={orgId}
                  onOpenDetail={setSelectedFeature}
                  onAssign={handleAssign}
                  members={members}
                  productStatuses={productStatuses}
                  progressEnabled={progressEnabled}
                  sprints={sprints}
                />
              ) : (
                <BoardView
                  features={filteredAndSortedFeatures}
                  listId={listId}
                  productId={productId!}
                  orgId={orgId}
                  onOpenDetail={setSelectedFeature}
                  productStatuses={productStatuses}
                />
              )}
            </div>

          </div>
        )}

        {/* SPRINTS VIEW TAB */}
        {activeTab === 'sprints' && (
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: 20, gap: 20 }}>
            
            {/* Left sidebar: Sprints selector list */}
            <div style={{ width: 220, display: 'flex', flexDirection: 'column', gap: 12, borderRight: '1px solid var(--pb-border)', paddingRight: 16, flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--pb-text2)', fontFamily: "'Syne', sans-serif" }}>Sprints</span>
                <button onClick={() => { setSprintForm({ name: '', goal: '', start_date: '', end_date: '', status: 'planned' }); setShowCreateSprint(true); }} style={{ padding: '3px 8px', background: 'transparent', border: '1px solid var(--pb-border2)', borderRadius: 6, fontSize: 11, cursor: 'pointer', color: 'var(--pb-text)' }}>+ Create</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>
                {sprints.length === 0 ? (
                  <div style={{ padding: 12, border: '1px dashed var(--pb-border)', borderRadius: 8, color: 'var(--pb-text3)', fontSize: 12.5, textAlign: 'center' }}>No Sprints yet</div>
                ) : (
                  sprints.map(s => {
                    const isSelected = s.id === activeSprintId;
                    return (
                      <div
                        key={s.id}
                        onClick={() => setActiveSprintId(s.id)}
                        style={{
                          padding: '10px 12px', borderRadius: 8, cursor: 'pointer', transition: 'all .1s',
                          border: isSelected ? '1px solid var(--pb-gold)' : '1px solid var(--pb-border)',
                          background: isSelected ? 'var(--pb-gold-bg)' : 'var(--pb-bg2)',
                          color: 'var(--pb-text)'
                        }}
                      >
                        <div style={{ fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>{s.name}</span>
                          <span style={{ fontSize: 9.5, textTransform: 'uppercase', color: 'var(--pb-text3)', padding: '1px 4px', background: '#0001', borderRadius: 4 }}>{s.status}</span>
                        </div>
                        {s.start_date && (
                          <div style={{ fontSize: 10.5, color: 'var(--pb-text3)', marginTop: 4 }}>
                            {s.start_date} to {s.end_date || '—'}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right container: Active sprint details panel */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto' }}>
              {(() => {
                const sprint = sprints.find(s => s.id === activeSprintId);
                if (!sprint) {
                  return (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--pb-border)', borderRadius: 12, color: 'var(--pb-text3)', fontSize: 13.5 }}>
                      Select a Sprint or create one from the left sidebar
                    </div>
                  );
                }

                return (
                  <>
                    {/* Sprint Header & Info */}
                    <div style={{ padding: '16px 20px', background: 'var(--pb-bg2)', border: '1px solid var(--pb-border)', borderRadius: 12, display: 'flex', justifyItems: 'center', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--pb-text)', fontFamily: "'Syne', sans-serif" }}>{sprint.name}</h2>
                        {sprint.goal && <p style={{ fontSize: 13, color: 'var(--pb-text2)', marginTop: 4 }}>Goal: {sprint.goal}</p>}
                        <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 12, color: 'var(--pb-text3)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={13} /> {sprint.start_date || 'No Start Date'} to {sprint.end_date || 'No End Date'}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => { setSprintForm({ name: sprint.name, goal: sprint.goal, start_date: sprint.start_date || '', end_date: sprint.end_date || '', status: sprint.status }); setShowEditSprint(true); }} style={{ padding: '6px 12px', fontSize: 12, background: 'transparent', border: '1px solid var(--pb-border2)', borderRadius: 6, color: 'var(--pb-text)', cursor: 'pointer' }}>Edit Sprint</button>
                        <button
                          onClick={async () => {
                            if (confirm('Delete this Sprint? Features assigned will revert to no sprint.')) {
                              await deleteSprint(sprint.id);
                              setActiveSprintId('');
                            }
                          }}
                          style={{ padding: '6px 12px', fontSize: 12, background: 'var(--pb-red-bg)', border: '1px solid var(--pb-red-border)', borderRadius: 6, color: 'var(--pb-red)', cursor: 'pointer' }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Progress Dashboard */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                      
                      {/* Weighted Points Progress */}
                      <div style={{ padding: 16, background: 'var(--pb-bg2)', border: '1px solid var(--pb-border)', borderRadius: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--pb-text3)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Weighted Progress (Points)</div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
                          <span style={{ fontSize: 24, fontWeight: 700 }}>{sprintPointsMetrics.weightedProgress}%</span>
                          <span style={{ fontSize: 12, color: 'var(--pb-text3)' }}>{sprintPointsMetrics.completed} / {sprintPointsMetrics.total} pts</span>
                        </div>
                        <div style={{ width: '100%', height: 6, background: 'var(--pb-border2)', borderRadius: 3, marginTop: 8, overflow: 'hidden' }}>
                          <div style={{ width: `${sprintPointsMetrics.weightedProgress}%`, height: '100%', background: 'var(--pb-gold)' }} />
                        </div>
                      </div>

                      {/* Count Features Progress */}
                      <div style={{ padding: 16, background: 'var(--pb-bg2)', border: '1px solid var(--pb-border)', borderRadius: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--pb-text3)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Count Progress (Features)</div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
                          <span style={{ fontSize: 24, fontWeight: 700 }}>{sprintPointsMetrics.countProgress}%</span>
                          <span style={{ fontSize: 12, color: 'var(--pb-text3)' }}>{sprintPointsMetrics.completedFeatures} / {sprintPointsMetrics.totalFeatures} features</span>
                        </div>
                        <div style={{ width: '100%', height: 6, background: 'var(--pb-border2)', borderRadius: 3, marginTop: 8, overflow: 'hidden' }}>
                          <div style={{ width: `${sprintPointsMetrics.countProgress}%`, height: '100%', background: 'var(--pb-accent)' }} />
                        </div>
                      </div>

                      {/* Sprint Point Total */}
                      <div style={{ padding: 16, background: 'var(--pb-bg2)', border: '1px solid var(--pb-border)', borderRadius: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--pb-text3)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Sprint Snapshot & Trends</div>
                        <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                          <button onClick={handleCaptureSnapshot} style={{ flex: 1, padding: '8px', fontSize: 12, fontWeight: 600, background: 'var(--pb-accent)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', gap: 6 }}>
                            <Sparkles size={13} /> Capture Snapshot
                          </button>
                        </div>
                        <span style={{ fontSize: 9.5, color: 'var(--pb-text3)', display: 'block', marginTop: 5 }}>Save daily metrics to power burndown chart logs.</span>
                      </div>

                    </div>

                    {/* Mapped sprint objectives */}
                    <div style={{ padding: 16, background: 'var(--pb-bg2)', border: '1px solid var(--pb-border)', borderRadius: 12 }}>
                      <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--pb-text3)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Linked Sprint Objectives</label>
                        <select
                          value=""
                          onChange={async (e) => {
                            if (e.target.value) {
                              const val = e.target.value;
                              const isLinked = activeSprintObjectives.includes(val);
                              if (isLinked) {
                                await unlinkObjectiveFromSprint({ sprintId: sprint.id, objectiveId: val });
                              } else {
                                await linkObjectiveToSprint({ sprintId: sprint.id, objectiveId: val });
                              }
                              e.target.value = '';
                            }
                          }}
                          style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: 'var(--pb-bg3)', border: '1px solid var(--pb-border)' }}
                        >
                          <option value="">+ Toggle Link Objective</option>
                          {objectives.map(o => (
                            <option key={o.id} value={o.id}>{o.name}</option>
                          ))}
                        </select>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {activeSprintObjectives.length === 0 ? (
                          <span style={{ fontSize: 12.5, color: 'var(--pb-text3)' }}>No objectives linked to this sprint yet.</span>
                        ) : (
                          activeSprintObjectives.map(oid => {
                            const obj = objectives.find(o => o.id === oid);
                            if (!obj) return null;
                            return (
                              <span key={oid} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', fontSize: 11.5, background: 'var(--pb-gold-bg)', color: 'var(--pb-gold-600)', border: '1px solid var(--pb-gold-200)', borderRadius: 6 }}>
                                <Target size={12} /> {obj.name}
                              </span>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Assigned Sprint Features List */}
                    <div style={{ padding: 16, background: 'var(--pb-bg2)', border: '1px solid var(--pb-border)', borderRadius: 12 }}>
                      <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--pb-text3)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Features in Sprint ({activeSprintFeatures.length})</label>
                        <select
                          value=""
                          onChange={async (e) => {
                            if (e.target.value) {
                              await updateFeature.mutateAsync({ id: e.target.value, sprint_id: sprint.id });
                              queryClient.invalidateQueries({ queryKey: ['workspace-features-all', productId] });
                              e.target.value = '';
                            }
                          }}
                          style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: 'var(--pb-bg3)', border: '1px solid var(--pb-border)' }}
                        >
                          <option value="">+ Assign Backlog Feature</option>
                          {allFeatures.filter(f => !f.sprint_id && f.level === 'feature').map(f => (
                            <option key={f.id} value={f.id}>{f.title}</option>
                          ))}
                        </select>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {activeSprintFeatures.length === 0 ? (
                          <div style={{ padding: 16, border: '1px dashed var(--pb-border)', borderRadius: 8, color: 'var(--pb-text3)', fontSize: 12.5, textAlign: 'center' }}>No features assigned yet</div>
                        ) : (
                          activeSprintFeatures.map(f => (
                            <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', border: '1px solid var(--pb-border)', borderRadius: 8, fontSize: 13 }}>
                              <span style={{ color: 'var(--pb-text)' }} onClick={() => setSelectedFeature(f)} className="hover:underline cursor-pointer flex-1">{f.title}</span>
                              <span style={{ fontSize: 11, padding: '2px 6px', background: f.product_statuses?.color + '20', color: f.product_statuses?.color, borderRadius: 12 }}>{f.product_statuses?.name}</span>
                              <span style={{ fontSize: 11, color: 'var(--pb-text3)' }}>{(f as any).story_points || 0} pts</span>
                              <button
                                onClick={async () => {
                                  await updateFeature.mutateAsync({ id: f.id, sprint_id: null });
                                  queryClient.invalidateQueries({ queryKey: ['workspace-features-all', productId] });
                                }}
                                style={{ border: 'none', background: 'transparent', color: 'var(--pb-text3)', cursor: 'pointer' }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--pb-red)')}
                                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--pb-text3)')}
                              >
                                Remove
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Historical Sprint Snapshots */}
                    <div style={{ padding: 16, background: 'var(--pb-bg2)', border: '1px solid var(--pb-border)', borderRadius: 12 }}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--pb-text3)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 12 }}>Historical Snapshots Logs</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {activeSprintSnapshots.length === 0 ? (
                          <div style={{ padding: 8, fontSize: 12.5, color: 'var(--pb-text3)' }}>No historical snapshots taken.</div>
                        ) : (
                          activeSprintSnapshots.map(snap => (
                            <div key={snap.id} style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--pb-bg3)', border: '1px solid var(--pb-border)', borderRadius: 6, fontSize: 12 }}>
                              <span style={{ fontWeight: 600 }}>{snap.snapshot_date}</span>
                              <span>Completed Points: {snap.completed_points} pts</span>
                              <span>Completed Features: {snap.completed_features}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

          </div>
        )}

        {/* OBJECTIVES TAB */}
        {activeTab === 'objectives' && (
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: 20, gap: 20 }}>
            
            {/* Left sidebar: Objectives selector */}
            <div style={{ width: 220, display: 'flex', flexDirection: 'column', gap: 12, borderRight: '1px solid var(--pb-border)', paddingRight: 16, flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--pb-text2)', fontFamily: "'Syne', sans-serif" }}>Objectives</span>
                <button onClick={() => { setObjForm({ name: '', description: '', owner_id: '', target_date: '', status: 'on_track' }); setShowCreateObj(true); }} style={{ padding: '3px 8px', background: 'transparent', border: '1px solid var(--pb-border2)', borderRadius: 6, fontSize: 11, cursor: 'pointer', color: 'var(--pb-text)' }}>+ Create</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>
                {objectives.length === 0 ? (
                  <div style={{ padding: 12, border: '1px dashed var(--pb-border)', borderRadius: 8, color: 'var(--pb-text3)', fontSize: 12.5, textAlign: 'center' }}>No objectives yet</div>
                ) : (
                  objectives.map(o => {
                    const isSelected = o.id === activeObjId;
                    return (
                      <div
                        key={o.id}
                        onClick={() => setActiveObjId(o.id)}
                        style={{
                          padding: '10px 12px', borderRadius: 8, cursor: 'pointer', transition: 'all .1s',
                          border: isSelected ? '1px solid var(--pb-gold)' : '1px solid var(--pb-border)',
                          background: isSelected ? 'var(--pb-gold-bg)' : 'var(--pb-bg2)',
                          color: 'var(--pb-text)'
                        }}
                      >
                        <div style={{ fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{o.name}</span>
                          <span style={{ fontSize: 9, color: 'var(--pb-text2)', padding: '1px 4px', background: '#0001', borderRadius: 4 }}>{o.status.replace('_', ' ')}</span>
                        </div>
                        <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                          <div style={{ flex: 1, height: 4, background: 'var(--pb-border2)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ width: `${o.progress}%`, height: '100%', background: 'var(--pb-gold)' }} />
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 700, marginLeft: 6 }}>{o.progress}%</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right panel: Selected Objective Details */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto' }}>
              {(() => {
                const obj = objectives.find(o => o.id === activeObjId);
                if (!obj) {
                  return (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--pb-border)', borderRadius: 12, color: 'var(--pb-text3)', fontSize: 13.5 }}>
                      Select an Objective or create one from the left sidebar
                    </div>
                  );
                }

                const ownerName = members.find(m => m.member_user_id === obj.owner_id)?.name || 'Unassigned';

                return (
                  <>
                    {/* Objective info banner */}
                    <div style={{ padding: '16px 20px', background: 'var(--pb-bg2)', border: '1px solid var(--pb-border)', borderRadius: 12, display: 'flex', justifyItems: 'center', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--pb-text)', fontFamily: "'Syne', sans-serif" }}>{obj.name}</h2>
                        {obj.description && <p style={{ fontSize: 13, color: 'var(--pb-text2)', marginTop: 4 }}>{obj.description}</p>}
                        <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 12, color: 'var(--pb-text3)' }}>
                          <span><strong>Owner:</strong> {ownerName}</span>
                          <span><strong>Target Date:</strong> {obj.target_date || 'None'}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => { setObjForm({ name: obj.name, description: obj.description, owner_id: obj.owner_id || '', target_date: obj.target_date || '', status: obj.status }); setShowEditObj(true); }} style={{ padding: '6px 12px', fontSize: 12, background: 'transparent', border: '1px solid var(--pb-border2)', borderRadius: 6, color: 'var(--pb-text)', cursor: 'pointer' }}>Edit</button>
                        <button
                          onClick={async () => {
                            if (confirm('Are you sure you want to delete this objective?')) {
                              await deleteObjective(obj.id);
                              setActiveObjId('');
                            }
                          }}
                          style={{ padding: '6px 12px', fontSize: 12, background: 'var(--pb-red-bg)', border: '1px solid var(--pb-red-border)', borderRadius: 6, color: 'var(--pb-red)', cursor: 'pointer' }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Progress details block */}
                    <div style={{ padding: 16, background: 'var(--pb-bg2)', border: '1px solid var(--pb-border)', borderRadius: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--pb-text3)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Automatic Progress roll-up</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
                        <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--pb-gold)' }}>{obj.progress}%</span>
                        <span style={{ fontSize: 12, color: 'var(--pb-text3)' }}>Live Features / Mapped Features</span>
                      </div>
                      <div style={{ width: '100%', height: 8, background: 'var(--pb-border2)', borderRadius: 4, marginTop: 8, overflow: 'hidden' }}>
                        <div style={{ width: `${obj.progress}%`, height: '100%', background: 'var(--pb-gold)' }} />
                      </div>
                      <span style={{ fontSize: 10, color: 'var(--pb-text3)', display: 'block', marginTop: 6 }}>Recalculates automatically. Features status category must be 'Live'.</span>
                    </div>

                    {/* Manage mapped features checklist */}
                    <div style={{ padding: 16, background: 'var(--pb-bg2)', border: '1px solid var(--pb-border)', borderRadius: 12 }}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--pb-text3)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 12 }}>Mapped Backlog Features</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {allFeatures.filter(f => f.level === 'feature').map(f => {
                          const isMapped = obj.mapped_feature_ids.includes(f.id);
                          return (
                            <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                              <input
                                type="checkbox"
                                checked={isMapped}
                                onChange={async (e) => {
                                  if (e.target.checked) {
                                    await linkFeatureToObjective({ objectiveId: obj.id, featureId: f.id });
                                  } else {
                                    await unlinkFeatureFromObjective({ objectiveId: obj.id, featureId: f.id });
                                  }
                                  queryClient.invalidateQueries({ queryKey: ['workspace-features-all', productId] });
                                }}
                                style={{ cursor: 'pointer' }}
                              />
                              <span style={{ color: 'var(--pb-text)', flex: 1 }}>{f.title}</span>
                              <span style={{ fontSize: 11, padding: '2px 6px', background: f.product_statuses?.color + '20', color: f.product_statuses?.color, borderRadius: 12 }}>{f.product_statuses?.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

          </div>
        )}

        {/* PRODUCT LINES VIEW TAB */}
        {activeTab === 'product_lines' && (
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Syne', sans-serif" }}>Product Line Backlogs</h2>
                <p style={{ fontSize: 12.5, color: 'var(--pb-text3)' }}>Organize features into discrete Product Lines backlog spaces.</p>
              </div>
              <button onClick={() => setShowCreateLine(true)} style={{ padding: '6px 14px', borderRadius: 6, background: 'var(--pb-accent)', color: '#fff', border: 'none', fontSize: 12.5, fontWeight: 500, cursor: 'pointer' }}>+ Add Product Line</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginTop: 12 }}>
              {productLines.map(line => (
                <div key={line.id} style={{ padding: 16, border: '1px solid var(--pb-border)', background: 'var(--pb-bg2)', borderRadius: 12, opacity: line.is_archived ? 0.5 : 1 }}>
                  <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--pb-text)' }}>{line.name}</span>
                    {line.is_archived && <span style={{ fontSize: 10, color: 'var(--pb-text3)', padding: '2px 6px', background: 'var(--pb-bg3)', borderRadius: 4 }}>Archived</span>}
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--pb-text2)', marginBottom: 12 }}>
                    Active features: {allFeatures.filter(f => f.product_line_id === line.id).length} items
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => {
                        setActiveLineId(line.id);
                        setActiveTab('backlog');
                      }}
                      style={{ flex: 1, padding: '6px', fontSize: 11.5, background: 'transparent', border: '1px solid var(--pb-border2)', borderRadius: 6, cursor: 'pointer', color: 'var(--pb-text2)' }}
                    >
                      View Backlog
                    </button>
                    {!line.is_archived ? (
                      <button
                        onClick={async () => {
                          if (confirm('Archive this product line?')) {
                            await updateProductLine({ id: line.id, is_archived: true });
                            queryClient.invalidateQueries({ queryKey: ['product-lines', productId] });
                          }
                        }}
                        style={{ padding: '6px 10px', fontSize: 11.5, background: 'var(--pb-red-bg)', border: '1px solid var(--pb-red-border)', borderRadius: 6, cursor: 'pointer', color: 'var(--pb-red)' }}
                      >
                        Archive
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          await updateProductLine({ id: line.id, is_archived: false });
                          queryClient.invalidateQueries({ queryKey: ['product-lines', productId] });
                        }}
                        style={{ padding: '6px 10px', fontSize: 11.5, background: 'var(--pb-bg3)', border: '1px solid var(--pb-border2)', borderRadius: 6, cursor: 'pointer', color: 'var(--pb-text)' }}
                      >
                        Unarchive
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* DIALOGS SECTION */}

      {/* Create Product Line Dialog */}
      <Dialog open={showCreateLine} onOpenChange={setShowCreateLine}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle>New Product Line</DialogTitle></DialogHeader>
          <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Product Line Name</label>
            <Input placeholder="e.g. Core Platform, Mobile Banking, Integrations" value={newLineName} onChange={e => setNewLineName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateLine(false)}>Cancel</Button>
            <Button onClick={handleCreateLine} disabled={!newLineName.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Product Line Dialog */}
      <Dialog open={showRenameLine} onOpenChange={setShowRenameLine}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle>Rename Product Line</DialogTitle></DialogHeader>
          <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Rename To</label>
            <Input value={renameLineName} onChange={e => setRenameLineName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameLine(false)}>Cancel</Button>
            <Button onClick={handleRenameLine} disabled={!renameLineName.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Sprint Dialog */}
      <Dialog open={showCreateSprint || showEditSprint} onOpenChange={c => { setShowCreateSprint(c); setShowEditSprint(c); }}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader><DialogTitle>{showCreateSprint ? 'New Sprint' : 'Edit Sprint'}</DialogTitle></DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '12px 0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 600 }}>Sprint Name</label>
              <Input value={sprintForm.name} onChange={e => setSprintForm(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. Sprint 14" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 600 }}>Goal</label>
              <Textarea value={sprintForm.goal} onChange={e => setSprintForm(prev => ({ ...prev, goal: e.target.value }))} placeholder="What is the goal of this sprint?" rows={2} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Start Date</label>
                <Input type="date" value={sprintForm.start_date} onChange={e => setSprintForm(prev => ({ ...prev, start_date: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 600 }}>End Date</label>
                <Input type="date" value={sprintForm.end_date} onChange={e => setSprintForm(prev => ({ ...prev, end_date: e.target.value }))} />
              </div>
            </div>
            {showEditSprint && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Status</label>
                <select value={sprintForm.status} onChange={e => setSprintForm(prev => ({ ...prev, status: e.target.value }))} style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid var(--pb-border2)', borderRadius: 6, background: 'var(--pb-bg)', color: 'var(--pb-text)' }}>
                  <option value="planned">Planned</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreateSprint(false); setShowEditSprint(false); }}>Cancel</Button>
            <Button onClick={handleSprintSubmit} disabled={!sprintForm.name}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Objective Dialog */}
      <Dialog open={showCreateObj || showEditObj} onOpenChange={c => { setShowCreateObj(c); setShowEditObj(c); }}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader><DialogTitle>{showCreateObj ? 'New Objective' : 'Edit Objective'}</DialogTitle></DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '12px 0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 600 }}>Objective Name</label>
              <Input value={objForm.name} onChange={e => setObjForm(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. Increase conversion rate" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 600 }}>Description</label>
              <Textarea value={objForm.description} onChange={e => setObjForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Objective details..." rows={2} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 600 }}>Owner</label>
              <select value={objForm.owner_id} onChange={e => setObjForm(prev => ({ ...prev, owner_id: e.target.value }))} style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid var(--pb-border2)', borderRadius: 6, background: 'var(--pb-bg)', color: 'var(--pb-text)' }}>
                <option value="">Select owner</option>
                {members.map(m => (
                  <option key={m.id} value={m.member_user_id}>{m.name || m.email}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 600 }}>Target Date</label>
              <Input type="date" value={objForm.target_date} onChange={e => setObjForm(prev => ({ ...prev, target_date: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 600 }}>Status</label>
              <select value={objForm.status} onChange={e => setObjForm(prev => ({ ...prev, status: e.target.value as any }))} style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid var(--pb-border2)', borderRadius: 6, background: 'var(--pb-bg)', color: 'var(--pb-text)' }}>
                <option value="on_track">On Track</option>
                <option value="at_risk">At Risk</option>
                <option value="off_track">Off Track</option>
                <option value="achieved">Achieved</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreateObj(false); setShowEditObj(false); }}>Cancel</Button>
            <Button onClick={handleObjSubmit} disabled={!objForm.name}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Feature detail slideover */}
      {selectedFeature && (
        <FeatureDetailPanel
          feature={selectedFeature}
          allFeatures={allFeatures}
          listId={listId}
          productId={productId!}
          orgId={orgId}
          onClose={() => {
            setSelectedFeature(null);
            queryClient.invalidateQueries({ queryKey: ['workspace-features-all', productId] });
          }}
          onOpenDetail={setSelectedFeature}
          onAssign={handleAssign}
          members={members}
        />
      )}

      {/* People picker modal */}
      <PeoplePicker
        isOpen={pickerState.isOpen}
        title={pickerState.title}
        onSelect={handlePickerSelect}
        onClose={() => setPickerState(prev => ({ ...prev, isOpen: false }))}
      />

    </div>
  );
}
