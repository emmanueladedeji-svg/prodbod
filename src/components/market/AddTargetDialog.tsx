import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MarketTargetData, getTargetProgress, getTargetStatus } from '@/hooks/useMarketTargets';
import { MarketSegmentData } from '@/hooks/useMarketSegments';

interface AddTargetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  segment: MarketSegmentData;
  onSave: (data: Omit<MarketTargetData, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  initialData?: MarketTargetData | null;
  isSaving?: boolean;
}

const defaultForm = {
  name: '',
  metric_type: 'revenue',
  target_value: 0,
  current_value: 0,
  start_date: '',
  deadline: '',
  priority: 'medium',
  owner: '',
};

const STATUS_COLORS: Record<string, string> = {
  Achieved: 'text-green-700 bg-green-50 border-green-200',
  'On Track': 'text-blue-700 bg-blue-50 border-blue-200',
  'At Risk': 'text-amber-700 bg-amber-50 border-amber-200',
  Behind: 'text-red-700 bg-red-50 border-red-200',
};

export function AddTargetDialog({
  open,
  onOpenChange,
  segment,
  onSave,
  initialData,
  isSaving,
}: AddTargetDialogProps) {
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || '',
        metric_type: initialData.metric_type || 'revenue',
        target_value: initialData.target_value || 0,
        current_value: initialData.current_value || 0,
        start_date: initialData.start_date || '',
        deadline: initialData.deadline || '',
        priority: initialData.priority || 'medium',
        owner: initialData.owner || '',
      });
    } else {
      setForm(defaultForm);
    }
  }, [initialData, open]);

  const set = (field: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const previewTarget: MarketTargetData = {
    id: 'preview',
    segment_id: segment.id,
    name: form.name,
    metric_type: form.metric_type,
    target_value: Number(form.target_value),
    current_value: Number(form.current_value),
    start_date: form.start_date || null,
    deadline: form.deadline || null,
    priority: form.priority,
    owner: form.owner || null,
    created_at: '',
    updated_at: '',
  };

  const progress = getTargetProgress(previewTarget);
  const status = getTargetStatus(previewTarget);

  const metricLabels: Record<string, string> = {
    market_share_pct: 'Market Share %',
    revenue: 'Revenue ($)',
    customer_count: 'Customer Count',
    penetration_pct: 'Penetration %',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      segment_id: segment.id,
      name: form.name,
      metric_type: form.metric_type,
      target_value: Number(form.target_value),
      current_value: form.current_value ? Number(form.current_value) : null,
      start_date: form.start_date || null,
      deadline: form.deadline || null,
      priority: form.priority,
      owner: form.owner || null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Target' : 'Add Market Target'}</DialogTitle>
          <p className="text-sm text-muted-foreground">For segment: <strong>{segment.name}</strong></p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Target Name <span className="text-destructive">*</span></Label>
            <Input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder='e.g. "Capture 15% of SME market by Q4"'
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Metric Type</Label>
              <Select value={form.metric_type} onValueChange={(v) => set('metric_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(metricLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Strategic Priority</Label>
              <Select value={form.priority} onValueChange={(v) => set('priority', v)}>
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Target Value <span className="text-destructive">*</span></Label>
              <Input
                type="number"
                min={0}
                value={form.target_value || ''}
                onChange={(e) => set('target_value', e.target.value)}
                placeholder="e.g. 1000000"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Current Value (optional)</Label>
              <Input
                type="number"
                min={0}
                value={form.current_value || ''}
                onChange={(e) => set('current_value', e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Deadline</Label>
              <Input type="date" value={form.deadline} onChange={(e) => set('deadline', e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Owner</Label>
            <Input
              value={form.owner}
              onChange={(e) => set('owner', e.target.value)}
              placeholder="e.g. Sarah Chen"
            />
          </div>

          {/* Progress preview */}
          {Number(form.target_value) > 0 && (
            <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Progress Preview</span>
                <span className={`text-xs px-2 py-0.5 rounded border font-semibold ${STATUS_COLORS[status]}`}>
                  {status}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-foreground w-12 text-right">
                  {progress.toFixed(0)}%
                </span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSaving || !form.name || !form.target_value}>
              {isSaving ? 'Saving…' : initialData ? 'Update Target' : 'Add Target'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
