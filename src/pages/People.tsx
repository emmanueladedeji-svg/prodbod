import { useState, useRef, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useMyOrgs } from '@/hooks/useProdbodOrgs';
import { useOrgMembersProdbod, useInviteMembers, useUpdateMemberRole, useRemoveMember, ProdbodMember } from '@/hooks/useProdbodMembers';
import { Loader2 } from 'lucide-react';

function avatarColor(s: string) {
  const c = ['#3d6cff', '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626', '#be185d'];
  let h = 0;
  for (const ch of (s || '')) h = (h * 31 + ch.charCodeAt(0)) % c.length;
  return c[h];
}
function initials(name: string, email: string) {
  if (name) return name.split(' ').map((n) => n[0] || '').slice(0, 2).join('').toUpperCase();
  return email.substring(0, 2).toUpperCase();
}
function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
function capitalize(s: string) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

function isValidEmail(e: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim()); }

// Invite links modal
function InviteLinksModal({ links, onClose }: { links: { email: string; token: string }[]; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--pb-bg2)', border: '1px solid var(--pb-border2)', borderRadius: 'var(--pb-rxl)', width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ padding: '20px 22px 16px', borderBottom: '1px solid var(--pb-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700 }}>Invites sent!</div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--pb-border)', background: 'transparent', cursor: 'pointer', color: 'var(--pb-text3)', fontSize: 16 }}>✕</button>
        </div>
        <div style={{ padding: '20px 22px' }}>
          <div style={{ padding: '11px 14px', borderRadius: 'var(--pb-r)', fontSize: 13, marginBottom: 16, background: 'var(--pb-blue-bg)', border: '1px solid var(--pb-blue-border)', color: 'var(--pb-blue)' }}>
            Share these invite links with the recipients, or copy them to send via your preferred channel.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {links.map(({ email, token }) => (
              <div key={token} style={{ background: 'var(--pb-bg3)', border: '1px solid var(--pb-border)', borderRadius: 'var(--pb-r)', padding: '10px 14px' }}>
                <div style={{ fontSize: 12, color: 'var(--pb-text3)', marginBottom: 4 }}>{email}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input readOnly value={`${window.location.origin}/invite?invite=${token}`} style={{ flex: 1, fontSize: 12, padding: '6px 10px', border: '1px solid var(--pb-border)', borderRadius: 6, background: 'var(--pb-bg2)', color: 'var(--pb-text)', fontFamily: "'DM Sans', sans-serif", outline: 'none' }} onClick={(e) => (e.target as HTMLInputElement).select()} />
                  <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/invite?invite=${token}`)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--pb-border)', background: 'var(--pb-bg2)', cursor: 'pointer', fontSize: 12, color: 'var(--pb-text2)', fontFamily: "'DM Sans', sans-serif" }}>Copy</button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--pb-border)', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '10px 18px', borderRadius: 'var(--pb-r)', fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, fontWeight: 500, cursor: 'pointer', border: '1px solid var(--pb-accent)', background: 'var(--pb-accent)', color: '#fff' }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default function People() {
  const { currentOrgId, userProfile } = useApp();
  const { data: orgs = [] } = useMyOrgs();
  const { data: members = [], isLoading } = useOrgMembersProdbod(currentOrgId);
  const inviteMembers = useInviteMembers(currentOrgId);
  const updateRole = useUpdateMemberRole(currentOrgId);
  const removeMember = useRemoveMember(currentOrgId);

  const org = orgs.find((o) => o.id === currentOrgId);

  const [emailTags, setEmailTags] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [emailError, setEmailError] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'pending'>('all');
  const [search, setSearch] = useState('');
  const [inviteLinks, setInviteLinks] = useState<{ email: string; token: string }[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addEmailTag = useCallback((email: string) => {
    const trimmed = email.trim().replace(/,$/, '');
    if (!trimmed) return;
    setEmailError('');
    if (!isValidEmail(trimmed)) { setEmailError(`"${trimmed}" is not a valid email.`); return; }
    if (emailTags.includes(trimmed)) { setEmailError(`"${trimmed}" already added.`); return; }
    if (members.find((m) => m.email === trimmed)) { setEmailError(`"${trimmed}" is already a member.`); return; }
    setEmailTags((prev) => [...prev, trimmed]);
  }, [emailTags, members]);

  const removeEmailTag = (i: number) => setEmailTags((prev) => prev.filter((_, idx) => idx !== i));

  const handleEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addEmailTag(emailInput);
      setEmailInput('');
    } else if (e.key === 'Backspace' && !emailInput && emailTags.length) {
      setEmailTags((prev) => prev.slice(0, -1));
    }
  };

  const handleEmailInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v.endsWith(',') || v.endsWith(' ')) {
      addEmailTag(v);
      setEmailInput('');
    } else {
      setEmailInput(v);
    }
  };

  const handleSendInvites = async () => {
    if (emailInput.trim()) addEmailTag(emailInput.trim());
    const tags = emailInput.trim() ? [...emailTags, emailInput.trim().replace(/,$/, '')] : [...emailTags];
    const validTags = tags.filter((e) => isValidEmail(e));
    if (!validTags.length) { setEmailError('Add at least one email address.'); return; }
    try {
      const results = await inviteMembers.mutateAsync(validTags);
      setEmailTags([]);
      setEmailInput('');
      setEmailError('');
      setInviteLinks(results);
    } catch (e: any) {
      setEmailError(e.message || 'Failed to send invites.');
    }
  };

  // Filter + search
  let list = [...members];
  if (filter === 'active') list = list.filter((m) => m.status === 'Active');
  if (filter === 'pending') list = list.filter((m) => m.status === 'Pending');
  if (search) {
    const q = search.toLowerCase();
    list = list.filter((m) => {
      const displayName = m.profile ? `${m.profile.first_name || ''} ${m.profile.last_name || ''}`.trim() : (m.name || '');
      return displayName.toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q);
    });
  }

  const filterBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px', border: '1px solid var(--pb-border)', borderRadius: 20, fontSize: 12.5,
    background: active ? 'var(--pb-bg3)' : 'var(--pb-bg2)', cursor: 'pointer',
    color: active ? 'var(--pb-text)' : 'var(--pb-text2)', fontWeight: active ? 500 : 400,
    borderColor: active ? 'var(--pb-border2)' : 'var(--pb-border)',
    fontFamily: "'DM Sans', sans-serif", transition: 'all .15s',
  });

  return (
    <div className="prodbod" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Invite panel */}
      <div style={{ background: 'var(--pb-bg2)', border: '1px solid var(--pb-border)', borderRadius: 'var(--pb-rl)', padding: 20, marginBottom: 20 }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ flexShrink: 0 }}>
            <path d="M11 8a3 3 0 100-6 3 3 0 000 6z"/>
            <path d="M2 14c0-3 2-5 5-5"/>
            <path d="M13 11h4M15 9v4" strokeLinecap="round"/>
          </svg>
          Invite people to{' '}
          <span style={{ color: 'var(--pb-accent-alt)' }}>{org?.name || '—'}</span>
        </div>

        {/* Email tags input */}
        <div
          onClick={() => inputRef.current?.focus()}
          style={{ minHeight: 48, padding: '8px 10px', border: '1.5px solid var(--pb-border)', borderRadius: 'var(--pb-r)', display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', cursor: 'text', transition: 'border-color .15s', background: 'var(--pb-bg)' }}
          onFocus={() => {}}
        >
          {emailTags.map((email, i) => (
            <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', background: 'var(--pb-blue-bg)', border: '1px solid var(--pb-blue-border)', borderRadius: 4, fontSize: 12.5, color: 'var(--pb-blue)' }}>
              {email}
              <button onClick={() => removeEmailTag(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--pb-blue)', fontSize: 15, lineHeight: 1, padding: 0, opacity: 0.7 }}>×</button>
            </div>
          ))}
          <input
            ref={inputRef}
            id="people-invite-input"
            type="text"
            value={emailInput}
            onChange={handleEmailInputChange}
            onKeyDown={handleEmailKeyDown}
            placeholder={emailTags.length === 0 ? 'Add emails, press Enter or comma to add multiple…' : ''}
            style={{ border: 'none', outline: 'none', fontFamily: "'DM Sans', sans-serif", fontSize: 13, background: 'transparent', flex: 1, minWidth: 180, color: 'var(--pb-text)' }}
          />
        </div>
        {emailError && <div style={{ fontSize: 12, color: 'var(--pb-red)', marginTop: 4 }}>{emailError}</div>}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, gap: 12, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 12, color: 'var(--pb-text3)', flex: 1 }}>
            Invited users join as <strong>Member</strong>. You can change roles in the table below after sending.
          </div>
          <button onClick={handleSendInvites} disabled={inviteMembers.isPending} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 12px', borderRadius: 'var(--pb-r)', fontFamily: "'DM Sans', sans-serif", fontSize: 12.5, fontWeight: 500, cursor: 'pointer', border: '1px solid var(--pb-accent)', background: 'var(--pb-accent)', color: '#fff', transition: 'all .15s' }}>
            {inviteMembers.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 8h12M10 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            Send invites
          </button>
        </div>
      </div>

      {/* Filters + search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button style={filterBtnStyle(filter === 'all')} onClick={() => setFilter('all')}>All users <span style={{ opacity: 0.6 }}>({members.length})</span></button>
        <button style={filterBtnStyle(filter === 'active')} onClick={() => setFilter('active')}>Active</button>
        <button style={filterBtnStyle(filter === 'pending')} onClick={() => setFilter('pending')}>Pending</button>
        <div style={{ marginLeft: 'auto', position: 'relative' }}>
          <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, pointerEvents: 'none' }} viewBox="0 0 16 16" fill="none" stroke="var(--pb-text3)" strokeWidth="1.5">
            <circle cx="7" cy="7" r="4"/><path d="M11 11l2.5 2.5" strokeLinecap="round"/>
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            style={{ padding: '7px 12px 7px 32px', border: '1px solid var(--pb-border)', borderRadius: 'var(--pb-r)', fontFamily: "'DM Sans', sans-serif", fontSize: 13, outline: 'none', width: 220, background: 'var(--pb-bg2)', color: 'var(--pb-text)' }}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--pb-bg2)', border: '1px solid var(--pb-border)', borderRadius: 'var(--pb-rl)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Name', 'Email', 'Role', 'Invited by', 'Invited on', 'Status', 'Last active', ''].map((h) => (
                <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 500, color: 'var(--pb-text3)', borderBottom: '1px solid var(--pb-border)', background: 'var(--pb-bg3)', whiteSpace: 'nowrap', fontFamily: "'Syne', sans-serif", letterSpacing: '.04em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center' }}><Loader2 className="h-5 w-5 animate-spin mx-auto" style={{ color: 'var(--pb-accent-alt)' }} /></td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--pb-text3)', fontSize: 13 }}>No members found</td></tr>
            ) : list.map((m) => {
              const displayName = m.profile
                ? `${m.profile.first_name || ''} ${m.profile.last_name || ''}`.trim()
                : m.name || '';
              const email = m.email || '';
              const av = initials(displayName, email);
              const avColor = avatarColor(email || displayName);
              const isOwner = m.role === 'Owner';

              return (
                <MemberRow
                  key={m.id}
                  member={m}
                  displayName={displayName}
                  email={email}
                  av={av}
                  avColor={avColor}
                  isOwner={isOwner}
                  onRoleChange={(role) => updateRole.mutate({ memberId: m.id, role })}
                  onRemove={() => {
                    if (confirm(`Remove ${displayName || email}?`)) removeMember.mutate(m.id);
                  }}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      {inviteLinks && <InviteLinksModal links={inviteLinks} onClose={() => setInviteLinks(null)} />}
    </div>
  );
}

function MemberRow({ member, displayName, email, av, avColor, isOwner, onRoleChange, onRemove }: {
  member: ProdbodMember;
  displayName: string;
  email: string;
  av: string;
  avColor: string;
  isOwner: boolean;
  onRoleChange: (role: string) => void;
  onRemove: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const tdStyle: React.CSSProperties = {
    padding: '12px 14px', fontSize: 13, borderBottom: '1px solid var(--pb-border)',
    verticalAlign: 'middle', background: hovered ? 'var(--pb-bg3)' : 'transparent', transition: 'background .15s',
  };
  const statusActive = member.status === 'Active';

  return (
    <tr onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <td style={tdStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0, fontFamily: "'Syne', sans-serif", color: '#fff', background: avColor }}>{av}</div>
          <div>
            <div style={{ fontWeight: 500, fontSize: 13.5 }}>{displayName || email}</div>
            {displayName && <div style={{ fontSize: 11.5, color: 'var(--pb-text3)' }}>{email}</div>}
          </div>
        </div>
      </td>
      <td style={{ ...tdStyle, color: 'var(--pb-text2)', fontSize: 12.5 }}>{email}</td>
      <td style={tdStyle}>
        {isOwner ? (
          <span style={{ fontSize: 13, color: 'var(--pb-accent-alt)', fontWeight: 600 }}>Owner</span>
        ) : (
          <select
            value={member.role}
            onChange={(e) => onRoleChange(e.target.value)}
            style={{ padding: '4px 26px 4px 8px', border: '1px solid var(--pb-border)', borderRadius: 5, fontFamily: "'DM Sans', sans-serif", fontSize: 12.5, cursor: 'pointer', appearance: 'none', background: `var(--pb-bg2) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%239a9a94' stroke-width='1.4' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 7px center`, outline: 'none', color: 'var(--pb-text)' }}
          >
            <option value="Owner">Owner</option>
            <option value="Staff">Member</option>
            <option value="Team Lead">Admin</option>
          </select>
        )}
      </td>
      <td style={{ ...tdStyle, color: 'var(--pb-text2)', fontSize: 12.5 }}>{member.invited_by || '—'}</td>
      <td style={{ ...tdStyle, color: 'var(--pb-text2)', fontSize: 12.5 }}>{fmtDate(member.invited_on)}</td>
      <td style={tdStyle}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 20, fontSize: 11.5, fontWeight: 500, background: statusActive ? 'var(--pb-green-bg)' : 'var(--pb-amber-bg)', color: statusActive ? 'var(--pb-green)' : 'var(--pb-amber)', border: `1px solid ${statusActive ? 'var(--pb-green-border)' : 'var(--pb-amber-border)'}` }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
          {capitalize(member.status)}
        </span>
      </td>
      <td style={{ ...tdStyle, color: 'var(--pb-text2)', fontSize: 12.5 }}>{fmtDate(member.last_active)}</td>
      <td style={tdStyle}>
        {!isOwner && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, opacity: hovered ? 1 : 0, transition: 'opacity .15s' }}>
            <button onClick={onRemove} title="Remove" style={{ width: 28, height: 28, borderRadius: 5, border: '1px solid var(--pb-border)', background: 'var(--pb-bg2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--pb-text3)', transition: 'all .15s' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--pb-red-border)'; e.currentTarget.style.color = 'var(--pb-red)'; e.currentTarget.style.background = 'var(--pb-red-bg)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--pb-border)'; e.currentTarget.style.color = 'var(--pb-text3)'; e.currentTarget.style.background = 'var(--pb-bg2)'; }}
            >
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M1 1l10 10M11 1L1 11" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
