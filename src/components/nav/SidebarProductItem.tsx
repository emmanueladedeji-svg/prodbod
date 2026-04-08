import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { ProdbodProduct, useUpdateProductName } from '@/hooks/useProdbodProducts';
import { useProductLists } from '@/hooks/useLists';
import { ProductContextMenu } from './ProductContextMenu';
import { ProductSpaceSettingsModal } from '@/components/settings/ProductSpaceSettingsModal';
import { StatusSettingsModal } from '@/components/settings/StatusSettingsModal';

function productColor(name: string) {
  const colors = ['#3d6cff', '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626', '#be185d'];
  let h = 0;
  for (const ch of (name || '')) h = (h * 31 + ch.charCodeAt(0)) % colors.length;
  return colors[h];
}

interface SidebarProductItemProps {
  product: ProdbodProduct;
  orgId: string;
  onNavigate: () => void;
}

export function SidebarProductItem({ product, orgId, onNavigate }: SidebarProductItemProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [expanded, setExpanded] = useState(() => location.pathname.includes(`/products/${product.id}`));
  const { data: lists = [] } = useProductLists(expanded ? product.id : null);

  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(product.name);
  const [shake, setShake] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStatusSettings, setShowStatusSettings] = useState(false);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const updateName = useUpdateProductName();

  const isActive = location.pathname.includes(`/products/${product.id}`);
  const color = (product as any).icon_color || productColor(product.name);

  useEffect(() => {
    if (isRenaming) {
      setTimeout(() => {
        renameInputRef.current?.focus();
        renameInputRef.current?.select();
      }, 10);
    }
  }, [isRenaming]);

  const handleProductClick = () => {
    if (isRenaming) return;
    setExpanded(e => !e);
  };

  const handleListClick = (listId: string) => {
    navigate(`/products/${product.id}/${listId}`);
    onNavigate();
  };

  const handleRenameCommit = async () => {
    const trimmed = renameValue.trim();
    if (!trimmed) {
      setShake(true);
      setTimeout(() => { setShake(false); renameInputRef.current?.focus(); }, 300);
      return;
    }
    if (trimmed !== product.name) {
      try {
        await updateName.mutateAsync({ id: product.id, name: trimmed, orgId });
      } catch (err) {
        console.error('Rename failed:', err);
      }
    }
    setIsRenaming(false);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); handleRenameCommit(); }
    if (e.key === 'Escape') { setRenameValue(product.name); setIsRenaming(false); }
  };

  return (
    <>
      <div>
        <div
          onClick={handleProductClick}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '6px 8px',
            borderRadius: 'var(--pb-r)',
            cursor: isRenaming ? 'default' : 'pointer',
            background: isActive ? 'var(--pb-gold-bg)' : 'transparent',
            borderLeft: isActive ? '3px solid var(--pb-gold)' : '3px solid transparent',
            color: isActive ? 'var(--pb-text)' : 'var(--pb-text2)',
            transition: 'all .12s',
            userSelect: 'none',
            position: 'relative',
          }}
          onMouseEnterCapture={() => setHovered(true)}
          onMouseLeaveCapture={() => setHovered(false)}
        >
          {/* Product colour icon */}
          <div
            style={{
              width: 18, height: 18, borderRadius: 4, background: color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, fontWeight: 700, color: '#fff',
              fontFamily: "'Syne', sans-serif", flexShrink: 0,
            }}
          >
            {(product as any).icon_letter || product.name.charAt(0).toUpperCase()}
          </div>

          {/* Name — inline editable */}
          {isRenaming ? (
            <input
              ref={renameInputRef}
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onKeyDown={handleRenameKeyDown}
              onBlur={handleRenameCommit}
              onClick={e => e.stopPropagation()}
              className={shake ? 'shake-anim' : ''}
              style={{
                flex: 1, border: 'none', outline: 'none', background: 'transparent',
                fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                color: 'var(--pb-text)', borderBottom: '1px solid var(--pb-gold)',
                padding: '0 2px', lineHeight: 1.4,
              }}
            />
          ) : (
            <span style={{
              flex: 1, fontSize: 13, fontWeight: isActive ? 500 : 400,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {product.name}
            </span>
          )}

          {/* ··· menu button — visible on hover */}
          {!isRenaming && (hovered || menuOpen) && (
            <div style={{ position: 'relative' }}>
              <button
                ref={menuBtnRef}
                onClick={(e) => { e.stopPropagation(); setMenuOpen(m => !m); }}
                style={{
                  width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 4, border: '1px solid var(--pb-border)', background: 'var(--pb-bg2)',
                  cursor: 'pointer', color: 'var(--pb-text3)', fontSize: 12, flexShrink: 0,
                  fontFamily: 'monospace',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--pb-bg3)'; e.currentTarget.style.color = 'var(--pb-text)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--pb-bg2)'; e.currentTarget.style.color = 'var(--pb-text3)'; }}
                title="Product options"
              >
                ···
              </button>
              {menuOpen && (
                <ProductContextMenu
                  product={product}
                  orgId={orgId}
                  onClose={() => setMenuOpen(false)}
                  onRename={() => { setIsRenaming(true); setRenameValue(product.name); }}
                  onSettingsOpen={() => setShowSettings(true)}
                  onStatusSettingsOpen={() => setShowStatusSettings(true)}
                />
              )}
            </div>
          )}

          {/* Chevron — only when not hovering/menu (space limited) */}
          {!isRenaming && !hovered && !menuOpen && (
            <ChevronRight
              size={12}
              style={{
                flexShrink: 0, transition: 'transform .15s',
                transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', opacity: 0.5,
              }}
            />
          )}
        </div>

        {expanded && (
          <div style={{ paddingLeft: 20 }}>
            {lists.length === 0 ? (
              <div style={{ padding: '4px 8px', fontSize: 12, color: 'var(--pb-text3)' }}>No lists</div>
            ) : (
              lists.map((list) => {
                const listActive = location.pathname === `/products/${product.id}/${list.id}`;
                return (
                  <div
                    key={list.id}
                    onClick={() => handleListClick(list.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px',
                      borderRadius: 'var(--pb-r)', cursor: 'pointer', fontSize: 12.5,
                      color: listActive ? 'var(--pb-text)' : 'var(--pb-text2)',
                      background: listActive ? 'var(--pb-bg3)' : 'transparent', transition: 'all .12s',
                    }}
                    onMouseEnter={(e) => { if (!listActive) e.currentTarget.style.background = 'var(--pb-bg3)'; }}
                    onMouseLeave={(e) => { if (!listActive) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ flexShrink: 0, opacity: 0.6 }}>
                      <line x1="2" y1="4" x2="10" y2="4"/>
                      <line x1="2" y1="7" x2="10" y2="7"/>
                      <line x1="2" y1="10" x2="8" y2="10"/>
                    </svg>
                    {list.name}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Modals rendered outside the sidebar item for proper z-indexing */}
      {showSettings && (
        <ProductSpaceSettingsModal
          productId={product.id}
          orgId={orgId}
          onClose={() => setShowSettings(false)}
        />
      )}
      {showStatusSettings && (
        <StatusSettingsModal
          productId={product.id}
          orgId={orgId}
          onClose={() => setShowStatusSettings(false)}
        />
      )}
    </>
  );
}
