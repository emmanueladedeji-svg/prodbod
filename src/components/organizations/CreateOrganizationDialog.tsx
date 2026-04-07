import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateOrganization } from '@/hooks/useOrganizations';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (org: { id: string; name: string }) => void;
}

export function CreateOrganizationDialog({ open, onOpenChange, onCreated }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const createOrg = useCreateOrganization();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const org = await createOrg.mutateAsync({ name: name.trim(), description: description.trim() || undefined });
      toast.success('Organization created');
      onCreated?.({ id: org.id, name: org.name });
      setName('');
      setDescription('');
      onOpenChange(false);
    } catch {
      toast.error('Failed to create organization');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New Organization</DialogTitle>
            <DialogDescription>Create a new organization to manage your products.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="org-name">Name *</Label>
              <Input
                id="org-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Acme Corp"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="org-desc">Description</Label>
              <Textarea
                id="org-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the organization"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createOrg.isPending || !name.trim()}>
              {createOrg.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
