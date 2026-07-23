import { FeatureStatus, FEATURE_STATUSES, ProductRole } from '@/types';
import { MoreVertical } from 'lucide-react';
import { useProductRoles } from '@/hooks/useProductRoles';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description?: string | null;
    icon_letter?: string | null;
    icon_color?: string | null;
    emoji_icon?: string | null;
  };
  statusCounts: Record<FeatureStatus, number>;
  memberAvatars?: Array<{ initials: string; color: string }>;
  isActive: boolean;
  canManage: boolean;
  onClick: () => void;
  onAssignRole: (role: 'pm' | 'lead_engineer') => void;
}

/* ── Role badge (pill on card) ─────────────────────────────────────────────── */
function RoleBadge({
  abbrev,
  person,
  canManage,
  onClick,
}: {
  abbrev: string;
  person: ProductRole | null;
  canManage: boolean;
  onClick: (e: React.MouseEvent) => void;
}) {
  if (person) {
    return (
      <div className="role-badge" onClick={canManage ? onClick : undefined} style={{
        display: 'flex', alignItems: 'center', gap: 5,
        background: 'var(--pb-bg)', border: '1px solid var(--pb-border)',
        borderRadius: 99, padding: '3px 8px 3px 4px', fontSize: 11,
        color: 'var(--pb-text2)', cursor: canManage ? 'pointer' : 'default', transition: 'border-color .15s',
      }}>
        <div style={{
          width: 18, height: 18, borderRadius: '50%', fontSize: 8, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', background: person.avatarColor, flexShrink: 0,
        }}>{person.initials}</div>
        <span style={{ fontWeight: 500, color: 'var(--pb-text3)' }}>{abbrev}·</span>
        <span>{person.name.split(' ')[0]}</span>
      </div>
    );
  }
  return (
    <div className="role-badge" onClick={canManage ? onClick : undefined} style={{
      display: 'flex', alignItems: 'center', gap: 5,
      background: 'var(--pb-bg)', border: '1px dashed var(--pb-border)',
      borderRadius: 99, padding: '3px 8px 3px 4px', fontSize: 11,
      color: 'var(--pb-text3)', cursor: canManage ? 'pointer' : 'default', transition: 'border-color .15s',
      opacity: canManage ? 1 : 0.6,
    }}>
      <span style={{ fontSize: 12 }}>{canManage ? '+' : ''}</span>
      <span>{canManage ? `Assign ${abbrev === 'PM' ? 'PM' : 'Lead Eng'}` : (abbrev === 'PM' ? 'No PM' : 'No Lead Eng')}</span>
    </div>
  );
}

/* ── Main ProductCard ─────────────────────────────────────────────────────── */
export function ProductCard({
  product,
  statusCounts,
  memberAvatars = [],
  isActive,
  canManage,
  onClick,
  onAssignRole,
}: ProductCardProps) {
  const { pm, leadEngineer } = useProductRoles(product.id);

  const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);
  const liveCount = statusCounts.live || 0;
  const devCount = (statusCounts.in_development || 0) + (statusCounts.in_testing || 0);

  const icon = product.emoji_icon || product.icon_letter || product.name.charAt(0);

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--pb-bg2)',
        border: `1.5px solid ${isActive ? 'var(--pb-gold-600)' : 'var(--pb-border)'}`,
        borderRadius: 14,
        padding: 20,
        cursor: 'pointer',
        transition: 'border-color .2s, box-shadow .2s, transform .15s',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: isActive ? '0 0 0 3px rgba(217,119,6,0.12)' : 'none',
        fontFamily: "'DM Sans', sans-serif",
      }}
      onMouseEnter={e => {
        if (!isActive) {
          (e.currentTarget as HTMLElement).style.borderColor = '#C4A55A';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.07)';
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={e => {
        if (!isActive) {
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--pb-border)';
          (e.currentTarget as HTMLElement).style.boxShadow = 'none';
          (e.currentTarget as HTMLElement).style.transform = 'none';
        }
      }}
    >
      {/* Top: icon + ⋮ */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9,
          background: 'var(--pb-gold-100)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
        }}>{icon}</div>
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: 24, height: 24, borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--pb-text3)', cursor: 'pointer', transition: 'background .15s, color .15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--pb-bg)'; (e.currentTarget as HTMLElement).style.color = 'var(--pb-text)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--pb-text3)'; }}
        >
          <MoreVertical size={14} />
        </div>
      </div>

      {/* Name + desc */}
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 3, color: 'var(--pb-text)' }}>{product.name}</div>
      <div style={{ fontSize: 12, color: 'var(--pb-text2)', lineHeight: 1.5, marginBottom: 14, minHeight: 18 }}>
        {product.description || '\u00A0'}
      </div>

      {/* Role badges */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        <RoleBadge abbrev="PM" person={pm} canManage={canManage} onClick={e => { e.stopPropagation(); onAssignRole('pm'); }} />
        <RoleBadge abbrev="ENG" person={leadEngineer} canManage={canManage} onClick={e => { e.stopPropagation(); onAssignRole('lead_engineer'); }} />
      </div>

      {/* Mini status bar */}
      <div style={{ height: 4, borderRadius: 99, background: 'var(--pb-border)', overflow: 'hidden', display: 'flex', marginBottom: 14 }}>
        {FEATURE_STATUSES.map(s => {
          const pct = total > 0 ? (statusCounts[s.key] / total * 100) : 0;
          if (pct === 0) return null;
          return <div key={s.key} style={{ width: `${pct}%`, height: '100%', background: s.color, transition: 'width .4s' }} />;
        })}
      </div>

      {/* Bottom: avatar row + stats */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Avatar stack */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {memberAvatars.slice(0, 3).map((av, i) => (
            <div key={i} style={{
              width: 26, height: 26, borderRadius: '50%', border: '2px solid var(--pb-bg2)',
              fontSize: 10, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', background: av.color, marginLeft: i === 0 ? 0 : -6, position: 'relative', zIndex: 3 - i,
            }}>{av.initials}</div>
          ))}
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: 26, height: 26, borderRadius: '50%',
              border: '1.5px dashed var(--pb-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--pb-text3)', fontSize: 14, cursor: 'pointer',
              marginLeft: memberAvatars.length > 0 ? -6 : 0,
              transition: 'border-color .15s, color .15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--pb-gold)'; (e.currentTarget as HTMLElement).style.color = 'var(--pb-gold)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--pb-border)'; (e.currentTarget as HTMLElement).style.color = 'var(--pb-text3)'; }}
          >+</div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "'DM Mono', monospace", color: '#10B981' }}>{liveCount}</div>
            <div style={{ fontSize: 10, color: 'var(--pb-text3)' }}>live</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "'DM Mono', monospace", color: '#F59E0B' }}>{devCount}</div>
            <div style={{ fontSize: 10, color: 'var(--pb-text3)' }}>in flight</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "'DM Mono', monospace" }}>{total}</div>
            <div style={{ fontSize: 10, color: 'var(--pb-text3)' }}>total</div>
          </div>
        </div>
      </div>
    </div>
  );
}
