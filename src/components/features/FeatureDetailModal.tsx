import { useState, useEffect, useRef } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  ChevronDown, ChevronRight, Plus, MessageSquare, Target, X, Maximize2, Minimize2,
  Flag, Calendar, Clock, Hash, Users, Tag, Send, Zap, Paperclip, CheckSquare,
  MoreHorizontal, ThumbsUp, SmilePlus, Reply, Search, Bell, Filter,
  Circle, ArrowRight,
} from 'lucide-react';
import { FeatureData, useFeatures } from '@/hooks/useFeatures';
import { useTasks, TaskData } from '@/hooks/useTasks';
import { useReleases } from '@/hooks/useReleases';
import { useSprints } from '@/hooks/useSprints';
import { useFeatureComments } from '@/hooks/useFeatureComments';
import { useProductObjectives } from '@/hooks/useProductObjectives';
import { cn } from '@/lib/utils';

/* ── Status & Priority configs ── */
const STATUS_OPTIONS = [
  { value: 'backlog', label: 'Backlog', color: 'bg-muted-foreground' },
  { value: 'in_progress', label: 'IN PROGRESS', color: 'bg-info' },
  { value: 'in_review', label: 'IN REVIEW', color: 'bg-warning' },
  { value: 'done', label: 'DONE', color: 'bg-success' },
];
const STATUS_BADGE: Record<string, string> = {
  backlog: 'bg-muted text-muted-foreground',
  in_progress: 'bg-info/15 text-info border-info/30',
  in_review: 'bg-warning/15 text-warning border-warning/30',
  done: 'bg-success/15 text-success border-success/30',
};
const PRIORITY_OPTIONS = [
  { value: 'critical', label: 'Urgent', icon: '🔴' },
  { value: 'high', label: 'High', icon: '🟠' },
  { value: 'medium', label: 'Normal', icon: '🟡' },
  { value: 'low', label: 'Low', icon: '🔵' },
];
const TASK_STATUS_ICONS: Record<string, { icon: string; color: string }> = {
  todo: { icon: '○', color: 'text-muted-foreground' },
  in_progress: { icon: '◐', color: 'text-info' },
  done: { icon: '✓', color: 'text-success' },
};

/* ── Props ── */
interface FeatureDetailModalProps {
  feature: FeatureData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/* ── MetaRow: label-value row like ClickUp ── */
function MetaRow({ icon: Icon, label, children, isEmpty }: {
  icon: any; label: string; children: React.ReactNode; isEmpty?: boolean;
}) {
  if (isEmpty) return null;
  return (
    <div className="flex items-center min-h-[38px] hover:bg-muted/30 rounded-md px-3 -mx-3 group">
      <div className="flex items-center gap-2.5 w-[160px] shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground/70" />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

/* ── Main Component ── */
export function FeatureDetailModal({ feature, open, onOpenChange }: FeatureDetailModalProps) {
  const { updateFeature } = useFeatures();
  const { tasks, createTask, updateTask } = useTasks(feature?.id);
  const { releases } = useReleases();
  const { sprints } = useSprints();
  const { comments, addComment } = useFeatureComments(feature?.id || null);
  const { objectives } = useProductObjectives();

  const [isFullScreen, setIsFullScreen] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newComment, setNewComment] = useState('');
  const [hideEmpty, setHideEmpty] = useState(false);
  const [subtasksOpen, setSubtasksOpen] = useState(true);
  const [relatedOpen, setRelatedOpen] = useState(false);
  const commentEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setIsFullScreen(false);
      setNewTaskName('');
      setNewComment('');
    }
  }, [open]);

  useEffect(() => {
    commentEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments.length]);

  if (!feature) return null;

  const objective = objectives.find(o => o.id === feature.product_objective_id);
  const doneTasks = tasks.filter(t => t.status === 'done').length;
  const statusCfg = STATUS_OPTIONS.find(s => s.value === feature.status);

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

  const cycleTaskStatus = (task: TaskData) => {
    const next = task.status === 'todo' ? 'in_progress' : task.status === 'in_progress' ? 'done' : 'todo';
    updateTask({ id: task.id, status: next });
  };

  const hasValue = (val: any) => val !== null && val !== undefined && val !== '' && val !== 0;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            'fixed z-50 bg-background border shadow-2xl flex flex-col',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            isFullScreen
              ? 'inset-0 rounded-none'
              : 'left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[96vw] max-w-[1100px] h-[90vh] rounded-xl'
          )}
        >
          {/* ═══ Sticky Header ═══ */}
          <div className="flex items-center justify-between px-5 h-12 border-b border-border shrink-0 bg-background">
            <div className="flex items-center gap-3 min-w-0">
              {/* Breadcrumb */}
              {objective && (
                <span className="text-xs text-muted-foreground truncate max-w-[200px] hidden sm:inline">
                  {objective.statement.substring(0, 40)}{objective.statement.length > 40 ? '…' : ''}
                </span>
              )}
              <span className="text-muted-foreground/40 hidden sm:inline">/</span>
              <Badge variant="outline" className="font-mono text-[11px] shrink-0">{feature.feature_code}</Badge>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground mr-1 hidden md:inline">
                Created {new Date(feature.created_at).toLocaleDateString()}
              </span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsFullScreen(!isFullScreen)}>
                {isFullScreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </Button>
              <DialogPrimitive.Close asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <X className="h-4 w-4" />
                </Button>
              </DialogPrimitive.Close>
            </div>
          </div>

          {/* ═══ Two-column body ═══ */}
          <div className="flex flex-1 overflow-hidden">
            {/* ── LEFT COLUMN ── */}
            <ScrollArea className="flex-1">
              <div className="max-w-[720px] mx-auto px-6 py-5">

                {/* ── Compact title bar (like ClickUp's sticky sub-header) ── */}
                <div className="flex items-center gap-3 mb-1">
                  <span className={cn('h-3 w-3 rounded-full shrink-0', statusCfg?.color)} />
                  <span className="text-xs text-muted-foreground">Feature</span>
                </div>

                {/* Feature Name — large editable */}
                <Input
                  defaultValue={feature.name}
                  onBlur={e => e.target.value !== feature.name && handleUpdate({ name: e.target.value })}
                  className="text-2xl font-bold border-none px-0 h-auto focus-visible:ring-0 bg-transparent leading-tight mb-4"
                />

                {/* Objective trace pill */}
                {objective && (
                  <div className="flex items-start gap-2 text-xs bg-muted/40 rounded-lg px-3 py-2.5 mb-5">
                    <Target className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                    <span className="text-muted-foreground leading-relaxed">{objective.statement}</span>
                  </div>
                )}

                {/* ═══ SECTION: Metadata Fields ═══ */}
                <div className="space-y-0">
                  <MetaRow icon={Circle} label="Status">
                    <Select value={feature.status} onValueChange={v => handleUpdate({ status: v })}>
                      <SelectTrigger className="h-7 text-xs border-none bg-transparent px-0 w-auto gap-1.5 focus:ring-0">
                        <Badge className={cn('text-[11px] font-semibold uppercase tracking-wide px-2.5 py-0.5', STATUS_BADGE[feature.status])}>
                          {statusCfg?.label}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map(s => (
                          <SelectItem key={s.value} value={s.value}>
                            <div className="flex items-center gap-2">
                              <span className={cn('h-2 w-2 rounded-full', s.color)} />
                              {s.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </MetaRow>

                  <MetaRow icon={Users} label="Assignees">
                    <div className="flex items-center gap-2">
                      {feature.assignee_name ? (
                        <div className="flex items-center gap-1.5">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-medium">
                              {feature.assignee_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <Input
                            defaultValue={feature.assignee_name}
                            onBlur={e => handleUpdate({ assignee_name: e.target.value } as any)}
                            className="h-7 text-sm border-none bg-transparent px-0 focus-visible:ring-0 w-[140px]"
                          />
                        </div>
                      ) : (
                        <Input
                          defaultValue=""
                          onBlur={e => e.target.value && handleUpdate({ assignee_name: e.target.value } as any)}
                          placeholder="Add assignee..."
                          className="h-7 text-sm border-none bg-transparent px-0 focus-visible:ring-0 w-[140px] text-muted-foreground"
                        />
                      )}
                    </div>
                  </MetaRow>

                  <MetaRow icon={Calendar} label="Dates">
                    <div className="flex items-center gap-2 text-sm">
                      <Input
                        type="date"
                        defaultValue={feature.created_at ? new Date(feature.created_at).toISOString().split('T')[0] : ''}
                        className="h-7 text-xs border-none bg-transparent px-0 focus-visible:ring-0 w-[110px]"
                        readOnly
                      />
                      <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                      <Input
                        type="date"
                        defaultValue={feature.due_date ? new Date(feature.due_date).toISOString().split('T')[0] : ''}
                        onChange={e => handleUpdate({ due_date: e.target.value || null } as any)}
                        className="h-7 text-xs border-none bg-transparent px-0 focus-visible:ring-0 w-[110px]"
                      />
                    </div>
                  </MetaRow>

                  <MetaRow icon={Flag} label="Priority">
                    <Select value={feature.priority} onValueChange={v => handleUpdate({ priority: v })}>
                      <SelectTrigger className="h-7 text-sm border-none bg-transparent px-0 w-auto gap-1 focus:ring-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITY_OPTIONS.map(p => (
                          <SelectItem key={p.value} value={p.value}>
                            <span className="flex items-center gap-2">{p.icon} {p.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </MetaRow>

                  <MetaRow icon={Clock} label="Time estimate" isEmpty={hideEmpty && !hasValue(feature.time_estimate)}>
                    <Input
                      type="number"
                      defaultValue={feature.time_estimate || ''}
                      onBlur={e => handleUpdate({ time_estimate: Number(e.target.value) || 0 } as any)}
                      placeholder="Empty"
                      className="h-7 text-sm border-none bg-transparent px-0 focus-visible:ring-0 w-20"
                    />
                  </MetaRow>

                  <MetaRow icon={Hash} label="Sprint points" isEmpty={hideEmpty && !hasValue(feature.story_points)}>
                    <Input
                      type="number"
                      defaultValue={feature.story_points || ''}
                      onBlur={e => handleUpdate({ story_points: Number(e.target.value) || 0 } as any)}
                      placeholder="Empty"
                      className="h-7 text-sm border-none bg-transparent px-0 focus-visible:ring-0 w-20"
                    />
                  </MetaRow>

                  <MetaRow icon={Zap} label="Sprint" isEmpty={hideEmpty && !hasValue(feature.sprint_id)}>
                    <Select value={feature.sprint_id || '__none__'} onValueChange={v => handleUpdate({ sprint_id: v === '__none__' ? null : v } as any)}>
                      <SelectTrigger className="h-7 text-sm border-none bg-transparent px-0 w-auto focus:ring-0">
                        <SelectValue placeholder="Empty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {sprints.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </MetaRow>

                  <MetaRow icon={Tag} label="Tags" isEmpty={hideEmpty && !(feature.tags && feature.tags.length > 0)}>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(feature.tags || []).map((tag, i) => (
                        <Badge key={i} variant="outline" className="text-xs bg-warning/10 text-warning border-warning/30 font-normal">
                          {tag}
                        </Badge>
                      ))}
                      {(!feature.tags || feature.tags.length === 0) && (
                        <span className="text-sm text-muted-foreground">Empty</span>
                      )}
                    </div>
                  </MetaRow>

                  {/* Collapse empty fields toggle */}
                  <button
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mt-1 px-3 -mx-3 py-1.5"
                    onClick={() => setHideEmpty(!hideEmpty)}
                  >
                    {hideEmpty ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    {hideEmpty ? 'Show empty fields' : 'Collapse empty fields'}
                  </button>
                </div>

                <Separator className="my-5" />

                {/* ═══ SECTION: Description ═══ */}
                <Textarea
                  defaultValue={feature.description}
                  onBlur={e => e.target.value !== feature.description && handleUpdate({ description: e.target.value })}
                  placeholder="Add a description..."
                  rows={6}
                  className="resize-none text-sm leading-relaxed border-none px-0 focus-visible:ring-0 bg-transparent"
                />

                <Separator className="my-5" />

                {/* ═══ SECTION: Progress Status ═══ */}
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Progress Status</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={feature.progress} className="h-2.5 flex-1" />
                    <span className="text-sm font-medium text-muted-foreground">{feature.progress}%</span>
                  </div>
                </div>

                {/* ═══ SECTION: Subtasks ═══ */}
                <Collapsible open={subtasksOpen} onOpenChange={setSubtasksOpen}>
                  <CollapsibleTrigger className="flex items-center gap-2 w-full py-2 group">
                    {subtasksOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <span className="text-sm font-semibold">Subtasks</span>
                    <span className="text-xs text-muted-foreground">{doneTasks} of {tasks.length}</span>
                    <div className="flex-1" />
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" className="h-6 text-[11px] gap-1 text-muted-foreground">
                        <Filter className="h-3 w-3" /> Sort
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => { e.stopPropagation(); setNewTaskName(''); }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    {/* Subtask progress bar */}
                    {tasks.length > 0 && (
                      <Progress value={tasks.length > 0 ? (doneTasks / tasks.length) * 100 : 0} className="h-1 mb-3" />
                    )}

                    {/* Column headers */}
                    {tasks.length > 0 && (
                      <div className="flex items-center px-2 py-1.5 text-[11px] text-muted-foreground uppercase tracking-wider border-b border-border">
                        <span className="flex-1">Name</span>
                        <span className="w-[100px] text-right">Assignee</span>
                      </div>
                    )}

                    {/* Task rows */}
                    {tasks.map(t => {
                      const tsCfg = TASK_STATUS_ICONS[t.status] || TASK_STATUS_ICONS.todo;
                      return (
                        <div
                          key={t.id}
                          className="flex items-center py-2 px-2 hover:bg-muted/30 rounded-md group/task border-b border-border/50 last:border-0"
                        >
                          <button
                            className={cn('text-base mr-2.5 leading-none', tsCfg.color)}
                            onClick={() => cycleTaskStatus(t)}
                            title="Toggle status"
                          >
                            {tsCfg.icon}
                          </button>
                          <span className={cn(
                            'text-sm flex-1 truncate',
                            t.status === 'done' && 'line-through text-muted-foreground'
                          )}>
                            {t.name}
                          </span>
                          {t.owners.length > 0 && (
                            <Avatar className="h-6 w-6 ml-2">
                              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                {t.owners[0].split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <Flag className="h-3 w-3 text-muted-foreground/50 ml-2 opacity-0 group-hover/task:opacity-100" />
                        </div>
                      );
                    })}

                    {/* Add task inline */}
                    <div className="flex items-center gap-2 py-2 px-2">
                      <Plus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <Input
                        value={newTaskName}
                        onChange={e => setNewTaskName(e.target.value)}
                        placeholder="Add Task"
                        className="h-7 text-sm border-none bg-transparent px-0 focus-visible:ring-0"
                        onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Separator className="my-5" />

                {/* ═══ SECTION: Checklist ═══ */}
                <button className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground py-2 w-full">
                  <CheckSquare className="h-4 w-4" />
                  Create checklist
                </button>

                {/* ═══ SECTION: Attach file ═══ */}
                <button className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground py-2 w-full">
                  <Paperclip className="h-4 w-4" />
                  Attach file
                </button>
              </div>
            </ScrollArea>

            {/* ── Sidebar icon strip (like ClickUp's right icons) ── */}
            <div className="w-10 border-l border-border flex flex-col items-center py-3 gap-2 bg-muted/20 shrink-0">
              <button className="p-1.5 rounded-md bg-primary/10 text-primary">
                <MessageSquare className="h-4 w-4" />
              </button>
              <button className="p-1.5 rounded-md text-muted-foreground hover:bg-muted">
                <Paperclip className="h-4 w-4" />
              </button>
              <button className="p-1.5 rounded-md text-muted-foreground hover:bg-muted">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>

            {/* ── RIGHT COLUMN: Activity ── */}
            <div className="w-[340px] border-l border-border flex flex-col shrink-0">
              {/* Activity header */}
              <div className="px-4 h-12 border-b border-border flex items-center justify-between shrink-0">
                <span className="text-sm font-semibold">Activity</span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Search className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 relative">
                    <Bell className="h-3.5 w-3.5" />
                    {comments.length > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-[9px] text-primary-foreground flex items-center justify-center font-bold">
                        {comments.length}
                      </span>
                    )}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Filter className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Activity feed */}
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-5">
                  {comments.length === 0 && (
                    <div className="text-center py-12">
                      <MessageSquare className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">No activity yet</p>
                    </div>
                  )}
                  {comments.map(c => (
                    <div key={c.id} className="group/comment">
                      <div className="flex gap-2.5">
                        <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                          <AvatarFallback className="text-[10px] bg-accent/10 text-accent font-medium">
                            {c.author_name[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{c.author_name}</span>
                            <span className="text-[11px] text-muted-foreground">
                              {new Date(c.created_at).toLocaleDateString(undefined, {
                                month: 'short', day: 'numeric', year: 'numeric',
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-foreground/80 mt-1 leading-relaxed whitespace-pre-wrap">{c.content}</p>
                          {/* Comment actions */}
                          <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover/comment:opacity-100 transition-opacity">
                            <button className="p-1 rounded hover:bg-muted"><ThumbsUp className="h-3 w-3 text-muted-foreground" /></button>
                            <button className="p-1 rounded hover:bg-muted"><SmilePlus className="h-3 w-3 text-muted-foreground" /></button>
                            <button className="p-1 rounded hover:bg-muted text-xs text-muted-foreground flex items-center gap-0.5">
                              <Reply className="h-3 w-3" /> Reply
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={commentEndRef} />
                </div>
              </ScrollArea>

              {/* Comment input bar */}
              <div className="p-3 border-t border-border shrink-0">
                <div className="flex items-center gap-1.5 mb-2">
                  <Button variant="ghost" size="icon" className="h-6 w-6"><Plus className="h-3 w-3" /></Button>
                  <div className="flex-1">
                    <span className="text-xs text-muted-foreground">Comment</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6"><SmilePlus className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6"><Paperclip className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6"><MoreHorizontal className="h-3 w-3" /></Button>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="text-sm h-8 flex-1"
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAddComment()}
                  />
                  <Button
                    size="icon"
                    className="h-8 w-8 shrink-0 bg-primary hover:bg-primary/90"
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                  >
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
