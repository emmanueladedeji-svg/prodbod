import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Users, Plus } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useMyOrgs } from '@/hooks/useProdbodOrgs';
import { useOrgProducts } from '@/hooks/useProdbodProducts';
import { SidebarProductItem } from './SidebarProductItem';
import { NewOrgModal } from '@/components/organizations/NewOrgModal';

interface ProductSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct?: () => void;
}

export function ProductSidebar({ isOpen, onClose, onAddProduct }: ProductSidebarProps) {
  const navigate = useNavigate();
  const { currentOrgId, setCurrentOrgId } = useApp();
  const { data: orgs = [] } = useMyOrgs();
  const { data: products = [] } = useOrgProducts(currentOrgId);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [orgDropOpen, setOrgDropOpen] = useState(false);
  const [newOrgModalOpen, setNewOrgModalOpen] = useState(false);
  const orgDropRef = useRef<HTMLDivElement>(null);

  const currentOrg = orgs.find(o => o.id === currentOrgId);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      const toggleBtn = document.getElementById('icon-rail-toggle');
      if (
        sidebarRef.current && !sidebarRef.current.contains(e.target as Node) &&
        toggleBtn && !toggleBtn.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClose]);

  // Close org drop on outside click
  useEffect(() => {
    if (!orgDropOpen) return;
    const handler = (e: MouseEvent) => {
      if (orgDropRef.current && !orgDropRef.current.contains(e.target as Node)) {
        setOrgDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [orgDropOpen]);

  const navLinkStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 8px',
    borderRadius: 'var(--pb-r)',
    cursor: 'pointer',
    color: isActive ? 'var(--pb-text)' : 'var(--pb-text2)',
    fontSize: 13,
    textDecoration: 'none',
    background: isActive ? 'var(--pb-bg3)' : 'transparent',
    fontWeight: isActive ? 500 : 400,
    transition: 'all .12s',
    fontFamily: "'DM Sans', sans-serif",
  });

  return (
    <>
      <div
        ref={sidebarRef}
        style={{
          position: 'fixed',
          left: 40,
          top: 0,
          height: '100vh',
          width: 220,
          zIndex: 30,
          background: 'var(--pb-bg2)',
          borderRight: '1px solid var(--pb-border)',
          boxShadow: '4px 0 16px rgba(0,0,0,0.06)',
          display: 'flex',
          flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.2s ease-out',
          fontFamily: "'DM Sans', sans-serif",
          overflow: 'hidden',
        }}
      >
        {/* Org switcher */}
        <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid var(--pb-border)', flexShrink: 0 }}>
          <div ref={orgDropRef} style={{ position: 'relative' }}>
            <div
              onClick={() => setOrgDropOpen(o => !o)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '7px 10px',
                borderRadius: 'var(--pb-r)',
                border: '1px solid var(--pb-border)',
                cursor: 'pointer',
                transition: 'all .12s',
                background: 'var(--pb-bg3)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--pb-border2)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--pb-border)')}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--pb-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
                  {currentOrg?.name || 'Select organisation'}
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--pb-text3)' }}>Organisation</div>
              </div>
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ flexShrink: 0 }}>
                <path d="M1 1l4 4 4-4" stroke="var(--pb-text3)" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </div>

            {orgDropOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                background: 'var(--pb-bg2)', border: '1px solid var(--pb-border2)',
                borderRadius: 'var(--pb-r)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                zIndex: 50, overflow: 'hidden',
              }}>
                {orgs.map(org => (
                  <div
                    key={org.id}
                    onClick={() => { setCurrentOrgId(org.id); setOrgDropOpen(false); }}
                    style={{
                      padding: '9px 12px', cursor: 'pointer', fontSize: 13,
                      color: 'var(--pb-text)',
                      fontWeight: org.id === currentOrgId ? 600 : 400,
                      transition: 'background .12s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--pb-bg3)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {org.name}
                  </div>
                ))}
                <div
                  onClick={() => { setOrgDropOpen(false); setNewOrgModalOpen(true); }}
                  style={{
                    padding: '9px 12px', cursor: 'pointer', fontSize: 13,
                    color: 'var(--pb-text)',
                    borderTop: '1px solid var(--pb-border)',
                    display: 'flex', alignItems: 'center', gap: 6,
                    transition: 'background .12s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--pb-bg3)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Plus size={12} /> New organisation
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Workspace links */}
        <div style={{ padding: '10px 10px 6px', flexShrink: 0 }}>
          <div style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--pb-text3)', padding: '4px 8px 6px', fontFamily: "'Syne', sans-serif" }}>
            Workspace
          </div>
          <NavLink to="/" end style={({ isActive }) => navLinkStyle(isActive)}
            onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; if (!el.className.includes('active')) el.style.background = 'var(--pb-bg3)'; }}
            onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; if (!el.className.includes('active')) el.style.background = 'transparent'; }}
          >
            <Home size={14} /> Dashboard
          </NavLink>
          <NavLink to="/people" style={({ isActive }) => navLinkStyle(isActive)}
            onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; if (!el.className.includes('active')) el.style.background = 'var(--pb-bg3)'; }}
            onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; if (!el.className.includes('active')) el.style.background = 'transparent'; }}
          >
            <Users size={14} /> People
          </NavLink>
        </div>

        <div style={{ width: 'calc(100% - 20px)', height: 1, background: 'var(--pb-border)', margin: '2px 10px 6px' }} />

        {/* Products */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px' }}>
          <div style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--pb-text3)', padding: '4px 8px 6px', fontFamily: "'Syne', sans-serif" }}>
            Products
          </div>

          {products.length === 0 ? (
            <div style={{ padding: '6px 8px', fontSize: 12.5, color: 'var(--pb-text3)' }}>No products yet</div>
          ) : (
            products.map(product => (
              <SidebarProductItem
                key={product.id}
                product={product}
                onNavigate={onClose}
              />
            ))
          )}

          <div
            onClick={onAddProduct}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '6px 8px',
              borderRadius: 'var(--pb-r)',
              cursor: 'pointer',
              fontSize: 12.5,
              color: 'var(--pb-text3)',
              transition: 'all .12s',
              marginTop: 4,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--pb-bg3)'; e.currentTarget.style.color = 'var(--pb-text)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--pb-text3)'; }}
          >
            <Plus size={12} />
            Add product
          </div>
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
