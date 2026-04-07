import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus, LayoutList, Columns3, Loader2, Sparkles, Filter, ChevronDown, ChevronRight, X, MoreHorizontal,
} from 'lucide-react';
import { useFeatures, FeatureData } from '@/hooks/useFeatures';
import { useSprints } from '@/hooks/useSprints';
import { useProductObjectives } from '@/hooks/useProductObjectives';
import { CreateFeatureDialog } from '@/components/features/CreateFeatureDialog';
import { QuickCreateTaskDialog } from '@/components/features/QuickCreateTaskDialog';
import { FeatureDetailModal } from '@/components/features/FeatureDetailModal';
import { StatusGroupHeader } from '@/components/features/StatusGroupHeader';
import { FeatureRow } from '@/components/features/FeatureRow';
import { InlineAddRow } from '@/components/features/InlineAddRow';
import { cn } from '@/lib/utils';
import { STATUS_CONFIG, STATUS_ORDER } from '@/components/features/featureConstants';

type ViewType = 'table' | 'kanban';

const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-muted-foreground',
  medium: 'text-info',
  high: 'text-warning',
  critical: 'text-destructive',
};

export default function Features() {
  const { features, isLoading, createFeature } = useFeatures();
  const { sprints } = useSprints();
  const { objectives } = useProductObjectives();

  const [view, setView] = useState<ViewType>('table');
  const [createOpen, setCreateOpen] = useState(false);
  const [taskCreateOpen, setTaskCreateOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<FeatureData | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Filters
  const [filterStatus, setFilterStatus] = useState('__all__');
  const [filterPriority, setFilterPriority] = useState('__all__');
  const [filterObjective, setFilterObjective] = useState('__all__');
  const [filterSprint, setFilterSprint] = useState('__all__');
  const [filterAssignee, setFilterAssignee] = useState('');

  const activeFilterCount = [filterStatus, filterPriority, filterObjective, filterSprint].filter(f => f !== '__all__').length + (filterAssignee ? 1 : 0);

  const clearFilters = () => {
    setFilterStatus('__all__');
    setFilterPriority('__all__');
    setFilterObjective('__all__');
    setFilterSprint('__all__');
    setFilterAssignee('');
  };

  const filtered = useMemo(() => {
    return features.filter(f => {
      if (filterStatus !== '__all__' && f.status !== filterStatus) return false;
      if (filterPriority !== '__all__' && f.priority !== filterPriority) return false;
      if (filterObjective !== '__all__' && f.product_objective_id !== filterObjective) return false;
      if (filterSprint !== '__all__') {
        if (filterSprint === '__unassigned__' && f.sprint_id) return false;
        if (filterSprint !== '__unassigned__' && f.sprint_id !== filterSprint) return false;
      }
      if (filterAssignee && !(f.assignee_name || '').toLowerCase().includes(filterAssignee.toLowerCase())) return false;
      return true;
    });
  }, [features, filterStatus, filterPriority, filterObjective, filterSprint, filterAssignee]);

  const groupedByStatus = useMemo(() => {
    const groups: Record<string, FeatureData[]> = {};
    STATUS_ORDER.forEach(s => { groups[s] = []; });
    filtered.forEach(f => {
      if (groups[f.status]) groups[f.status].push(f);
      else groups[f.status] = [f];
    });
    return groups;
  }, [filtered]);

  const toggleGroup = (status: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  };

  const openDetail = (f: FeatureData) => {
    setSelectedFeature(f);
    setDetailOpen(true);
  };

  const handleInlineAdd = async (name: string, _status: string) => {
    const firstObjective = objectives[0];
    if (!firstObjective) return;
    try {
      await createFeature({
        name,
        product_objective_id: firstObjective.id,
        priority: 'medium',
      });
    } catch {}
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Features</h1>
          <p className="text-sm text-muted-foreground">Strategic execution hub — features, tasks, and releases</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={filtersOpen ? 'secondary' : 'outline'}
            size="sm"
            className="gap-1.5 h-8 text-xs"
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            <Filter className="h-3 w-3" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="h-4 px-1 text-[10px] bg-primary text-primary-foreground">{activeFilterCount}</Badge>
            )}
          </Button>
          <div className="flex items-center rounded-md border border-border bg-muted/30 p-0.5">
            <Button variant={view === 'table' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('table')} className="gap-1 h-7 text-xs">
              <LayoutList className="h-3 w-3" /> List
            </Button>
            <Button variant={view === 'kanban' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('kanban')} className="gap-1 h-7 text-xs">
              <Columns3 className="h-3 w-3" /> Board
            </Button>
          </div>
          
          {/* Split Create Button */}
          <div className="flex items-center">
            <Button onClick={() => setCreateOpen(true)} className="gap-1.5 h-8 text-xs rounded-r-none">
              <Plus className="h-3.5 w-3.5" /> Feature
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="h-8 px-1.5 rounded-l-none border-l border-primary-foreground/20">
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setCreateOpen(true)}>
                  <Plus className="h-3.5 w-3.5 mr-2" /> New Feature
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTaskCreateOpen(true)}>
                  <Plus className="h-3.5 w-3.5 mr-2" /> New Task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
        <CollapsibleContent>
          <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg border border-border bg-muted/20">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-7 text-xs w-[120px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Status</SelectItem>
                {STATUS_ORDER.map(s => <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="h-7 text-xs w-[120px]"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Urgent</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterObjective} onValueChange={setFilterObjective}>
              <SelectTrigger className="h-7 text-xs w-[160px]"><SelectValue placeholder="Objective" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Objectives</SelectItem>
                {objectives.map(o => (
                  <SelectItem key={o.id} value={o.id}>{o.statement.substring(0, 40)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterSprint} onValueChange={setFilterSprint}>
              <SelectTrigger className="h-7 text-xs w-[130px]"><SelectValue placeholder="Sprint" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Sprints</SelectItem>
                <SelectItem value="__unassigned__">Unassigned</SelectItem>
                {sprints.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input
              value={filterAssignee}
              onChange={e => setFilterAssignee(e.target.value)}
              placeholder="Assignee..."
              className="h-7 text-xs w-[120px]"
            />
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={clearFilters}>
                <X className="h-3 w-3" /> Clear
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Empty state */}
      {features.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No features yet</h3>
            <p className="text-muted-foreground mb-4">Create your first feature to start execution tracking</p>
            <Button onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> New Feature
            </Button>
          </div>
        </Card>
      )}

      {/* Status-Grouped List View */}
      {view === 'table' && features.length > 0 && (
        <Card className="overflow-hidden">
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_80px_120px_90px_90px_90px] items-center px-3 py-2 border-b border-border bg-muted/40 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            <span>Name</span>
            <span className="text-center">Assignee</span>
            <span className="text-center">Status</span>
            <span className="text-center">Date Done</span>
            <span className="text-center">Start Date</span>
            <span className="text-center">Due Date</span>
          </div>

          {STATUS_ORDER.map(status => {
            const items = groupedByStatus[status] || [];
            const isOpen = !collapsedGroups.has(status);

            return (
              <div key={status}>
                <StatusGroupHeader
                  status={status}
                  count={items.length}
                  isOpen={isOpen}
                  onToggle={() => toggleGroup(status)}
                  onAddClick={() => setCreateOpen(true)}
                />
                {isOpen && (
                  <>
                    {items.map(f => (
                      <FeatureRow key={f.id} feature={f} onClick={() => openDetail(f)} />
                    ))}
                    <InlineAddRow status={status} onAdd={(name) => handleInlineAdd(name, status)} />
                  </>
                )}
              </div>
            );
          })}
        </Card>
      )}

      {/* Kanban View */}
      {view === 'kanban' && filtered.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          {STATUS_ORDER.map(status => {
            const grouped = filtered.filter(f => f.status === status);
            const config = STATUS_CONFIG[status];
            return (
              <div key={status} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className={cn('h-2.5 w-2.5 rounded-full', config?.dot)} />
                  <span className="text-sm font-medium">{config?.label}</span>
                  <span className="text-xs text-muted-foreground">{grouped.length}</span>
                </div>
                <div className="space-y-2">
                  {grouped.map(f => (
                    <Card key={f.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openDetail(f)}>
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] text-muted-foreground">{f.feature_code}</span>
                          <Badge className={cn('text-[10px] h-5 gap-1 border-0', config?.bg, config?.color)} variant="secondary">
                            {config?.label}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium leading-tight">{f.name}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{f.assignee_name || 'Unassigned'}</span>
                          {f.story_points ? <span>{f.story_points} pts</span> : null}
                        </div>
                        <Progress value={f.progress} className="h-1" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === 'table' && filtered.length === 0 && features.length > 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No features match your filters.
          <Button variant="link" size="sm" onClick={clearFilters}>Clear filters</Button>
        </div>
      )}

      <CreateFeatureDialog open={createOpen} onOpenChange={setCreateOpen} />
      <QuickCreateTaskDialog open={taskCreateOpen} onOpenChange={setTaskCreateOpen} />
      <FeatureDetailModal feature={selectedFeature} open={detailOpen} onOpenChange={setDetailOpen} />
    </div>
  );
}
