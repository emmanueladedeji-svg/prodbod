import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Users, Target, ChevronRight, ChevronLeft, LogOut, User } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';

function avatarColor(s: string) {
  const c = ['#3d6cff', '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626', '#be185d'];
  let h = 0;
  for (const ch of (s || '')) h = (h * 31 + ch.charCodeAt(0)) % c.length;
  return c[h];
}

function getInitials(first?: string | null, last?: string | null, email?: string | null) {
  if (first || last) return ((first?.[0] || '') + (last?.[0] || '')).toUpperCase();
  return (email || '??').substring(0, 2).toUpperCase();
}

interface IconRailProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function IconRail({ sidebarOpen, onToggleSidebar }: IconRailProps) {
  const navigate = useNavigate();
  const { userProfile } = useApp();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const myName = userProfile?.first_name
    ? `${userProfile.first_name} ${userProfile.last_name || ''}`.trim()
    : 'User';
  const myInitials = getInitials(userProfile?.first_name, userProfile?.last_name);
  const myAvatarColor = avatarColor(myName);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [userMenuOpen]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const iconBtn = (active: boolean): React.CSSProperties => ({
    width: 32,
    height: 32,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    border: 'none',
    background: 'transparent',
    color: active ? 'var(--pb-text)' : 'var(--pb-text3)',
    transition: 'all .15s',
    position: 'relative',
  });

  return (
    <div
      style={{
        width: 40,
        flexShrink: 0,
        height: '100vh',
        background: 'var(--pb-bg2)',
        borderRight: '1px solid var(--pb-border)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 8,
        paddingBottom: 8,
        zIndex: 40,
        position: 'relative',
      }}
    >
      {/* Logo */}
      <div
        title="Dashboard"
        onClick={() => navigate('/')}
        style={{
          width: 28,
          height: 28,
          borderRadius: 7,
          background: 'var(--pb-black)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          marginBottom: 6,
        }}
      >
        <span style={{ color: 'var(--pb-gold)', fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 10, letterSpacing: '-0.04em' }}>PB</span>
      </div>

      {/* Toggle sidebar */}
      <button
        id="icon-rail-toggle"
        title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        onClick={onToggleSidebar}
        style={{
          ...iconBtn(false),
          marginBottom: 8,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--pb-bg3)'; e.currentTarget.style.color = 'var(--pb-text)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--pb-text3)'; }}
      >
        {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>

      <div style={{ width: 20, height: 1, background: 'var(--pb-border)', marginBottom: 8 }} />

      {/* Nav links */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
        <NavLink to="/" end title="Dashboard" style={{ textDecoration: 'none', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {({ isActive }) => (
            <>
              {isActive && <div style={{ position: 'absolute', left: -4, top: 4, bottom: 4, width: 3, borderRadius: '0 2px 2px 0', background: 'var(--pb-gold)' }} />}
              <div
                style={iconBtn(isActive)}
                onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.color = 'var(--pb-text)'; } }}
                onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.color = 'var(--pb-text3)'; } }}
              >
                <Home size={15} />
              </div>
            </>
          )}
        </NavLink>

        <NavLink to="/people" title="People" style={{ textDecoration: 'none', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {({ isActive }) => (
            <>
              {isActive && <div style={{ position: 'absolute', left: -4, top: 4, bottom: 4, width: 3, borderRadius: '0 2px 2px 0', background: 'var(--pb-gold)' }} />}
              <div
                style={iconBtn(isActive)}
                onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.color = 'var(--pb-text)'; } }}
                onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.color = 'var(--pb-text3)'; } }}
              >
                <Users size={15} />
              </div>
            </>
          )}
        </NavLink>

        <NavLink to="/products" title="Products" style={{ textDecoration: 'none', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {({ isActive }) => (
            <>
              {isActive && <div style={{ position: 'absolute', left: -4, top: 4, bottom: 4, width: 3, borderRadius: '0 2px 2px 0', background: 'var(--pb-gold)' }} />}
              <div
                style={iconBtn(isActive)}
                onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.color = 'var(--pb-text)'; } }}
                onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.color = 'var(--pb-text3)'; } }}
              >
                <Target size={15} />
              </div>
            </>
          )}
        </NavLink>
      </div>

      {/* User avatar */}
      <div ref={userMenuRef} style={{ position: 'relative' }}>
        <div
          title={myName}
          onClick={() => setUserMenuOpen(o => !o)}
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: myAvatarColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: 10,
            fontWeight: 700,
            color: '#fff',
            fontFamily: "'Syne', sans-serif",
            flexShrink: 0,
          }}
        >
          {myInitials}
        </div>

        {userMenuOpen && (
          <div
            style={{
              position: 'absolute',
              bottom: '100%',
              left: '100%',
              marginBottom: 4,
              marginLeft: 6,
              background: 'var(--pb-bg2)',
              border: '1px solid var(--pb-border2)',
              borderRadius: 'var(--pb-r)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              zIndex: 100,
              overflow: 'hidden',
              minWidth: 160,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--pb-border)' }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--pb-text)' }}>{myName}</div>
            </div>
            <div
              onClick={() => { navigate('/settings'); setUserMenuOpen(false); }}
              style={{ padding: '9px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--pb-text2)', transition: 'background .12s' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--pb-bg3)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <User size={13} />
              Profile
            </div>
            <div
              onClick={handleSignOut}
              style={{ padding: '9px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--pb-red)', transition: 'background .12s' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--pb-red-bg)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <LogOut size={13} />
              Sign out
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
