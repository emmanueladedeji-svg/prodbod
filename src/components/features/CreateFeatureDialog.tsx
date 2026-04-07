import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useFeatures } from '@/hooks/useFeatures';
import { useProductObjectives, ProductObjectiveData } from '@/hooks/useProductObjectives';
import { useReleases } from '@/hooks/useReleases';
import { useSprints } from '@/hooks/useSprints';

interface CreateFeatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateFeatureDialog({ open, onOpenChange }: CreateFeatureDialogProps) {
  const { createFeature, isCreating } = useFeatures();
  const { objectives } = useProductObjectives();
  const { releases } = useReleases();
  const { sprints } = useSprints();

  const [name, setName] = useState('');
  const [featureType, setFeatureType] = useState('new');
  const [objectiveId, setObjectiveId] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [releaseId, setReleaseId] = useState('');
  const [sprintId, setSprintId] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [dueDate, setDueDate] = useState<Date | undefined>();

  const reset = () => {
    setName('');
    setFeatureType('new');
    setObjectiveId('');
    setDescription('');
    setPriority('medium');
    setReleaseId('');
    setSprintId('');
    setStartDate(undefined);
    setDueDate(undefined);
  };

  const handleSubmit = async () => {
    if (!name) return;
    await createFeature({
      product_objective_id: objectiveId || objectives[0]?.id,
      name,
      description,
      feature_type: featureType,
      priority,
      release_id: releaseId && releaseId !== '__none__' ? releaseId : null,
      sprint_id: sprintId && sprintId !== '__none__' ? sprintId : null,
      due_date: dueDate ? dueDate.toISOString() : null,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Feature</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Feature Name *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Quick Start Wizard" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={featureType} onValueChange={setFeatureType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="improvement">Improvement</SelectItem>
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
          <div className="space-y-2">
            <Label>Linked Objective</Label>
            <Select value={objectiveId} onValueChange={setObjectiveId}>
              <SelectTrigger><SelectValue placeholder="Select objective (optional)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {objectives.map((o: ProductObjectiveData) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.statement.substring(0, 60)}{o.statement.length > 60 ? '...' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Feature description..." rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Release</Label>
              <Select value={releaseId} onValueChange={setReleaseId}>
                <SelectTrigger><SelectValue placeholder="No release" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {releases.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.version || r.goal || 'Release'}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sprint</Label>
              <Select value={sprintId} onValueChange={setSprintId}>
                <SelectTrigger><SelectValue placeholder="No sprint" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {sprints.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!name || isCreating}>
            {isCreating ? 'Creating...' : 'Create Feature'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
