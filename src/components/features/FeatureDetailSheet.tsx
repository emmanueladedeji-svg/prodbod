import { useState } from 'react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, Plus, MessageSquare, Target, Package, Zap } from 'lucide-react';
import { FeatureData, useFeatures } from '@/hooks/useFeatures';
import { useTasks } from '@/hooks/useTasks';
import { useReleases } from '@/hooks/useReleases';
import { useSprints } from '@/hooks/useSprints';
import { useFeatureComments } from '@/hooks/useFeatureComments';
import { useProductObjectives } from '@/hooks/useProductObjectives';

const STATUS_OPTIONS = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'in_review', label: 'In Review' },
  { value: 'done', label: 'Done' },
];

const STATUS_COLORS: Record<string, string> = {
  backlog: 'bg-muted text-muted-foreground',
  in_progress: 'bg-info/10 text-info',
  in_review: 'bg-warning/10 text-warning',
  done: 'bg-success/10 text-success',
};

interface FeatureDetailSheetProps {
  feature: FeatureData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeatureDetailSheet({ feature, open, onOpenChange }: FeatureDetailSheetProps) {
  const { updateFeature } = useFeatures();
  const { tasks, createTask } = useTasks(feature?.id);
  const { releases } = useReleases();
  const { sprints } = useSprints();
  const { comments, addComment } = useFeatureComments(feature?.id || null);
  const { objectives } = useProductObjectives();

  const [newTaskName, setNewTaskName] = useState('');
  const [newComment, setNewComment] = useState('');

  if (!feature) return null;

  const objective = objectives.find(o => o.id === feature.product_objective_id);
  const release = releases.find(r => r.id === feature.release_id);
  const sprint = sprints.find(s => s.id === feature.sprint_id);

  const handleUpdate = (values: Partial<FeatureData>) => {
    updateFeature({ id: feature.id, ...values });
  };

  const handleAddTask = async () => {
    if (!newTaskName.trim()) return;
    await createTask({ feature_id: feature.id, name: newTaskName });
    setNewTaskName('');
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    await addComment({ feature_id: feature.id, author_name: 'You', content: newComment });
    setNewComment('');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[520px] sm:max-w-[520px] overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-mono">{feature.feature_code}</Badge>
            <Badge className={STATUS_COLORS[feature.status] || ''} variant="secondary">
              {STATUS_OPTIONS.find(s => s.value === feature.status)?.label || feature.status}
            </Badge>
          </div>
          <SheetTitle className="text-xl">{feature.name}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 pb-8">
          {/* Strategic Traceability */}
          {objective && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md p-2">
              <Target className="h-3 w-3 text-primary" />
              <span className="truncate">{objective.statement}</span>
              {release && (
                <>
                  <span>·</span>
                  <Package className="h-3 w-3 text-secondary" />
                  <span>{release.version || 'Release'}</span>
                </>
              )}
              {sprint && (
                <>
                  <span>·</span>
                  <Zap className="h-3 w-3 text-accent" />
                  <span>{sprint.name}</span>
                </>
              )}
            </div>
          )}

          {/* Section A: Core */}
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium py-2">
              Core Information <ChevronDown className="h-4 w-4" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2">
              <div className="space-y-1">
                <Label className="text-xs">Name</Label>
                <Input
                  defaultValue={feature.name}
                  onBlur={e => e.target.value !== feature.name && handleUpdate({ name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Type</Label>
                  <Select value={feature.feature_type || 'new'} onValueChange={v => handleUpdate({ feature_type: v } as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="improvement">Improvement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Priority</Label>
                  <Select value={feature.priority} onValueChange={v => handleUpdate({ priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Description</Label>
                <Textarea
                  defaultValue={feature.description}
                  onBlur={e => e.target.value !== feature.description && handleUpdate({ description: e.target.value })}
                  rows={3}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Section B: Release & Sprint */}
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium py-2">
              Release & Sprint <ChevronDown className="h-4 w-4" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Release</Label>
                  <Select value={feature.release_id || '__none__'} onValueChange={v => handleUpdate({ release_id: v === '__none__' ? null : v } as any)}>
                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {releases.map(r => (
                        <SelectItem key={r.id} value={r.id}>{r.version || r.goal || 'Release'}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Sprint</Label>
                  <Select value={feature.sprint_id || '__none__'} onValueChange={v => handleUpdate({ sprint_id: v === '__none__' ? null : v } as any)}>
                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {sprints.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Section E: Status & Progress */}
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium py-2">
              Status & Progress <ChevronDown className="h-4 w-4" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2">
              <div className="space-y-1">
                <Label className="text-xs">Status</Label>
                <Select value={feature.status} onValueChange={v => handleUpdate({ status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{feature.progress}%</span>
                </div>
                <Progress value={feature.progress} className="h-2" />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Section D: Planning */}
          <Collapsible>
            <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium py-2">
              Planning <ChevronDown className="h-4 w-4" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Story Points</Label>
                  <Input
                    type="number"
                    defaultValue={feature.story_points}
                    onBlur={e => handleUpdate({ story_points: Number(e.target.value) } as any)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Time Estimate (hrs)</Label>
                  <Input
                    type="number"
                    defaultValue={feature.time_estimate}
                    onBlur={e => handleUpdate({ time_estimate: Number(e.target.value) } as any)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Assignee</Label>
                <Input
                  defaultValue={feature.assignee_name}
                  onBlur={e => handleUpdate({ assignee_name: e.target.value } as any)}
                  placeholder="Assignee name"
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Section C: Tasks */}
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium py-2">
              Tasks ({tasks.length}) <ChevronDown className="h-4 w-4" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-2">
              {tasks.map(t => (
                <div key={t.id} className="flex items-center gap-2 text-sm p-2 rounded-md bg-muted/30">
                  <Badge className={STATUS_COLORS[t.status] || 'bg-muted'} variant="secondary">
                    {t.status === 'done' ? '✓' : t.status === 'in_progress' ? '◐' : '○'}
                  </Badge>
                  <span className="flex-1 truncate">{t.name}</span>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  value={newTaskName}
                  onChange={e => setNewTaskName(e.target.value)}
                  placeholder="Add a task..."
                  className="text-sm"
                  onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                />
                <Button size="sm" variant="outline" onClick={handleAddTask}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Section H: Comments */}
          <Collapsible>
            <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium py-2">
              <span className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Comments ({comments.length})
              </span>
              <ChevronDown className="h-4 w-4" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-2">
              {comments.map(c => (
                <div key={c.id} className="p-2 rounded-md bg-muted/30 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{c.author_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{c.content}</p>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="text-sm"
                  onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                />
                <Button size="sm" variant="outline" onClick={handleAddComment}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </SheetContent>
    </Sheet>
  );
}
