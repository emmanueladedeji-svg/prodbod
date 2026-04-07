import { ProdbodProduct } from '@/hooks/useProdbodProducts';
import { ProductList } from '@/hooks/useLists';

interface WorkspaceShellProps {
  product: ProdbodProduct | null;
  list: ProductList | null;
  orgName: string;
  view: 'list' | 'board';
  setView: (v: 'list' | 'board') => void;
  onAddFeature: () => void;
  children: React.ReactNode;
}

export function WorkspaceShell({ product, list, orgName, view, setView, onAddFeature, children }: WorkspaceShellProps) {
  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '5px 12px',
    borderRadius: 6,
    fontSize: 13,
    cursor: 'pointer',
    border: active ? '1px solid var(--pb-border2)' : '1px solid transparent',
    background: active ? 'var(--pb-bg2)' : 'transparent',
    color: active ? 'var(--pb-text)' : 'var(--pb-text3)',
    fontWeight: active ? 500 : 400,
    fontFamily: "'DM Sans', sans-serif",
    transition: 'all .12s',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '12px 20px',
        borderBottom: '1px solid var(--pb-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        background: 'var(--pb-bg2)',
        gap: 12,
      }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--pb-text2)', fontFamily: "'DM Sans', sans-serif", minWidth: 0 }}>
          <span style={{ color: 'var(--pb-text3)', flexShrink: 0 }}>{orgName}</span>
          <span style={{ color: 'var(--pb-text3)', flexShrink: 0 }}>/</span>
          <span style={{ color: 'var(--pb-text2)', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{product?.name || '—'}</span>
          <span style={{ color: 'var(--pb-text3)', flexShrink: 0 }}>/</span>
          <span style={{ fontWeight: 600, color: 'var(--pb-text)', flexShrink: 0 }}>{list?.name || '—'}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* View tabs */}
          <div style={{ display: 'flex', gap: 2, background: 'var(--pb-bg3)', padding: 3, borderRadius: 8, border: '1px solid var(--pb-border)' }}>
            <button onClick={() => setView('list')} style={tabStyle(view === 'list')}>List</button>
            <button onClick={() => setView('board')} style={tabStyle(view === 'board')}>Board</button>
          </div>

          {/* Add feature button */}
          <button
            onClick={onAddFeature}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 13px',
              borderRadius: 'var(--pb-r)',
              border: '1px solid var(--pb-accent)',
              background: 'var(--pb-accent)',
              color: '#fff',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              transition: 'opacity .12s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            + Feature
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}
