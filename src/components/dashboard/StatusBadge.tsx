import { FeatureStatus, FEATURE_STATUSES } from '@/types';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: FeatureStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusBadge({ status, size = 'sm', className }: StatusBadgeProps) {
  const config = FEATURE_STATUSES.find(s => s.key === status) || FEATURE_STATUSES[0];

  return (
    <div 
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-medium transition-colors",
        size === 'sm' ? "text-[10px]" : "text-xs",
        className
      )}
      style={{ 
        backgroundColor: config.bgColor,
        color: config.color 
      }}
    >
      <span 
        className={cn(
          "rounded-full",
          size === 'sm' ? "w-1 h-1" : "w-1.5 h-1.5"
        )}
        style={{ backgroundColor: config.color }}
      />
      {config.label}
    </div>
  );
}
