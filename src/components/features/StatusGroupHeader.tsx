import { Button } from '@/components/ui/button';
import { Plus, ChevronDown, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STATUS_CONFIG } from './featureConstants';

interface StatusGroupHeaderProps {
  status: string;
  count: number;
  isOpen: boolean;
  onToggle: () => void;
  onAddClick: () => void;
}

export function StatusGroupHeader({ status, count, isOpen, onToggle, onAddClick }: StatusGroupHeaderProps) {
  const config = STATUS_CONFIG[status];
  if (!config) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 border-b border-border cursor-pointer select-none group',
        config.bg,
      )}
      onClick={onToggle}
    >
      {isOpen ? (
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      ) : (
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      )}
      <span className={cn('h-2 w-2 rounded-full shrink-0', config.dot)} />
      <span className={cn('text-xs font-bold tracking-wide', config.color)}>{config.label}</span>
      <span className="text-[11px] text-muted-foreground">{count}</span>
      <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0"
          onClick={(e) => { e.stopPropagation(); onAddClick(); }}
        >
          <Plus className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
          <MoreHorizontal className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
