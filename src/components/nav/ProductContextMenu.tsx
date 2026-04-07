import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ProdbodProduct, useDuplicateProduct, useDeleteProduct, useProductFeatureCount } from '@/hooks/useProdbodProducts';

interface ProductContextMenuProps {
  product: ProdbodProduct;
  orgId: string;
  onClose: () => void;
  onRename: () => void;
  onSettingsOpen: () => void;
  onStatusSettingsOpen: () => void;
}

export function ProductContextMenu({
  product, orgId, onClose, onRename, onSettingsOpen, onStatusSettingsOpen,
}: ProductContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const duplicate = useDuplicateProduct();
  const deleteProduct = useDeleteProduct();
  const { data: featureCount = 0 } = useProductFeatureCount(showDeleteConfirm ? product.id : null);

  const isOnThisProduct = location.pathname.startsWith(`/products/${product.id}`);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const keyHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, [onClose]);

  const handleDuplicate = async () => {
    onClose();
    try {
      await duplicate.mutateAsync({ product });
    } catch (err) {
      console.error('Duplicate failed:', err);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteProduct.mutateAsync({ id: product.id, orgId });
      setShowDeleteConfirm(false);
      onClose();
      if (isOnThisProduct) navigate('/');
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const menuItemStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px',
    height: 32, cursor: 'pointer', fontSize: 13.5, color: 'var(--pb-text)',
    fontFamily: "'DM Sans', sans-serif", transition: 'background .1s',
    userSelect: 'none',
  };

  const iconStyle: React.CSSProperties = {
    width: 14, height: 14, flexShrink: 0, opacity: 0.6,
  };

  return (
    <>
      <div
        ref={ref}
        style={{
          position: 'absolute', top: '100%', right: 0, zIndex: 100,
          background: 'var(--pb-bg2)', border: '1px solid var(--pb-border2)',
          borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          minWidth: 210, overflow: 'hidden', fontFamily: "'DM Sans', sans-serif",
          marginTop: 4,
        }}
      >
        {/* Rename */}
        <div
          style={menuItemStyle}
          onClick={() => { onClose(); onRename(); }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--pb-bg3)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <svg style={iconStyle} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 10.5 10 2.5l1.5 1.5-8 8H2v-1.5z"/>
          </svg>
          Rename
        </div>

        {/* Space settings */}
        <div
          style={menuItemStyle}
          onClick={() => { onClose(); onSettingsOpen(); }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--pb-bg3)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <svg style={iconStyle} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="7" cy="7" r="2"/>
            <path d="M7 1v2M7 11v2M1 7h2M11 7h2M2.93 2.93l1.41 1.41M9.66 9.66l1.41 1.41M2.93 11.07l1.41-1.41M9.66 4.34l1.41-1.41"/>
          </svg>
          Space settings
        </div>

        {/* Status settings */}
        <div
          style={menuItemStyle}
          onClick={() => { onClose(); onStatusSettingsOpen(); }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--pb-bg3)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <svg style={iconStyle} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="7" cy="7" r="5.5"/>
            <path d="M4 7h6M7 4v6"/>
          </svg>
          Status settings
        </div>

        <div style={{ height: 1, background: 'var(--pb-border)', margin: '3px 0' }} />

        {/* Duplicate */}
        <div
          style={menuItemStyle}
          onClick={handleDuplicate}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--pb-bg3)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          {duplicate.isPending ? (
            <Loader2 style={{ ...iconStyle, animation: 'spin 1s linear infinite' }} />
          ) : (
            <svg style={iconStyle} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="4" y="4" width="8" height="8" rx="1.5"/>
              <path d="M2 10V2h8"/>
            </svg>
          )}
          Duplicate product
        </div>

        <div style={{ height: 1, background: 'var(--pb-border)', margin: '3px 0' }} />

        {/* Delete */}
        <div
          style={{ ...menuItemStyle, color: 'var(--pb-red)' }}
          onClick={() => setShowDeleteConfirm(true)}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--pb-red-bg)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          <svg style={{ ...iconStyle, opacity: 1 }} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 3.5h10M5 3.5V2h4v1.5M5.5 6v5M8.5 6v5M3 3.5l.5 8.5h7L11 3.5"/>
          </svg>
          Delete product
        </div>
      </div>

      {/* Delete confirmation modal — portaled to body so sidebar transform doesn't clip it */}
      {showDeleteConfirm && createPortal(
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteConfirm(false); }}
        >
          <div style={{
            background: 'var(--pb-bg2)', border: '1px solid var(--pb-border2)',
            borderRadius: 'var(--pb-rxl)', width: '100%', maxWidth: 420,
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)', fontFamily: "'DM Sans', sans-serif",
            overflow: 'hidden',
          }}>
            <div style={{ padding: '20px 22px 16px', borderBottom: '1px solid var(--pb-border)' }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                Delete "{product.name}"?
              </div>
              <div style={{ fontSize: 13.5, color: 'var(--pb-text2)', lineHeight: 1.5 }}>
                This will permanently delete this product, its backlog, and all{' '}
                <strong>{featureCount}</strong> feature{featureCount !== 1 ? 's' : ''} inside it.
                This cannot be undone.
              </div>
            </div>
            <div style={{ padding: '14px 22px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  padding: '9px 18px', borderRadius: 'var(--pb-r)', border: '1px solid var(--pb-border)',
                  background: 'transparent', cursor: 'pointer', fontSize: 13.5, fontFamily: "'DM Sans', sans-serif",
                  color: 'var(--pb-text2)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteProduct.isPending}
                style={{
                  padding: '9px 18px', borderRadius: 'var(--pb-r)', border: 'none',
                  background: 'var(--pb-red)', color: '#fff', cursor: 'pointer',
                  fontSize: 13.5, fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
                  display: 'flex', alignItems: 'center', gap: 6,
                  opacity: deleteProduct.isPending ? 0.7 : 1,
                }}
              >
                {deleteProduct.isPending && <Loader2 size={14} className="animate-spin" />}
                Delete product
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
