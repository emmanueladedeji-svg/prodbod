import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useGetInviteByToken } from '@/hooks/useInvites';
import { useAcceptInvite } from '@/hooks/useProdbodMembers';
import { useApp } from '@/contexts/AppContext';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';

const PENDING_INVITE_KEY = 'pb-pending-invite-token';

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

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

function ErrorCard({ message, action }: { message: string | React.ReactNode, action?: React.ReactNode }) {
  return (
    <div className="prodbod min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--pb-bg)', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ maxWidth: 420, width: '100%', background: 'var(--pb-bg2)', border: '1px solid var(--pb-border)', borderRadius: 'var(--pb-rxl)', padding: '36px 32px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 28 }}>
          Prod<span style={{ color: 'var(--pb-gold)' }}>Bod</span>
        </div>
        <div style={{ padding: '11px 14px', borderRadius: 'var(--pb-r)', fontSize: 13, background: 'var(--pb-red-bg)', border: '1px solid var(--pb-red-border)', color: 'var(--pb-red)', marginBottom: action ? 20 : 0 }}>
          {message}
        </div>
        {action}
      </div>
    </div>
  );
}

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const rawToken = searchParams.get('invite');
  const [token, setToken] = useState<string | null>(rawToken);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const queryClient = useQueryClient();
  const { setCurrentOrgId } = useApp();
  const { data: inviteResult, isLoading: inviteLoading } = useGetInviteByToken(token);
  const acceptInvite = useAcceptInvite();

  const [sessionChecked, setSessionChecked] = useState(false);
  const [existingSession, setExistingSession] = useState<Session | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [jobRole, setJobRole] = useState('');
  const [otherRole, setOtherRole] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch org name for the subtitle
  const [orgName, setOrgName] = useState('');

  // Check for existing session on mount (magic-link arrivals already have a session)
  // Also recovers invite token from sessionStorage on Google OAuth return
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && !rawToken) {
        // Google OAuth return — recover token from sessionStorage
        const stored = sessionStorage.getItem(PENDING_INVITE_KEY);
        if (stored) {
          sessionStorage.removeItem(PENDING_INVITE_KEY);
          setToken(stored);
        }
      }
      setExistingSession(session);
      setSessionChecked(true);
    });

    // Also listen for auth state changes (magic link may resolve after mount)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && !rawToken) {
        const stored = sessionStorage.getItem(PENDING_INVITE_KEY);
        if (stored) {
          sessionStorage.removeItem(PENDING_INVITE_KEY);
          setToken(stored);
        }
      }
      if (session) setExistingSession(session);
      setSessionChecked(true);
    });

    return () => subscription.unsubscribe();
  }, [rawToken]);

  useEffect(() => {
    const orgId = inviteResult?.invite?.org_id;
    if (orgId) {
      supabase.from('organizations').select('name').eq('id', orgId).maybeSingle()
        .then(({ data }) => setOrgName(data?.name || ''));
    }
  }, [inviteResult?.invite?.org_id]);

  // AUTO-REDIRECT if already accepted and signed in as that user
  useEffect(() => {
    if (inviteResult?.status === 'already_accepted' && existingSession && inviteResult.invite?.email === existingSession.user.email) {
      // User is already a member or at least already used the link.
      // We should check if they are actually in organization_members.
      supabase.from('organization_members')
        .select('organization_id')
        .eq('organization_id', inviteResult.invite.org_id)
        .eq('member_user_id', existingSession.user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setCurrentOrgId(data.organization_id);
            navigate('/', { replace: true });
          }
        });
    }
  }, [inviteResult, existingSession, navigate, setCurrentOrgId]);

  const isReady = sessionChecked && !inviteLoading;

  // --- Loading ---
  if (!isReady) {
    return (
      <div className="prodbod min-h-screen flex items-center justify-center" style={{ background: 'var(--pb-bg)' }}>
        <Loader2 className="h-7 w-7 animate-spin" style={{ color: 'var(--pb-gold)' }} />
      </div>
    );
  }

  const loginAction = (
    <button
      onClick={async () => {
        await supabase.auth.signOut();
        queryClient.clear();
        window.location.href = '/auth';
      }}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        padding: '10px 18px', borderRadius: 'var(--pb-r)',
        fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, fontWeight: 500,
        cursor: 'pointer', border: 'none',
        background: 'var(--pb-gold)', color: 'var(--pb-text)',
        width: '100%', transition: 'all .15s',
      }}
    >
      Go to Sign In
    </button>
  );

  // --- Error states ---
  if (!token) return <ErrorCard message="Invalid invite link." action={loginAction} />;
  if (inviteResult?.status === 'not_found') return <ErrorCard message="This invite link is invalid." action={loginAction} />;
  if (inviteResult?.status === 'expired') return <ErrorCard message="This invite link has expired. Ask your workspace admin to resend your invitation." action={loginAction} />;
  
  // If already accepted and NOT redirected by the auto-redirect above (e.g. wrong user signed in or not signed in)
  if (inviteResult?.status === 'already_accepted') {
    return <ErrorCard message="This invite has already been used. Try signing in instead." action={loginAction} />;
  }

  const invite = inviteResult?.invite;
  if (!invite) return <ErrorCard message="Something went wrong loading this invite." action={loginAction} />;

  // Wrong account signed in via magic link
  if (existingSession && existingSession.user.email !== invite.email) {
    return (
      <ErrorCard 
        message={
          <div>
            <p style={{ marginBottom: 16 }}>
              This invite was sent to <strong style={{ color: 'var(--pb-text)' }}>{invite.email}</strong>. 
              You are currently signed in as <strong style={{ color: 'var(--pb-text)' }}>{existingSession.user.email}</strong>.
            </p>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.reload();
              }}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                padding: '8px 16px', borderRadius: 'var(--pb-r)',
                fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
                cursor: 'pointer', border: 'none',
                background: 'var(--pb-gold)', color: 'var(--pb-text)',
                width: '100%', transition: 'all .15s',
              }}
            >
              Sign out to use this invite
            </button>
          </div>
        } 
      />
    );
  }

  const hasMagicLinkSession = !!existingSession;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!firstName.trim() || !lastName.trim()) { setError('Please enter your first and last name.'); return; }
    if (!hasMagicLinkSession && password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (!jobRole) { setError('Please select your job role.'); return; }

    const finalRole = jobRole === 'Other' ? (otherRole.trim() || 'Other') : jobRole;
    setIsSubmitting(true);

    try {
      let userId: string;

      if (hasMagicLinkSession) {
        // User already authenticated (magic link or previous attempt)
        // Ensure they have the password they just typed
        const { error: updateErr } = await supabase.auth.updateUser({ password });
        if (updateErr) throw updateErr;
        userId = existingSession!.user.id;
      } else {
        // Try sign in first (handles existing accounts sharing links)
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: invite.email,
          password,
        });

        if (signInData?.user) {
          userId = signInData.user.id;
        } else if (signInError?.message?.toLowerCase().includes('invalid login credentials') ||
                   signInError?.message?.toLowerCase().includes('invalid credentials')) {
          // New user — create account
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: invite.email,
            password,
            options: { emailRedirectTo: window.location.origin },
          });
          if (signUpError) throw signUpError;
          if (!signUpData.user) throw new Error('Could not create account.');
          userId = signUpData.user.id;
        } else if (signInError) {
          throw signInError;
        } else {
          throw new Error('Authentication failed. Please try again.');
        }
      }

      const result = await acceptInvite.mutateAsync({
        token: token!,
        userId,
        profileData: { first_name: firstName.trim(), last_name: lastName.trim(), job_role: finalRole },
      });

      // Send welcome email (fire and forget)
      supabase.functions.invoke('send-welcome-email', {
        body: { 
          email: invite.email, 
          user_name: firstName.trim() 
        }
      }).catch(e => console.error('Welcome email error:', e));

      // Optimistic update to prevent OnboardingGuard from redirecting to /onboarding
      queryClient.setQueryData(['user-profile'], (old: any) => ({
        ...old,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        onboarding_completed: true
      }));

      // We don't have the full org object here, but we can trigger a refetch 
      // and wait for it to be CERTAIN the cache is populated before navigating.
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['user-profile'] }),
        queryClient.refetchQueries({ queryKey: ['my-orgs'] })
      ]);

      setCurrentOrgId(result.orgId);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!token) { setError('No invite token found. Please use the original invite link.'); return; }
    sessionStorage.setItem(PENDING_INVITE_KEY, token);
    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/invite` },
      });
      if (error) {
        sessionStorage.removeItem(PENDING_INVITE_KEY);
        throw error;
      }
      // Browser navigates away — nothing runs after this
    } catch (err: any) {
      setError(err.message || 'Google sign in failed.');
      setIsGoogleLoading(false);
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
          {hasMagicLinkSession ? 'Set up your profile' : "You're invited!"}
        </div>
        <div style={{ fontSize: 13, color: 'var(--pb-text2)', marginBottom: 24, lineHeight: 1.5 }}>
          Set up your account to join {orgName ? <strong>{orgName}</strong> : 'the workspace'}.
        </div>

        {hasMagicLinkSession && (
          <div style={{ fontSize: 12, color: 'var(--pb-text3)', marginBottom: 20, padding: '8px 12px', background: 'var(--pb-bg3)', borderRadius: 'var(--pb-r)', border: '1px solid var(--pb-border)' }}>
            Joining as <strong style={{ color: 'var(--pb-text)' }}>{invite.email}</strong>
          </div>
        )}

        {error && (
          <div style={{ padding: '11px 14px', borderRadius: 'var(--pb-r)', fontSize: 13, marginBottom: 12, background: 'var(--pb-red-bg)', border: '1px solid var(--pb-red-border)', color: 'var(--pb-red)' }}>
            {error}
          </div>
        )}

        {!hasMagicLinkSession && (
          <>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isSubmitting}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                padding: '10px 18px', borderRadius: 'var(--pb-r)',
                fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, fontWeight: 500,
                cursor: 'pointer', border: '1px solid var(--pb-border)',
                background: 'var(--pb-bg2)', color: 'var(--pb-text)',
                width: '100%', marginBottom: 16, transition: 'all .15s',
              }}
            >
              {isGoogleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
              Continue with Google
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '0 0 16px', color: 'var(--pb-text3)', fontSize: 12 }}>
              <span style={{ flex: 1, height: 1, background: 'var(--pb-border)' }} />
              or
              <span style={{ flex: 1, height: 1, background: 'var(--pb-border)' }} />
            </div>
          </>
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
            <label style={labelStyle}>{hasMagicLinkSession ? 'Confirm password' : 'Create password'}</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                style={{ ...inputStyle, paddingRight: 40 }}
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--pb-text3)', display: 'flex', alignItems: 'center' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
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
            {hasMagicLinkSession ? 'Complete setup' : 'Join workspace'}
          </button>
        </form>
      </div>
    </div>
  );
}
