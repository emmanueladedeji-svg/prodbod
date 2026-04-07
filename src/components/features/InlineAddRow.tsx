import { useState } from 'react';
import { Plus } from 'lucide-react';

interface InlineAddRowProps {
  status: string;
  onAdd: (name: string) => void;
}

export function InlineAddRow({ status, onAdd }: InlineAddRowProps) {
  const [value, setValue] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value.trim()) {
      onAdd(value.trim());
      setValue('');
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border/30">
      <Plus className="h-3 w-3 text-muted-foreground shrink-0" />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add Feature..."
        className="flex-1 bg-transparent text-sm text-muted-foreground placeholder:text-muted-foreground/50 outline-none"
      />
    </div>
  );
}
