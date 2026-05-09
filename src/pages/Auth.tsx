import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Eye, EyeOff } from 'lucide-react';

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export default function Auth() {
  const { session, loading } = useAuth();
  const [view, setView] = useState<'signin' | 'signup'>('signin');

  // Sign in state
  const [siEmail, setSiEmail] = useState('');
  const [siPassword, setSiPassword] = useState('');
  const [showSiPassword, setShowSiPassword] = useState(false);
  const [siError, setSiError] = useState('');

  // Sign up state
  const [suEmail, setSuEmail] = useState('');
  const [suPassword, setSuPassword] = useState('');
  const [showSuPassword, setShowSuPassword] = useState(false);
  const [suError, setSuError] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [signUpState, setSignUpState] = useState<'form' | 'confirm-email'>('form');
  const [confirmedEmail, setConfirmedEmail] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--pb-bg)' }}>
        <Loader2 className="h-7 w-7 animate-spin" style={{ color: 'var(--pb-gold)' }} />
      </div>
    );
  }

  if (session) return <Navigate to="/" replace />;

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

  const mapSignInError = (err: any) => {
    const msg = typeof err === 'string' ? err : (err?.message || JSON.stringify(err));
    if (/invalid login credentials|invalid credentials/i.test(msg)) return 'Incorrect email or password.';
    if (/email not confirmed/i.test(msg)) return 'Please confirm your email first. Check your inbox.';
    return msg === '{}' ? 'Sign in failed. Please try again.' : (msg || 'Sign in failed. Please try again.');
  };

  const mapSignUpError = (err: any) => {
    const msg = typeof err === 'string' ? err : (err?.message || JSON.stringify(err));
    if (/user already registered|already registered/i.test(msg)) return 'An account with this email already exists. Try signing in instead.';
    return msg === '{}' ? 'Could not create account. Please try again.' : (msg || 'Could not create account. Please try again.');
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSiError('');
    if (!siEmail || !isValidEmail(siEmail)) { setSiError('Please enter a valid email address.'); return; }
    if (!siPassword) { setSiError('Please enter your password.'); return; }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: siEmail.trim(), password: siPassword });
      if (error) throw error;
    } catch (err: any) {
      setSiError(mapSignInError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuError('');
    if (!suEmail || !isValidEmail(suEmail)) { setSuError('Please enter a valid email address.'); return; }
    if (suPassword.length < 8) { setSuError('Password must be at least 8 characters.'); return; }
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: suEmail.trim(),
        password: suPassword,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      // If no session returned, email confirmation is required
      if (data.user && !data.session) {
        setConfirmedEmail(suEmail.trim());
        setSignUpState('confirm-email');
        return;
      }
      // If session active immediately (email confirmation disabled), useAuth redirect handles it
    } catch (err: any) {
      setSuError(mapSignUpError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://prodbod.vercel.app',
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setSiError(err.message || 'Google sign in failed.');
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="prodbod min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--pb-bg)', fontFamily: "'DM Sans', sans-serif" }}>
      <div className="w-full" style={{ maxWidth: 420 }}>
        <div
          className="w-full"
          style={{
            background: 'var(--pb-bg2)',
            border: '1px solid var(--pb-border)',
            borderRadius: 'var(--pb-rxl)',
            padding: '36px 32px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          }}
        >
          {/* Logo */}
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 28 }}>
            Prod<span style={{ color: 'var(--pb-gold)' }}>Bod</span>
          </div>

          {view === 'signin' ? (
            <>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6, color: 'var(--pb-text)' }}>Welcome back</div>
              <div style={{ fontSize: 13, color: 'var(--pb-text2)', marginBottom: 24, lineHeight: 1.5 }}>Sign in to your workspace</div>

              {/* Google */}
              <button
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

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0', color: 'var(--pb-text3)', fontSize: 12 }}>
                <span style={{ flex: 1, height: 1, background: 'var(--pb-border)' }} />
                or
                <span style={{ flex: 1, height: 1, background: 'var(--pb-border)' }} />
              </div>

              {siError && (
                <div style={{ padding: '11px 14px', borderRadius: 'var(--pb-r)', fontSize: 13, marginBottom: 12, background: 'var(--pb-red-bg)', border: '1px solid var(--pb-red-border)', color: 'var(--pb-red)' }}>
                  {typeof siError === 'object' && siError !== null ? (siError as any).message || JSON.stringify(siError) : String(siError)}
                </div>
              )}

              <form onSubmit={handleSignIn}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--pb-text2)', marginBottom: 5, letterSpacing: '0.02em', textTransform: 'uppercase', fontFamily: "'Syne', sans-serif" }}>Email</label>
                  <input
                    type="email"
                    placeholder="you@company.com"
                    value={siEmail}
                    onChange={(e) => setSiEmail(e.target.value)}
                    style={{ width: '100%', padding: '10px 13px', border: '1px solid var(--pb-border)', borderRadius: 'var(--pb-r)', fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, color: 'var(--pb-text)', background: 'var(--pb-bg)', outline: 'none' }}
                    required
                  />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--pb-text2)', marginBottom: 5, letterSpacing: '0.02em', textTransform: 'uppercase', fontFamily: "'Syne', sans-serif" }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showSiPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={siPassword}
                      onChange={(e) => setSiPassword(e.target.value)}
                      style={{ width: '100%', padding: '10px 13px', paddingRight: 40, border: '1px solid var(--pb-border)', borderRadius: 'var(--pb-r)', fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, color: 'var(--pb-text)', background: 'var(--pb-bg)', outline: 'none' }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowSiPassword(!showSiPassword)}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--pb-text3)', display: 'flex', alignItems: 'center' }}
                    >
                      {showSiPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    padding: '10px 18px', borderRadius: 'var(--pb-r)',
                    fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, fontWeight: 500,
                    cursor: 'pointer', border: 'none',
                    background: 'var(--pb-gold)', color: 'var(--pb-text)',
                    width: '100%', marginTop: 4, transition: 'all .15s',
                  }}
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Sign in
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--pb-text2)' }}>
                Don't have an account?{' '}
                <span onClick={() => setView('signup')} style={{ color: 'var(--pb-text)', textDecoration: 'underline', fontWeight: 500, cursor: 'pointer' }}>
                  Sign up
                </span>
              </div>
            </>
          ) : signUpState === 'confirm-email' ? (
            <>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6, color: 'var(--pb-text)' }}>Check your inbox</div>
              <div style={{ fontSize: 13, color: 'var(--pb-text2)', marginBottom: 24, lineHeight: 1.5 }}>
                We sent a confirmation link to <strong>{confirmedEmail}</strong>. Click it to activate your account.
              </div>
              <div style={{ padding: '14px 16px', borderRadius: 'var(--pb-r)', background: 'var(--pb-bg3)', border: '1px solid var(--pb-border)', fontSize: 13, color: 'var(--pb-text2)', lineHeight: 1.6, marginBottom: 20 }}>
                <strong>Didn't receive it?</strong> Check your spam folder, or{' '}
                <span
                  onClick={async () => {
                    await supabase.auth.resend({ type: 'signup', email: confirmedEmail });
                  }}
                  style={{ color: 'var(--pb-text)', textDecoration: 'underline', cursor: 'pointer', fontWeight: 500 }}
                >
                  resend the email
                </span>.
              </div>
              <button
                onClick={() => { setSignUpState('form'); setView('signin'); }}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '10px 18px', borderRadius: 'var(--pb-r)', fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, fontWeight: 500, cursor: 'pointer', border: '1px solid var(--pb-border)', background: 'transparent', color: 'var(--pb-text)', width: '100%', transition: 'all .15s' }}
              >
                Back to sign in
              </button>
            </>
          ) : (
            <>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6, color: 'var(--pb-text)' }}>Create your account</div>
              <div style={{ fontSize: 13, color: 'var(--pb-text2)', marginBottom: 24, lineHeight: 1.5 }}>Start managing your product portfolio</div>

              {/* Google */}
              <button
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
                Sign up with Google
              </button>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0', color: 'var(--pb-text3)', fontSize: 12 }}>
                <span style={{ flex: 1, height: 1, background: 'var(--pb-border)' }} />
                or
                <span style={{ flex: 1, height: 1, background: 'var(--pb-border)' }} />
              </div>

              {suError && (
                <div style={{ padding: '11px 14px', borderRadius: 'var(--pb-r)', fontSize: 13, marginBottom: 12, background: 'var(--pb-red-bg)', border: '1px solid var(--pb-red-border)', color: 'var(--pb-red)' }}>
                  {typeof suError === 'object' && suError !== null ? (suError as any).message || JSON.stringify(suError) : String(suError)}
                </div>
              )}

              <form onSubmit={handleSignUp}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 0 }}>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--pb-text2)', marginBottom: 5, letterSpacing: '0.02em', textTransform: 'uppercase', fontFamily: "'Syne', sans-serif" }}>Email</label>
                    <input
                      type="email"
                      placeholder="you@company.com"
                      value={suEmail}
                      onChange={(e) => setSuEmail(e.target.value)}
                      style={{ width: '100%', padding: '10px 13px', border: '1px solid var(--pb-border)', borderRadius: 'var(--pb-r)', fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, color: 'var(--pb-text)', background: 'var(--pb-bg)', outline: 'none' }}
                      required
                    />
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--pb-text2)', marginBottom: 5, letterSpacing: '0.02em', textTransform: 'uppercase', fontFamily: "'Syne', sans-serif" }}>Password</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showSuPassword ? "text" : "password"}
                        placeholder="Min. 8 characters"
                        value={suPassword}
                        onChange={(e) => setSuPassword(e.target.value)}
                        style={{ width: '100%', padding: '10px 13px', paddingRight: 40, border: '1px solid var(--pb-border)', borderRadius: 'var(--pb-r)', fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, color: 'var(--pb-text)', background: 'var(--pb-bg)', outline: 'none' }}
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSuPassword(!showSuPassword)}
                        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--pb-text3)', display: 'flex', alignItems: 'center' }}
                      >
                        {showSuPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    padding: '10px 18px', borderRadius: 'var(--pb-r)',
                    fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, fontWeight: 500,
                    cursor: 'pointer', border: 'none',
                    background: 'var(--pb-gold)', color: 'var(--pb-text)',
                    width: '100%', transition: 'all .15s',
                  }}
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create account
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--pb-text2)' }}>
                Already have an account?{' '}
                <span onClick={() => setView('signin')} style={{ color: 'var(--pb-text)', textDecoration: 'underline', fontWeight: 500, cursor: 'pointer' }}>
                  Sign in
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
