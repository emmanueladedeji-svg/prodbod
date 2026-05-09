import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DEPARTMENTS } from '@/hooks/useProdbodMembers';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (data: { emails: string[]; department?: string }) => void;
  loading?: boolean;
}

export function InviteMemberDialog({ open, onOpenChange, onInvite, loading }: Props) {
  const [emailsText, setEmailsText] = useState('');
  const [department, setDepartment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emails = emailsText
      .split(/[\s,]+/)
      .map((e) => e.trim())
      .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

    if (emails.length === 0) return;

    onInvite({ emails, department: department || undefined });
    setEmailsText('');
    setDepartment('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite People</DialogTitle>
          <DialogDescription>Add a new member to this organization.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="inv-emails">Emails</Label>
            <Textarea
              id="inv-emails"
              placeholder="Enter emails separated by commas or new lines..."
              value={emailsText}
              onChange={(e) => setEmailsText(e.target.value)}
              className="min-h-[100px] resize-none"
              required
            />
            <p className="text-[11px] text-muted-foreground">
              Invite multiple people at once by separating emails with commas or new lines.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Department</Label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !emailsText.trim()}>
              {loading ? 'Inviting…' : 'Send Invites'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
