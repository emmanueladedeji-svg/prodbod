import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Plus, TrendingUp, Users, DollarSign } from 'lucide-react';
import {
  MarketSegmentData,
  computeSegmentMetrics,
  getSegmentClassification,
} from '@/hooks/useMarketSegments';

interface SegmentCardProps {
  segment: MarketSegmentData;
  color: string;
  onEdit: () => void;
  onDelete: () => void;
  onAddTarget: () => void;
}

const CLASSIFICATION_STYLES: Record<string, { badge: string; label: string }> = {
  Dominant: { badge: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: '👑 Dominant' },
  'Growth Stage': { badge: 'bg-blue-100 text-blue-800 border-blue-300', label: '📈 Growth Stage' },
  Emerging: { badge: 'bg-purple-100 text-purple-800 border-purple-300', label: '🌱 Emerging' },
  Untapped: { badge: 'bg-muted text-muted-foreground border-border', label: '⚪ Untapped' },
};

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-800 border-green-300',
  monitored: 'bg-amber-100 text-amber-800 border-amber-300',
  archived: 'bg-muted text-muted-foreground border-border',
};

const STATUS_LABELS: Record<string, string> = {
  active: '🟢 Active',
  monitored: '🟡 Monitored',
  archived: '⚪ Archived',
};

function formatVal(val: number): string {
  if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(1)}B`;
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  return `$${val.toLocaleString()}`;
}

function formatNum(val: number): string {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(1)}K`;
  return val.toLocaleString();
}

export function SegmentCard({ segment, color, onEdit, onDelete, onAddTarget }: SegmentCardProps) {
  const classification = getSegmentClassification(segment);
  const metrics = computeSegmentMetrics(segment);
  const style = CLASSIFICATION_STYLES[classification];
  const statusStyle = STATUS_STYLES[segment.status || 'active'];
  const statusLabel = STATUS_LABELS[segment.status || 'active'];

  const remainingCustomers = Math.max(0, metrics.tam_customers - (segment.current_customers || 0));
  const remainingRevenue = Math.max(0, metrics.som_value - (segment.current_revenue || 0));

  return (
    <Card className="hover:shadow-md transition-shadow border-l-4" style={{ borderLeftColor: color }}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-semibold text-foreground truncate">{segment.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded border font-medium ${style.badge}`}>
                {style.label}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded border font-medium ${statusStyle}`}>
                {statusLabel}
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {segment.industry && <Badge variant="secondary" className="text-xs">{segment.industry}</Badge>}
              {(segment.location || segment.geography) && (
                <Badge variant="outline" className="text-xs">{segment.location || segment.geography}</Badge>
              )}
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onAddTarget} title="Add Target">
              <Plus className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Customer Penetration */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground font-medium">Customer Penetration</span>
            <span className="font-bold text-foreground">{metrics.customer_penetration_pct.toFixed(1)}%</span>
          </div>
          <Progress value={metrics.customer_penetration_pct} className="h-2" />
        </div>

        {/* Revenue Capture */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground font-medium">Revenue Capture</span>
            <span className="font-semibold text-foreground">{metrics.revenue_capture_pct.toFixed(1)}%</span>
          </div>
          <Progress value={metrics.revenue_capture_pct} className="h-1" />
        </div>

        {/* Market Size Stats — Customers + Values */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="text-center p-2 rounded bg-muted/50">
            <div className="text-xs text-muted-foreground mb-0.5">TAM</div>
            <div className="text-sm font-bold text-foreground">{formatNum(metrics.tam_customers)}</div>
            <div className="text-xs text-muted-foreground">{formatVal(metrics.tam_value)}</div>
          </div>
          <div className="text-center p-2 rounded bg-muted/50">
            <div className="text-xs text-muted-foreground mb-0.5">SAM</div>
            <div className="text-sm font-bold text-foreground">{formatNum(metrics.sam_customers)}</div>
            <div className="text-xs text-muted-foreground">{formatVal(metrics.sam_value)}</div>
          </div>
          <div className="text-center p-2 rounded bg-muted/50">
            <div className="text-xs text-muted-foreground mb-0.5">SOM</div>
            <div className="text-sm font-bold text-foreground">{formatNum(metrics.som_customers)}</div>
            <div className="text-xs text-muted-foreground">{formatVal(metrics.som_value)}</div>
          </div>
        </div>

        {/* Current Performance */}
        <div className="flex items-center justify-between text-xs pt-1 border-t">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="h-3 w-3" />
            <span>Acquired</span>
          </div>
          <span className="font-semibold text-foreground">
            {(segment.current_customers || 0).toLocaleString()} customers
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <DollarSign className="h-3 w-3" />
            <span>Revenue</span>
          </div>
          <span className="font-semibold text-foreground">
            {formatVal(segment.current_revenue || 0)}
          </span>
        </div>

        {/* Remaining Opportunity */}
        <div className="flex items-center justify-between text-xs border-t pt-2">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            <span>Remaining</span>
          </div>
          <span className="font-semibold text-primary">
            {formatNum(remainingCustomers)} customers · {formatVal(remainingRevenue)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
