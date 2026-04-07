import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useReleases } from '@/hooks/useReleases';

interface CreateReleaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateReleaseDialog({ open, onOpenChange }: CreateReleaseDialogProps) {
  const { createRelease, isCreating } = useReleases();
  const [version, setVersion] = useState('');
  const [goal, setGoal] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [releaseType, setReleaseType] = useState('minor');

  const reset = () => { setVersion(''); setGoal(''); setTargetDate(''); setReleaseType('minor'); };

  const handleSubmit = async () => {
    if (!version) return;
    await createRelease({ version, goal, target_date: targetDate || undefined, release_type: releaseType });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Create Release</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Release Name / Version *</Label>
            <Input value={version} onChange={e => setVersion(e.target.value)} placeholder="e.g. v2.5.0" />
          </div>
          <div className="space-y-2">
            <Label>Goal</Label>
            <Textarea value={goal} onChange={e => setGoal(e.target.value)} placeholder="Release goal..." rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Target Date</Label>
              <Input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={releaseType} onValueChange={setReleaseType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="major">Major</SelectItem>
                  <SelectItem value="minor">Minor</SelectItem>
                  <SelectItem value="patch">Patch</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!version || isCreating}>
            {isCreating ? 'Creating...' : 'Create Release'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
