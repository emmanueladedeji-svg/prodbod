import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  CheckSquare, Plus, Calendar, Flag, Link2, Loader2, LayoutList, Columns3,
} from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useFeatures } from '@/hooks/useFeatures';

const statusColors: Record<string, string> = {
  todo: 'bg-muted text-muted-foreground',
  in_progress: 'bg-info/10 text-info border-info/20',
  done: 'bg-success/10 text-success border-success/20',
};

const priorityColors: Record<string, string> = {
  low: 'text-muted-foreground',
  medium: 'text-info',
  high: 'text-warning',
  critical: 'text-destructive',
};

type TaskView = 'list' | 'kanban';

export default function Tasks() {
  const [view, setView] = useState<TaskView>('list');
  const { tasks, isLoading, updateTask } = useTasks();
  const { features } = useFeatures();

  const tasksByStatus = {
    todo: tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    done: tasks.filter(t => t.status === 'done'),
  };

  const handleToggle = (taskId: string, currentStatus: string) => {
    updateTask({ id: taskId, status: currentStatus === 'done' ? 'todo' : 'done' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderTaskCard = (task: typeof tasks[0]) => {
    const feature = features.find(f => f.id === task.feature_id);

    return (
      <Card key={task.id} className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={task.status === 'done'}
              onCheckedChange={() => handleToggle(task.id, task.status)}
              className="mt-1"
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-foreground">{task.name}</h4>
              {task.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{task.description}</p>
              )}
            </div>
            <Flag className={`h-4 w-4 shrink-0 ${priorityColors[task.priority] || ''}`} />
          </div>
          {feature && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Link2 className="h-3 w-3" />
              <span className="truncate">{feature.name}</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {task.owners.length > 0 ? task.owners.join(', ') : 'Unassigned'}
            </div>
            {task.due_date && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {new Date(task.due_date).toLocaleDateString()}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
          <p className="text-muted-foreground">All tasks across features</p>
        </div>
        <div className="flex items-center rounded-md border border-border bg-muted/30 p-0.5">
          <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('list')} className="gap-1 h-7 text-xs">
            <LayoutList className="h-3 w-3" /> List
          </Button>
          <Button variant={view === 'kanban' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('kanban')} className="gap-1 h-7 text-xs">
            <Columns3 className="h-3 w-3" /> Kanban
          </Button>
        </div>
      </div>

      {tasks.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No tasks yet</h3>
            <p className="text-muted-foreground">Tasks are created within features</p>
          </div>
        </Card>
      )}

      {/* Kanban View */}
      {view === 'kanban' && tasks.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
            <div key={status} className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge className={statusColors[status] || ''} variant="outline">
                  {status.replace('_', ' ')}
                </Badge>
                <span className="text-muted-foreground text-sm">{statusTasks.length}</span>
              </div>
              <div className="space-y-3">{statusTasks.map(renderTaskCard)}</div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {view === 'list' && tasks.length > 0 && (
        <div className="space-y-2">
          {tasks.map(task => {
            const feature = features.find(f => f.id === task.feature_id);
            return (
              <Card key={task.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-3">
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={task.status === 'done'}
                      onCheckedChange={() => handleToggle(task.id, task.status)}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground">{task.name}</h4>
                    </div>
                    <Badge className={statusColors[task.status] || ''} variant="outline">
                      {task.status.replace('_', ' ')}
                    </Badge>
                    {feature && (
                      <Badge variant="secondary" className="text-xs">{feature.name}</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {task.owners.length > 0 ? task.owners[0] : ''}
                    </span>
                    <Flag className={`h-4 w-4 ${priorityColors[task.priority] || ''}`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

    </div>
  );
}
