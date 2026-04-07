import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, X } from 'lucide-react';
import { useOrgProducts, useUpdateProductSettings, ProdbodProduct } from '@/hooks/useProdbodProducts';
import { useOrgMembersProdbod } from '@/hooks/useProdbodMembers';
import { StatusColorPicker } from './StatusColorPicker';

interface ProductSpaceSettingsModalProps {
  productId: string;
  orgId: string;
  onClose: () => void;
}

const VIEW_OPTIONS = [
  { key: 'list', label: 'List', required: true, icon: '☰' },
  { key: 'board', label: 'Board', required: false, icon: '⊞' },
  { key: 'calendar', label: 'Calendar', required: false, icon: '📅', comingSoon: true },
  { key: 'timeline', label: 'Timeline', required: false, icon: '📊', comingSoon: true },
];

export function ProductSpaceSettingsModal({ productId, orgId, onClose }: ProductSpaceSettingsModalProps) {
  const { data: products = [] } = useOrgProducts(orgId);
  const product = (products as ProdbodProduct[]).find(p => p.id === productId);
  const { data: members = [] } = useOrgMembersProdbod(orgId);
  const updateSettings = useUpdateProductSettings();

  const [name, setName] = useState('');
  const [iconColor, setIconColor] = useState('#7c5cfc');
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [defaultViews, setDefaultViews] = useState<string[]>(['list', 'board']);
  const [progressEnabled, setProgressEnabled] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setIconColor(product.icon_color || '#7c5cfc');
      setOwnerId(product.owner_id);
      setDescription(product.description || '');
      setDefaultViews(product.default_views || ['list', 'board']);
      setProgressEnabled(product.progress_icons_enabled ?? false);
    }
  }, [product]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const toggleView = (key: string) => {
    if (key === 'list') return; // always on
    setDefaultViews(prev =>
      prev.includes(key) ? prev.filter(v => v !== key) : [...prev, key]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) { setError('Product name is required.'); return; }
    try {
      await updateSettings.mutateAsync({
        id: productId, orgId,
        name: name.trim(),
        icon_color: iconColor,
        owner_id: ownerId,
        description: description.trim() || null,
        default_views: defaultViews,
        progress_icons_enabled: progressEnabled,
      });
      setSaved(true);
      setTimeout(() => { setSaved(false); onClose(); }, 800);
    } catch (e: any) {
      setError(e.message || 'Save failed.');
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 13px', border: '1px solid var(--pb-border)',
    borderRadius: 'var(--pb-r)', fontFamily: "'DM Sans', sans-serif",
    fontSize: 13.5, color: 'var(--pb-text)', background: 'var(--pb-bg)', outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--pb-text2)',
    marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase',
    fontFamily: "'Syne', sans-serif",
  };

  const activeMembers = members.filter((m: any) => m.status === 'Active' || m.status === 'active');

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'var(--pb-bg2)', border: '1px solid var(--pb-border2)',
        borderRadius: 'var(--pb-rxl)', width: '100%', maxWidth: 660, maxHeight: '88vh',
        display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.15)',
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 22px', borderBottom: '1px solid var(--pb-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700 }}>
            Edit {product?.name || ''} settings
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: 6, border: '1px solid var(--pb-border)',
              background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: 'var(--pb-text3)',
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 'var(--pb-r)', fontSize: 13,
              background: 'var(--pb-red-bg)', border: '1px solid var(--pb-red-border)', color: 'var(--pb-red)',
            }}>
              {error}
            </div>
          )}

          {/* Section 1: Icon + Name + Owner */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Icon & name */}
            <div>
              <label style={labelStyle}>Icon & name</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                {/* Colour icon */}
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowColorPicker(p => !p)}
                    style={{
                      width: 36, height: 36, borderRadius: 8, background: iconColor,
                      border: '2px solid var(--pb-border2)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 15, fontWeight: 700, color: '#fff',
                      fontFamily: "'Syne', sans-serif", flexShrink: 0,
                    }}
                    title="Change icon colour"
                  >
                    {name.charAt(0).toUpperCase() || 'P'}
                  </button>
                  {showColorPicker && (
                    <div ref={colorPickerRef} style={{ position: 'absolute', top: '110%', left: 0, zIndex: 20 }}>
                      <StatusColorPicker
                        value={iconColor}
                        onChange={(c) => { setIconColor(c); setShowColorPicker(false); }}
                      />
                    </div>
                  )}
                </div>
                <span style={{ fontSize: 12, color: 'var(--pb-text3)' }}>Click icon to change colour</span>
              </div>
              <input
                style={inputStyle}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Product name"
              />
            </div>

            {/* Owner */}
            <div>
              <label style={labelStyle}>Owner</label>
              <select
                style={{ ...inputStyle, cursor: 'pointer' }}
                value={ownerId ?? ''}
                onChange={e => setOwnerId(e.target.value || null)}
              >
                <option value="">Assign an owner…</option>
                {activeMembers.map((m: any) => (
                  <option key={m.id} value={m.member_user_id ?? m.id}>
                    {m.profile?.first_name && m.profile?.last_name
                      ? `${m.profile.first_name} ${m.profile.last_name}`
                      : m.name || m.email}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 2: Description */}
          <div>
            <label style={labelStyle}>Description <span style={{ fontSize: 11, color: 'var(--pb-text3)', textTransform: 'none', fontWeight: 400, letterSpacing: 0, marginLeft: 4 }}>(optional)</span></label>
            <textarea
              style={{ ...inputStyle, minHeight: 80, resize: 'vertical' } as React.CSSProperties}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What does this product do?"
            />
          </div>

          {/* Section 3: Default views */}
          <div>
            <label style={labelStyle}>Default views</label>
            <div style={{ fontSize: 12.5, color: 'var(--pb-text3)', marginBottom: 10 }}>
              Views available in this product's workspace
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {VIEW_OPTIONS.map(v => (
                <div key={v.key} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', borderRadius: 'var(--pb-r)',
                  border: '1px solid var(--pb-border)', background: 'var(--pb-bg)',
                  opacity: v.comingSoon ? 0.6 : 1,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 16 }}>{v.icon}</span>
                    <span style={{ fontSize: 13.5, color: 'var(--pb-text)' }}>{v.label}</span>
                    {v.required && (
                      <span style={{
                        fontSize: 10, padding: '1px 6px', borderRadius: 10,
                        background: 'var(--pb-blue-bg)', color: 'var(--pb-blue)',
                        fontFamily: "'Syne', sans-serif", fontWeight: 600,
                      }}>Required</span>
                    )}
                    {v.comingSoon && (
                      <span style={{
                        fontSize: 10, padding: '1px 6px', borderRadius: 10,
                        background: 'var(--pb-bg3)', color: 'var(--pb-text3)',
                        fontFamily: "'Syne', sans-serif",
                      }}>Coming soon</span>
                    )}
                  </div>
                  {/* Toggle */}
                  <button
                    onClick={() => !v.required && !v.comingSoon && toggleView(v.key)}
                    disabled={v.required || !!v.comingSoon}
                    style={{
                      width: 36, height: 20, borderRadius: 10, border: 'none',
                      background: (v.required || defaultViews.includes(v.key)) ? 'var(--pb-accent-alt)' : 'var(--pb-border2)',
                      cursor: v.required || v.comingSoon ? 'not-allowed' : 'pointer',
                      position: 'relative', transition: 'background .2s', flexShrink: 0,
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: 2, width: 16, height: 16, borderRadius: '50%',
                      background: '#fff', transition: 'left .2s',
                      left: (v.required || defaultViews.includes(v.key)) ? 18 : 2,
                    }} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Progress icons */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', borderRadius: 'var(--pb-r)', border: '1px solid var(--pb-border)',
            background: 'var(--pb-bg)',
          }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--pb-text)', marginBottom: 3 }}>
                Progress icons
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--pb-text3)' }}>
                Show completion % ring on feature rows
              </div>
            </div>
            <button
              onClick={() => setProgressEnabled(p => !p)}
              style={{
                width: 36, height: 20, borderRadius: 10, border: 'none',
                background: progressEnabled ? 'var(--pb-accent-alt)' : 'var(--pb-border2)',
                cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0,
              }}
            >
              <div style={{
                position: 'absolute', top: 2, width: 16, height: 16, borderRadius: '50%',
                background: '#fff', transition: 'left .2s', left: progressEnabled ? 18 : 2,
              }} />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 22px', borderTop: '1px solid var(--pb-border)',
          display: 'flex', justifyContent: 'flex-end', gap: 8, flexShrink: 0,
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 18px', borderRadius: 'var(--pb-r)', border: '1px solid var(--pb-border)',
              background: 'transparent', cursor: 'pointer', fontSize: 13.5,
              fontFamily: "'DM Sans', sans-serif", color: 'var(--pb-text2)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={updateSettings.isPending}
            style={{
              padding: '10px 22px', borderRadius: 'var(--pb-r)', border: 'none',
              background: 'var(--pb-accent)', color: '#fff', cursor: 'pointer',
              fontSize: 13.5, fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 6,
              opacity: updateSettings.isPending ? 0.7 : 1,
            }}
          >
            {updateSettings.isPending && <Loader2 size={14} className="animate-spin" />}
            {saved ? '✓ Saved' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
