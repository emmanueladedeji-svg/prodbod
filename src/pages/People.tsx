import { useState, useRef, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useMyOrgs } from '@/hooks/useProdbodOrgs';
import { useOrgMembersProdbod, useInviteMembers, useUpdateMemberRole, useRemoveMember, useResendInvite, ProdbodMember } from '@/hooks/useProdbodMembers';
import { useOrgPermissions } from '@/hooks/useOrgRole';
import { supabase } from '@/integrations/supabase/client';
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
function fmtDate(d: string | null, includeTime = false) {
  if (!d) return '—';
  const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
    options.hour12 = true;
  }
  return new Date(d).toLocaleString('en-GB', options);
}
function capitalize(s: string) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
function isValidEmail(e: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim()); }

// Invite results modal — shows per-invite email delivery status
function InviteResultsModal({ results, onClose }: { results: { email: string; token: string; emailSent: boolean; emailError?: string }[]; onClose: () => void }) {
  const anyFailed = results.some((r) => !r.emailSent);
  const sentCount = results.filter((r) => r.emailSent).length;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--pb-bg2)', border: '1px solid var(--pb-border2)', borderRadius: 'var(--pb-rxl)', width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ padding: '20px 22px 16px', borderBottom: '1px solid var(--pb-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700 }}>Invitations sent</div>
            <div style={{ fontSize: 12, color: 'var(--pb-text3)', marginTop: 2 }}>
              {anyFailed
                ? `Emails sent to ${sentCount} of ${results.length} recipient${results.length !== 1 ? 's' : ''}`
                : `${results.length} invitation email${results.length !== 1 ? 's' : ''} sent successfully`}
            </div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--pb-border)', background: 'transparent', cursor: 'pointer', color: 'var(--pb-text3)', fontSize: 16 }}>✕</button>
        </div>
        <div style={{ padding: '20px 22px' }}>
          {anyFailed && (
            <div style={{ padding: '10px 14px', borderRadius: 'var(--pb-r)', fontSize: 12.5, marginBottom: 16, background: 'var(--pb-amber-bg)', border: '1px solid var(--pb-amber-border)', color: 'var(--pb-amber)' }}>
              Some emails couldn't be sent — share the links below manually.
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {results.map(({ email, token, emailSent, emailError }) => (
              <div key={token} style={{ background: 'var(--pb-bg3)', border: '1px solid var(--pb-border)', borderRadius: 'var(--pb-r)', padding: '10px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: emailSent ? 0 : 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--pb-text)' }}>{email}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: emailSent ? 'var(--pb-green)' : 'var(--pb-amber)', fontWeight: 500 }}>
                    {emailSent ? (
                      <>
                        <svg width="13" height="13" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1.5 6l3 3 6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Email sent
                      </>
                    ) : (
                      <>
                        <svg width="13" height="13" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 3v4M6 9v.5" strokeLinecap="round"/><circle cx="6" cy="6" r="5"/></svg>
                        Link only
                      </>
                    )}
                  </div>
                </div>
                {!emailSent && emailError && (
                  <div style={{ fontSize: 11.5, color: 'var(--pb-red)', marginBottom: 8, padding: '5px 8px', background: 'var(--pb-red-bg)', borderRadius: 4, border: '1px solid var(--pb-red-border)' }}>
                    Error: {emailError}
                  </div>
                )}
                {!emailSent && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input readOnly value={`${window.location.origin}/invite?invite=${token}`} style={{ flex: 1, fontSize: 12, padding: '6px 10px', border: '1px solid var(--pb-border)', borderRadius: 6, background: 'var(--pb-bg2)', color: 'var(--pb-text)', fontFamily: "'DM Sans', sans-serif", outline: 'none' }} onClick={(e) => (e.target as HTMLInputElement).select()} />
                    <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/invite?invite=${token}`)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--pb-border)', background: 'var(--pb-bg2)', cursor: 'pointer', fontSize: 12, color: 'var(--pb-text2)', fontFamily: "'DM Sans', sans-serif" }}>Copy</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--pb-border)', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '10px 18px', borderRadius: 'var(--pb-r)', fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, fontWeight: 500, cursor: 'pointer', border: 'none', background: 'var(--pb-gold)', color: 'var(--pb-text)' }}>
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
  const resendInvite = useResendInvite();

  const org = orgs.find((o) => o.id === currentOrgId);

  const [emailTags, setEmailTags] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [emailError, setEmailError] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'pending'>('all');
  const [search, setSearch] = useState('');
  const [inviteResults, setInviteResults] = useState<{ email: string; token: string; emailSent: boolean; emailError?: string }[] | null>(null);
  const [resendingEmail, setResendingEmail] = useState<string | null>(null);
  const [resendSentEmail, setResendSentEmail] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Determine current user's role in this organization using the scoped hook
  const { role: myRole, isAdmin: canManage } = useOrgPermissions(currentOrgId);

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

    // Client-side duplicate guard
    const pendingEmails = new Set(members.filter((m) => m.status === 'Pending').map((m) => m.email));
    const alreadyPending = validTags.filter((e) => pendingEmails.has(e));
    if (alreadyPending.length > 0) {
      setEmailError(`Already pending: ${alreadyPending.join(', ')}. Use Resend on their row to re-send the invitation.`);
      return;
    }

    try {
      const results = await inviteMembers.mutateAsync(validTags);
      setEmailTags([]);
      setEmailInput('');
      setEmailError('');
      setInviteResults(results);
    } catch (e: any) {
      setEmailError(e.message || 'Failed to send invites.');
    }
  };

  const handleResend = async (email: string) => {
    if (!currentOrgId) return;
    setResendingEmail(email);
    try {
      // 1. Try to find an existing pending invite
      let { data: inv } = await supabase
        .from('invites')
        .select('token')
        .eq('email', email)
        .eq('org_id', currentOrgId)
        .eq('accepted', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let tokenToUse = inv?.token;

      // 2. If no valid invite found, create a new one
      if (!tokenToUse) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data: newInv, error: invErr } = await supabase
          .from('invites')
          .insert({ email, org_id: currentOrgId, invited_by: user.id })
          .select('token')
          .single();
        
        if (invErr) throw invErr;
        tokenToUse = newInv.token;
      }

      const result = await resendInvite.mutateAsync({
        email,
        token: tokenToUse,
        orgName: org?.name || '',
        inviterName: `${userProfile?.first_name || ''} ${userProfile?.last_name || ''}`.trim() || userProfile?.id || '',
      });

      if (result?.success === false) {
        alert('Email could not be sent. Check your Brevo configuration.');
        return;
      }

      setResendSentEmail(email);
      setTimeout(() => setResendSentEmail(null), 2500);
    } catch (e: any) {
      alert(e.message || 'Failed to resend invite. Please try again.');
    } finally {
      setResendingEmail(null);
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
          <span style={{ color: 'var(--pb-text)' }}>{org?.name || '—'}</span>
        </div>

        {/* Email tags input */}
        <div
          onClick={() => inputRef.current?.focus()}
          style={{ minHeight: 48, padding: '8px 10px', border: '1.5px solid var(--pb-border)', borderRadius: 'var(--pb-r)', display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', cursor: 'text', transition: 'border-color .15s', background: 'var(--pb-bg)' }}
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
            Invited users receive an email with a link to set up their account and join.
          </div>
          <button onClick={handleSendInvites} disabled={inviteMembers.isPending} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 12px', borderRadius: 'var(--pb-r)', fontFamily: "'DM Sans', sans-serif", fontSize: 12.5, fontWeight: 500, cursor: 'pointer', border: 'none', background: 'var(--pb-gold)', color: 'var(--pb-text)', transition: 'all .15s' }}>
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
      <div style={{ background: 'var(--pb-bg2)', border: '1px solid var(--pb-border)', borderRadius: 'var(--pb-rl)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
          <thead>
            <tr>
              {['Name', 'Email', 'Role', 'Invited by', 'Invited on', 'Status', 'Last active', ''].map((h) => (
                <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 500, color: 'var(--pb-text3)', borderBottom: '1px solid var(--pb-border)', background: 'var(--pb-bg3)', whiteSpace: 'nowrap', fontFamily: "'Syne', sans-serif", letterSpacing: '.04em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center' }}><Loader2 className="h-5 w-5 animate-spin mx-auto" style={{ color: 'var(--pb-gold)' }} /></td></tr>
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
                  canManage={canManage}
                  isResending={resendingEmail === email}
                  resendSent={resendSentEmail === email}
                  onRoleChange={(role) => updateRole.mutate({ memberId: m.id, role })}
                  onRemove={() => {
                    if (confirm(`Remove ${displayName || email}?`)) removeMember.mutate(m.id);
                  }}
                  onResend={() => handleResend(email)}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      {inviteResults && <InviteResultsModal results={inviteResults} onClose={() => setInviteResults(null)} />}
    </div>
  );
}

function MemberRow({ member, displayName, email, av, avColor, isOwner, canManage, isResending, resendSent, onRoleChange, onRemove, onResend }: {
  member: ProdbodMember;
  displayName: string;
  email: string;
  av: string;
  avColor: string;
  isOwner: boolean;
  canManage: boolean;
  isResending: boolean;
  resendSent: boolean;
  onRoleChange: (role: string) => void;
  onRemove: () => void;
  onResend: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const isPending = member.status === 'Pending';

  const tdStyle: React.CSSProperties = {
    padding: '12px 14px', fontSize: 13, borderBottom: '1px solid var(--pb-border)',
    verticalAlign: 'middle', background: hovered ? 'var(--pb-bg3)' : 'transparent', transition: 'background .15s',
  };
  const statusActive = member.status === 'Active';

  return (
    <tr onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <td style={tdStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, maxWidth: 220 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0, fontFamily: "'Syne', sans-serif", color: '#fff', background: avColor }}>{av}</div>
          <div style={{ overflow: 'hidden' }}>
            <div 
              style={{ fontWeight: 500, fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              title={displayName || email}
            >
              {displayName || email}
            </div>
            {displayName && (
              <div 
                style={{ fontSize: 11.5, color: 'var(--pb-text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                title={email}
              >
                {email}
              </div>
            )}
          </div>
        </div>
      </td>
      <td style={{ ...tdStyle, color: 'var(--pb-text2)', fontSize: 12.5 }}>
        <div style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={email}>
          {email}
        </div>
      </td>
      <td style={tdStyle}>
        {isOwner || !canManage ? (
          <span style={{ fontSize: 12, fontWeight: 600, background: isOwner ? 'var(--pb-gold)' : 'var(--pb-bg3)', color: 'var(--pb-text)', padding: '2px 9px', borderRadius: 20, fontFamily: "'Syne', sans-serif", letterSpacing: '0.04em', textTransform: 'uppercase' }}>{isOwner ? 'Owner' : member.role === 'Team Lead' ? 'Admin' : 'Member'}</span>
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
      <td style={{ ...tdStyle, color: 'var(--pb-text2)', fontSize: 12.5 }}>{fmtDate(member.last_active, true)}</td>
      <td style={tdStyle}>
        {!isOwner && canManage && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, opacity: hovered ? 1 : 0, transition: 'opacity .15s' }}>
            {/* Resend invite — only for pending members */}
            {isPending && (
              resendSent ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 5, fontSize: 11.5, fontWeight: 500, background: 'var(--pb-green-bg)', border: '1px solid var(--pb-green-border)', color: 'var(--pb-green)', whiteSpace: 'nowrap' }}>
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1.5 6l3 3 6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Sent
                </div>
              ) : (
                <button
                  onClick={onResend}
                  disabled={isResending}
                  title="Resend invite email"
                  style={{ height: 28, padding: '0 10px', borderRadius: 5, border: '1px solid var(--pb-border)', background: 'var(--pb-bg2)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--pb-text3)', fontSize: 12, fontFamily: "'DM Sans', sans-serif", fontWeight: 500, transition: 'all .15s', whiteSpace: 'nowrap' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--pb-gold)'; e.currentTarget.style.color = 'var(--pb-text)'; e.currentTarget.style.background = 'var(--pb-bg3)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--pb-border)'; e.currentTarget.style.color = 'var(--pb-text3)'; e.currentTarget.style.background = 'var(--pb-bg2)'; }}
                >
                  {isResending
                    ? <Loader2 style={{ width: 11, height: 11 }} className="animate-spin" />
                    : (
                      <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path d="M2 8l12-6-5 14-2-5-5-3z" strokeLinejoin="round"/>
                      </svg>
                    )
                  }
                  {isResending ? 'Sending…' : 'Resend invite'}
                </button>
              )
            )}
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
