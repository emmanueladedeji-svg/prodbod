import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useOrgProducts, useAddProduct } from '@/hooks/useProdbodProducts';
import { useOrgMembersProdbod } from '@/hooks/useProdbodMembers';
import { useMyOrgs } from '@/hooks/useProdbodOrgs';
import { Loader2 } from 'lucide-react';

function AddProductModal({ orgId, onClose }: { orgId: string; onClose: () => void }) {
  const addProduct = useAddProduct();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [error, setError] = useState('');

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 13px', border: '1px solid var(--pb-border)',
    borderRadius: 'var(--pb-r)', fontFamily: "'DM Sans', sans-serif",
    fontSize: 13.5, color: 'var(--pb-text)', background: 'var(--pb-bg)', outline: 'none',
  };

  const handleAdd = async () => {
    if (!name.trim()) { setError('Please enter a product name.'); return; }
    try {
      await addProduct.mutateAsync({ orgId, name: name.trim(), description: desc.trim() || undefined });
      onClose();
    } catch (e: any) { setError(e.message || 'Failed to add product.'); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--pb-bg2)', border: '1px solid var(--pb-border2)', borderRadius: 'var(--pb-rxl)', width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ padding: '20px 22px 16px', borderBottom: '1px solid var(--pb-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700 }}>Add product</div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--pb-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--pb-text3)', fontSize: 16 }}>✕</button>
        </div>
        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && <div style={{ padding: '11px 14px', borderRadius: 'var(--pb-r)', fontSize: 13, background: 'var(--pb-red-bg)', border: '1px solid var(--pb-red-border)', color: 'var(--pb-red)' }}>{error}</div>}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--pb-text2)', marginBottom: 5, letterSpacing: '0.02em', textTransform: 'uppercase', fontFamily: "'Syne', sans-serif" }}>Product name</label>
            <input style={inputStyle} placeholder="e.g. Mobile Banking App" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--pb-text2)', marginBottom: 5, letterSpacing: '0.02em', textTransform: 'uppercase', fontFamily: "'Syne', sans-serif" }}>
              Description <span style={{ fontSize: 11, color: 'var(--pb-text3)', fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: 6 }}>(optional)</span>
            </label>
            <input style={inputStyle} placeholder="What does this product do?" value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>
        </div>
        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--pb-border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '10px 18px', borderRadius: 'var(--pb-r)', fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, fontWeight: 500, cursor: 'pointer', border: '1px solid var(--pb-border)', background: 'transparent', color: 'var(--pb-text2)', transition: 'all .15s' }}>
            Cancel
          </button>
          <button onClick={handleAdd} disabled={addProduct.isPending} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px 18px', borderRadius: 'var(--pb-r)', fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, fontWeight: 500, cursor: 'pointer', border: '1px solid var(--pb-accent)', background: 'var(--pb-accent)', color: '#fff', transition: 'all .15s' }}>
            {addProduct.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Add product
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { currentOrgId } = useApp();
  const { data: orgs = [] } = useMyOrgs();
  const { data: products = [], isLoading: productsLoading } = useOrgProducts(currentOrgId);
  const { data: members = [], isLoading: membersLoading } = useOrgMembersProdbod(currentOrgId);
  const [showAddProduct, setShowAddProduct] = useState(false);

  const org = orgs.find((o) => o.id === currentOrgId);
  const activeMembers = members.filter((m) => m.status === 'Active').length;
  const pendingMembers = members.filter((m) => m.status === 'Pending').length;

  if (!currentOrgId) {
    return (
      <div className="prodbod" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--pb-text3)', fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
      </div>
    );
  }

  return (
    <div className="prodbod" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
        <div style={{ background: 'var(--pb-bg2)', border: '1px solid var(--pb-border)', borderRadius: 'var(--pb-rl)', padding: '18px 20px' }}>
          <div style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--pb-text3)', fontFamily: "'Syne', sans-serif", marginBottom: 6 }}>Total members</div>
          {membersLoading ? <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--pb-gold)' }} /> : (
            <>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--pb-text)' }}>{members.length}</div>
              <div style={{ fontSize: 12, color: 'var(--pb-text3)', marginTop: 3 }}>{activeMembers} active · {pendingMembers} pending</div>
            </>
          )}
        </div>
        <div style={{ background: 'var(--pb-bg2)', border: '1px solid var(--pb-border)', borderRadius: 'var(--pb-rl)', padding: '18px 20px' }}>
          <div style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--pb-text3)', fontFamily: "'Syne', sans-serif", marginBottom: 6 }}>Products</div>
          {productsLoading ? <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--pb-gold)' }} /> : (
            <>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--pb-gold)' }}>{products.length}</div>
              <div style={{ fontSize: 12, color: 'var(--pb-text3)', marginTop: 3 }}>in this organisation</div>
            </>
          )}
        </div>
        <div style={{ background: 'var(--pb-bg2)', border: '1px solid var(--pb-border)', borderRadius: 'var(--pb-rl)', padding: '18px 20px' }}>
          <div style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--pb-text3)', fontFamily: "'Syne', sans-serif", marginBottom: 6 }}>Organisation</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--pb-text)', marginTop: 8 }}>{org?.name || '—'}</div>
          <div style={{ fontSize: 12, color: 'var(--pb-text3)', marginTop: 3 }}>{org?.industry || 'No industry set'}</div>
        </div>
      </div>

      {/* Products list */}
      <div style={{ background: 'var(--pb-bg2)', border: '1px solid var(--pb-border)', borderRadius: 'var(--pb-rl)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--pb-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700 }}>Products</span>
          <button onClick={() => setShowAddProduct(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 12px', borderRadius: 'var(--pb-r)', fontFamily: "'DM Sans', sans-serif", fontSize: 12.5, fontWeight: 500, cursor: 'pointer', border: '1px solid var(--pb-border)', background: 'transparent', color: 'var(--pb-text2)', transition: 'all .15s' }}>
            + Add product
          </button>
        </div>
        {productsLoading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <Loader2 className="h-5 w-5 animate-spin mx-auto" style={{ color: 'var(--pb-gold)' }} />
          </div>
        ) : products.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--pb-text3)', fontSize: 13 }}>No products added yet</div>
        ) : (
          products.map((p) => (
            <div
              key={p.id}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px', borderBottom: '1px solid var(--pb-border)', transition: 'background .15s', cursor: 'default' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--pb-bg3)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--pb-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>📦</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 13.5 }}>{p.name}</div>
                {p.description && <div style={{ fontSize: 12, color: 'var(--pb-text3)' }}>{p.description}</div>}
              </div>
            </div>
          ))
        )}
      </div>

      {showAddProduct && currentOrgId && (
        <AddProductModal orgId={currentOrgId} onClose={() => setShowAddProduct(false)} />
      )}
    </div>
  );
}
