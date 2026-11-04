import React, { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavStore } from '../store/useNavStore';

export interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Route guard enforcing:
 * 1. Unauthenticated users are redirected to #login.
 * 2. Authenticated admins with onboardingCompleted === false are directed to #onboarding.
 * 3. Authenticated users with onboardingCompleted === true are blocked from re-entering #onboarding or #signup.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const { activeTab, setActiveTab } = useNavStore();

  useEffect(() => {
    if (isLoading) return;

    const isPublicAuthRoute = ['login', 'signup', 'verify', 'accept-invite', 'onboarding'].includes(activeTab);

    // 1. Unauthenticated users attempting to access application workspace
    if (!isAuthenticated) {
      if (!isPublicAuthRoute) {
        setActiveTab('login');
      }
      return;
    }

    // 2. Authenticated Administrator needing to complete initial onboarding
    if (user?.role === 'admin' && user?.onboardingCompleted === false) {
      if (activeTab !== 'onboarding' && activeTab !== 'verify') {
        setActiveTab('onboarding');
      }
      return;
    }

    // 3. Authenticated users attempting to visit auth/onboarding pages after completing setup
    if (
      user?.onboardingCompleted !== false &&
      (activeTab === 'onboarding' || activeTab === 'signup' || activeTab === 'login')
    ) {
      const isJustOnboarded =
        typeof window !== 'undefined' &&
        sessionStorage.getItem('safetech_just_onboarded') === 'true';
      if (!isJustOnboarded) {
        setActiveTab('dashboard');
      }
    }
  }, [isAuthenticated, isLoading, user, activeTab, setActiveTab]);

  return <>{children}</>;
};

