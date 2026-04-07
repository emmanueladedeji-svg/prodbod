import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { IconRail } from '@/components/nav/IconRail';
import { ProductSidebar } from '@/components/nav/ProductSidebar';
import { TopBar } from './TopBar';
import { useSidebar } from '@/hooks/useSidebar';
import { useApp } from '@/contexts/AppContext';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isOpen, toggle, setIsOpen } = useSidebar();
  const [showAddProduct, setShowAddProduct] = useState(false);
  const location = useLocation();
  const { currentOrgId } = useApp();

  // Workspace pages: no TopBar, full-height content
  const isWorkspace = location.pathname.startsWith('/products/');

  // Slight padding offset when sidebar is open (sidebar is overlaid, not inline)
  // Main content always starts at 40px (icon rail width)

  return (
    <div
      className="prodbod"
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--pb-bg)',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Fixed icon rail */}
      <IconRail sidebarOpen={isOpen} onToggleSidebar={toggle} />

      {/* Slide-out product sidebar */}
      <ProductSidebar
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onAddProduct={() => { setShowAddProduct(true); setIsOpen(false); }}
      />

      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!isWorkspace && <TopBar />}
        <main style={{ flex: 1, overflowY: isWorkspace ? 'hidden' : 'auto', padding: isWorkspace ? 0 : 28 }}>
          {children}
        </main>
      </div>

      {/* Add Product Modal — reuse Dashboard's AddProductModal logic via import */}
      {showAddProduct && currentOrgId && (
        <AddProductModalInline orgId={currentOrgId} onClose={() => setShowAddProduct(false)} />
      )}
    </div>
  );
}

// Inline mini modal for adding product from sidebar
import { useAddProduct } from '@/hooks/useProdbodProducts';
import { Loader2 } from 'lucide-react';

function AddProductModalInline({ orgId, onClose }: { orgId: string; onClose: () => void }) {
  const addProduct = useAddProduct();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [error, setError] = useState('');

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 13px', border: '1px solid var(--pb-border)',
    borderRadius: 'var(--pb-r)', fontFamily: "'DM Sans', sans-serif",
    fontSize: 13.5, color: 'var(--pb-text)', background: 'var(--pb-bg)', outline: 'none',
    boxSizing: 'border-box',
  };

  const handleAdd = async () => {
    if (!name.trim()) { setError('Please enter a product name.'); return; }
    try {
      await addProduct.mutateAsync({ orgId, name: name.trim(), description: desc.trim() || undefined });
      onClose();
    } catch (e: any) { setError(e.message || 'Failed to add product.'); }
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: 'var(--pb-bg2)', border: '1px solid var(--pb-border2)', borderRadius: 'var(--pb-rxl)', width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ padding: '20px 22px 16px', borderBottom: '1px solid var(--pb-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700 }}>Add product</div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--pb-border)', background: 'transparent', cursor: 'pointer', color: 'var(--pb-text3)', fontSize: 16 }}>✕</button>
        </div>
        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && <div style={{ padding: '11px 14px', borderRadius: 'var(--pb-r)', fontSize: 13, background: 'var(--pb-red-bg)', border: '1px solid var(--pb-red-border)', color: 'var(--pb-red)' }}>{error}</div>}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--pb-text2)', marginBottom: 5, letterSpacing: '0.02em', textTransform: 'uppercase', fontFamily: "'Syne', sans-serif" }}>Product name</label>
            <input style={inputStyle} placeholder="e.g. Mobile Banking App" value={name} onChange={(e) => setName(e.target.value)} autoFocus onKeyDown={(e) => e.key === 'Enter' && handleAdd()} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--pb-text2)', marginBottom: 5, letterSpacing: '0.02em', textTransform: 'uppercase', fontFamily: "'Syne', sans-serif" }}>
              Description <span style={{ fontSize: 11, color: 'var(--pb-text3)', fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: 6 }}>(optional)</span>
            </label>
            <input style={inputStyle} placeholder="What does this product do?" value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>
        </div>
        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--pb-border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '10px 18px', borderRadius: 'var(--pb-r)', fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, fontWeight: 500, cursor: 'pointer', border: '1px solid var(--pb-border)', background: 'transparent', color: 'var(--pb-text2)' }}>
            Cancel
          </button>
          <button onClick={handleAdd} disabled={addProduct.isPending} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px 18px', borderRadius: 'var(--pb-r)', fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, fontWeight: 500, cursor: 'pointer', border: '1px solid var(--pb-accent)', background: 'var(--pb-accent)', color: '#fff' }}>
            {addProduct.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Add product
          </button>
        </div>
      </div>
    </div>
  );
}
