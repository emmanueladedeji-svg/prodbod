import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Zap, Plus, Flag, AlertTriangle, TrendingUp, Trash2, Pencil, Clock, Target } from 'lucide-react';
import { useStrategies, computeMetricProgress, computeHealthScore, computeStrategyStatus, STATUS_CONFIG, VALUE_LEVERS } from '@/hooks/useStrategies';
import { useBusinessObjectives } from '@/hooks/useBusinessObjectives';
import { useMarketSegments } from '@/hooks/useMarketSegments';
import { useProductObjectives } from '@/hooks/useProductObjectives';
import { useApp } from '@/contexts/AppContext';
import { CreateStrategyWizard } from '@/components/strategies/CreateStrategyWizard';
import { useState } from 'react';
import { differenceInDays, format } from 'date-fns';

export default function Strategies() {
  const { currentProduct } = useApp();
  const { strategies, isLoading, createStrategy, deleteStrategy, updateMetric, isCreating } = useStrategies();
  const { objectives: businessObjectives } = useBusinessObjectives();
  const { segments } = useMarketSegments();
  const { objectives: productObjectives } = useProductObjectives();
  const [wizardOpen, setWizardOpen] = useState(false);

  if (!currentProduct) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Select a product to view strategies.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="space-y-4">
          {[1, 2].map((i) => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      </div>
    );
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this strategy? This action cannot be undone.')) return;
    await deleteStrategy(id);
  };

  const handleMetricUpdate = async (metricId: string, currentValue: number) => {
    await updateMetric({ id: metricId, current_value: currentValue });
  };

  // Empty state
  if (strategies.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Product Strategies</h1>
            <p className="text-muted-foreground">Strategic approaches to achieve business objectives</p>
          </div>
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No strategies yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Create your first product strategy to connect business objectives with measurable execution plans.
            </p>
            <Button onClick={() => setWizardOpen(true)} className="gap-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90" disabled={businessObjectives.length === 0}>
              <Plus className="h-4 w-4" />
              Create Strategy
            </Button>
            {businessObjectives.length === 0 && (
              <p className="text-xs text-muted-foreground mt-2">Create a business objective first.</p>
            )}
          </CardContent>
        </Card>
        <CreateStrategyWizard
          open={wizardOpen}
          onOpenChange={setWizardOpen}
          objectives={businessObjectives}
          segments={segments}
          onSubmit={createStrategy}
          isSubmitting={isCreating}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Product Strategies</h1>
          <p className="text-muted-foreground">Strategic approaches to achieve business objectives</p>
        </div>
        <Button onClick={() => setWizardOpen(true)} className="gap-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90" disabled={businessObjectives.length === 0}>
          <Plus className="h-4 w-4" />
          Add Strategy
        </Button>
      </div>

      <div className="space-y-4">
        {strategies.map((strategy) => {
          const bo = businessObjectives.find((o) => o.id === strategy.business_objective_id);
          const segment = bo?.target_segment_id ? segments.find((s) => s.id === bo.target_segment_id) : null;
          const linkedPOs = productObjectives.filter((po) => po.strategy_id === strategy.id);
          const health = computeHealthScore(strategy.metrics);
          const status = computeStrategyStatus(strategy, strategy.metrics);
          const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.not_started;
          const daysLeft = strategy.end_date ? differenceInDays(new Date(strategy.end_date), new Date()) : null;
          const vlLabel = VALUE_LEVERS.find((v) => v.value === strategy.value_lever)?.label || strategy.value_lever;

          return (
            <Card key={strategy.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Zap className="h-4 w-4 text-primary" />
                      </div>
                      <Badge className={statusCfg.className}>{statusCfg.label}</Badge>
                      {bo && <Badge variant="outline" className="text-xs">{bo.quarter} {bo.year}</Badge>}
                      {segment && <Badge variant="outline" className="text-xs">{segment.name}</Badge>}
                      <Badge variant="secondary" className="text-xs">{vlLabel}</Badge>
                    </div>
                    <CardTitle className="text-lg">{strategy.name || strategy.statement}</CardTitle>
                    {strategy.description && <p className="text-sm text-muted-foreground mt-1">{strategy.description}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary">
                      <Flag className="h-3 w-3 mr-1" />
                      {linkedPOs.length} objectives
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(strategy.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Health score + time remaining */}
                <div className="flex items-center gap-6">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Health Score</span>
                      <span className="font-semibold">{health}%</span>
                    </div>
                    <Progress value={health} className="h-2" />
                  </div>
                  {daysLeft !== null && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {daysLeft > 0 ? `${daysLeft}d left` : 'Past due'}
                    </div>
                  )}
                </div>

                {/* Metrics */}
                {strategy.metrics.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      Strategy Metrics
                    </h4>
                    {strategy.metrics.map((metric) => {
                      const progress = computeMetricProgress(metric);
                      return (
                        <div key={metric.id} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>{metric.metric_name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{metric.baseline_value}</span>
                              <Input
                                type="number"
                                value={metric.current_value}
                                onChange={(e) => handleMetricUpdate(metric.id, Number(e.target.value))}
                                className="h-6 w-20 text-xs text-center"
                              />
                              <span className="text-xs text-muted-foreground">{metric.target_value}</span>
                              <span className="text-xs font-medium w-10 text-right">{Math.round(progress)}%</span>
                            </div>
                          </div>
                          <Progress value={progress} className="h-1.5" />
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Risk assumptions */}
                {strategy.risk_assumptions && strategy.risk_assumptions.length > 0 && (
                  <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                    <h4 className="text-sm font-medium flex items-center gap-2 text-warning mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      Risk Assumptions
                    </h4>
                    <ul className="space-y-1">
                      {strategy.risk_assumptions.map((risk, i) => (
                        <li key={i} className="text-sm text-muted-foreground">• {risk}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <CreateStrategyWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        objectives={businessObjectives}
        segments={segments}
        onSubmit={createStrategy}
        isSubmitting={isCreating}
      />
    </div>
  );
}
