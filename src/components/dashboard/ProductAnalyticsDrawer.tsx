import { useState, useMemo } from 'react';
import { X, UserPlus } from 'lucide-react';
import { FeatureStatus, FEATURE_STATUSES } from '@/types';
import { useProductRoles } from '@/hooks/useProductRoles';
import { useFeatureStatusCounts } from '@/hooks/useFeatureStatusCounts';
import { useFeatureStatusHistory } from '@/hooks/useFeatureStatusHistory';
import { useProductFeatures } from '@/hooks/useProductFeatures';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';

interface ProductAnalyticsDrawerProps {
  productId: string | null;
  productName?: string;
  productDescription?: string | null;
  onClose: () => void;
  canManage: boolean;
  onAssignRole: (productId: string, role: 'pm' | 'lead_engineer') => void;
  onAssignFeature: (featureId: string) => void;
}

/* ── Tooltip for the stacked bar chart ─────────────────────────────────────── */
function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--pb-text)', color: '#fff', borderRadius: 8,
      padding: '8px 12px', fontSize: 11, whiteSpace: 'nowrap',
      boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {FEATURE_STATUSES.map(s => {
        const val = payload.find((p: any) => p.dataKey === s.key)?.value;
        if (!val) return null;
        return (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 6, lineHeight: 1.7 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
            {s.label}: <strong>{val}</strong>
          </div>
        );
      })}
    </div>
  );
}

/* ── Drawer role pill ──────────────────────────────────────────────────────── */
function DrawerRolePill({
  roleLabel,
  person,
  canManage,
  onClick,
}: {
  roleLabel: string;
  person: { name: string; initials: string; avatarColor: string } | null;
  canManage: boolean;
  onClick: () => void;
}) {
  if (person) {
    return (
      <div onClick={canManage ? onClick : undefined} style={{
        display: 'flex', alignItems: 'center', gap: 7,
        background: 'var(--pb-bg)', border: '1px solid var(--pb-border)',
        borderRadius: 99, padding: '5px 12px 5px 6px', fontSize: 12,
        cursor: canManage ? 'pointer' : 'default', transition: 'border-color .15s',
        fontFamily: "'DM Sans', sans-serif",
      }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--pb-gold)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--pb-border)'}
      >
        <div style={{
          width: 22, height: 22, borderRadius: '50%', fontSize: 9, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', background: person.avatarColor,
        }}>{person.initials}</div>
        <div>
          <span style={{ display: 'block', fontSize: 10, color: 'var(--pb-text3)', fontWeight: 500, lineHeight: 1 }}>{roleLabel}</span>
          <span style={{ fontWeight: 500, lineHeight: 1 }}>{person.name}</span>
        </div>
      </div>
    );
  }
  return (
    <div onClick={canManage ? onClick : undefined} style={{
      display: 'flex', alignItems: 'center', gap: 7,
      background: 'var(--pb-bg)', border: '1px dashed var(--pb-border)',
      borderRadius: 99, padding: '5px 12px 5px 6px', fontSize: 12,
      cursor: canManage ? 'pointer' : 'default', color: 'var(--pb-text3)', transition: 'border-color .15s',
      fontFamily: "'DM Sans', sans-serif",
      opacity: canManage ? 1 : 0.6,
    }}
      onMouseEnter={e => {
        if (canManage) (e.currentTarget as HTMLElement).style.borderColor = 'var(--pb-gold)';
      }}
      onMouseLeave={e => {
        if (canManage) (e.currentTarget as HTMLElement).style.borderColor = 'var(--pb-border)';
      }}
    >
      <div style={{
        width: 22, height: 22, borderRadius: '50%',
        background: 'var(--pb-border)', color: 'var(--pb-text3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
      }}>{canManage ? '+' : ''}</div>
      <div>
        <span style={{ display: 'block', fontSize: 10, color: 'var(--pb-text3)', fontWeight: 500, lineHeight: 1 }}>{roleLabel}</span>
        <span style={{ fontWeight: 500, lineHeight: 1, color: 'var(--pb-text3)' }}>{canManage ? 'Assign' : 'Not assigned'}</span>
      </div>
    </div>
  );
}

/* ── Main Drawer ───────────────────────────────────────────────────────────── */
export function ProductAnalyticsDrawer({
  productId,
  productName,
  productDescription,
  onClose,
  canManage,
  onAssignRole,
  onAssignFeature,
}: ProductAnalyticsDrawerProps) {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [statusFilter, setStatusFilter] = useState<FeatureStatus | 'all'>('all');
  const [referenceDate, setReferenceDate] = useState<Date>(new Date());

  const { pm, leadEngineer } = useProductRoles(productId);
  const { data: countsData } = useFeatureStatusCounts(productId);
  const statusCounts = countsData?.counts || {
    idea: 0,
    discovery: 0,
    in_development: 0,
    in_testing: 0,
    live: 0,
    closed: 0,
  };
  const totalFeatures = countsData?.total || 0;
  const { data: historyData = [] } = useFeatureStatusHistory(productId, period, referenceDate);
  const { data: features = [], isLoading: featuresLoading } = useProductFeatures(productId, statusFilter);

  const isOpen = !!productId;

  const chartData = useMemo(() =>
    historyData.map(d => ({ name: d.label, ...d.counts })),
    [historyData]
  );

  const handleStatusToggle = (key: FeatureStatus | 'all') => {
    setStatusFilter(prev => prev === key ? 'all' : key as any);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, height: '100vh',
      width: 720, maxWidth: '100vw',
      background: 'var(--pb-bg2)',
      borderLeft: '1px solid var(--pb-border)',
      zIndex: 200,
      display: 'flex', flexDirection: 'column',
      transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
      transition: 'transform .35s cubic-bezier(0.4,0,0.2,1)',
      overflow: 'hidden',
      fontFamily: "'DM Sans', sans-serif",
    }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '24px 28px 0', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.3px', color: 'var(--pb-text)' }}>
            {productName || 'Product Details'}
          </div>
          {productDescription && (
            <div style={{ fontSize: 12, color: 'var(--pb-text2)', marginTop: 3 }}>{productDescription}</div>
          )}
        </div>
        <div
          onClick={onClose}
          style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'var(--pb-bg)', border: '1px solid var(--pb-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--pb-text2)', fontSize: 16, flexShrink: 0,
            transition: 'background .15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--pb-border)'; (e.currentTarget as HTMLElement).style.color = 'var(--pb-text)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--pb-bg)'; (e.currentTarget as HTMLElement).style.color = 'var(--pb-text2)'; }}
        >✕</div>
      </div>

      {/* ── Role pills ── */}
      <div style={{ display: 'flex', gap: 10, padding: '14px 28px', borderBottom: '1px solid var(--pb-border)', flexShrink: 0 }}>
        <DrawerRolePill roleLabel="Product Manager" person={pm} canManage={canManage} onClick={() => productId && onAssignRole(productId, 'pm')} />
        <DrawerRolePill roleLabel="Lead Engineer" person={leadEngineer} canManage={canManage} onClick={() => productId && onAssignRole(productId, 'lead_engineer')} />
      </div>

      {/* ── Time filter pills ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderBottom: '1px solid var(--pb-border)', flexShrink: 0, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['week', 'month', 'year'] as const).map(p => (
            <div
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 500,
                border: `1px solid ${period === p ? 'var(--pb-text)' : 'var(--pb-border)'}`,
                background: period === p ? 'var(--pb-text)' : 'var(--pb-bg2)',
                color: period === p ? '#fff' : 'var(--pb-text2)',
                cursor: 'pointer', transition: 'all .15s',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </div>
          ))}
        </div>
        <div style={{ width: 1, height: 20, background: 'var(--pb-border)', margin: '0 4px' }} />
        {period === 'month' && (
          <select 
            value={referenceDate.getMonth()} 
            onChange={e => {
              const newDate = new Date(referenceDate);
              newDate.setMonth(parseInt(e.target.value));
              setReferenceDate(newDate);
            }}
            style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid var(--pb-border)', background: 'var(--pb-bg2)', fontSize: 12, fontFamily: "'DM Sans', sans-serif", color: 'var(--pb-text)', outline: 'none', cursor: 'pointer' }}
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i} value={i}>{new Date(2000, i, 1).toLocaleString('default', { month: 'short' })} {referenceDate.getFullYear()}</option>
            ))}
          </select>
        )}
        {period === 'year' && (
          <select 
            value={referenceDate.getFullYear()} 
            onChange={e => {
              const newDate = new Date(referenceDate);
              newDate.setFullYear(parseInt(e.target.value));
              setReferenceDate(newDate);
            }}
            style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid var(--pb-border)', background: 'var(--pb-bg2)', fontSize: 12, fontFamily: "'DM Sans', sans-serif", color: 'var(--pb-text)', outline: 'none', cursor: 'pointer' }}
          >
            {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        )}
      </div>

      {/* ── Scrollable body ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* Stacked distribution bar */}
        <div style={{ padding: '16px 28px 0', flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--pb-text2)', marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Feature status distribution
          </div>
          <div style={{ height: 10, borderRadius: 99, overflow: 'hidden', display: 'flex', marginBottom: 10, background: 'var(--pb-border)' }}>
            {FEATURE_STATUSES.map(s => {
              const count = statusCounts?.[s.key] || 0;
              if (!totalFeatures || count === 0) return null;
              const pct = (count / totalFeatures) * 100;
              return (
                <div
                  key={s.key}
                  onClick={() => handleStatusToggle(s.key)}
                  style={{
                    width: `${pct}%`, height: '100%', background: s.color, cursor: 'pointer',
                    transition: 'filter .15s, width .5s',
                    filter: statusFilter !== 'all' && statusFilter !== s.key ? 'brightness(0.5) saturate(0.3)' : 'none',
                  }}
                  title={`${s.label}: ${count} (${pct.toFixed(1)}%)`}
                />
              );
            })}
          </div>

          {/* Legend row */}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 4 }}>
            {FEATURE_STATUSES.map(s => {
              const count = statusCounts?.[s.key] || 0;
              if (!totalFeatures) return null;
              const pct = ((count / totalFeatures) * 100).toFixed(1);
              return (
                <div
                  key={s.key}
                  onClick={() => handleStatusToggle(s.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    fontSize: 11, color: statusFilter === s.key ? 'var(--pb-text)' : 'var(--pb-text2)',
                    fontWeight: statusFilter === s.key ? 500 : 400,
                    cursor: 'pointer', transition: 'color .15s',
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                  {s.label}
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, marginLeft: 3 }}>{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bar chart */}
        {chartData.length > 0 && (
          <div style={{ padding: '16px 28px', flexShrink: 0 }}>
            <div style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barCategoryGap="20%" margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9CA3AF', fontFamily: "'DM Mono', monospace" }} dy={4} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9CA3AF', fontFamily: "'DM Mono', monospace" }} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'transparent' }} />
                  {FEATURE_STATUSES.slice().reverse().map((s, i) => (
                    <Bar key={s.key} dataKey={s.key} stackId="a" fill={s.color} radius={i === 0 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── Features drill-down ── */}
        <div style={{ borderTop: '1px solid var(--pb-border)' }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 28px 10px', position: 'sticky', top: 0,
            background: 'var(--pb-bg2)', zIndex: 10, borderBottom: '1px solid var(--pb-border)',
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--pb-text)' }}>Features</div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--pb-bg)', border: '1px solid var(--pb-border)',
              borderRadius: 99, padding: '2px 8px', fontSize: 11, fontWeight: 600,
              fontFamily: "'DM Mono', monospace",
            }}>{totalFeatures}</div>
          </div>

          {/* Status filter pills */}
          <div style={{
            display: 'flex', gap: 6, flexWrap: 'wrap',
            padding: '10px 28px', borderBottom: '1px solid var(--pb-border)',
            position: 'sticky', top: 49, background: 'var(--pb-bg2)', zIndex: 9,
          }}>
            {/* All pill */}
            <div
              onClick={() => handleStatusToggle('all')}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 500,
                border: '1.5px solid transparent', cursor: 'pointer', transition: 'all .15s',
                background: statusFilter === 'all' ? 'var(--pb-text)' : 'var(--pb-bg)',
                color: statusFilter === 'all' ? '#fff' : 'var(--pb-text2)',
                borderColor: statusFilter === 'all' ? 'var(--pb-text)' : 'transparent',
              }}
            >All · {totalFeatures}</div>

            {FEATURE_STATUSES.map(s => {
              const count = statusCounts?.[s.key] || 0;
              const isActive = statusFilter === s.key;
              return (
                <div
                  key={s.key}
                  onClick={() => handleStatusToggle(s.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 500,
                    border: '1.5px solid transparent', cursor: 'pointer', transition: 'all .15s',
                    background: isActive ? s.color : 'var(--pb-bg)',
                    color: isActive ? '#fff' : 'var(--pb-text2)',
                    borderColor: isActive ? s.color : 'transparent',
                  }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: isActive ? '#fff' : s.color }} />
                  {s.label} · {count}
                </div>
              );
            })}
          </div>

          {/* Feature list */}
          <div style={{ padding: '8px 28px 20px' }}>
            {featuresLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ height: 40, background: 'var(--pb-bg)', borderRadius: 8, marginBottom: 6 }} className="animate-pulse" />
              ))
            ) : features.length === 0 ? (
              <div style={{ padding: '40px 28px', textAlign: 'center', color: 'var(--pb-text3)', fontSize: 13 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🎯</div>
                No features in this status yet.
              </div>
            ) : (
              features.map(feature => {
                const s = FEATURE_STATUSES.find(x => x.key === feature.status);
                const badgeBg = s ? s.color + '20' : '#f3f4f620';
                return (
                  <div
                    key={feature.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 0', borderBottom: '1px solid var(--pb-border)',
                    }}
                  >
                    {/* Status dot */}
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: s?.color || '#9CA3AF', flexShrink: 0 }} />
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--pb-text)' }}>
                        {feature.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 500, padding: '2px 6px', borderRadius: 4,
                          letterSpacing: '0.02em',
                          background: badgeBg, color: s?.color || '#6B7280',
                        }}>{s?.label || feature.status}</span>
                        {feature.is_sub_feature && (
                          <span style={{ fontSize: 10, color: 'var(--pb-text3)' }}>↳ sub-feature</span>
                        )}
                      </div>
                    </div>
                    {/* Assignee */}
                    <div style={{ flexShrink: 0 }}>
                      {feature.assignee ? (
                        <div
                          title={feature.assignee.name}
                          style={{
                            width: 24, height: 24, borderRadius: '50%',
                            fontSize: 9, fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', background: feature.assignee.avatarColor, cursor: 'pointer',
                          }}
                        >{feature.assignee.initials}</div>
                      ) : (
                        <div
                          onClick={() => canManage && onAssignFeature(feature.id)}
                          style={{
                            width: 24, height: 24, borderRadius: '50%',
                            border: '1.5px dashed var(--pb-border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--pb-text3)', fontSize: 13, cursor: canManage ? 'pointer' : 'default',
                            transition: 'border-color .15s, color .15s',
                            opacity: canManage ? 1 : 0.6,
                          }}
                          onMouseEnter={e => canManage && ((e.currentTarget as HTMLElement).style.borderColor = 'var(--pb-gold)', (e.currentTarget as HTMLElement).style.color = 'var(--pb-gold)')}
                          onMouseLeave={e => canManage && ((e.currentTarget as HTMLElement).style.borderColor = 'var(--pb-border)', (e.currentTarget as HTMLElement).style.color = 'var(--pb-text3)')}
                        >{canManage ? '+' : ''}</div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
