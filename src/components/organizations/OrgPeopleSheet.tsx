import { useState } from 'react';
import { Search, Users, MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  useOrgMembersProdbod,
  useInviteMembers,
  useUpdateMember,
  useRemoveMember,
  ORG_ROLES,
  DEPARTMENTS,
} from '@/hooks/useProdbodMembers';
import { InviteMemberDialog } from './InviteMemberDialog';

interface Props {
  orgId: string;
  orgName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AVATAR_COLORS = [
  'from-blue-500 to-blue-700',
  'from-violet-500 to-purple-700',
  'from-emerald-500 to-teal-700',
  'from-rose-500 to-pink-700',
  'from-amber-500 to-orange-700',
  'from-cyan-500 to-sky-700',
];

function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function statusBadge(status: string, role: string) {
  if (role === 'Owner')
    return <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">Owner</Badge>;
  if (status === 'Active')
    return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100">Active</Badge>;
  return <Badge className="bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100">Pending</Badge>;
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
}

export function OrgPeopleSheet({ orgId, orgName, open, onOpenChange }: Props) {
  const [search, setSearch] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: members = [], isLoading } = useOrgMembersProdbod(orgId);
  const inviteMutation = useInviteMembers(orgId);
  const updateMutation = useUpdateMember(orgId);
  const deleteMutation = useRemoveMember(orgId);

  const filtered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.email && m.email.toLowerCase().includes(search.toLowerCase()))
  );

  const handleInvite = async (data: { emails: string[]; department?: string }) => {
    try {
      const results = await inviteMutation.mutateAsync(data.emails);
      
      const successCount = results.filter(r => r.emailSent).length;
      const failCount = results.length - successCount;

      if (successCount > 0) {
        toast({ 
          title: 'Invites sent', 
          description: `${successCount} invitation${successCount !== 1 ? 's' : ''} sent successfully.` 
        });
      }
      
      if (failCount > 0) {
        toast({ 
          title: 'Some invites failed', 
          description: `${failCount} invitation${failCount !== 1 ? 's' : ''} could not be sent.`,
          variant: 'destructive'
        });
      }

      setInviteOpen(false);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleRoleChange = (id: string, role: string) => {
    updateMutation.mutate({ memberId: id, updates: { role } });
  };

  const handleDeptChange = (id: string, department: string) => {
    updateMutation.mutate({ memberId: id, updates: { department } });
  };

  const handleRemove = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => toast({ title: 'Member removed' }),
    });
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-3xl flex flex-col bg-background p-0">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <SheetTitle className="text-lg font-semibold">Manage people</SheetTitle>
                  <SheetDescription className="text-sm text-muted-foreground">{orgName}</SheetDescription>
                </div>
              </div>
              <Button size="sm" onClick={() => setInviteOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Invite people
              </Button>
            </div>
          </SheetHeader>

          {/* Search + filter bar */}
          <div className="px-6 py-3 flex items-center gap-3 border-b border-border">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Badge variant="secondary" className="whitespace-nowrap">
              All Users ({members.length})
            </Badge>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-sm gap-2">
                <Users className="h-8 w-8 opacity-40" />
                {members.length === 0
                  ? 'No members yet. Invite someone to get started.'
                  : 'No results found.'}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Invited by</TableHead>
                    <TableHead>Invited on</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((m) => (
                    <TableRow key={m.id}>
                      {/* Name + avatar */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              'h-8 w-8 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold text-xs shrink-0',
                              avatarColor(m.name)
                            )}
                          >
                            {getInitials(m.name)}
                          </div>
                          <span className="font-medium text-sm truncate max-w-[160px]">{m.name}</span>
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell>{statusBadge(m.status, m.role)}</TableCell>

                      {/* Email */}
                      <TableCell className="text-sm text-muted-foreground truncate max-w-[180px]">
                        {m.email || '—'}
                      </TableCell>

                      {/* Role dropdown */}
                      <TableCell>
                        <Select value={m.role} onValueChange={(v) => handleRoleChange(m.id, v)}>
                          <SelectTrigger className="h-8 w-[110px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ORG_ROLES.map((r) => (
                              <SelectItem key={r} value={r}>
                                {r}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>

                      {/* Department dropdown */}
                      <TableCell>
                        <Select
                          value={m.department || ''}
                          onValueChange={(v) => handleDeptChange(m.id, v)}
                        >
                          <SelectTrigger className="h-8 w-[140px] text-xs">
                            <SelectValue placeholder="Assign…" />
                          </SelectTrigger>
                          <SelectContent>
                            {DEPARTMENTS.map((d) => (
                              <SelectItem key={d} value={d}>
                                {d}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>

                      {/* Invited by */}
                      <TableCell className="text-sm text-muted-foreground truncate max-w-[140px]">
                        {m.invited_by || '—'}
                      </TableCell>

                      {/* Invited on */}
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(m.invited_on)}
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleRemove(m.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove member
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-border bg-muted/20 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{members.length}</span>{' '}
            member{members.length !== 1 ? 's' : ''} in this organization
          </div>
        </SheetContent>
      </Sheet>

      <InviteMemberDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onInvite={handleInvite}
        loading={inviteMutation.isPending}
      />
    </>
  );
}
