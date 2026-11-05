import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { toast } from '../../store/useUIStore';

export interface AuthBarrierProps {
  children: React.ReactNode;
  mode?: 'protected' | 'guest';
}

/**
 * Step 8: Auth Initialization Barrier
 *
 * Eliminates dashboard render flash & navigation jumping during initial page load:
 * 1. Blocks rendering while authStatus is 'idle' or 'loading'.
 * 2. Renders clean obsidian session verification barrier.
 * 3. Enforces protected tenant routing or guest routing once session resolves.
 */
export const AuthBarrier: React.FC<AuthBarrierProps> = ({
  children,
  mode = 'protected',
}) => {
  const { authStatus, isAuthenticated, user, checkAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (authStatus === 'idle') {
      checkAuth();
    }
  }, [authStatus, checkAuth]);

  useEffect(() => {
    if (authStatus === 'idle' || authStatus === 'loading') {
      return;
    }

    // 1. Protected route barrier: unauthenticated users redirected to /login
    if (mode === 'protected' && !isAuthenticated) {
      const fromPath = location.pathname + location.search;
      const redirectUrl = fromPath !== '/dashboard' && fromPath !== '/' 
        ? `/login?redirect=${encodeURIComponent(fromPath)}` 
        : '/login';
      navigate(redirectUrl, { replace: true });
      return;
    }

    // 2. Onboarding barrier: admin who hasn't finished company setup redirected to /signup
    if (
      mode === 'protected' &&
      isAuthenticated &&
      user?.role === 'admin' &&
      user?.onboardingCompleted === false
    ) {
      if (location.pathname !== '/signup') {
        navigate('/signup', { replace: true });
      }
      return;
    }

    // 3. Guest route barrier: authenticated users redirected away from /login or /signup
    if (mode === 'guest' && isAuthenticated && user?.onboardingCompleted !== false) {
      const isJustOnboarded =
        typeof window !== 'undefined' &&
        sessionStorage.getItem('safetech_just_onboarded') === 'true';
      if (!isJustOnboarded) {
        const identifier = user?.email || user?.fullName || 'user';
        toast(`Already authenticated as ${identifier}. Redirected to dashboard.`);
        navigate('/dashboard', { replace: true });
      }
    }
  }, [authStatus, isAuthenticated, user, mode, location, navigate]);

  // Barrier loading state: renders clean obsidian screen to eliminate visual flash/jumps
  if (authStatus === 'idle' || authStatus === 'loading') {
    return (
      <div
        className="fixed inset-0 w-screen h-screen z-[9999] flex flex-col items-center justify-center bg-[#0D121A] text-[#E1E7F0] select-none font-sans"
        aria-busy="true"
        aria-label="Verifying authentication session"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#151C27] border border-[#243042] flex items-center justify-center shadow-lg">
            <img
              src="/logo.png"
              alt="Safe Tech"
              className="w-7 h-7 object-contain animate-pulse"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-4 h-4 border-2 border-[#243042] border-t-[#3B82F6] rounded-full animate-spin" />
            <span className="text-xs font-mono font-medium text-[#8C9BAE]">
              Authenticating secure session...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Once resolved, if unauthenticated on protected route, return barrier while redirecting
  if (mode === 'protected' && !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

export default AuthBarrier;

