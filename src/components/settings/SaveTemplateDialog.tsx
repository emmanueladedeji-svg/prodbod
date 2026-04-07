import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useSaveStatusTemplate } from '@/hooks/useProductStatuses';

interface SaveTemplateDialogProps {
  orgId: string;
  statuses: any[];
  onClose: () => void;
  onSaved: (name: string) => void;
}

export function SaveTemplateDialog({ orgId, statuses, onClose, onSaved }: SaveTemplateDialogProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const save = useSaveStatusTemplate();

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) { setError('Template name is required.'); return; }
    try {
      await save.mutateAsync({ orgId, name: trimmed, statuses });
      onSaved(trimmed);
      onClose();
    } catch (e: any) {
      setError(e.message || 'Save failed.');
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 300,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'var(--pb-bg2)', border: '1px solid var(--pb-border2)',
        borderRadius: 'var(--pb-rxl)', width: '100%', maxWidth: 380,
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)', fontFamily: "'DM Sans', sans-serif",
        overflow: 'hidden',
      }}>
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--pb-border)' }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700 }}>
            Save as template
          </div>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {error && (
            <div style={{
              padding: '8px 12px', borderRadius: 6, fontSize: 12.5,
              background: 'var(--pb-red-bg)', border: '1px solid var(--pb-red-border)', color: 'var(--pb-red)',
            }}>
              {error}
            </div>
          )}
          <div>
            <label style={{
              display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--pb-text2)',
              marginBottom: 5, letterSpacing: '0.05em', textTransform: 'uppercase',
              fontFamily: "'Syne', sans-serif",
            }}>Template name</label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onClose(); }}
              placeholder="e.g. Engineering, Content Workflow"
              style={{
                width: '100%', padding: '9px 12px', border: '1px solid var(--pb-border)',
                borderRadius: 'var(--pb-r)', fontFamily: "'DM Sans', sans-serif",
                fontSize: 13.5, color: 'var(--pb-text)', background: 'var(--pb-bg)',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--pb-border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px', borderRadius: 'var(--pb-r)', border: '1px solid var(--pb-border)',
              background: 'transparent', cursor: 'pointer', fontSize: 13.5,
              fontFamily: "'DM Sans', sans-serif", color: 'var(--pb-text2)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={save.isPending}
            style={{
              padding: '8px 16px', borderRadius: 'var(--pb-r)', border: 'none',
              background: 'var(--pb-accent)', color: '#fff', cursor: 'pointer',
              fontSize: 13.5, fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {save.isPending && <Loader2 size={13} className="animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
