import React, { useState, useEffect } from 'react';
import { useNavStore } from '../../store/useNavStore';
import { AuthLayout, AuthMode } from '../../components/auth/AuthLayout';
import { LoginView } from './LoginView';
import { AdminOnboardingView } from './AdminOnboardingView';

export interface AuthContainerProps {
  initialMode?: AuthMode;
}

/**
 * Unified Auth Container supporting the Animated Sliding "Poster Morph"
 * Controls mode state ('login' ↔ 'register') with zero DOM unmounting.
 */
export const AuthContainer: React.FC<AuthContainerProps> = ({ initialMode }) => {
  const { activeTab, setActiveTab } = useNavStore();

  const [mode, setMode] = useState<AuthMode>(() => {
    if (initialMode) return initialMode;
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
      const modeParam = urlParams.get('mode') || hashParams.get('mode');
      if (modeParam === 'register' || modeParam === 'signup') return 'register';
      if (modeParam === 'login') return 'login';
    }
    return activeTab === 'signup' || activeTab === 'onboarding' ? 'register' : 'login';
  });

  // Sync mode with route changes without re-render loops
  useEffect(() => {
    if (activeTab === 'signup' || activeTab === 'onboarding') {
      setMode('register');
    } else if (activeTab === 'login') {
      setMode('login');
    }
  }, [activeTab]);

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    if (newMode === 'register') {
      if (activeTab !== 'signup' && activeTab !== 'onboarding') {
        setActiveTab('signup');
      }
    } else {
      if (activeTab !== 'login') {
        setActiveTab('login');
      }
    }
  };

  return (
    <AuthLayout
      mode={mode}
      onModeChange={handleModeChange}
      leftSlot={
        <AdminOnboardingView
          embedded
          onSwitchMode={handleModeChange}
        />
      }
      rightSlot={
        <LoginView
          embedded
          onSwitchMode={handleModeChange}
        />
      }
    />
  );
};

