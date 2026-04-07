import { useState } from 'react';
import { Search, Check, X, Users, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  MOCK_TEAM_DIRECTORY,
  MockUser,
  ProductTeamData,
  OPTIONAL_ROLES,
} from '@/data/mockTeamDirectory';

interface TeamStepProps {
  teamData: ProductTeamData;
  onChange: (data: ProductTeamData) => void;
  /** When provided, only users in this list are shown. Org-scoped selection. */
  allowedUserIds?: string[];
}

const LEADERSHIP_ROLES: { key: keyof Pick<ProductTeamData, 'productManager' | 'scrumMaster' | 'leadDeveloper' | 'leadDesigner'>; label: string }[] = [
  { key: 'productManager', label: 'Product Manager' },
  { key: 'scrumMaster', label: 'Scrum Master' },
  { key: 'leadDeveloper', label: 'Lead Developer' },
  { key: 'leadDesigner', label: 'Lead Designer' },
];

function UserAvatar({ user, size = 'md' }: { user: MockUser; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm';
  return (
    <div className={cn('rounded-full bg-gradient-to-br flex items-center justify-center text-white font-semibold flex-shrink-0', sizeClass, user.avatarColor)}>
      {user.initials}
    </div>
  );
}

export function TeamStep({ teamData, onChange, allowedUserIds }: TeamStepProps) {
  const [search, setSearch] = useState('');

  // If allowedUserIds provided, scope to those users; else use full directory
  const pool = allowedUserIds !== undefined
    ? MOCK_TEAM_DIRECTORY.filter(u => allowedUserIds.includes(u.id))
    : MOCK_TEAM_DIRECTORY;

  const filtered = pool.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.department.toLowerCase().includes(search.toLowerCase())
  );

  const selectedUsers = pool.filter(u => teamData.selectedMemberIds.includes(u.id));

  const toggleMember = (user: MockUser) => {
    const isSelected = teamData.selectedMemberIds.includes(user.id);
    if (isSelected) {
      // Remove from selection and clear any leadership role assignments
      const newIds = teamData.selectedMemberIds.filter(id => id !== user.id);
      const newMemberRoles = { ...teamData.memberRoles };
      delete newMemberRoles[user.id];
      const updated: ProductTeamData = {
        ...teamData,
        selectedMemberIds: newIds,
        productManager: teamData.productManager === user.id ? null : teamData.productManager,
        scrumMaster: teamData.scrumMaster === user.id ? null : teamData.scrumMaster,
        leadDeveloper: teamData.leadDeveloper === user.id ? null : teamData.leadDeveloper,
        leadDesigner: teamData.leadDesigner === user.id ? null : teamData.leadDesigner,
        memberRoles: newMemberRoles,
      };
      onChange(updated);
    } else {
      onChange({ ...teamData, selectedMemberIds: [...teamData.selectedMemberIds, user.id] });
    }
  };

  const setLeadershipRole = (key: keyof Pick<ProductTeamData, 'productManager' | 'scrumMaster' | 'leadDeveloper' | 'leadDesigner'>, value: string) => {
    onChange({ ...teamData, [key]: value === '__none__' ? null : value });
  };

  const setOptionalRole = (userId: string, role: string) => {
    const newMemberRoles = { ...teamData.memberRoles, [userId]: role === '__none__' ? null : role as any };
    onChange({ ...teamData, memberRoles: newMemberRoles });
  };

  // Members not in a leadership role
  const leadershipIds = [teamData.productManager, teamData.scrumMaster, teamData.leadDeveloper, teamData.leadDesigner].filter(Boolean) as string[];
  const additionalMembers = selectedUsers.filter(u => !leadershipIds.includes(u.id));

  // No org members scenario
  if (allowedUserIds !== undefined && allowedUserIds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
          <AlertCircle className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="text-sm font-semibold text-foreground mb-2">No organization members yet</p>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
          Add people to your organization first (via the <strong>People</strong> button in the sidebar). Only organization members can be assigned to a product team.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section 1: Directory */}
      <div>
        <h3 className="font-semibold text-foreground mb-1">Select Team Members</h3>
        <p className="text-sm text-muted-foreground mb-3">Choose who will work on this product.</p>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or department..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
          {filtered.map(user => {
            const isSelected = teamData.selectedMemberIds.includes(user.id);
            return (
              <button
                key={user.id}
                type="button"
                onClick={() => toggleMember(user)}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border text-left transition-all',
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
            <p className="text-sm text-muted-foreground col-span-2 py-4 text-center">No team members found.</p>
          )}
        </div>

        {/* Selected chips */}
        {selectedUsers.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedUsers.map(u => (
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
            <AlertCircle className="h-3 w-3" /> At least one team member is required.
          </p>
        )}
      </div>

      {/* Section 2: Leadership roles */}
      {selectedUsers.length > 0 && (
        <div>
          <h3 className="font-semibold text-foreground mb-1">Assign Leadership Roles</h3>
          <p className="text-sm text-muted-foreground mb-3">All four roles must be filled before creating the product.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {LEADERSHIP_ROLES.map(({ key, label }) => {
              const value = teamData[key];
              const missing = !value;
              return (
                <div key={key} className="space-y-1">
                  <label className="text-sm font-medium text-foreground flex items-center gap-1">
                    {label}
                    <span className="text-destructive">*</span>
                  </label>
                  <Select
                    value={value ?? '__none__'}
                    onValueChange={v => setLeadershipRole(key, v)}
                  >
                    <SelectTrigger className={cn('w-full', missing && 'border-destructive/60')}>
                      <SelectValue placeholder="Select person..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— Select person —</SelectItem>
                      {selectedUsers.map(u => (
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
                  {missing && (
                    <p className="text-xs text-destructive">Required</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Section 3: Additional roles */}
      {additionalMembers.length > 0 && (
        <div>
          <h3 className="font-semibold text-foreground mb-1">Additional Member Roles <span className="text-muted-foreground font-normal text-sm">(optional)</span></h3>
          <div className="space-y-2">
            {additionalMembers.map(user => (
              <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 border border-border">
                <UserAvatar user={user} size="sm" />
                <span className="flex-1 text-sm font-medium text-foreground">{user.name}</span>
                <Select
                  value={teamData.memberRoles[user.id] ?? '__none__'}
                  onValueChange={v => setOptionalRole(user.id, v)}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Assign role..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— No role —</SelectItem>
                    {OPTIONAL_ROLES.map(r => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 4: Summary */}
      {selectedUsers.length > 0 && (
        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground text-sm">Team Summary</h3>
          </div>
          <div className="space-y-1.5 text-sm">
            {LEADERSHIP_ROLES.map(({ key, label }) => {
              const id = teamData[key];
              const user = id ? MOCK_TEAM_DIRECTORY.find(u => u.id === id) : null;
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
      )}
    </div>
  );
}
