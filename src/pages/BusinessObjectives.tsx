import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Plus, Calendar, Trash2, Users, Target, DollarSign } from 'lucide-react';
import {
  useBusinessObjectives, computeObjectiveTargets, computeObjectiveProgress, getObjectiveStatus,
} from '@/hooks/useBusinessObjectives';
import { useMarketSegments, computeSegmentMetrics } from '@/hooks/useMarketSegments';
import { useApp } from '@/contexts/AppContext';

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1, CURRENT_YEAR + 2];

const STATUS_STYLES: Record<string, string> = {
  'Not Started': 'bg-muted text-muted-foreground border-border',
  'On Track': 'text-blue-700 bg-blue-50 border-blue-200',
  'At Risk': 'text-amber-700 bg-amber-50 border-amber-200',
  Achieved: 'text-green-700 bg-green-50 border-green-200',
};

function formatCurrency(value: number) {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toLocaleString()}`;
}

function formatNumber(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

export default function BusinessObjectives() {
  const { currentProduct } = useApp();
  const { objectives, isLoading, createObjective, deleteObjective, isCreating } = useBusinessObjectives();
  const { segments } = useMarketSegments();

  const activeSegments = useMemo(() => segments.filter((s) => (s.status || 'active') === 'active'), [segments]);

  const [showCreate, setShowCreate] = useState(false);
  const [statement, setStatement] = useState('');
  const [quarter, setQuarter] = useState('Q1');
  const [year, setYear] = useState(String(CURRENT_YEAR));
  const [objectiveType, setObjectiveType] = useState('increase');
  const [targetType, setTargetType] = useState('revenue');
  const [targetSegmentId, setTargetSegmentId] = useState('');
  const [targetMode, setTargetMode] = useState<'percentage' | 'absolute'>('percentage');
  const [targetPercentage, setTargetPercentage] = useState(10);
  const [targetAbsolute, setTargetAbsolute] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [ownerName, setOwnerName] = useState('');

  const selectedSegment = activeSegments.find((s) => s.id === targetSegmentId);
  const selectedSegmentMetrics = selectedSegment ? computeSegmentMetrics(selectedSegment) : null;

  const computedTargets = useMemo(() => {
    if (!selectedSegmentMetrics) return { target_customers: 0, target_revenue: 0 };
    if (targetMode === 'percentage') {
      const pct = targetPercentage / 100;
      return {
        target_customers: Math.round(selectedSegmentMetrics.som_customers * pct),
        target_revenue: Math.round(selectedSegmentMetrics.som_value * pct * 100) / 100,
      };
    }
    return {
      target_customers: targetType === 'customer' ? targetAbsolute : 0,
      target_revenue: targetType === 'revenue' ? targetAbsolute : 0,
    };
  }, [selectedSegmentMetrics, targetMode, targetPercentage, targetAbsolute, targetType]);

  const resetForm = () => {
    setStatement(''); setObjectiveType('increase'); setTargetType('revenue');
    setTargetSegmentId(''); setTargetMode('percentage'); setTargetPercentage(10);
    setTargetAbsolute(0); setStartDate(''); setEndDate(''); setOwnerName('');
  };

  const handleCreate = async () => {
    await createObjective({
      objective: {
        product_id: currentProduct?.id!,
        statement, quarter, year: Number(year),
        objective_type: objectiveType,
        target_type: targetType,
        target_segment_id: targetSegmentId || null,
        target_percentage: targetMode === 'percentage' ? targetPercentage : null,
        target_customers: computedTargets.target_customers || null,
        target_revenue: computedTargets.target_revenue || null,
        start_date: startDate || null,
        end_date: endDate || null,
        owner_name: ownerName || null,
        status: 'not_started',
        target_segment_ids: null,
      },
    });
    setShowCreate(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this objective?')) await deleteObjective(id);
  };

  if (!currentProduct) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-muted-foreground">Select a product to manage business objectives.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Business Objectives</h1>
          <p className="text-muted-foreground">Segment-targeted objectives with auto-calculated progress</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90">
          <Plus className="h-4 w-4" />
          Add Objective
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2">{[1, 2].map((i) => <Skeleton key={i} className="h-56" />)}</div>
      ) : objectives.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center border-2 border-dashed rounded-lg p-10">
          <TrendingUp className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-foreground mb-1">No business objectives yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Define segment-targeted objectives to drive strategic alignment.
          </p>
          <Button onClick={() => setShowCreate(true)} className="gap-2"><Plus className="h-4 w-4" />Add First Objective</Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {objectives.map((objective) => {
            const seg = segments.find((s) => s.id === objective.target_segment_id);
            const progress = computeObjectiveProgress(objective, seg);
            const status = getObjectiveStatus(progress);
            const statusStyle = STATUS_STYLES[status];
            const daysRemaining = objective.end_date
              ? Math.max(0, Math.ceil((new Date(objective.end_date).getTime() - Date.now()) / 86400000))
              : null;

            return (
              <Card key={objective.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20">
                        <Calendar className="h-3 w-3 mr-1" />
                        {objective.quarter} {objective.year}
                      </Badge>
                      <span className={`text-xs px-2 py-0.5 rounded border font-medium ${statusStyle}`}>{status}</span>
                      {objective.objective_type && (
                        <Badge variant="outline" className="text-xs capitalize">{objective.objective_type}</Badge>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive shrink-0" onClick={() => handleDelete(objective.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardTitle className="text-lg mt-3">{objective.statement}</CardTitle>

                  {seg && (
                    <div className="mt-2 p-2 rounded bg-muted/50 text-xs text-muted-foreground flex items-center gap-2">
                      <Target className="h-3 w-3" />
                      Targeting: {seg.name}
                      {objective.target_type === 'customer'
                        ? ` · ${formatNumber(objective.target_customers || 0)} customers`
                        : ` · ${formatCurrency(objective.target_revenue || 0)}`}
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-bold">{progress.toFixed(0)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {daysRemaining !== null && <span>{daysRemaining} days remaining</span>}
                    {objective.owner_name && <span>Owner: {objective.owner_name}</span>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Objective Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Business Objective</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Objective Statement <span className="text-destructive">*</span></Label>
              <Textarea value={statement} onChange={(e) => setStatement(e.target.value)}
                placeholder='e.g. "Capture 20% of SME fintech segment by Q4"' rows={3} />
            </div>

            {/* Objective Type */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Outcome Type</Label>
                <Select value={objectiveType} onValueChange={setObjectiveType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="increase">📈 Increase</SelectItem>
                    <SelectItem value="reduce">📉 Reduce</SelectItem>
                    <SelectItem value="achieve">🎯 Achieve</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quarter</Label>
                <Select value={quarter} onValueChange={setQuarter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{QUARTERS.map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{YEARS.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            {/* Target Segment */}
            {activeSegments.length > 0 && (
              <div className="space-y-2">
                <Label>Target Segment (Active only)</Label>
                <Select value={targetSegmentId} onValueChange={setTargetSegmentId}>
                  <SelectTrigger><SelectValue placeholder="Select segment..." /></SelectTrigger>
                  <SelectContent>
                    {activeSegments.map((seg) => (
                      <SelectItem key={seg.id} value={seg.id}>{seg.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Target Definition */}
            {selectedSegment && (
              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Target className="h-4 w-4" />
                  Target Definition
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Target Type</Label>
                    <Select value={targetType} onValueChange={setTargetType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="customer"><Users className="h-3 w-3 inline mr-1" />Customer Target</SelectItem>
                        <SelectItem value="revenue"><DollarSign className="h-3 w-3 inline mr-1" />Revenue Target</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Mode</Label>
                    <Select value={targetMode} onValueChange={(v) => setTargetMode(v as 'percentage' | 'absolute')}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">% of SOM</SelectItem>
                        <SelectItem value="absolute">Absolute Value</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {targetMode === 'percentage' ? (
                  <div className="space-y-2">
                    <Label>Target % of SOM</Label>
                    <div className="flex items-center gap-4">
                      <Slider value={[targetPercentage]} onValueChange={([v]) => setTargetPercentage(v)} max={100} step={1} className="flex-1" />
                      <span className="text-sm font-bold w-12 text-right">{targetPercentage}%</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>{targetType === 'customer' ? 'Target Customers' : 'Target Revenue'}</Label>
                    <Input type="number" value={targetAbsolute || ''} onChange={(e) => setTargetAbsolute(Number(e.target.value))} />
                  </div>
                )}

                {/* Preview */}
                <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Target Customers</span>
                    <span className="font-bold">{formatNumber(computedTargets.target_customers)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Target Revenue</span>
                    <span className="font-bold">{formatCurrency(computedTargets.target_revenue)}</span>
                  </div>
                  {selectedSegmentMetrics && (
                    <div className="flex justify-between text-xs text-muted-foreground border-t pt-1 mt-1">
                      <span>SOM: {formatNumber(selectedSegmentMetrics.som_customers)} customers / {formatCurrency(selectedSegmentMetrics.som_value)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Dates & Owner */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Owner</Label>
                <Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Responsible leader" />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={isCreating || !statement.trim()}>
              {isCreating ? 'Creating…' : 'Create Objective'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
