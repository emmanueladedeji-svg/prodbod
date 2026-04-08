import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { useMyOrgs } from '@/hooks/useProdbodOrgs';
import { useOrgMembersProdbod } from '@/hooks/useProdbodMembers';
import { NewOrgModal } from '@/components/organizations/NewOrgModal';

function avatarColor(s: string) {
  const c = ['#3d6cff', '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626', '#be185d'];
  let h = 0;
  for (const ch of (s || '')) h = (h * 31 + ch.charCodeAt(0)) % c.length;
  return c[h];
}
function initials(first?: string | null, last?: string | null, email?: string | null) {
  if (first || last) return ((first?.[0] || '') + (last?.[0] || '')).toUpperCase();
  return (email || '??').substring(0, 2).toUpperCase();
}
function capitalize(s: string) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentOrgId, setCurrentOrgId, userProfile } = useApp();
  const { user } = useAuth();
  const { data: orgs = [] } = useMyOrgs();
  const { data: members = [] } = useOrgMembersProdbod(currentOrgId);

  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [newOrgModalOpen, setNewOrgModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOrg = orgs.find((o) => o.id === currentOrgId);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOrgDropdownOpen(false);
      }
    };
    if (orgDropdownOpen) document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [orgDropdownOpen]);

  const me = members.find((m) => m.member_user_id === user?.id);
  const myRole = me?.role || 'Member';

  const myInitials = initials(userProfile?.first_name, userProfile?.last_name, user?.email);
  const myName = userProfile?.first_name
    ? `${userProfile.first_name} ${userProfile.last_name || ''}`.trim()
    : user?.email || '—';
  const myAvatarColor = avatarColor(myName);

  const navLinkStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
    borderRadius: 'var(--pb-r)', cursor: 'pointer',
    color: active ? 'var(--pb-text)' : 'var(--pb-text2)', fontSize: 13.5,
    transition: 'all .15s', userSelect: 'none',
    background: active ? 'var(--pb-bg3)' : 'transparent',
    fontWeight: active ? 500 : 400,
    fontFamily: "'DM Sans', sans-serif",
  });

  return (
    <>
      <aside
        className="prodbod"
        style={{
          width: 230, flexShrink: 0, background: 'var(--pb-bg2)',
          borderRight: '1px solid var(--pb-border)', display: 'flex',
          flexDirection: 'column', overflowY: 'auto', height: '100vh',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* Top: Logo + Org Switcher */}
        <div style={{ padding: '18px 16px 14px' }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 10 }}>
            Prod<span style={{ color: 'var(--pb-gold)' }}>Bod</span>
          </div>

          {/* Org switcher */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <div
              onClick={() => setOrgDropdownOpen((prev) => !prev)}
              style={{ marginTop: 10, padding: '8px 10px', background: 'var(--pb-bg3)', border: '1px solid var(--pb-border)', borderRadius: 'var(--pb-r)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, transition: 'all .15s' }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 150 }}>{currentOrg?.name || '—'}</div>
                <div style={{ fontSize: 10.5, color: 'var(--pb-text3)' }}>Organisation</div>
              </div>
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                <path d="M1 1l5 5 5-5" stroke="var(--pb-text3)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>

            {orgDropdownOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: 'var(--pb-bg2)', border: '1px solid var(--pb-border2)', borderRadius: 'var(--pb-r)', boxShadow: '0 8px 24px rgba(0,0,0,.1)', zIndex: 50, overflow: 'hidden' }}>
                {orgs.map((org) => (
                  <div
                    key={org.id}
                    onClick={() => { setCurrentOrgId(org.id); setOrgDropdownOpen(false); }}
                    style={{ padding: '10px 12px', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, transition: 'background .12s', color: 'var(--pb-text)', fontWeight: org.id === currentOrgId ? 600 : 400 }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--pb-bg3)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {org.name}
                  </div>
                ))}
                <div
                  onClick={() => { setOrgDropdownOpen(false); setNewOrgModalOpen(true); }}
                  style={{ padding: '10px 12px', cursor: 'pointer', fontSize: 13, color: 'var(--pb-text)', borderTop: '1px solid var(--pb-border)', display: 'flex', alignItems: 'center', gap: 8, transition: 'background .12s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--pb-bg3)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  + New organisation
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '8px 10px', flex: 1 }}>
          <div style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--pb-text3)', padding: '10px 8px 5px', fontFamily: "'Syne', sans-serif" }}>Workspace</div>

          <div
            style={navLinkStyle(location.pathname === '/')}
            onClick={() => navigate('/')}
            onMouseEnter={(e) => { if (location.pathname !== '/') e.currentTarget.style.background = 'var(--pb-bg3)'; e.currentTarget.style.color = 'var(--pb-text)'; }}
            onMouseLeave={(e) => { if (location.pathname !== '/') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--pb-text2)'; } }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ flexShrink: 0, opacity: location.pathname === '/' ? 1 : 0.65 }}>
              <rect x="1" y="1" width="6" height="6" rx="1.5"/>
              <rect x="9" y="1" width="6" height="6" rx="1.5"/>
              <rect x="1" y="9" width="6" height="6" rx="1.5"/>
              <rect x="9" y="9" width="6" height="6" rx="1.5"/>
            </svg>
            Dashboard
          </div>

          <div
            style={navLinkStyle(location.pathname === '/people')}
            onClick={() => navigate('/people')}
            onMouseEnter={(e) => { if (location.pathname !== '/people') e.currentTarget.style.background = 'var(--pb-bg3)'; e.currentTarget.style.color = 'var(--pb-text)'; }}
            onMouseLeave={(e) => { if (location.pathname !== '/people') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--pb-text2)'; } }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ flexShrink: 0, opacity: location.pathname === '/people' ? 1 : 0.65 }}>
              <circle cx="6" cy="5" r="2.5"/>
              <circle cx="11" cy="5" r="2"/>
              <path d="M1 13c0-2.2 2-4 5-4s5 1.8 5 4"/>
              <path d="M12 8c1.7 0 3 1.1 3 2.8"/>
            </svg>
            People
          </div>
        </nav>

        {/* User info */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid var(--pb-border)', display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, fontFamily: "'Syne', sans-serif", color: '#fff', background: myAvatarColor }}>
            {myInitials}
          </div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{myName}</div>
            <div style={{ fontSize: 11, color: 'var(--pb-text3)' }}>{capitalize(myRole)}</div>
          </div>
        </div>
      </aside>

      <NewOrgModal
        open={newOrgModalOpen}
        onClose={() => setNewOrgModalOpen(false)}
        onCreated={(orgId) => setCurrentOrgId(orgId)}
      />
    </>
  );
}
