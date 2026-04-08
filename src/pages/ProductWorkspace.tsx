import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useMyOrgs } from '@/hooks/useProdbodOrgs';
import { useOrgProducts } from '@/hooks/useProdbodProducts';
import { useProductLists } from '@/hooks/useLists';
import { useWorkspaceFeatures, Feature } from '@/hooks/useWorkspaceFeatures';
import { useOrgMembersProdbod } from '@/hooks/useProdbodMembers';
import { useProductStatuses } from '@/hooks/useProductStatuses';
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell';
import { ListView } from '@/components/workspace/ListView';
import { BoardView } from '@/components/workspace/BoardView';
import { FeatureDetailPanel } from '@/components/workspace/FeatureDetailPanel';
import { InlineAddRow } from '@/components/workspace/InlineAddRow';

export default function ProductWorkspace() {
  const { productId, listId } = useParams<{ productId: string; listId: string }>();
  const navigate = useNavigate();
  const { currentOrgId } = useApp();
  const { data: orgs = [] } = useMyOrgs();
  const { data: products = [] } = useOrgProducts(currentOrgId);
  const { data: lists = [], isLoading: listsLoading } = useProductLists(productId ?? null);
  const { data: features = [], isLoading: featuresLoading } = useWorkspaceFeatures(listId ?? null);
  const { data: members = [] } = useOrgMembersProdbod(currentOrgId);
  const { data: productStatuses = [] } = useProductStatuses(productId ?? null);

  const [view, setView] = useState<'list' | 'board'>('list');
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [showInlineAdd, setShowInlineAdd] = useState(false);

  const product = (products as any[]).find((p: any) => p.id === productId) ?? null;
  const progressEnabled = (product as any)?.progress_icons_enabled ?? false;
  const defaultStatusId = productStatuses.find(s => s.is_default)?.id ?? productStatuses[0]?.id ?? '';
  const list = lists.find(l => l.id === listId) ?? null;
  const currentOrg = orgs.find(o => o.id === currentOrgId);
  const orgName = currentOrg?.name || '—';

  // If no listId but product has lists, navigate to first list
  useEffect(() => {
    if (!listId && lists.length > 0 && productId) {
      navigate(`/products/${productId}/${lists[0].id}`, { replace: true });
    }
  }, [listId, lists, productId, navigate]);

  // Resolve productId from URL if not in current org products
  // (org might not be loaded yet)
  if (!productId) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--pb-text3)', fontSize: 13 }}>
        No product selected
      </div>
    );
  }

  if (listsLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--pb-gold)' }} />
      </div>
    );
  }

  if (!listId || !list) {
    if (lists.length === 0 && !listsLoading) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--pb-text3)', fontSize: 13 }}>
          No lists found for this product
        </div>
      );
    }
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--pb-gold)' }} />
      </div>
    );
  }

  const orgId = currentOrgId || product?.organization_id || '';

  return (
    <div className="prodbod" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <WorkspaceShell
        product={product}
        list={list}
        orgName={orgName}
        view={view}
        setView={setView}
        onAddFeature={() => setShowInlineAdd(true)}
      >
        {featuresLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--pb-gold)' }} />
          </div>
        ) : view === 'list' ? (
          <ListView
            features={features}
            listId={listId}
            productId={productId}
            orgId={orgId}
            onOpenDetail={setSelectedFeature}
            members={members}
            productStatuses={productStatuses}
            progressEnabled={progressEnabled}
          />
        ) : (
          <BoardView
            features={features}
            listId={listId}
            productId={productId}
            orgId={orgId}
            onOpenDetail={setSelectedFeature}
            productStatuses={productStatuses}
          />
        )}
      </WorkspaceShell>

      {/* Quick add overlay at bottom of list view */}
      {showInlineAdd && view === 'list' && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
          background: 'var(--pb-bg2)', borderTop: '2px solid var(--pb-gold)',
          boxShadow: '0 -4px 16px rgba(0,0,0,0.08)',
        }}>
          <InlineAddRow
            listId={listId}
            productId={productId}
            orgId={orgId}
            defaultStatusId={defaultStatusId}
            level="feature"
            parentId={null}
            position={features.filter(f => f.parent_id === null).length}
            onDone={() => setShowInlineAdd(false)}
            onCancel={() => setShowInlineAdd(false)}
          />
        </div>
      )}

      {/* Feature detail panel */}
      {selectedFeature && (
        <FeatureDetailPanel
          feature={selectedFeature}
          allFeatures={features}
          listId={listId}
          productId={productId}
          orgId={orgId}
          onClose={() => setSelectedFeature(null)}
          onOpenDetail={setSelectedFeature}
        />
      )}
    </div>
  );
}
