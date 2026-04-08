import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useGetInviteByToken } from '@/hooks/useInvites';
import { useAcceptInvite } from '@/hooks/useProdbodMembers';
import { Loader2 } from 'lucide-react';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 13px',
  border: '1px solid var(--pb-border)', borderRadius: 'var(--pb-r)',
  fontFamily: "'DM Sans', sans-serif", fontSize: 13.5,
  color: 'var(--pb-text)', background: 'var(--pb-bg)', outline: 'none',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--pb-text2)',
  marginBottom: 5, letterSpacing: '0.02em', textTransform: 'uppercase',
  fontFamily: "'Syne', sans-serif",
};

const ROLES = ['Product Manager', 'Product Designer', 'Software Engineer', 'QA Engineer', 'Data Engineer', 'Product Marketer', 'Other'];

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('invite');

  const { data: invite, isLoading: inviteLoading } = useGetInviteByToken(token);
  const acceptInvite = useAcceptInvite();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [otherRole, setOtherRole] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch org name for the subtitle
  const [orgName, setOrgName] = useState('');
  useEffect(() => {
    if (invite?.org_id) {
      supabase.from('organizations').select('name').eq('id', invite.org_id).maybeSingle()
        .then(({ data }) => setOrgName(data?.name || ''));
    }
  }, [invite?.org_id]);

  if (!token) {
    return (
      <div className="prodbod min-h-screen flex items-center justify-center" style={{ background: 'var(--pb-bg)', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ color: 'var(--pb-red)', fontSize: 14 }}>Invalid invite link.</div>
      </div>
    );
  }

  if (inviteLoading) {
    return (
      <div className="prodbod min-h-screen flex items-center justify-center" style={{ background: 'var(--pb-bg)' }}>
        <Loader2 className="h-7 w-7 animate-spin" style={{ color: 'var(--pb-gold)' }} />
      </div>
    );
  }

  if (!invite || invite.accepted) {
    return (
      <div className="prodbod min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--pb-bg)', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ maxWidth: 420, width: '100%', background: 'var(--pb-bg2)', border: '1px solid var(--pb-border)', borderRadius: 'var(--pb-rxl)', padding: '36px 32px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 28 }}>
            Prod<span style={{ color: 'var(--pb-gold)' }}>Bod</span>
          </div>
          <div style={{ padding: '11px 14px', borderRadius: 'var(--pb-r)', fontSize: 13, background: 'var(--pb-red-bg)', border: '1px solid var(--pb-red-border)', color: 'var(--pb-red)' }}>
            This invite link is invalid or has already been used.
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!firstName.trim() || !lastName.trim()) { setError('Please enter your first and last name.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (!jobRole) { setError('Please select your job role.'); return; }
    const finalRole = jobRole === 'Other' ? (otherRole.trim() || 'Other') : jobRole;

    setIsSubmitting(true);
    try {
      // Sign up or sign in
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: invite.email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (signUpError) throw signUpError;

      const userId = signUpData.user?.id;
      if (!userId) throw new Error('Could not create account.');

      await acceptInvite.mutateAsync({
        token: token!,
        userId,
        profileData: { first_name: firstName.trim(), last_name: lastName.trim(), job_role: finalRole },
      });

      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="prodbod min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--pb-bg)', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ maxWidth: 420, width: '100%', background: 'var(--pb-bg2)', border: '1px solid var(--pb-border)', borderRadius: 'var(--pb-rxl)', padding: '36px 32px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
        {/* Logo */}
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 28 }}>
          Prod<span style={{ color: 'var(--pb-gold)' }}>Bod</span>
        </div>

        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6, color: 'var(--pb-text)' }}>
          You're invited!
        </div>
        <div style={{ fontSize: 13, color: 'var(--pb-text2)', marginBottom: 24, lineHeight: 1.5 }}>
          Set up your account to join {orgName ? <strong>{orgName}</strong> : 'the workspace'}.
        </div>

        {error && (
          <div style={{ padding: '11px 14px', borderRadius: 'var(--pb-r)', fontSize: 13, marginBottom: 12, background: 'var(--pb-red-bg)', border: '1px solid var(--pb-red-border)', color: 'var(--pb-red)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>First name</label>
              <input style={inputStyle} placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Last name</label>
              <input style={inputStyle} placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={invite.email}
              readOnly
              style={{ ...inputStyle, background: 'var(--pb-bg3)', color: 'var(--pb-text2)' }}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Create password</label>
            <input type="password" style={inputStyle} placeholder="Min. 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Job role</label>
            <select
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
              style={{ ...inputStyle, appearance: 'none', cursor: 'pointer', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' fill='none' stroke='%239a9a94' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
              required
            >
              <option value="">Select your role</option>
              {ROLES.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>

          {jobRole === 'Other' && (
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Specify role</label>
              <input style={inputStyle} placeholder="Your role" value={otherRole} onChange={(e) => setOtherRole(e.target.value)} />
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              padding: '10px 18px', borderRadius: 'var(--pb-r)',
              fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, fontWeight: 500,
              cursor: 'pointer', border: 'none',
              background: 'var(--pb-gold)', color: 'var(--pb-text)',
              width: '100%', transition: 'all .15s', marginTop: 4,
            }}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Join workspace
          </button>
        </form>
      </div>
    </div>
  );
}
