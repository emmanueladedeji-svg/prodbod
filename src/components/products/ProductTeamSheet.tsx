import { useEffect, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Crown, Users, Search, Check, X, AlertCircle, Info } from 'lucide-react';
import {
  loadProductTeam,
  saveProductTeam,
  loadOrgMembers,
  ProductTeamData,
  getUserById,
  MOCK_TEAM_DIRECTORY,
  MockUser,
  EMPTY_TEAM_DATA,
  OPTIONAL_ROLES,
} from '@/data/mockTeamDirectory';
import { DbProduct } from '@/hooks/useProducts';
import { cn } from '@/lib/utils';

interface Props {
  product: DbProduct | null;
  organizationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LEADERSHIP_ROLES: {
  key: keyof Pick<ProductTeamData, 'productManager' | 'scrumMaster' | 'leadDeveloper' | 'leadDesigner'>;
  label: string;
  highlight?: boolean;
}[] = [
  { key: 'productManager', label: 'Product Manager', highlight: true },
  { key: 'scrumMaster', label: 'Scrum Master' },
  { key: 'leadDeveloper', label: 'Lead Developer' },
  { key: 'leadDesigner', label: 'Lead Designer' },
];

function UserAvatar({ user, size = 'md' }: { user: MockUser; size?: 'sm' | 'md' }) {
  const s = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm';
  return (
    <div className={cn(
      'rounded-full bg-gradient-to-br flex items-center justify-center text-white font-semibold flex-shrink-0',
      s,
      user.avatarColor
    )}>
      {user.initials}
    </div>
  );
}

export function ProductTeamSheet({ product, organizationId, open, onOpenChange }: Props) {
  const [teamData, setTeamData] = useState<ProductTeamData>(EMPTY_TEAM_DATA);
  const [orgMemberIds, setOrgMemberIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (open && product?.id) {
      const loaded = loadProductTeam(product.id);
      setTeamData(loaded ?? EMPTY_TEAM_DATA);
    } else {
      setTeamData(EMPTY_TEAM_DATA);
    }
    if (open && organizationId) {
      setOrgMemberIds(loadOrgMembers(organizationId));
    }
    setSearch('');
  }, [open, product?.id, organizationId]);

  // Pool of users the org has added
  const orgMembers = MOCK_TEAM_DIRECTORY.filter((u) => orgMemberIds.includes(u.id));

  const filtered = orgMembers.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.department.toLowerCase().includes(search.toLowerCase())
  );

  const selectedUsers = orgMembers.filter((u) => teamData.selectedMemberIds.includes(u.id));

  const toggleMember = (user: MockUser) => {
    const isSelected = teamData.selectedMemberIds.includes(user.id);
    if (isSelected) {
      const newIds = teamData.selectedMemberIds.filter((id) => id !== user.id);
      const newMemberRoles = { ...teamData.memberRoles };
      delete newMemberRoles[user.id];
      setTeamData({
        ...teamData,
        selectedMemberIds: newIds,
        productManager: teamData.productManager === user.id ? null : teamData.productManager,
        scrumMaster: teamData.scrumMaster === user.id ? null : teamData.scrumMaster,
        leadDeveloper: teamData.leadDeveloper === user.id ? null : teamData.leadDeveloper,
        leadDesigner: teamData.leadDesigner === user.id ? null : teamData.leadDesigner,
        memberRoles: newMemberRoles,
      });
    } else {
      setTeamData({ ...teamData, selectedMemberIds: [...teamData.selectedMemberIds, user.id] });
    }
  };

  const setLeadershipRole = (
    key: keyof Pick<ProductTeamData, 'productManager' | 'scrumMaster' | 'leadDeveloper' | 'leadDesigner'>,
    value: string
  ) => {
    setTeamData({ ...teamData, [key]: value === '__none__' ? null : value });
  };

  const setOptionalRole = (userId: string, role: string) => {
    setTeamData({
      ...teamData,
      memberRoles: { ...teamData.memberRoles, [userId]: role === '__none__' ? null : (role as any) },
    });
  };

  const handleSave = () => {
    if (product?.id) {
      saveProductTeam(product.id, teamData);
    }
    onOpenChange(false);
  };

  const leadershipIds = [
    teamData.productManager,
    teamData.scrumMaster,
    teamData.leadDeveloper,
    teamData.leadDesigner,
  ].filter(Boolean) as string[];

  const additionalMembers = selectedUsers.filter((u) => !leadershipIds.includes(u.id));

  // No org members yet
  if (open && orgMemberIds.length === 0) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-md bg-background flex flex-col p-0">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-lg font-semibold">Product Team</SheetTitle>
                <SheetDescription className="text-sm text-muted-foreground">{product?.name ?? ''}</SheetDescription>
              </div>
            </div>
          </SheetHeader>
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Info className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-foreground mb-2">No organization members yet</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Add people to your organization first using the <strong>People</strong> button at the top of the switcher. Only organization members can be assigned to a product.
            </p>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col bg-background p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-lg font-semibold">Product Team</SheetTitle>
              <SheetDescription className="text-sm text-muted-foreground">{product?.name ?? ''}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Section 1 — Select members */}
          <div>
            <h3 className="font-semibold text-foreground mb-1">Select Team Members</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Choose from your organization's members.
            </p>

            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or department..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {filtered.map((user) => {
                const isSelected = teamData.selectedMemberIds.includes(user.id);
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => toggleMember(user)}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border text-left transition-all w-full',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card hover:border-primary/50 hover:bg-muted/30'
                    )}
                  >
                    <UserAvatar user={user} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.department}</p>
                    </div>
                    {isSelected && (
                      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No members found.</p>
              )}
            </div>

            {/* Selected chips */}
            {selectedUsers.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedUsers.map((u) => (
                  <Badge key={u.id} variant="secondary" className="gap-1 pl-2 pr-1 py-1">
                    {u.name}
                    <button type="button" onClick={() => toggleMember(u)} className="ml-1 rounded-full hover:bg-muted">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {teamData.selectedMemberIds.length === 0 && (
              <p className="text-xs text-destructive flex items-center gap-1 mt-2">
                <AlertCircle className="h-3 w-3" /> Select at least one team member.
              </p>
            )}
          </div>

          {/* Section 2 — Leadership roles */}
          {selectedUsers.length > 0 && (
            <div>
              <h3 className="font-semibold text-foreground mb-1">Leadership Roles</h3>
              <p className="text-sm text-muted-foreground mb-3">Assign the four key leadership roles.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {LEADERSHIP_ROLES.map(({ key, label, highlight }) => {
                  const value = teamData[key];
                  return (
                    <div key={key} className="space-y-1">
                      <label className="text-sm font-medium text-foreground flex items-center gap-1">
                        {highlight && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                        {label} <span className="text-destructive">*</span>
                      </label>
                      <Select value={value ?? '__none__'} onValueChange={(v) => setLeadershipRole(key, v)}>
                        <SelectTrigger className={cn('w-full', !value && 'border-destructive/60')}>
                          <SelectValue placeholder="Select person..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">— Select person —</SelectItem>
                          {selectedUsers.map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              <div className="flex items-center gap-2">
                                <div className={cn('h-5 w-5 rounded-full bg-gradient-to-br text-white flex items-center justify-center text-[10px] font-bold', u.avatarColor)}>
                                  {u.initials}
                                </div>
                                {u.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 3 — Optional roles */}
          {additionalMembers.length > 0 && (
            <div>
              <h3 className="font-semibold text-foreground mb-1">
                Additional Roles <span className="text-muted-foreground font-normal text-sm">(optional)</span>
              </h3>
              <div className="space-y-2">
                {additionalMembers.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 border border-border">
                    <UserAvatar user={user} size="sm" />
                    <span className="flex-1 text-sm font-medium text-foreground">{user.name}</span>
                    <Select
                      value={teamData.memberRoles[user.id] ?? '__none__'}
                      onValueChange={(v) => setOptionalRole(user.id, v)}
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue placeholder="Assign role..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— No role —</SelectItem>
                        {OPTIONAL_ROLES.map((r) => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 4 — Summary */}
          {selectedUsers.length > 0 && (
            <>
              <Separator />
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-foreground text-sm">Team Summary</h3>
                </div>
                <div className="space-y-1.5 text-sm">
                  {LEADERSHIP_ROLES.map(({ key, label }) => {
                    const id = teamData[key];
                    const user = id ? getUserById(id) : null;
                    return (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-muted-foreground">{label}:</span>
                        <span className={cn('font-medium', user ? 'text-foreground' : 'text-destructive/70')}>
                          {user ? user.name : '—'}
                        </span>
                      </div>
                    );
                  })}
                  <div className="pt-1 border-t border-border flex items-center justify-between mt-1">
                    <span className="text-muted-foreground">Total members:</span>
                    <span className="font-semibold text-foreground">{selectedUsers.length}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={teamData.selectedMemberIds.length === 0}>
            Save Team
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
