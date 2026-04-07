import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useFeatures } from '@/hooks/useFeatures';
import { useTasks } from '@/hooks/useTasks';
import { Loader2 } from 'lucide-react';

interface QuickCreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickCreateTaskDialog({ open, onOpenChange }: QuickCreateTaskDialogProps) {
  const { features } = useFeatures();
  const { createTask, isCreating } = useTasks();

  const [name, setName] = useState('');
  const [featureId, setFeatureId] = useState('');
  const [priority, setPriority] = useState('medium');

  const reset = () => {
    setName('');
    setFeatureId('');
    setPriority('medium');
  };

  const handleSubmit = async () => {
    if (!name.trim() || !featureId) return;
    try {
      await createTask({
        feature_id: featureId,
        name: name.trim(),
        priority,
      });
      reset();
      onOpenChange(false);
    } catch {}
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Task Name *</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter task name..."
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>
          <div className="space-y-2">
            <Label>Link to Feature *</Label>
            <Select value={featureId} onValueChange={setFeatureId}>
              <SelectTrigger><SelectValue placeholder="Select a feature..." /></SelectTrigger>
              <SelectContent>
                {features.map(f => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.feature_code ? `${f.feature_code} — ` : ''}{f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
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
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || !featureId || isCreating}>
            {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
