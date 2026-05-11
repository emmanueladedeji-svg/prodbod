import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useOrgProducts, useAddProduct } from '@/hooks/useProdbodProducts';
import { useOrgMembersProdbod } from '@/hooks/useProdbodMembers';
import { useMyOrgs } from '@/hooks/useProdbodOrgs';
import { useAllProductStatusCounts } from '@/hooks/useAllProductStatusCounts';
import { useProductRoles } from '@/hooks/useProductRoles';
import { useUpdateWorkspaceFeature } from '@/hooks/useWorkspaceFeatures';
import { useOrgPermissions } from '@/hooks/useOrgRole';
import { ProductCard } from '@/components/dashboard/ProductCard';
import { ProductAnalyticsDrawer } from '@/components/dashboard/ProductAnalyticsDrawer';
import { PeoplePicker } from '@/components/dashboard/PeoplePicker';
import { Loader2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FeatureStatus } from '@/types';

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
          <button onClick={handleAdd} disabled={addProduct.isPending} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px 18px', borderRadius: 'var(--pb-r)', fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, fontWeight: 500, cursor: 'pointer', border: 'none', background: 'var(--pb-gold)', color: 'var(--pb-text)', transition: 'all .15s' }}>
            {addProduct.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Add product
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { currentOrgId, organizationsLoading } = useApp();
  const { data: orgs = [], isLoading: myOrgsLoading } = useMyOrgs();
  const { data: products = [], isLoading: productsLoading } = useOrgProducts(currentOrgId);
  const { data: members = [], isLoading: membersLoading } = useOrgMembersProdbod(currentOrgId);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const navigate = useNavigate();
  const { isAdmin: canManage } = useOrgPermissions(currentOrgId);

  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [pickerState, setPickerState] = useState<{
    isOpen: boolean;
    productId: string | null;
    role: 'pm' | 'lead_engineer' | 'feature';
    featureId?: string;
    title: string;
  }>({ isOpen: false, productId: null, role: 'pm', title: '' });

  const productIds = products.map(p => p.id);
  const { data: statusCountsData, isLoading: countsLoading } = useAllProductStatusCounts(productIds);
  const statusCountsMap = statusCountsData?.statusCountsMap || {};
  
  const { assignRole } = useProductRoles(pickerState.productId);

  const openPeoplePicker = (productId: string, role: 'pm' | 'lead_engineer') => {
    setPickerState({
      isOpen: true,
      productId,
      role,
      title: role === 'pm' ? 'Assign Product Manager' : 'Assign Lead Engineer',
    });
  };

  const updateFeature = useUpdateWorkspaceFeature();

  const handlePickerSelect = async (userId: string) => {
    if (pickerState.productId && pickerState.role !== 'feature') {
      await assignRole(pickerState.role, userId);
    } else if (pickerState.role === 'feature' && pickerState.featureId) {
      await updateFeature.mutateAsync({ id: pickerState.featureId, assignee_id: userId });
    }
    setPickerState(prev => ({ ...prev, isOpen: false }));
  };

  const activeProduct = products.find(p => p.id === activeProductId);
  const emptyStatusCounts: Record<FeatureStatus, number> = {
    idea: 0, discovery: 0, in_development: 0, in_testing: 0, live: 0, closed: 0
  };

  // Build avatar data for the card footer avatar stacks
  const memberAvatarColors = ['#F59E0B', '#8B5CF6', '#3B82F6', '#EC4899', '#10B981', '#EF4444'];
  const memberAvatarList = members
    .filter(m => m.status === 'Active')
    .map(m => {
      const name = m.name || 'Unknown';
      const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
      const hash = (m.member_user_id || m.id).split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0);
      const color = memberAvatarColors[hash % memberAvatarColors.length];
      return { initials, color };
    });

  const org = orgs.find((o) => o.id === currentOrgId);
  const activeMembers = members.filter((m) => m.status === 'Active').length;
  const pendingMembers = members.filter((m) => m.status === 'Pending').length;

  const isGlobalLoading = organizationsLoading || myOrgsLoading;

  if (isGlobalLoading) {
    return (
      <div className="prodbod" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--pb-text3)', fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
      </div>
    );
  }

  if (!currentOrgId) {
    return (
      <div className="prodbod" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: 40, fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--pb-bg2)', border: '1px solid var(--pb-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, fontSize: 24 }}>🏢</div>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No organisation found</div>
        <div style={{ color: 'var(--pb-text2)', fontSize: 14, maxWidth: 360, marginBottom: 24, lineHeight: 1.5 }}>
          You don't seem to be part of any organisation yet. Create a new one to get started.
        </div>
        <button 
          onClick={() => navigate('/onboarding')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 'var(--pb-r)', fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none', background: 'var(--pb-gold)', color: 'var(--pb-text)', transition: 'all .15s' }}
        >
          <Plus size={18} />
          Create organisation
        </button>
      </div>
    );
  }

  return (
    <div className="prodbod flex h-full overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div 
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '32px 36px',
          transition: 'margin-right .35s cubic-bezier(0.4,0,0.2,1)',
          marginRight: activeProductId ? 720 : 0,
        }}
      >
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.4px' }}>Dashboard</h1>
          {canManage && (
            <button 
              onClick={() => navigate('/onboarding')}
              style={{ 
                background: 'var(--pb-text)', color: '#fff', border: 'none', borderRadius: 8, 
                padding: '8px 16px', fontSize: 13, fontWeight: 500, fontFamily: "'DM Sans', sans-serif", 
                cursor: 'pointer', transition: 'opacity .15s' 
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.8'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
            >
              + New organisation
            </button>
          )}
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
          <div style={{ background: 'var(--pb-bg2)', border: '1px solid var(--pb-border)', borderRadius: 'var(--pb-rl)', padding: '20px 24px' }}>
            <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--pb-text2)', marginBottom: 8 }}>Total members</div>
            {membersLoading ? <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--pb-gold)' }} /> : (
              <>
                <div style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-1px', lineHeight: 1, fontFamily: "'DM Mono', monospace", color: 'var(--pb-text)' }}>{members.length}</div>
                <div style={{ fontSize: 12, color: 'var(--pb-text3)', marginTop: 6 }}>{activeMembers} active · {pendingMembers} pending</div>
              </>
            )}
          </div>
          <div style={{ background: 'var(--pb-bg2)', border: '1px solid var(--pb-border)', borderRadius: 'var(--pb-rl)', padding: '20px 24px' }}>
            <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--pb-text2)', marginBottom: 8 }}>Products</div>
            {productsLoading ? <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--pb-gold)' }} /> : (
              <>
                <div style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-1px', lineHeight: 1, fontFamily: "'DM Mono', monospace", color: '#D97706' }}>{products.length}</div>
                <div style={{ fontSize: 12, color: 'var(--pb-text3)', marginTop: 6 }}>in this organisation</div>
              </>
            )}
          </div>
          <div style={{ background: 'var(--pb-bg2)', border: '1px solid var(--pb-border)', borderRadius: 'var(--pb-rl)', padding: '20px 24px' }}>
            <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--pb-text2)', marginBottom: 8 }}>Organisation</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--pb-text)', marginBottom: 2 }}>{org?.name || '—'}</div>
            <div style={{ fontSize: 12, color: 'var(--pb-text2)' }}>{org?.industry || 'No industry set'}</div>
          </div>
        </div>

        {/* Products section */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--pb-text)' }}>Products</div>
          {canManage && (
            <button
              onClick={() => setShowAddProduct(true)}
              style={{
                background: 'var(--pb-bg2)', border: '1px solid var(--pb-border)', borderRadius: 8,
                padding: '7px 14px', fontSize: 12, fontWeight: 500,
                fontFamily: "'DM Sans', sans-serif", cursor: 'pointer',
                color: 'var(--pb-text)', transition: 'border-color .15s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#aaa'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--pb-border)'}
            >+ Add product</button>
          )}
        </div>

        {productsLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ height: 200, background: 'var(--pb-bg)', borderRadius: 14 }} className="animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', background: 'var(--pb-bg2)', border: '1px solid var(--pb-border)', borderRadius: 'var(--pb-rl)', color: 'var(--pb-text3)', fontSize: 14 }}>
            No products added yet. Click "+ Add product" to get started.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {products.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                statusCounts={statusCountsMap[product.id] ?? emptyStatusCounts}
                memberAvatars={memberAvatarList}
                isActive={activeProductId === product.id}
                canManage={canManage}
                onClick={() => setActiveProductId(product.id)}
                onAssignRole={(role) => openPeoplePicker(product.id, role)}
              />
            ))}
          </div>
        )}

        {showAddProduct && currentOrgId && (
          <AddProductModal orgId={currentOrgId} onClose={() => setShowAddProduct(false)} />
        )}
      </div>

      {/* Analytics drawer */}
      <ProductAnalyticsDrawer
        productId={activeProductId}
        productName={activeProduct?.name}
        productDescription={activeProduct?.description}
        onClose={() => setActiveProductId(null)}
        canManage={canManage}
        onAssignRole={(productId, role) => openPeoplePicker(productId, role)}
        onAssignFeature={(featureId) => {
          setPickerState({ isOpen: true, productId: null, role: 'feature', featureId, title: 'Assign Team Member' });
        }}
      />

      {/* People picker modal */}
      <PeoplePicker
        isOpen={pickerState.isOpen}
        title={pickerState.title}
        onSelect={handlePickerSelect}
        onClose={() => setPickerState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
