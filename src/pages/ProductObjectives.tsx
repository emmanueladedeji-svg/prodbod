import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Flag, Plus, Sparkles, Clock, CheckCircle, Link2 } from 'lucide-react';
import { useProductObjectives } from '@/hooks/useProductObjectives';
import { useStrategies } from '@/hooks/useStrategies';
import { useApp } from '@/contexts/AppContext';

const priorityColors: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-info/10 text-info',
  high: 'bg-warning/10 text-warning',
  critical: 'bg-destructive/10 text-destructive',
};

export default function ProductObjectives() {
  const { currentProduct } = useApp();
  const { objectives, isLoading } = useProductObjectives();
  const { strategies } = useStrategies();

  if (!currentProduct) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Select a product to view objectives.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      </div>
    );
  }

  if (objectives.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Product Objectives</h1>
          <p className="text-muted-foreground">User-centric objectives that drive feature development</p>
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Flag className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No product objectives yet</h3>
            <p className="text-muted-foreground max-w-md">
              Product objectives are created under strategies. Create a strategy first, then add objectives.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Product Objectives</h1>
          <p className="text-muted-foreground">User-centric objectives that drive feature development</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {objectives.map((objective) => {
          const strategy = strategies.find((s) => s.id === objective.strategy_id);
          return (
            <Card key={objective.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <Badge className={priorityColors[objective.priority] || priorityColors.medium}>
                    {objective.priority}
                  </Badge>
                </div>
                <CardTitle className="text-base mt-3 leading-snug">{objective.statement}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {strategy && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Link2 className="h-3 w-3" />
                    <span className="truncate">{(strategy.name || strategy.statement).substring(0, 50)}...</span>
                  </div>
                )}
                {objective.timeframe && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{objective.timeframe}</span>
                  </div>
                )}
                {objective.success_metrics && objective.success_metrics.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Success Metrics</h4>
                    <ul className="space-y-1">
                      {objective.success_metrics.slice(0, 2).map((metric, i) => (
                        <li key={i} className="text-sm flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-success shrink-0" />
                          <span className="text-foreground truncate">{metric}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
