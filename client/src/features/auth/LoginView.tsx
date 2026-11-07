import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavStore } from '../../store/useNavStore';
import { toast } from '../../store/useUIStore';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { OtpInput } from './OtpInput';

export type LoginChannel = 'email' | 'sms';

export interface LoginViewProps {
  onSwitchMode?: (mode: 'login' | 'register') => void;
  embedded?: boolean;
  onGoogleUnregistered?: (data: { email: string; name: string }) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onSwitchMode,
  embedded = false,
  onGoogleUnregistered,
}) => {
  const [channel, setChannel] = useState<LoginChannel>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [loading, setLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleAuthEmail, setGoogleAuthEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const { setUser } = useAuthStore();
  const { setActiveTab } = useNavStore();
  const navigate = useNavigate();

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  // Initialize Google Identity Services if client ID is configured
  useEffect(() => {
    if (!googleClientId || typeof window === 'undefined') return;

    const initGsi = () => {
      const google = (window as any).google;
      if (!google?.accounts?.id) return;

      try {
        google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response: { credential?: string }) => {
            if (!response.credential) return;
            setIsGoogleLoading(true);
            setErrorMsg('');
            try {
              const res = await api.post('/auth/google', {
                credential: response.credential,
              });

              if (res.data?.success && res.data.user) {
                setUser(res.data.user, res.data.token);
                toast(`Signed in with Google as ${res.data.user.email}`);
                navigate('/dashboard', { replace: true });
                if (res.data.user.role === 'admin' && res.data.user.onboardingCompleted === false) {
                  setActiveTab('onboarding');
                } else {
                  setActiveTab('dashboard');
                }
              } else if (res.data?.isUnregistered || res.data?.registered === false) {
                toast('Google account verified. Redirecting to administrator setup...', false);
                if (onGoogleUnregistered) {
                  onGoogleUnregistered({
                    email: res.data.email,
                    name: res.data.name || '',
                  });
                } else if (onSwitchMode) {
                  onSwitchMode('register');
                } else {
                  setActiveTab('signup');
                }
              }
            } catch (err: any) {
              setErrorMsg(err.message || 'Google authentication failed');
            } finally {
              setIsGoogleLoading(false);
            }
          },
        });
      } catch (e) {
        console.warn('Google Identity Services notice:', e);
      }
    };

    if ((window as any).google?.accounts?.id) {
      initGsi();
    } else {
      const timer = setInterval(() => {
        if ((window as any).google?.accounts?.id) {
          initGsi();
          clearInterval(timer);
        }
      }, 300);
      return () => clearInterval(timer);
    }
  }, [googleClientId, onGoogleUnregistered, onSwitchMode, navigate, setActiveTab, setUser]);

  const cleanPhoneDigits = phone.replace(/\D/g, '');
  const fullPhone = cleanPhoneDigits ? `+252${cleanPhoneDigits}` : '';
  const currentTarget = channel === 'email' ? email.trim() : fullPhone;

  // Cooldown countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (channel === 'email') {
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setErrorMsg('Please enter a valid business email address');
        return;
      }
    } else {
      if (!cleanPhoneDigits || cleanPhoneDigits.length < 7) {
        setErrorMsg('Please enter your 7 to 9 digit phone number');
        return;
      }
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/request-otp', {
        target: currentTarget,
        channel,
        purpose: 'login',
      });

      if (res.data?.success) {
        toast(res.data.message || `Login code dispatched to ${currentTarget}`);
        setStep('otp');
        setOtp('');
        setResendCooldown(60);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to request login code. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (otp.length !== 6) {
      setErrorMsg('Please enter the full 6-digit verification code');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.post('/auth/verify-otp', {
        target: currentTarget,
        otp: otp.trim(),
        purpose: 'login',
      });

      if (res.data?.success && res.data.user) {
        const token = res.data.token;
        setUser(res.data.user, token);
        toast(`Signed in as ${res.data.user.fullName || res.data.user.email}`);

        // Route Guard Invariant: If admin has not completed onboarding, resume at Step 2
        if (res.data.user.role === 'admin' && res.data.user.onboardingCompleted === false) {
          setActiveTab('onboarding');
        } else {
          setActiveTab('dashboard');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async (directEmail?: string) => {
    setErrorMsg('');

    // Developer sandbox / manual simulation
    if (directEmail && directEmail.trim()) {
      setIsGoogleLoading(true);
      try {
        const res = await api.post('/auth/google', {
          email: directEmail.trim().toLowerCase(),
          name: directEmail.trim().split('@')[0],
        });

        if (res.data?.success && res.data.user) {
          setUser(res.data.user, res.data.token);
          toast(`Signed in with Google as ${res.data.user.email}`);
          navigate('/dashboard', { replace: true });
          if (res.data.user.role === 'admin' && res.data.user.onboardingCompleted === false) {
            setActiveTab('onboarding');
          } else {
            setActiveTab('dashboard');
          }
        } else if (res.data?.isUnregistered || res.data?.registered === false) {
          toast('Google account verified. Redirecting to administrator setup...', false);
          if (onGoogleUnregistered) {
            onGoogleUnregistered({
              email: res.data.email || directEmail.trim().toLowerCase(),
              name: res.data.name || directEmail.trim().split('@')[0],
            });
          } else if (onSwitchMode) {
            onSwitchMode('register');
          } else {
            setActiveTab('signup');
          }
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Google authentication failed');
      } finally {
        setIsGoogleLoading(false);
        setShowGoogleModal(false);
      }
      return;
    }

    // Live Google Identity Services prompt if configured
    const google = typeof window !== 'undefined' ? (window as any).google : null;
    if (googleClientId && google?.accounts?.id) {
      try {
        google.accounts.id.prompt();
      } catch (err) {
        console.warn('Google prompt invocation:', err);
      }
    } else {
      setShowGoogleModal(true);
    }
  };

  const content = (
    <div style={{ width: '100%' }}>
      {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1
            style={{
              fontSize: '26px',
              fontWeight: 700,
              color: '#E5EAF2',
              margin: '0 0 6px 0',
              letterSpacing: '-0.3px',
            }}
          >
            Welcome Back
          </h1>
          <p style={{ fontSize: '13.5px', color: '#8C9BAE', margin: 0 }}>
            Sign in to access your business ledger.
          </p>
        </div>

        {/* Dual-Rail Segmented Toggle */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#0D121A',
            border: '1px solid #243042',
            borderRadius: '8px',
            padding: '3px',
            marginBottom: '20px',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setChannel('email');
              setStep('input');
              setErrorMsg('');
            }}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '6px',
              border: 0,
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: channel === 'email' ? '#18263D' : 'transparent',
              color: channel === 'email' ? '#6E9CF0' : '#8C9BAE',
              transition: 'all 0.15s ease',
            }}
          >
            Email with OTP
          </button>
          <button
            type="button"
            onClick={() => {
              setChannel('sms');
              setStep('input');
              setErrorMsg('');
            }}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '6px',
              border: 0,
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: channel === 'sms' ? '#18263D' : 'transparent',
              color: channel === 'sms' ? '#6E9CF0' : '#8C9BAE',
              transition: 'all 0.15s ease',
            }}
          >
            Phone with OTP
          </button>
        </div>

        {errorMsg && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(240, 122, 112, 0.12)',
              border: '1px solid rgba(240, 122, 112, 0.3)',
              borderRadius: '6px',
              color: '#F07A70',
              fontSize: '12.5px',
              marginBottom: '18px',
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 1: CREDENTIAL INPUT FORM                                             */}
        {/* ========================================================================= */}
        {step === 'input' ? (
          <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {channel === 'email' ? (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#B9C5DA', marginBottom: '6px' }}>
                  Business Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-base sm:text-sm"
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    minHeight: '44px',
                    borderRadius: '8px',
                    backgroundColor: '#0D121A',
                    border: '1px solid #243042',
                    color: '#E5EAF2',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            ) : (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#B9C5DA', marginBottom: '6px' }}>
                  Phone Number
                </label>
                <div style={{ display: 'flex', alignItems: 'stretch' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 14px',
                      backgroundColor: '#151C27',
                      border: '1px solid #243042',
                      borderRight: '0',
                      borderRadius: '8px 0 0 8px',
                      color: '#B9C5DA',
                      fontSize: '13.5px',
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontWeight: 600,
                      userSelect: 'none',
                    }}
                  >
                    +252
                  </div>
                  <input
                    type="tel"
                    required
                    placeholder="xxxxxxxxx"
                    value={phone}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '');
                      const stripped = raw.startsWith('252') ? raw.slice(3) : raw;
                      setPhone(stripped.slice(0, 9));
                    }}
                    className="w-full text-base sm:text-sm"
                    style={{
                      flex: 1,
                      padding: '11px 14px',
                      minHeight: '44px',
                      borderRadius: '0 8px 8px 0',
                      backgroundColor: '#0D121A',
                      border: '1px solid #243042',
                      color: '#E5EAF2',
                      fontFamily: "'IBM Plex Mono', monospace",
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || isGoogleLoading}
              style={{
                backgroundColor: '#3B82F6',
                color: '#FFFFFF',
                border: 0,
                borderRadius: '8px',
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: loading || isGoogleLoading ? 'not-allowed' : 'pointer',
                opacity: loading || isGoogleLoading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '4px',
                boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
              }}
            >
              {loading ? 'Sending Code...' : 'Send Login Code'}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>

            {/* Clean Obsidian Divider */}
            <div style={{ display: 'flex', alignItems: 'center', margin: '4px 0', gap: '12px' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#243042' }} />
              <span style={{ fontSize: '11px', color: '#6F7B90', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                OR
              </span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#243042' }} />
            </div>

            {/* Google Single Sign-On Button */}
            <button
              type="button"
              onClick={() => handleGoogleAuth()}
              disabled={loading || isGoogleLoading}
              style={{
                width: '100%',
                backgroundColor: '#151C27',
                border: '1px solid #243042',
                borderRadius: '8px',
                padding: '11px 16px',
                fontSize: '13.5px',
                fontWeight: 600,
                color: '#E5EAF2',
                cursor: loading || isGoogleLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 150ms ease',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              {isGoogleLoading ? 'Connecting to Google...' : 'Continue with Google'}
            </button>

            <div
              style={{
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1px solid #243042',
                textAlign: 'center',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  if (onSwitchMode) {
                    onSwitchMode('register');
                  } else {
                    setActiveTab('signup');
                  }
                }}
                style={{
                  backgroundColor: 'transparent',
                  border: 0,
                  color: '#8C9BAE',
                  fontSize: '13px',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Need to create an enterprise account?{' '}
                <span style={{ color: '#6E9CF0', textDecoration: 'underline' }}>
                  Sign up as Administrator
                </span>
              </button>
            </div>
          </form>
        ) : (
          /* ========================================================================= */
          /* STEP 2: 6-DIGIT OTP VERIFICATION FORM                                     */
          /* ========================================================================= */
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <span style={{ fontSize: '13px', color: '#8C9BAE' }}>
                Enter the 6-digit code dispatched to <b style={{ color: '#E5EAF2' }}>{currentTarget}</b>
              </span>
            </div>

            <OtpInput
              value={otp}
              onChange={(val) => {
                setOtp(val);
                setErrorMsg('');
              }}
              disabled={loading}
              autoFocus
            />

            <div style={{ textAlign: 'center' }}>
              {resendCooldown > 0 ? (
                <span style={{ fontSize: '12.5px', color: '#6F7B90' }}>
                  Resend code in <b style={{ color: '#E5EAF2' }}>{resendCooldown}s</b>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleRequestOtp()}
                  disabled={loading}
                  style={{
                    background: 'transparent',
                    border: 0,
                    color: '#6E9CF0',
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    padding: 0,
                  }}
                >
                  Didn't receive the code? Resend
                </button>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '8px',
                paddingTop: '16px',
                borderTop: '1px solid #243042',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setStep('input');
                  setOtp('');
                  setErrorMsg('');
                }}
                disabled={loading}
                style={{
                  backgroundColor: 'transparent',
                  border: 0,
                  color: '#8C9BAE',
                  fontSize: '13px',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                ← Change credential
              </button>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                style={{
                  backgroundColor: '#3B82F6',
                  color: '#FFFFFF',
                  border: 0,
                  borderRadius: '8px',
                  padding: '11px 24px',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  cursor: loading || otp.length !== 6 ? 'not-allowed' : 'pointer',
                  opacity: loading || otp.length !== 6 ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {loading ? 'Verifying...' : 'Sign In'}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </button>
            </div>
          </form>
        )}
      {/* Google Setup Guide & Sandbox Simulator (Mounted via portal to document.body, only when client ID is missing) */}
      {showGoogleModal && !googleClientId && typeof document !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(5, 8, 12, 0.8)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
          onClick={() => setShowGoogleModal(false)}
        >
          <div
            style={{
              backgroundColor: '#151C27',
              border: '1px solid #243042',
              borderRadius: '12px',
              padding: '26px',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 24px 48px rgba(0, 0, 0, 0.7)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <svg width="22" height="22" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#E5EAF2', margin: 0 }}>
                Google Single Sign-On Setup
              </h2>
            </div>

            <div
              style={{
                padding: '10px 12px',
                backgroundColor: 'rgba(234, 179, 8, 0.1)',
                border: '1px solid rgba(234, 179, 8, 0.3)',
                borderRadius: '6px',
                color: '#FDE047',
                fontSize: '12px',
                lineHeight: 1.4,
                marginBottom: '16px',
              }}
            >
              <b>Configuration Notice:</b> <code>VITE_GOOGLE_CLIENT_ID</code> is not configured in your <code>.env</code> file. Add your Google OAuth Client ID to activate Google's live account chooser.
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#B9C5DA', marginBottom: '6px' }}>
                Developer Sandbox Simulation
              </div>
              <p style={{ fontSize: '12px', color: '#8C9BAE', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                Simulate a verified Google response to test login or administrator onboarding:
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (googleAuthEmail.trim()) {
                    handleGoogleAuth(googleAuthEmail);
                  }
                }}
                style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
              >
                <input
                  type="email"
                  required
                  placeholder="e.g. admin@safetech.so"
                  value={googleAuthEmail}
                  onChange={(e) => setGoogleAuthEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    backgroundColor: '#0D121A',
                    border: '1px solid #243042',
                    color: '#E5EAF2',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setShowGoogleModal(false)}
                    style={{
                      backgroundColor: 'transparent',
                      border: '1px solid #243042',
                      borderRadius: '6px',
                      padding: '7px 14px',
                      fontSize: '12.5px',
                      color: '#8C9BAE',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isGoogleLoading || !googleAuthEmail.trim()}
                    style={{
                      backgroundColor: '#3B82F6',
                      color: '#FFFFFF',
                      border: 0,
                      borderRadius: '6px',
                      padding: '7px 16px',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: isGoogleLoading || !googleAuthEmail.trim() ? 'not-allowed' : 'pointer',
                      opacity: isGoogleLoading || !googleAuthEmail.trim() ? 0.6 : 1,
                    }}
                  >
                    {isGoogleLoading ? 'Simulating...' : 'Simulate Google Auth →'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <AuthLayout mode="login" onModeChange={onSwitchMode}>
      {content}
    </AuthLayout>
  );
};
