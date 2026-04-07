import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { NewOrgModal } from '@/components/organizations/NewOrgModal';
import { useApp } from '@/contexts/AppContext';

export function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setCurrentOrgId } = useApp();
  const [newOrgModalOpen, setNewOrgModalOpen] = useState(false);

  const isPeoplePage = location.pathname === '/people';
  const isDashboard = location.pathname === '/';
  const pageTitle = isPeoplePage ? 'People' : 'Dashboard';

  const focusInviteInput = () => {
    // People page invite input id
    const input = document.getElementById('people-invite-input');
    if (input) input.focus();
  };

  return (
    <>
      <div
        className="prodbod"
        style={{
          padding: '14px 28px',
          borderBottom: '1px solid var(--pb-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--pb-bg2)',
          flexShrink: 0,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>
          {pageTitle}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {isDashboard && (
            <button
              onClick={() => setNewOrgModalOpen(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '6px 12px', borderRadius: 'var(--pb-r)',
                fontFamily: "'DM Sans', sans-serif", fontSize: 12.5, fontWeight: 500,
                cursor: 'pointer', border: '1px solid var(--pb-border)',
                background: 'transparent', color: 'var(--pb-text2)', transition: 'all .15s',
              }}
            >
              + New organisation
            </button>
          )}
          {isPeoplePage && (
            <button
              onClick={focusInviteInput}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '6px 12px', borderRadius: 'var(--pb-r)',
                fontFamily: "'DM Sans', sans-serif", fontSize: 12.5, fontWeight: 500,
                cursor: 'pointer', border: '1px solid var(--pb-accent)',
                background: 'var(--pb-accent)', color: '#fff', transition: 'all .15s',
              }}
            >
              + Invite people
            </button>
          )}
        </div>
      </div>

      <NewOrgModal
        open={newOrgModalOpen}
        onClose={() => setNewOrgModalOpen(false)}
        onCreated={(orgId) => setCurrentOrgId(orgId)}
      />
    </>
  );
}
