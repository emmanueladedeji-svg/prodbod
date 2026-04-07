import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { FeatureData } from '@/hooks/useFeatures';
import { STATUS_CONFIG } from './featureConstants';

interface FeatureRowProps {
  feature: FeatureData;
  onClick: () => void;
}

export function FeatureRow({ feature, onClick }: FeatureRowProps) {
  const config = STATUS_CONFIG[feature.status];

  const dateDone = feature.status === 'done' && feature.updated_at
    ? format(new Date(feature.updated_at), 'M/d/yy')
    : '—';

  const startDate = (feature as any).start_date
    ? format(new Date((feature as any).start_date), 'M/d/yy')
    : '—';

  const dueDate = feature.due_date
    ? format(new Date(feature.due_date), 'M/d/yy')
    : '—';

  return (
    <div
      className="grid grid-cols-[1fr_80px_120px_90px_90px_90px] items-center px-3 py-2 border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors text-sm"
      onClick={onClick}
    >
      {/* Name + tags */}
      <div className="flex items-center gap-2 min-w-0">
        <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', config?.dot)} />
        <span className="truncate font-medium text-foreground">{feature.name}</span>
        {feature.feature_code && (
          <span className="text-[10px] font-mono text-muted-foreground shrink-0">{feature.feature_code}</span>
        )}
        {feature.tags && feature.tags.length > 0 && (
          <div className="flex gap-1 shrink-0">
            {feature.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline" className="text-[10px] h-4 px-1.5 rounded">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Assignee */}
      <div className="flex items-center justify-center">
        {feature.assignee_name ? (
          <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center" title={feature.assignee_name}>
            <span className="text-[10px] font-medium text-primary">
              {feature.assignee_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </span>
          </div>
        ) : (
          <div className="h-6 w-6 rounded-full border border-dashed border-muted-foreground/30" />
        )}
      </div>

      {/* Status badge */}
      <div className="flex items-center justify-center">
        <Badge className={cn('text-[10px] h-5 gap-1 border-0', config?.bg, config?.color)} variant="secondary">
          <span className={cn('h-1.5 w-1.5 rounded-full', config?.dot)} />
          {config?.label}
        </Badge>
      </div>

      {/* Date Done */}
      <div className="text-xs text-muted-foreground text-center">{dateDone}</div>

      {/* Start Date */}
      <div className="text-xs text-muted-foreground text-center">{startDate}</div>

      {/* Due Date */}
      <div className="text-xs text-muted-foreground text-center">{dueDate}</div>
    </div>
  );
}
