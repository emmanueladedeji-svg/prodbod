import { useState } from 'react';
import { Plus, X, Search } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { FeatureAssignee } from '@/hooks/useFeatureAssignees';
import { OrgMember, getAvatarColor } from '@/hooks/useOrgMembers';

interface MultiAssigneePickerProps {
  assignees: FeatureAssignee[];
  orgMembers: OrgMember[];
  onAdd: (userId: string) => void;
  onRemove: (userId: string) => void;
  isUpdating?: boolean;
}

export function MultiAssigneePicker({
  assignees,
  orgMembers,
  onAdd,
  onRemove,
  isUpdating,
}: MultiAssigneePickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const assignedIds = new Set(assignees.map((a) => a.userId));

  const available = orgMembers.filter(
    (m) =>
      !assignedIds.has(m.userId) &&
      (search === '' ||
        m.displayName.toLowerCase().includes(search.toLowerCase()) ||
        m.email.toLowerCase().includes(search.toLowerCase()))
  );

  const visibleAssignees = assignees.slice(0, 3);
  const overflow = assignees.length - 3;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {/* Stacked avatars */}
      <div className="flex items-center -space-x-2">
        {visibleAssignees.map((a) => (
          <div key={a.userId} className="relative group/avatar">
            <Avatar
              className="h-7 w-7 border-2 border-background ring-1 ring-border"
              style={{ backgroundColor: getAvatarColor(a.userId) }}
            >
              <AvatarFallback
                className="text-[10px] font-semibold text-white"
                style={{ backgroundColor: getAvatarColor(a.userId) }}
              >
                {a.initials}
              </AvatarFallback>
            </Avatar>
            {/* Remove on hover */}
            <button
              onClick={() => onRemove(a.userId)}
              disabled={isUpdating}
              className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-white items-center justify-center hidden group-hover/avatar:flex z-10"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
        ))}
        {overflow > 0 && (
          <Avatar className="h-7 w-7 border-2 border-background ring-1 ring-border">
            <AvatarFallback className="text-[10px] font-semibold bg-muted text-muted-foreground">
              +{overflow}
            </AvatarFallback>
          </Avatar>
        )}
      </div>

      {/* Add button */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled={isUpdating}
            className="h-7 w-7 rounded-full border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="start">
          <div className="flex items-center gap-2 mb-2 px-1">
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members…"
              className="h-7 border-none bg-transparent px-0 text-sm focus-visible:ring-0"
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto space-y-0.5">
            {available.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-3">
                {orgMembers.length === 0 ? 'No active members' : 'No matches'}
              </p>
            )}
            {available.map((m) => (
              <button
                key={m.userId}
                onClick={() => {
                  onAdd(m.userId);
                  setSearch('');
                  setOpen(false);
                }}
                className={cn(
                  'flex items-center gap-2.5 w-full px-2 py-1.5 rounded-md text-sm',
                  'hover:bg-muted/60 transition-colors text-left'
                )}
              >
                <Avatar
                  className="h-6 w-6 shrink-0"
                  style={{ backgroundColor: m.avatarColor }}
                >
                  <AvatarFallback
                    className="text-[10px] font-semibold text-white"
                    style={{ backgroundColor: m.avatarColor }}
                  >
                    {m.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-medium truncate leading-tight">{m.displayName}</p>
                  {m.role && (
                    <p className="text-[11px] text-muted-foreground truncate">{m.role}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {assignees.length === 0 && (
        <span className="text-sm text-muted-foreground">No assignees</span>
      )}
    </div>
  );
}
