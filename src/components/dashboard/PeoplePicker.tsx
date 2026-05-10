import { useState } from 'react';
import { useOrgMembersProdbod } from '@/hooks/useProdbodMembers';
import { useApp } from '@/contexts/AppContext';
import { Loader2 } from 'lucide-react';

interface PeoplePickerProps {
  isOpen: boolean;
  title: string;
  onSelect: (userId: string) => void;
  onClose: () => void;
  currentUserId?: string;
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(userId: string) {
  const colors = ['#D97706', '#8B5CF6', '#10B981', '#EC4899', '#3B82F6', '#6B7280'];
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

export function PeoplePicker({ isOpen, title, onSelect, onClose, currentUserId }: PeoplePickerProps) {
  const { currentOrgId } = useApp();
  const { data: members = [], isLoading } = useOrgMembersProdbod(currentOrgId);
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredMembers = members.filter(m => {
    const query = search.toLowerCase();
    return (m.name?.toLowerCase() || '').includes(query) || (m.email?.toLowerCase() || '').includes(query);
  });

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.25)',
        zIndex: 500,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--pb-bg2)',
          border: '1px solid var(--pb-border)',
          borderRadius: 16,
          padding: 20,
          width: 340,
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        }}
      >
        {/* Title */}
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: 'var(--pb-text)' }}>{title}</div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search team members…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid var(--pb-border)',
            borderRadius: 8,
            fontSize: 13,
            fontFamily: "'DM Sans', sans-serif",
            outline: 'none',
            marginBottom: 10,
            color: 'var(--pb-text)',
            background: 'var(--pb-bg)',
            boxSizing: 'border-box',
          }}
        />

        {/* List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 0' }}>
              <Loader2 style={{ width: 18, height: 18, color: 'var(--pb-gold)' }} className="animate-spin" />
            </div>
          ) : filteredMembers.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', fontSize: 13, color: 'var(--pb-text3)' }}>No members found</div>
          ) : (
            filteredMembers.map(member => {
              const userId = member.member_user_id || member.id;
              const name = member.name || 'Unknown';
              const role = member.department || member.role || 'Member';

              return (
                <div
                  key={member.id}
                  onClick={() => onSelect(userId)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', borderRadius: 8,
                    cursor: 'pointer', transition: 'background .15s',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--pb-bg)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    fontSize: 11, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', background: getAvatarColor(userId), flexShrink: 0,
                  }}>{getInitials(name)}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--pb-text)' }}>{name}</div>
                    <div style={{ fontSize: 11, color: 'var(--pb-text3)' }}>{role}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: '1px solid var(--pb-border)',
              borderRadius: 8,
              padding: '7px 14px',
              fontSize: 12,
              fontFamily: "'DM Sans', sans-serif",
              cursor: 'pointer',
              color: 'var(--pb-text2)',
            }}
          >Cancel</button>
        </div>
      </div>
    </div>
  );
}
