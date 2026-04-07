import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Telescope,
  Edit,
  Target,
  TrendingUp,
  Brain,
  Sparkles,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { VisionData } from '@/hooks/useVision';
import { MarketSegmentData } from '@/hooks/useMarketSegments';

interface VisionStoryViewProps {
  vision: VisionData;
  segments: MarketSegmentData[];
  objectivesCount: number;
  onEdit: () => void;
}

function formatCurrency(val: number) {
  if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(1)}B`;
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  return `$${val.toLocaleString()}`;
}

export default function VisionStoryView({ vision, segments, objectivesCount, onEdit }: VisionStoryViewProps) {
  const alignedSegments = segments.filter((s) => vision.target_segment_ids?.includes(s.id));
  const totalAlignedTam = alignedSegments.reduce((sum, s) => sum + (s.tam || s.size || 0), 0);
  const hasStory = !!vision.generated_story;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Product Vision</h1>
          <p className="text-muted-foreground">Your product's transformation story</p>
        </div>
        <Button variant="outline" onClick={onEdit} className="gap-2">
          <Edit className="h-4 w-4" /> Edit Vision
        </Button>
      </div>

      {/* Vision Story Hero Card */}
      <Card className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 border-primary/20">
        <CardContent className="p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
              <Telescope className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">Vision Story</h2>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {vision.time_horizon || 3}-Year Horizon
                </Badge>
              </div>
            </div>
          </div>
          {hasStory ? (
            <blockquote className="text-xl font-medium text-foreground leading-relaxed border-l-4 border-primary pl-6">
              "{vision.generated_story}"
            </blockquote>
          ) : (
            <blockquote className="text-xl font-medium text-foreground leading-relaxed border-l-4 border-primary pl-6">
              "{vision.statement || 'No vision statement set.'}"
            </blockquote>
          )}
        </CardContent>
      </Card>

      {/* Strategic Anchors */}
      <div className="grid gap-4 md:grid-cols-2">
        {vision.strategic_intent && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">Strategic Intent</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-foreground text-sm leading-relaxed">{vision.strategic_intent}</p>
            </CardContent>
          </Card>
        )}

        {vision.value_proposition && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">Value Proposition</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-foreground text-sm leading-relaxed">{vision.value_proposition}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Success Indicators */}
      {vision.success_indicators && vision.success_indicators.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">Success Indicators</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {vision.success_indicators.filter(Boolean).map((indicator, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                  <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">{i + 1}</span>
                  </div>
                  <span className="text-sm text-foreground">{indicator}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Linked Segments */}
      {alignedSegments.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">Target Markets</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {alignedSegments.map((seg) => (
                <Badge key={seg.id} variant="outline">{seg.name}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Intelligence Panel */}
      {(segments.length > 0 || objectivesCount > 0) && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">System Intelligence</CardTitle>
                <CardDescription>Vision alignment computed from your market model</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border bg-card p-4 text-center">
                <div className="text-2xl font-bold text-foreground">{alignedSegments.length}</div>
                <div className="text-sm text-muted-foreground">Aligned Segments</div>
              </div>
              <div className="rounded-lg border bg-card p-4 text-center">
                <div className="text-2xl font-bold text-foreground">
                  {totalAlignedTam > 0 ? formatCurrency(totalAlignedTam) : '—'}
                </div>
                <div className="text-sm text-muted-foreground">TAM Covered</div>
              </div>
              <div className="rounded-lg border bg-card p-4 text-center">
                <div className="text-2xl font-bold text-foreground">{objectivesCount}</div>
                <div className="text-sm text-muted-foreground">Business Objectives</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Meta */}
      <div className="text-sm text-muted-foreground flex items-center gap-4">
        <span>Last updated: {new Date(vision.updated_at).toLocaleDateString()}</span>
        <Separator orientation="vertical" className="h-4" />
        <span>Created: {new Date(vision.created_at).toLocaleDateString()}</span>
      </div>
    </div>
  );
}
