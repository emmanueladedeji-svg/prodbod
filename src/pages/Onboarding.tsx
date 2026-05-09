import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useUserProfile, useUpsertUserProfile } from '@/hooks/useUserProfile';
import { useCreateProdbodOrg, useMyOrgs } from '@/hooks/useProdbodOrgs';
import { useAddProduct } from '@/hooks/useProdbodProducts';
import { useApp } from '@/contexts/AppContext';
import { MonthYearPicker } from '@/components/ui/MonthYearPicker';
import { Loader2 } from 'lucide-react';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 13px',
  border: '1px solid var(--pb-border)', borderRadius: 'var(--pb-r)',
  fontFamily: "'DM Sans', sans-serif", fontSize: 13.5,
  color: 'var(--pb-text)', background: 'var(--pb-bg)', outline: 'none',
  transition: 'border-color .15s',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--pb-text2)',
  marginBottom: 5, letterSpacing: '0.02em', textTransform: 'uppercase',
  fontFamily: "'Syne', sans-serif",
};
const optionalTag = <span style={{ fontSize: 11, color: 'var(--pb-text3)', fontWeight: 400, marginLeft: 6, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>;

const ROLES = ['Product Manager', 'Product Designer', 'Software Engineer', 'QA Engineer', 'Data Engineer', 'Product Marketer', 'Other'];
const INDUSTRIES = ['Fintech', 'Healthtech', 'EdTech', 'E-commerce', 'SaaS / B2B', 'Logistics', 'Media', 'Consulting', 'Other'];
const TIMEZONES = ['UTC (GMT+0)', 'West Africa Time (GMT+1)', 'East Africa Time (GMT+3)', 'GMT-5 (EST)', 'GMT-6 (CST)', 'GMT-8 (PST)', 'GMT+5:30 (IST)', 'GMT+8 (SGT)', 'GMT+9 (JST)'];

function avatarColor(s: string) {
  const c = ['#3d6cff', '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626', '#be185d'];
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % c.length;
  return c[h];
}
function initials(f: string, l: string) {
  return ((f[0] || '') + (l[0] || '')).toUpperCase() || '?';
}

interface WizProduct { name: string; desc: string; }

export default function Onboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setCurrentOrgId } = useApp();
  const { data: savedProfile, isLoading: profileLoading } = useUserProfile();
  const { data: myOrgs = [], isLoading: orgsLoading } = useMyOrgs();
  const upsertProfile = useUpsertUserProfile();
  const createOrg = useCreateProdbodOrg();
  const addProduct = useAddProduct();

  const [step, setStep] = useState(0);
  const [stepDone, setStepDone] = useState([false, false, false]);
  const [alert, setAlert] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Step 0 — Profile
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [otherRole, setOtherRole] = useState('');
  const [dept, setDept] = useState('');
  const [tz, setTz] = useState('');

  // Restore saved progress from DB on mount
  useEffect(() => {
    if (profileLoading || orgsLoading || hydrated) return;
    setHydrated(true);
    // If onboarding is marked as completed in the profile, we should not be here.
    // Skip the wizard entirely.
    if (savedProfile?.onboarding_completed) {
      navigate('/', { replace: true });
      return;
    }
    if (!savedProfile?.first_name) return; // nothing saved yet — stay on step 0
    // Pre-fill step 0 fields
    setFirstName(savedProfile.first_name ?? '');
    setLastName(savedProfile.last_name ?? '');
    setJobRole(savedProfile.job_role ?? '');
    setDept(savedProfile.department ?? '');
    setTz(savedProfile.timezone ?? '');
    // Step 0 was already completed — jump to step 1
    setStep(1);
    setStepDone([true, false, false]);
  }, [savedProfile, profileLoading, orgsLoading, myOrgs.length, hydrated, navigate]);

  // Step 1 — Org
  const [orgName, setOrgName] = useState('');
  const [orgDesc, setOrgDesc] = useState('');
  const [industry, setIndustry] = useState('');
  const [orgDate, setOrgDate] = useState('');

  // Step 2 — Products
  const [products, setProducts] = useState<WizProduct[]>([]);
  const [npName, setNpName] = useState('');
  const [npDesc, setNpDesc] = useState('');
  const [createdOrgId, setCreatedOrgId] = useState<string | null>(null);

  const markDone = (s: number) => setStepDone(prev => { const n = [...prev]; n[s] = true; return n; });

  const handleStep0 = async () => {
    setAlert('');
    if (!firstName.trim() || !lastName.trim()) { setAlert('Please enter your first and last name.'); return; }
    if (!jobRole) { setAlert('Please select your job role.'); return; }
    setIsLoading(true);
    try {
      const finalRole = jobRole === 'Other' ? (otherRole.trim() || 'Other') : jobRole;
      await upsertProfile.mutateAsync({ first_name: firstName.trim(), last_name: lastName.trim(), job_role: finalRole, department: dept.trim() || undefined, timezone: tz || undefined });
      markDone(0);
      setStep(1);
    } catch (e: any) { setAlert(e.message || 'Failed to save profile.'); }
    finally { setIsLoading(false); }
  };

  const handleStep1 = () => {
    setAlert('');
    if (!orgName.trim()) { setAlert('Please enter your organisation name.'); return; }
    markDone(1);
    setStep(2);
  };

  const addWizProduct = () => {
    if (!npName.trim()) return;
    setProducts(prev => [...prev, { name: npName.trim(), desc: npDesc.trim() }]);
    setNpName(''); setNpDesc('');
  };

  const removeProduct = (i: number) => setProducts(prev => prev.filter((_, idx) => idx !== i));

  const handleFinish = async () => {
    setAlert('');
    setIsLoading(true);
    try {
      const org = await createOrg.mutateAsync({ name: orgName.trim(), description: orgDesc.trim() || undefined, industry: industry || undefined, established_date: orgDate || undefined });
      const oid = org.id;
      setCreatedOrgId(oid);

      for (const p of products) {
        await addProduct.mutateAsync({ orgId: oid, name: p.name, description: p.desc || undefined });
      }

      await upsertProfile.mutateAsync({ onboarding_completed: true });

      // Send welcome email (fire and forget)
      const { data: { user } } = await supabase.auth.getUser();
      supabase.functions.invoke('send-welcome-email', {
        body: { 
          email: savedProfile?.email || user?.email, 
          user_name: firstName || savedProfile?.first_name 
        }
      }).catch(e => console.error('Welcome email error:', e));

      // Optimistically update the query cache BEFORE navigating so that
      // OnboardingGuard immediately sees the correct state and does not
      // redirect back to /onboarding due to stale data.
      queryClient.setQueryData(['user-profile'], (old: any) =>
        old ? { ...old, onboarding_completed: true } : old
      );
      queryClient.setQueryData(['my-orgs'], (old: any) => {
        if (!old) return [org];
        const alreadyExists = old.some((o: any) => o.id === org.id);
        return alreadyExists ? old : [...old, org];
      });

      setCurrentOrgId(oid);
      navigate('/');
    } catch (e: any) { setAlert(e.message || 'Failed to create workspace.'); }
    finally { setIsLoading(false); }
  };

  const av = initials(firstName, lastName);
  const avColor = (firstName || lastName) ? avatarColor(firstName + lastName) : 'var(--pb-accent-alt)';

  // Show a neutral loading screen while we check what step to resume from
  if (profileLoading || !hydrated) {
    return (
      <div className="prodbod" style={{ display: 'flex', minHeight: '100vh', background: 'var(--pb-bg)', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 style={{ width: 28, height: 28, color: 'var(--pb-accent)', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div className="prodbod" style={{ display: 'flex', minHeight: '100vh', background: 'var(--pb-bg)', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Sidebar */}
      <div style={{ width: 280, background: 'var(--pb-black)', padding: '32px 24px', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 40, color: '#fff' }}>
          Prod<span style={{ color: 'var(--pb-gold)' }}>Bod</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[
            { label: 'Your profile', n: 1 },
            { label: 'Your organisation', n: 2 },
            { label: 'Add products', n: 3 },
          ].map((s, i) => {
            const isActive = step === i;
            const isDone = stepDone[i];
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 'var(--pb-r)', fontSize: 13, color: isDone ? 'rgba(255,255,255,0.75)' : isActive ? '#fff' : 'rgba(255,255,255,0.4)', background: 'transparent' }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', border: `1.5px solid ${isDone ? '#fff' : isActive ? 'var(--pb-gold)' : 'rgba(255,255,255,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0, color: isDone ? 'var(--pb-black)' : isActive ? 'var(--pb-black)' : 'rgba(255,255,255,0.4)', background: isDone ? '#fff' : isActive ? 'var(--pb-gold)' : 'transparent' }}>
                  {isDone ? '✓' : s.n}
                </div>
                <span>{s.label}</span>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 'auto', paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            onClick={async () => {
              try {
                // Clear everything to break the loop
                await supabase.auth.signOut();
                localStorage.clear();
                sessionStorage.clear();
                queryClient.clear();
                window.location.href = '/auth';
              } catch (err) {
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = '/auth';
              }
            }}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 'var(--pb-r)',
              fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.6)',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              cursor: 'pointer', transition: 'all .15s', textAlign: 'left'
            }}
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '60px 40px', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 540 }}>

          {/* Step 0 — Profile */}
          {step === 0 && (
            <>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>Tell us about yourself</div>
              <div style={{ fontSize: 13.5, color: 'var(--pb-text2)', marginBottom: 32, lineHeight: 1.6 }}>This is how your team will know you across ProdBod.</div>

              {/* Avatar preview */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: avColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 700, flexShrink: 0 }}>
                  {av}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>Profile avatar</div>
                  <div style={{ fontSize: 12, color: 'var(--pb-text3)', marginTop: 2 }}>Generated from your initials</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>First name</label>
                  <input style={inputStyle} placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Last name</label>
                  <input style={inputStyle} placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Job role</label>
                <select value={jobRole} onChange={(e) => setJobRole(e.target.value)} style={{ ...inputStyle, appearance: 'none', cursor: 'pointer', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' fill='none' stroke='%239a9a94' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}>
                  <option value="">Select your role</option>
                  {ROLES.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>

              {jobRole === 'Other' && (
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Specify your role</label>
                  <input style={inputStyle} placeholder="e.g. Growth Lead" value={otherRole} onChange={(e) => setOtherRole(e.target.value)} />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Department {optionalTag}</label>
                  <input style={inputStyle} placeholder="e.g. Product" value={dept} onChange={(e) => setDept(e.target.value)} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Timezone {optionalTag}</label>
                  <select value={tz} onChange={(e) => setTz(e.target.value)} style={{ ...inputStyle, appearance: 'none', cursor: 'pointer', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' fill='none' stroke='%239a9a94' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}>
                    <option value="">Select timezone</option>
                    {TIMEZONES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {alert && <div style={{ padding: '11px 14px', borderRadius: 'var(--pb-r)', fontSize: 13, marginBottom: 12, background: 'var(--pb-red-bg)', border: '1px solid var(--pb-red-border)', color: 'var(--pb-red)' }}>{alert}</div>}

              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--pb-border)' }}>
                <button onClick={handleStep0} disabled={isLoading} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 'var(--pb-r)', fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, fontWeight: 500, cursor: 'pointer', border: 'none', background: 'var(--pb-gold)', color: 'var(--pb-text)', transition: 'all .15s' }}>
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Continue →
                </button>
              </div>
            </>
          )}

          {/* Step 1 — Org */}
          {step === 1 && (
            <>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>Create your organisation</div>
              <div style={{ fontSize: 13.5, color: 'var(--pb-text2)', marginBottom: 32, lineHeight: 1.6 }}>You can create multiple organisations later. This sets up your first workspace.</div>

              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Organisation name</label>
                <input style={inputStyle} placeholder="e.g. Opex Consult" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>What does your organisation do? {optionalTag}</label>
                <textarea value={orgDesc} onChange={(e) => setOrgDesc(e.target.value)} placeholder="A short description of your organisation's focus and purpose..." style={{ ...inputStyle, resize: 'vertical', minHeight: 80, lineHeight: 1.5 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Industry {optionalTag}</label>
                  <select value={industry} onChange={(e) => setIndustry(e.target.value)} style={{ ...inputStyle, appearance: 'none', cursor: 'pointer', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' fill='none' stroke='%239a9a94' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}>
                    <option value="">Select industry</option>
                    {INDUSTRIES.map((ind) => <option key={ind}>{ind}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Date established {optionalTag}</label>
                  <MonthYearPicker value={orgDate} onChange={setOrgDate} />
                </div>
              </div>

              {alert && <div style={{ padding: '11px 14px', borderRadius: 'var(--pb-r)', fontSize: 13, marginBottom: 12, background: 'var(--pb-red-bg)', border: '1px solid var(--pb-red-border)', color: 'var(--pb-red)' }}>{alert}</div>}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--pb-border)' }}>
                <button onClick={() => { setStepDone(prev => { const n=[...prev]; n[0]=false; return n; }); setStep(0); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 'var(--pb-r)', fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, fontWeight: 500, cursor: 'pointer', border: '1px solid var(--pb-border)', background: 'transparent', color: 'var(--pb-text2)', transition: 'all .15s' }}>
                  ← Back
                </button>
                <button onClick={handleStep1} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 'var(--pb-r)', fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, fontWeight: 500, cursor: 'pointer', border: '1px solid var(--pb-accent)', background: 'var(--pb-accent)', color: '#fff', transition: 'all .15s' }}>
                  Continue →
                </button>
              </div>
            </>
          )}

          {/* Step 2 — Products */}
          {step === 2 && (
            <>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>Add your products</div>
              <div style={{ fontSize: 13.5, color: 'var(--pb-text2)', marginBottom: 32, lineHeight: 1.6 }}>List the products your organisation is building. You can skip this and add them later.</div>

              {/* Products list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                {products.map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: 'var(--pb-bg2)', border: '1px solid var(--pb-border)', borderRadius: 'var(--pb-r)' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 500 }}>{p.name}</div>
                      {p.desc && <div style={{ fontSize: 12, color: 'var(--pb-text2)', marginTop: 1 }}>{p.desc}</div>}
                    </div>
                    <button onClick={() => removeProduct(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--pb-text3)', fontSize: 18, padding: '2px 5px', borderRadius: 4, lineHeight: 1 }}>×</button>
                  </div>
                ))}
              </div>

              {/* Add product form */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 14, background: 'var(--pb-bg3)', border: '1px solid var(--pb-border)', borderRadius: 'var(--pb-r)', marginTop: 4 }}>
                <div style={{ margin: 0 }}>
                  <label style={labelStyle}>Product name</label>
                  <input style={inputStyle} placeholder="e.g. Mobile Banking App" value={npName} onChange={(e) => setNpName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addWizProduct())} />
                </div>
                <div style={{ margin: 0 }}>
                  <label style={labelStyle}>Description {optionalTag}</label>
                  <input style={inputStyle} placeholder="What does this product do?" value={npDesc} onChange={(e) => setNpDesc(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addWizProduct())} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={addWizProduct} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 12px', borderRadius: 'var(--pb-r)', fontFamily: "'DM Sans', sans-serif", fontSize: 12.5, fontWeight: 500, cursor: 'pointer', border: '1px solid var(--pb-border)', background: 'transparent', color: 'var(--pb-text2)', transition: 'all .15s' }}>
                    + Add product
                  </button>
                </div>
              </div>

              {alert && <div style={{ padding: '11px 14px', borderRadius: 'var(--pb-r)', fontSize: 13, marginTop: 12, background: 'var(--pb-red-bg)', border: '1px solid var(--pb-red-border)', color: 'var(--pb-red)' }}>{alert}</div>}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--pb-border)' }}>
                <button onClick={() => { setStepDone(prev => { const n=[...prev]; n[1]=false; return n; }); setStep(1); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 'var(--pb-r)', fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, fontWeight: 500, cursor: 'pointer', border: '1px solid var(--pb-border)', background: 'transparent', color: 'var(--pb-text2)', transition: 'all .15s' }}>
                  ← Back
                </button>
                <button onClick={handleFinish} disabled={isLoading} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 'var(--pb-r)', fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, fontWeight: 500, cursor: 'pointer', border: 'none', background: 'var(--pb-gold)', color: 'var(--pb-text)', transition: 'all .15s' }}>
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Launch workspace →
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
