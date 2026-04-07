import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSprints } from '@/hooks/useSprints';

interface CreateSprintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateSprintDialog({ open, onOpenChange }: CreateSprintDialogProps) {
  const { createSprint, isCreating } = useSprints();
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const reset = () => { setName(''); setGoal(''); setStartDate(''); setEndDate(''); };

  const handleSubmit = async () => {
    if (!name) return;
    await createSprint({ name, goal, start_date: startDate || undefined, end_date: endDate || undefined });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Create Sprint</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Sprint Name *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sprint 12" />
          </div>
          <div className="space-y-2">
            <Label>Goal</Label>
            <Textarea value={goal} onChange={e => setGoal(e.target.value)} placeholder="Sprint goal..." rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!name || isCreating}>
            {isCreating ? 'Creating...' : 'Create Sprint'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
