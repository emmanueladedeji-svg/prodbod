import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, X, ArrowLeft, ArrowRight, Sparkles, BookOpen } from 'lucide-react';
import { VisionData, generateVisionStory } from '@/hooks/useVision';
import { MarketSegmentData } from '@/hooks/useMarketSegments';

interface WizardStep {
  key: string;
  label: string;
  prompt: string;
  helper: string;
  placeholder: string;
}

const STORY_STEPS: WizardStep[] = [
  {
    key: 'once_upon_a_time',
    label: 'Once upon a time…',
    prompt: 'Describe the current world',
    helper: 'Describe the current reality of customers, market, or industry before your product creates change.',
    placeholder: 'Small businesses struggled to access real-time financial insights',
  },
  {
    key: 'every_day',
    label: 'Every day…',
    prompt: 'Define the recurring pain',
    helper: 'Describe the recurring problems or frustrations experienced regularly.',
    placeholder: 'they relied on fragmented data and manual reporting',
  },
  {
    key: 'one_day',
    label: 'One day…',
    prompt: 'The turning point',
    helper: 'Describe the turning point that makes change possible.',
    placeholder: 'intelligent automation became accessible to everyone',
  },
  {
    key: 'because_of_that',
    label: 'Because of that…',
    prompt: 'Immediate transformation',
    helper: 'Describe the changes that begin to happen after the turning point.',
    placeholder: 'Decision making becomes faster',
  },
  {
    key: 'until_finally',
    label: 'Until finally…',
    prompt: 'The ultimate future',
    helper: 'Describe the long-term transformation your product enables.',
    placeholder: 'every business operates with predictive intelligence by default',
  },
];

interface VisionWizardProps {
  initialData?: VisionData | null;
  segments: MarketSegmentData[];
  onSave: (values: Partial<VisionData>) => Promise<void>;
  isSaving: boolean;
  onCancel: () => void;
}

export default function VisionWizard({ initialData, segments, onSave, isSaving, onCancel }: VisionWizardProps) {
  const [step, setStep] = useState(0);
  const totalSteps = 6;

  // Story inputs
  const [onceUponATime, setOnceUponATime] = useState(initialData?.once_upon_a_time || '');
  const [everyDay, setEveryDay] = useState(initialData?.every_day || '');
  const [oneDay, setOneDay] = useState(initialData?.one_day || '');
  const [becauseOfThat, setBecauseOfThat] = useState<string[]>(
    initialData?.because_of_that?.length ? initialData.because_of_that : ['']
  );
  const [untilFinally, setUntilFinally] = useState(initialData?.until_finally || '');

  // Strategic anchors
  const [strategicIntent, setStrategicIntent] = useState(initialData?.strategic_intent || '');
  const [valueProposition, setValueProposition] = useState(initialData?.value_proposition || '');
  const [successIndicators, setSuccessIndicators] = useState<string[]>(
    initialData?.success_indicators?.length ? initialData.success_indicators : ['']
  );
  const [timeHorizon, setTimeHorizon] = useState(String(initialData?.time_horizon || 3));
  const [targetSegmentIds, setTargetSegmentIds] = useState<string[]>(initialData?.target_segment_ids || []);

  const storyValues = { onceUponATime, everyDay, oneDay, becauseOfThat, untilFinally };
  const livePreview = generateVisionStory(storyValues);

  const handleAddImpact = () => setBecauseOfThat([...becauseOfThat, '']);
  const handleRemoveImpact = (i: number) => setBecauseOfThat(becauseOfThat.filter((_, idx) => idx !== i));
  const handleImpactChange = (i: number, val: string) => {
    const updated = [...becauseOfThat];
    updated[i] = val;
    setBecauseOfThat(updated);
  };

  const handleAddIndicator = () => setSuccessIndicators([...successIndicators, '']);
  const handleRemoveIndicator = (i: number) => setSuccessIndicators(successIndicators.filter((_, idx) => idx !== i));
  const handleIndicatorChange = (i: number, val: string) => {
    const updated = [...successIndicators];
    updated[i] = val;
    setSuccessIndicators(updated);
  };

  const toggleSegment = (id: string) =>
    setTargetSegmentIds((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);

  const handleSave = async () => {
    const story = generateVisionStory(storyValues);
    await onSave({
      once_upon_a_time: onceUponATime,
      every_day: everyDay,
      one_day: oneDay,
      because_of_that: becauseOfThat.filter(Boolean),
      until_finally: untilFinally,
      generated_story: story,
      strategic_intent: strategicIntent,
      value_proposition: valueProposition,
      success_indicators: successIndicators.filter(Boolean),
      time_horizon: Number(timeHorizon),
      target_segment_ids: targetSegmentIds,
      // Also populate legacy fields for backward compat
      statement: story,
      core_problem: everyDay,
      long_term_impact: untilFinally,
    });
  };

  const getStepValue = () => {
    if (step === 0) return onceUponATime;
    if (step === 1) return everyDay;
    if (step === 2) return oneDay;
    if (step === 4) return untilFinally;
    return '';
  };

  const setStepValue = (val: string) => {
    if (step === 0) setOnceUponATime(val);
    else if (step === 1) setEveryDay(val);
    else if (step === 2) setOneDay(val);
    else if (step === 4) setUntilFinally(val);
  };

  const canProceed = () => {
    if (step === 0) return onceUponATime.trim().length > 0;
    if (step === 1) return everyDay.trim().length > 0;
    if (step === 2) return oneDay.trim().length > 0;
    if (step === 3) return becauseOfThat.some((b) => b.trim().length > 0);
    if (step === 4) return untilFinally.trim().length > 0;
    return true;
  };

  const renderStoryStep = () => {
    const stepInfo = STORY_STEPS[step];
    if (step === 3) {
      // "Because of that" — multiple entries
      return (
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{stepInfo.label}</h2>
            <p className="text-muted-foreground mt-1">{stepInfo.helper}</p>
          </div>
          <div className="space-y-3">
            {becauseOfThat.map((impact, i) => (
              <div key={i} className="flex gap-2 items-start">
                <Textarea
                  value={impact}
                  onChange={(e) => handleImpactChange(i, e.target.value)}
                  placeholder={i === 0 ? stepInfo.placeholder : 'Add another impact…'}
                  rows={2}
                  className="flex-1 text-base"
                />
                {becauseOfThat.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveImpact(i)} className="shrink-0 mt-1">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={handleAddImpact} className="gap-2">
            <Plus className="h-4 w-4" /> Add another impact
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{stepInfo.label}</h2>
          <p className="text-muted-foreground mt-1">{stepInfo.helper}</p>
        </div>
        <Textarea
          value={getStepValue()}
          onChange={(e) => setStepValue(e.target.value)}
          placeholder={stepInfo.placeholder}
          rows={4}
          className="text-base"
        />
      </div>
    );
  };

  const renderStrategicAnchors = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Strategic Anchors</h2>
        <p className="text-muted-foreground mt-1">Define the strategic context around your vision story</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium">Strategic Intent</Label>
          <p className="text-xs text-muted-foreground mb-1.5">What change are we driving?</p>
          <Textarea
            value={strategicIntent}
            onChange={(e) => setStrategicIntent(e.target.value)}
            placeholder="To shift the market from reactive to predictive operations…"
            rows={2}
          />
        </div>

        <div>
          <Label className="text-sm font-medium">Core Value Proposition</Label>
          <p className="text-xs text-muted-foreground mb-1.5">What unique value do we deliver?</p>
          <Textarea
            value={valueProposition}
            onChange={(e) => setValueProposition(e.target.value)}
            placeholder="The only platform that connects strategy to execution with full traceability…"
            rows={2}
          />
        </div>

        <div>
          <Label className="text-sm font-medium">Vision Time Horizon</Label>
          <Select value={timeHorizon} onValueChange={setTimeHorizon}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 Year</SelectItem>
              <SelectItem value="3">3 Years</SelectItem>
              <SelectItem value="5">5 Years</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {segments.length > 0 && (
          <div>
            <Label className="text-sm font-medium">Target Market Segments</Label>
            <p className="text-xs text-muted-foreground mb-1.5">Which segments does this vision target?</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {segments.map((seg) => (
                <button
                  key={seg.id}
                  type="button"
                  onClick={() => toggleSegment(seg.id)}
                  className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${
                    targetSegmentIds.includes(seg.id)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-foreground border-border hover:border-primary/50'
                  }`}
                >
                  {seg.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <Label className="text-sm font-medium">Success Indicators</Label>
          <p className="text-xs text-muted-foreground mb-1.5">How will you measure vision success?</p>
          <div className="space-y-2">
            {successIndicators.map((indicator, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={indicator}
                  onChange={(e) => handleIndicatorChange(i, e.target.value)}
                  placeholder={i === 0 ? '50% market penetration in target segments' : 'Add indicator…'}
                  className="flex-1"
                />
                {successIndicators.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveIndicator(i)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={handleAddIndicator} className="gap-2 mt-2">
            <Plus className="h-4 w-4" /> Add indicator
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Product Vision</h1>
          <p className="text-muted-foreground">Tell your product's transformation story</p>
        </div>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Step {step + 1} of {totalSteps}</span>
          <span>{step < 5 ? 'Story' : 'Strategic Anchors'}</span>
        </div>
        <Progress value={((step + 1) / totalSteps) * 100} className="h-2" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Main input panel */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-6">
              {step < 5 ? renderStoryStep() : renderStrategicAnchors()}
            </CardContent>
          </Card>
        </div>

        {/* Live preview panel */}
        <div className="lg:col-span-2">
          <Card className="bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 border-primary/20 sticky top-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Live Preview</span>
              </div>
              {livePreview ? (
                <p className="text-sm text-foreground leading-relaxed italic">
                  "{livePreview}"
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Your vision story will appear here as you complete each step…
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(step - 1)} disabled={step === 0} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        {step < totalSteps - 1 ? (
          <Button onClick={() => setStep(step + 1)} disabled={!canProceed()} className="gap-2">
            Next <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            <Sparkles className="h-4 w-4" />
            {isSaving ? 'Saving…' : 'Generate & Save Vision'}
          </Button>
        )}
      </div>
    </div>
  );
}
