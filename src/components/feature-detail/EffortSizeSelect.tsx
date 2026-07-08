import { cn } from '@/lib/utils';
import { EffortSize, EFFORT_SIZES } from '@/types';

interface EffortSizeSelectProps {
  value: EffortSize | null | undefined;
  onChange: (value: EffortSize | null) => void;
  disabled?: boolean;
}

export function EffortSizeSelect({ value, onChange, disabled }: EffortSizeSelectProps) {
  return (
    <div className="flex items-center gap-1.5">
      {EFFORT_SIZES.map((s) => {
        const isActive = value === s.value;
        return (
          <button
            key={s.value}
            disabled={disabled}
            onClick={() => onChange(isActive ? null : s.value)}
            className={cn(
              'h-7 min-w-[32px] px-2 rounded-md text-xs font-semibold border transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-transparent text-muted-foreground border-border hover:border-primary/50 hover:text-foreground',
              disabled && 'opacity-40 cursor-not-allowed'
            )}
          >
            {s.value}
          </button>
        );
      })}
    </div>
  );
}
