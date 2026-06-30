import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const INACTIVITY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const LAST_ACTIVE_KEY = 'pb-last-active';

export function useInactivityTimeout(enabled: boolean) {
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const signOut = async () => {
      await supabase.auth.signOut();
      localStorage.removeItem(LAST_ACTIVE_KEY);
      navigate('/auth', { replace: true });
    };

    const resetTimer = () => {
      localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(signOut, INACTIVITY_MS);
    };

    // Check if already expired from a previous session
    const lastActive = localStorage.getItem(LAST_ACTIVE_KEY);
    if (lastActive) {
      const elapsed = Date.now() - parseInt(lastActive, 10);
      if (elapsed >= INACTIVITY_MS) {
        signOut();
        return;
      }
      // Resume the countdown from where it left off
      timerRef.current = setTimeout(signOut, INACTIVITY_MS - elapsed);
    } else {
      resetTimer();
    }

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [enabled, navigate]);
}
