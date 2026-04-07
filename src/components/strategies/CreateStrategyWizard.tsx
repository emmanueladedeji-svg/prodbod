import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarIcon, Plus, Trash2, ChevronLeft, ChevronRight, Zap, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { VALUE_LEVERS } from '@/hooks/useStrategies';
import { BusinessObjectiveData } from '@/hooks/useBusinessObjectives';
import { MarketSegmentData } from '@/hooks/useMarketSegments';

interface MetricInput {
  metric_name: string;
  baseline_value: number;
  target_value: number;
  current_value: number;
  measurement_frequency: string;
}

interface WizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objectives: BusinessObjectiveData[];
  segments: MarketSegmentData[];
  onSubmit: (data: {
    strategy: {
      business_objective_id: string;
      name: string;
      description: string;
      statement: string;
      rationale: string;
      problem_statement: string;
      approach: string;
      value_lever: string;
      hypothesis: string;
      start_date: string | null;
      end_date: string | null;
      partial_threshold: number;
      failure_threshold: number;
    };
    metrics: MetricInput[];
  }) => Promise<any>;
  isSubmitting: boolean;
}

const STEPS = [
  'Context',
  'Identify',
  'Problem',
  'Approach',
  'Hypothesis',
  'Metrics',
  'Timeframe',
  'Review',
];

export function CreateStrategyWizard({ open, onOpenChange, objectives, segments, onSubmit, isSubmitting }: WizardProps) {
  const [step, setStep] = useState(0);
  const [boId, setBoId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [approach, setApproach] = useState('');
  const [valueLever, setValueLever] = useState('acquisition');
  const [hypothesis, setHypothesis] = useState('');
  const [metrics, setMetrics] = useState<MetricInput[]>([
    { metric_name: '', baseline_value: 0, target_value: 0, current_value: 0, measurement_frequency: 'monthly' },
  ]);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [partialThreshold, setPartialThreshold] = useState(50);
  const [failureThreshold, setFailureThreshold] = useState(20);

  const selectedBO = objectives.find((o) => o.id === boId);
  const targetSegment = selectedBO?.target_segment_id
    ? segments.find((s) => s.id === selectedBO.target_segment_id)
    : null;

  const canProceed = () => {
    switch (step) {
      case 0: return !!boId;
      case 1: return name.trim().length > 0;
      case 2: return problemStatement.trim().length > 0;
      case 3: return approach.trim().length > 0 && !!valueLever;
      case 4: return hypothesis.trim().length > 0;
      case 5: return metrics.length > 0 && metrics.every((m) => m.metric_name.trim().length > 0);
      case 6: return !!startDate && !!endDate;
      case 7: return true;
      default: return false;
    }
  };

  const canActivate = () =>
    boId && name && problemStatement && approach && valueLever && hypothesis &&
    metrics.length > 0 && metrics.every((m) => m.metric_name.trim()) &&
    startDate && endDate;

  const handleSubmit = async () => {
    if (!canActivate()) return;
    await onSubmit({
      strategy: {
        business_objective_id: boId,
        name,
        description,
        statement: name,
        rationale: description,
        problem_statement: problemStatement,
        approach,
        value_lever: valueLever,
        hypothesis,
        start_date: startDate ? format(startDate, 'yyyy-MM-dd') : null,
        end_date: endDate ? format(endDate, 'yyyy-MM-dd') : null,
        partial_threshold: partialThreshold,
        failure_threshold: failureThreshold,
      },
      metrics,
    });
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setStep(0);
    setBoId('');
    setName('');
    setDescription('');
    setProblemStatement('');
    setApproach('');
    setValueLever('acquisition');
    setHypothesis('');
    setMetrics([{ metric_name: '', baseline_value: 0, target_value: 0, current_value: 0, measurement_frequency: 'monthly' }]);
    setStartDate(undefined);
    setEndDate(undefined);
    setPartialThreshold(50);
    setFailureThreshold(20);
  };

  const addMetric = () => {
    setMetrics([...metrics, { metric_name: '', baseline_value: 0, target_value: 0, current_value: 0, measurement_frequency: 'monthly' }]);
  };

  const removeMetric = (i: number) => {
    if (metrics.length > 1) setMetrics(metrics.filter((_, idx) => idx !== i));
  };

  const updateMetric = (i: number, field: keyof MetricInput, value: string | number) => {
    const updated = [...metrics];
    (updated[i] as any)[field] = value;
    setMetrics(updated);
  };

  const boEndDate = selectedBO?.end_date ? new Date(selectedBO.end_date) : undefined;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Product Strategy</DialogTitle>
          <DialogDescription>
            Step {step + 1} of {STEPS.length}: {STEPS[step]}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex gap-1 mb-4">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-colors',
                i <= step ? 'bg-primary' : 'bg-muted'
              )}
            />
          ))}
        </div>

        {/* Step 0: Context */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <Label>Link to Business Objective</Label>
              <Select value={boId} onValueChange={setBoId}>
                <SelectTrigger><SelectValue placeholder="Select business objective" /></SelectTrigger>
                <SelectContent>
                  {objectives.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.statement.substring(0, 80)}{o.statement.length > 80 ? '...' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedBO && (
              <Card>
                <CardContent className="pt-4 space-y-2 text-sm">
                  <div><span className="font-medium text-muted-foreground">Objective:</span> {selectedBO.statement}</div>
                  <div><span className="font-medium text-muted-foreground">Period:</span> {selectedBO.quarter} {selectedBO.year}</div>
                  {targetSegment && (
                    <div><span className="font-medium text-muted-foreground">Target Segment:</span> {targetSegment.name}</div>
                  )}
                  {selectedBO.target_revenue && (
                    <div><span className="font-medium text-muted-foreground">Revenue Target:</span> ${selectedBO.target_revenue.toLocaleString()}</div>
                  )}
                  {selectedBO.end_date && (
                    <div><span className="font-medium text-muted-foreground">End Date:</span> {selectedBO.end_date}</div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Step 1: Identify */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label>Strategy Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Self-serve onboarding optimization" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of this strategy" rows={3} />
            </div>
          </div>
        )}

        {/* Step 2: Problem */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label>Problem Statement</Label>
              <p className="text-xs text-muted-foreground mb-2">Define the measurable barrier preventing success.</p>
              <Textarea value={problemStatement} onChange={(e) => setProblemStatement(e.target.value)} placeholder="What specific, measurable problem must be solved?" rows={4} />
            </div>
          </div>
        )}

        {/* Step 3: Approach */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <Label>Strategic Approach</Label>
              <Textarea value={approach} onChange={(e) => setApproach(e.target.value)} placeholder="How will this objective be achieved?" rows={4} />
            </div>
            <div>
              <Label>Value Lever</Label>
              <Select value={valueLever} onValueChange={setValueLever}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VALUE_LEVERS.map((vl) => (
                    <SelectItem key={vl.value} value={vl.value}>{vl.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Step 4: Hypothesis */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <Label>Strategy Hypothesis</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Template: "If we execute this strategy, [metric] will change from [baseline] to [target] because [reason]."
              </p>
              <Textarea value={hypothesis} onChange={(e) => setHypothesis(e.target.value)} placeholder="If we execute this strategy..." rows={4} />
            </div>
          </div>
        )}

        {/* Step 5: Metrics */}
        {step === 5 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Strategy Metrics</Label>
              <Button type="button" variant="outline" size="sm" onClick={addMetric} className="gap-1">
                <Plus className="h-3 w-3" /> Add Metric
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">At least one numeric metric is required.</p>
            {metrics.map((m, i) => (
              <Card key={i}>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Metric {i + 1}</Label>
                    {metrics.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeMetric(i)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <Input value={m.metric_name} onChange={(e) => updateMetric(i, 'metric_name', e.target.value)} placeholder="Metric name" />
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">Baseline</Label>
                      <Input type="number" value={m.baseline_value} onChange={(e) => updateMetric(i, 'baseline_value', Number(e.target.value))} />
                    </div>
                    <div>
                      <Label className="text-xs">Target</Label>
                      <Input type="number" value={m.target_value} onChange={(e) => updateMetric(i, 'target_value', Number(e.target.value))} />
                    </div>
                    <div>
                      <Label className="text-xs">Current</Label>
                      <Input type="number" value={m.current_value} onChange={(e) => updateMetric(i, 'current_value', Number(e.target.value))} />
                    </div>
                  </div>
                  <Select value={m.measurement_frequency} onValueChange={(v) => updateMetric(i, 'measurement_frequency', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Step 6: Timeframe */}
        {step === 6 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !startDate && 'text-muted-foreground')}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={startDate} onSelect={setStartDate} /></PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !endDate && 'text-muted-foreground')}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={endDate} onSelect={setEndDate} disabled={(date) => (boEndDate ? date > boEndDate : false)} />
                  </PopoverContent>
                </Popover>
                {boEndDate && <p className="text-xs text-muted-foreground mt-1">Cannot exceed objective end: {format(boEndDate, 'PPP')}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Partial Success Threshold (%)</Label>
                <Input type="number" value={partialThreshold} onChange={(e) => setPartialThreshold(Number(e.target.value))} min={0} max={100} />
              </div>
              <div>
                <Label>Failure Threshold (%)</Label>
                <Input type="number" value={failureThreshold} onChange={(e) => setFailureThreshold(Number(e.target.value))} min={0} max={100} />
              </div>
            </div>
          </div>
        )}

        {/* Step 7: Review */}
        {step === 7 && (
          <div className="space-y-4 text-sm">
            <Card>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="font-semibold">{name}</span>
                </div>
                {description && <p className="text-muted-foreground">{description}</p>}
                {selectedBO && <Badge variant="outline">{selectedBO.quarter} {selectedBO.year}</Badge>}
                <div><span className="font-medium">Problem:</span> {problemStatement}</div>
                <div><span className="font-medium">Approach:</span> {approach}</div>
                <div><span className="font-medium">Value Lever:</span> {VALUE_LEVERS.find((v) => v.value === valueLever)?.label}</div>
                <div><span className="font-medium">Hypothesis:</span> {hypothesis}</div>
                <div><span className="font-medium">Timeframe:</span> {startDate && format(startDate, 'PP')} → {endDate && format(endDate, 'PP')}</div>
                <div><span className="font-medium">Thresholds:</span> Partial ≥{partialThreshold}%, Failure ≤{failureThreshold}%</div>
                <div className="pt-2 border-t">
                  <span className="font-medium">Metrics ({metrics.length}):</span>
                  <ul className="mt-1 space-y-1">
                    {metrics.map((m, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-success" />
                        {m.metric_name}: {m.baseline_value} → {m.target_value} ({m.measurement_frequency})
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={() => step > 0 ? setStep(step - 1) : onOpenChange(false)} className="gap-1">
            <ChevronLeft className="h-4 w-4" />
            {step > 0 ? 'Back' : 'Cancel'}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed()} className="gap-1">
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!canActivate() || isSubmitting} className="gap-1 bg-gradient-to-r from-primary to-secondary hover:opacity-90">
              <Zap className="h-4 w-4" />
              Activate Strategy
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
