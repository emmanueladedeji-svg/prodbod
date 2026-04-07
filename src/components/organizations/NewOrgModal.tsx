import { useState } from 'react';
import { useCreateProdbodOrg } from '@/hooks/useProdbodOrgs';
import { MonthYearPicker } from '@/components/ui/MonthYearPicker';
import { Loader2 } from 'lucide-react';

const INDUSTRIES = ['Fintech', 'Healthtech', 'EdTech', 'E-commerce', 'SaaS / B2B', 'Consulting', 'Other'];

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 13px', border: '1px solid var(--pb-border)',
  borderRadius: 'var(--pb-r)', fontFamily: "'DM Sans', sans-serif",
  fontSize: 13.5, color: 'var(--pb-text)', background: 'var(--pb-bg)', outline: 'none',
  transition: 'border-color .15s',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--pb-text2)',
  marginBottom: 5, letterSpacing: '0.02em', textTransform: 'uppercase',
  fontFamily: "'Syne', sans-serif",
};
const optionalTag = <span style={{ fontSize: 11, color: 'var(--pb-text3)', fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: 6 }}>(optional)</span>;

interface NewOrgModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (orgId: string) => void;
}

export function NewOrgModal({ open, onClose, onCreated }: NewOrgModalProps) {
  const createOrg = useCreateProdbodOrg();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [industry, setIndustry] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');

  if (!open) return null;

  const reset = () => { setName(''); setDesc(''); setIndustry(''); setDate(''); setError(''); };
  const handleClose = () => { reset(); onClose(); };

  const handleCreate = async () => {
    setError('');
    if (!name.trim()) { setError('Please enter an organisation name.'); return; }
    try {
      const org = await createOrg.mutateAsync({
        name: name.trim(),
        description: desc.trim() || undefined,
        industry: industry || undefined,
        established_date: date || undefined,
      });
      reset();
      onClose();
      onCreated?.(org.id);
    } catch (e: any) {
      setError(e.message || 'Failed to create organisation.');
    }
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, opacity: 1 }}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div
        className="prodbod"
        style={{ background: 'var(--pb-bg2)', border: '1px solid var(--pb-border2)', borderRadius: 'var(--pb-rxl)', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', fontFamily: "'DM Sans', sans-serif" }}
      >
        {/* Header */}
        <div style={{ padding: '20px 22px 16px', borderBottom: '1px solid var(--pb-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700 }}>New organisation</div>
          <button onClick={handleClose} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--pb-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--pb-text3)', fontSize: 16, transition: 'all .15s' }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <div style={{ padding: '11px 14px', borderRadius: 'var(--pb-r)', fontSize: 13, background: 'var(--pb-red-bg)', border: '1px solid var(--pb-red-border)', color: 'var(--pb-red)' }}>
              {error}
            </div>
          )}

          <div>
            <label style={labelStyle}>Organisation name</label>
            <input style={inputStyle} placeholder="e.g. Acme Corp" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>

          <div>
            <label style={labelStyle}>Description {optionalTag}</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="What does this organisation do?"
              style={{ ...inputStyle, resize: 'vertical', minHeight: 60, lineHeight: 1.5 }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>Industry {optionalTag}</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                style={{ ...inputStyle, appearance: 'none', cursor: 'pointer', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' fill='none' stroke='%239a9a94' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
              >
                <option value="">Select…</option>
                {INDUSTRIES.map((ind) => <option key={ind}>{ind}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Date established {optionalTag}</label>
              <MonthYearPicker value={date} onChange={setDate} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--pb-border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            onClick={handleClose}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '10px 18px', borderRadius: 'var(--pb-r)', fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, fontWeight: 500, cursor: 'pointer', border: '1px solid var(--pb-border)', background: 'transparent', color: 'var(--pb-text2)', transition: 'all .15s' }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={createOrg.isPending}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px 18px', borderRadius: 'var(--pb-r)', fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, fontWeight: 500, cursor: 'pointer', border: '1px solid var(--pb-accent)', background: 'var(--pb-accent)', color: '#fff', transition: 'all .15s' }}
          >
            {createOrg.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Create organisation
          </button>
        </div>
      </div>
    </div>
  );
}
